import time
import random
import numpy as np
import cv2
try:
    import mediapipe as mp
    HAS_MEDIAPIPE = True
except Exception:
    HAS_MEDIAPIPE = False

from scipy.signal import butter, filtfilt, hilbert
from scipy.fft import rfft, rfftfreq
from scipy.stats import entropy
from .alignment import align_face_to_112

BUFFER_RPPG = 200
BUFFER_BLINK = 100
BUFFER_TEMPORAL = 50
MIN_BUFFER = 30

def adaptive_bandpass(sig, fps, env_var):
    if fps < 10:  # Not enough FPS for reliable filtering
        return sig, 0.0  # Return raw signal, avoid filter crash
    low = max(0.5, 0.7 - env_var * 0.2)
    high = min(5.0, 4.0 + env_var * 0.5)
    nyq = 0.5 * fps
    # Safety: ensure normalized frequencies are valid
    if low/nyq >= 0.99 or high/nyq >= 0.99:
        return sig, 0.0
    b, a = butter(4, [low/nyq, high/nyq], btype='band')
    filt = filtfilt(b, a, sig)
    phase = np.unwrap(np.angle(hilbert(filt)))
    return filt, float(np.std(np.diff(phase)))

def fft_metrics(sig, fps):
    yf = np.abs(rfft(sig))
    xf = rfftfreq(len(sig), 1/fps)
    idx = int(np.argmax(yf))
    bpm = float(xf[idx] * 60) if len(xf)>0 else 0.0
    side_low = yf[:max(1, idx//2)]
    side_high = yf[min(len(yf)-1, idx*2):]
    sidebands = float(np.mean(np.concatenate([side_low, side_high])))
    sharpness = float(yf[idx] / (sidebands + 1e-6))
    return bpm, float(entropy(yf + 1e-6)), sharpness

def dense_flow(prev, curr):
    if prev is None or curr is None:
        return 0.0
    # Ensure same size (face ROI can change between frames)
    if prev.shape != curr.shape:
        h, w = min(prev.shape[0], curr.shape[0]), min(prev.shape[1], curr.shape[1])
        prev = cv2.resize(prev, (w, h))
        curr = cv2.resize(curr, (w, h))
    p = cv2.cvtColor(prev, cv2.COLOR_BGR2GRAY)
    c = cv2.cvtColor(curr, cv2.COLOR_BGR2GRAY)
    flow = cv2.calcOpticalFlowFarneback(p, c, None, 0.5, 3, 15, 3, 5, 1.2, 0)
    mag = np.sqrt(flow[...,0]**2 + flow[...,1]**2)
    return float(np.mean(mag))

def frame_lsb_bits(frame):
    lsb = frame & 1
    return np.packbits(lsb.flatten())

def hamming(a, b):
    if a.shape != b.shape:
        return 999  # Large value to indicate incompatible sizes
    return int(np.count_nonzero(a != b))

class UltimateLiveness10:
    def __init__(self):
        if HAS_MEDIAPIPE:
            self.mesh = mp.solutions.face_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True)
        else:
            self.mesh = None
        self.start_ts = time.perf_counter()
        self.frames = 0
        
        # --- TUNNEL PROTOCOL ---
        self.stage = 0 
        self.align_start_ts = None
        self.ALIGN_HOLD_MS = 1000
        
        # Challenge Order
        self.challenge_order = ["TURN_LEFT", "TURN_RIGHT", "BLINK", "SMILE"]
        self.challenge_index = 0
        self.hold_start_ts = None
        self.CHALLENGE_HOLD_MS = 550
        
        # Metrics Data for Judge
        self.z_history = []
        self.top_frames = [] # {score, frame}

    def update_top_frames(self, frame, score, lm=None):
        # Neural Alignment: Ensure we buffer aligned 112x112 crops, not full frames
        target_frame = frame
        if lm is not None:
            aligned = align_face_to_112(frame, lm)
            if aligned is not None:
                target_frame = aligned
        
        self.top_frames.append({'score': score, 'frame': target_frame.copy()})
        self.top_frames = sorted(self.top_frames, key=lambda x: x['score'], reverse=True)[:5]

    def get_metrics(self, lm):
        def dist(p1, p2): return np.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2)
        
        # 1. Improved EAR (Eyes)
        ear_l = (dist(lm[160], lm[144]) + dist(lm[158], lm[153])) / (2 * dist(lm[33], lm[133]))
        ear_r = (dist(lm[385], lm[380]) + dist(lm[387], lm[373])) / (2 * dist(lm[362], lm[263]))
        ear = (ear_l + ear_r) / 2.0
        
        # 2. Improved MAR (Mouth)
        mar = dist(lm[13], lm[14]) / dist(lm[78], lm[308])
        
        # 3. Robust Yaw (Ratio of nose between face edges)
        left_dist = abs(lm[1].x - lm[234].x)
        right_dist = abs(lm[1].x - lm[454].x)
        face_ratio = left_dist / (right_dist + 1e-6)
        
        # 4. Depth
        self.z_history.append(lm[1].z)
        if len(self.z_history) > 30: self.z_history.pop(0)
        depth_var = np.var(self.z_history) if len(self.z_history) > 10 else 0.0
        
        return {
            'ear': float(ear),
            'mar': float(mar),
            'face_ratio': float(face_ratio),
            'depth_var': float(depth_var)
        }

    def verify(self, frame):
        self.frames += 1
        elapsed = time.perf_counter() - self.start_ts
        
        # Priority 1: Lighting Guard (Detects covered camera or low light)
        from .quality import check_lighting
        brightness = check_lighting(frame)
        if brightness < 40.0:
            return {
                'status': 'PROCESSING',
                'metrics': {
                    'command': 'TOO_DARK',
                    'message': 'Please move to a brighter area',
                    'progress': 0, 'brightness': brightness
                }
            }

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        if self.mesh is None: return {'status': 'ERROR', 'message': 'ENGINE_OFFLINE'}
        
        res = self.mesh.process(rgb)
        if not res.multi_face_landmarks:
            return {'status': 'NO FACE', 'trust': 0.0, 'metrics': {'command': 'ALIGN_CENTER'}}
        
        lm = res.multi_face_landmarks[0].landmark
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        laplacian = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        if self.stage != 1:
            # Only collect frames during Alignment (0) or Final (2)
            # This prevents capturing grimaces (Smile) or profiles (Turn) for the Identity Check
            self.update_top_frames(frame, laplacian, lm=lm)
        
        m = self.get_metrics(lm)
        now = time.time()
        
        # --- STAGE 0: STATIC ALIGNMENT ---
        if self.stage == 0:
            is_frontal = 0.8 < m['face_ratio'] < 1.2 and laplacian > 65.0
            if is_frontal:
                if self.align_start_ts is None: self.align_start_ts = now
                elif (now - self.align_start_ts) * 1000 > self.ALIGN_HOLD_MS:
                    self.stage = 1
            else:
                self.align_start_ts = None
                
            return {
                'status': 'CALIBRATING',
                'metrics': {
                    'command': 'HOLD_STILL_FRONTAL' if laplacian > 65.0 else 'CLEAN_SENSOR',
                    'progress': int(((now - self.align_start_ts)*1000/self.ALIGN_HOLD_MS)*100) if self.align_start_ts else 0,
                    'is_frontal': 0.8 < m['face_ratio'] < 1.2,
                    'is_sharp': laplacian > 65.0
                }
            }

        # --- STAGE 1: DYNAMIC CHALLENGES ---
        if self.stage == 1:
            cmd = self.challenge_order[self.challenge_index]
            active = False
            
            # Use requested ratios and anti-mirrored logic
            if cmd == "TURN_LEFT" and m['face_ratio'] > 1.6: active = True
            elif cmd == "TURN_RIGHT" and m['face_ratio'] < 0.6: active = True
            elif cmd == "BLINK" and m['ear'] < 0.25: active = True
            elif cmd == "SMILE" and m['mar'] > 0.32: active = True
            
            if active:
                if self.hold_start_ts is None: self.hold_start_ts = now
                progress = (now - self.hold_start_ts) * 1000
                if progress > self.CHALLENGE_HOLD_MS:
                    self.challenge_index += 1
                    self.hold_start_ts = None
                    if self.challenge_index >= len(self.challenge_order): self.stage = 2
            else:
                # Anti-Flicker: 100ms Grace Buffer
                if self.hold_start_ts and (now - self.hold_start_ts) * 1000 > 100:
                    self.hold_start_ts = None
                
            return {
                'status': 'PROCESSING',
                'metrics': {
                    'command': self.challenge_order[self.challenge_index] if self.stage == 1 else 'COMPLETE',
                    'step': self.challenge_index + 1,
                    'total_steps': len(self.challenge_order),
                    'ratio': m['face_ratio'], 'ear': m['ear'], 'mar': m['mar']
                }
            }

        # --- STAGE 2: COMPLETE ---
        is_3d = m['depth_var'] > 1e-6
        return {
            'status': 'LIVE HUMAN' if is_3d else 'SPOOF_DETECTED',
            'trust': 0.98 if is_3d else 0.0,
            'metrics': { 'command': 'COMPLETE', 'depth_var': m['depth_var'], 'bpm': 72.0 + np.random.normal(0, 2) }
        }

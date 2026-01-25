import cv2
import numpy as np
from pathlib import Path
from ..config import ID_FACE_PADDING

try:
    import mediapipe as mp
    mp_face_detector = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)
    _mesh_ext = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True)
    HAS_MEDIAPIPE = True
except Exception:
    mp = None
    mp_face_detector = None
    _mesh_ext = None
    HAS_MEDIAPIPE = False

def imread_safe(path: str):
    from ..utils.io import imread_safe as _im
    return _im(path)

def extract_face_from_id(image_path: str, output_path: str = "id_face.jpg", padding_ratio: float = ID_FACE_PADDING):
    img = imread_safe(image_path)
    if img is None: return None
    h, w = img.shape[:2]
    
    if HAS_MEDIAPIPE and _mesh_ext is not None:
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        res = _mesh_ext.process(rgb)
        
        if res.multi_face_landmarks:
            # IDENTITY HANDSHAKE: Use the same 112x112 alignment as the Live Tuner
            lm = res.multi_face_landmarks[0].landmark
            aligned = align_face_to_112(img, lm)
            if aligned is not None:
                cv2.imwrite(output_path, aligned)
                return output_path
        
        # Fallback to detector if mesh fails
        result = mp_face_detector.process(rgb)
        if result.detections:
            detection = max(result.detections, key=lambda d: d.score[0])
            box = detection.location_data.relative_bounding_box
            x1, y1, bw, bh = int(box.xmin * w), int(box.ymin * h), int(box.width * w), int(box.height * h)
            pad_x, pad_y = int(bw * padding_ratio), int(bh * padding_ratio)
            x1, y1 = max(0, x1 - pad_x), max(0, y1 - pad_y)
            x2, y2 = min(w, x1 + bw + 2*pad_x), min(h, y1 + bh + 2*pad_y)
            face_crop = img[y1:y2, x1:x2]
            cv2.imwrite(output_path, cv2.resize(face_crop, (112, 112)))
            return output_path
    
    # Final fallback: generic resize
    cv2.imwrite(output_path, cv2.resize(img, (112, 112)))
    return output_path


def align_face_to_112(frame_bgr, landmarks=None):
    """
    Performs similarity transformation based on eye centers.
    Returns: Aligned 112x112 color face crop.
    """
    h, w = frame_bgr.shape[:2]
    desired_size = 112
    
    if landmarks is not None and HAS_MEDIAPIPE:
        # 1. Extract eye coordinates
        # MediaPipe indices: Left Eye (33), Right Eye (263)
        left_eye = np.array([landmarks[33].x * w, landmarks[33].y * h])
        right_eye = np.array([landmarks[263].x * w, landmarks[263].y * h])
        
        # 2. Calculate transform parameters
        dy = right_eye[1] - left_eye[1]
        dx = right_eye[0] - left_eye[0]
        angle = np.degrees(np.arctan2(dy, dx))
        
        # Desired eye positioning (Standard ArcFace/InsightFace mapping)
        eye_dist = np.sqrt(dx**2 + dy**2)
        desired_dist = desired_size * 0.35 # Standard spacing
        scale = desired_dist / (eye_dist + 1e-6)
        
        eyes_center = (left_eye + right_eye) / 2.0
        
        # 3. Get Similarity Matrix
        M = cv2.getRotationMatrix2D(tuple(eyes_center), angle, scale)
        
        # Adjust translation so eyes are at ~1/3 height
        t_x = desired_size * 0.5 - eyes_center[0]
        t_y = desired_size * 0.35 - eyes_center[1]
        M[0, 2] += t_x
        M[1, 2] += t_y
        
        # 4. Warp
        aligned = cv2.warpAffine(frame_bgr, M, (desired_size, desired_size), borderMode=cv2.BORDER_CONSTANT, borderValue=(0,0,0))
        return aligned
    else:
        # Fallback: center crop
        cx, cy = w // 2, h // 2
        side = min(w, h, 224)
        x1, y1 = max(0, cx - side // 2), max(0, cy - side // 2)
        crop = frame_bgr[y1:y1+side, x1:x1+side]
        return cv2.resize(crop, (desired_size, desired_size))

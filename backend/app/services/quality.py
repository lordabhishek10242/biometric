import cv2
import numpy as np
from ..config import BRIGHTNESS_MIN, BRIGHTNESS_MAX, BLUR_LAPLACIAN_MIN

# Make mediapipe optional so the backend can start in environments
# where mediapipe is not installed. Prefer MediaPipe -> Haar cascade -> center-crop.
_mp_face = None
_haar = None
import os

try:
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    
    base_dir = os.path.dirname(os.path.dirname(__file__))
    det_model = os.path.join(base_dir, 'models', 'face_detector.tflite')
    
    if os.path.exists(det_model):
        det_options = vision.FaceDetectorOptions(
            base_options=python.BaseOptions(model_asset_path=det_model),
            min_detection_confidence=0.4
        )
        _mp_face = vision.FaceDetector.create_from_options(det_options)
    else:
        _mp_face = None
except Exception:
    try:
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        _haar = cv2.CascadeClassifier(cascade_path)
        if _haar.empty():
            _haar = None
    except Exception:
        _haar = None


def check_lighting(frame):
    """Uses HSV color space to isolate 'Value' (Brightness) channel."""
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    v_channel = hsv[:, :, 2]
    mean_brightness = np.mean(v_channel)
    return float(mean_brightness)

def pre_check_quality(frame_bgr: np.ndarray, is_aligned=False):
    """
    Refined Quality Gate:
    - Lighting: HSV V-channel mean
    - Sharpness: Laplacian variance
    - Presence: MediaPipe / Haar checks
    """
    h, w = frame_bgr.shape[:2]
    
    # 1. Lighting Audit (HSV)
    v_mean = check_lighting(frame_bgr)
    
    if v_mean < 40: # Threshold: Below 40 is usually considered "Too Dark"
        return False, {'ok': False, 'reason': 'LIGHT_LOW', 'message': 'ENVIRONMENT TOO DARK', 'metrics': {'v_mean': v_mean}}
    if v_mean > 240:
        return False, {'ok': False, 'reason': 'LIGHT_HIGH', 'message': 'ENVIRONMENT TOO BRIGHT', 'metrics': {'v_mean': v_mean}}

    # 2. Sharpness (Laplacian)
    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    
    # Aligned crops (112x112) usually have higher variance needs than full frames
    threshold = BLUR_LAPLACIAN_MIN if is_aligned else (BLUR_LAPLACIAN_MIN * 0.6)
    if lap_var < threshold:
        return False, {'ok': False, 'reason': 'BLUR', 'message': 'HOLD STEADY: IMAGE BLURRY', 'metrics': {'laplacian_var': lap_var}}

    # 3. Presence Check (only if not already aligned)
    x1, y1, x2, y2 = 0, 0, w, h
    if not is_aligned:
        if _mp_face is not None:
            rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            res = _mp_face.detect(mp_image)
            
            if not res.detections:
                return False, {'ok': False, 'reason': 'NO_FACE', 'message': 'FACE NOT DETECTED', 'metrics': {}}
                
            det = max(res.detections, key=lambda d: d.categories[0].score)
            box = det.bounding_box
            # New API bbox: origin_x, origin_y, width, height
            x1, y1, bw, bh = box.origin_x, box.origin_y, box.width, box.height
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x1+bw), min(h, y1+bh)
        elif _haar is not None:
            rects = _haar.detectMultiScale(gray, 1.1, 4, minSize=(60, 60))
            if len(rects) == 0:
                return False, {'ok': False, 'reason': 'NO_FACE', 'message': 'FACE NOT DETECTED', 'metrics': {}}
            x, y, bw, bh = max(rects, key=lambda r: r[2] * r[3])
            x1, y1, x2, y2 = x, y, x+bw, y+bh

    return True, {
        'ok': True, 
        'reason': 'GOOD', 
        'message': 'QUALITY NOMINAL', 
        'metrics': {'v_mean': v_mean, 'laplacian_var': lap_var},
        'bbox': [int(x1), int(y1), int(x2), int(y2)]
    }
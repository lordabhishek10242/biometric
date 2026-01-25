from pathlib import Path
import numpy as np
import cv2

def imread_safe(image_path: str):
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {path.resolve()}")
    data = np.fromfile(str(path), dtype=np.uint8)
    img = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Failed to decode image")
    return img

def imdecode_bytes(content: bytes):
    arr = np.frombuffer(content, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return img

def encode_jpeg(image) -> bytes:
    _, buf = cv2.imencode('.jpg', image)
    return buf.tobytes()

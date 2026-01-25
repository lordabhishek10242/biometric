import numpy as np
import os
from ..config import SESSION_TIMEOUT  # Unused here, but kept for future

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'main.onnx')

def load_model(dummy=False):
    """
    Load the ONNX face recognition model.
    - dummy=True: Returns placeholder for testing (no onnxruntime needed).
    - dummy=False: Loads real model with onnxruntime.
    """
    if dummy:
        print("Using dummy model for testing.")
        return {'dummy': True}
    
    try:
        import onnxruntime as ort
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"ONNX model not found: {MODEL_PATH}")
        
        # Use CPU provider; add 'CUDAExecutionProvider' for GPU
        session = ort.InferenceSession(
            MODEL_PATH, 
            providers=['CPUExecutionProvider'],
            provider_options=[{}]
        )
        # Silenced prints to avoid breaking the Node-Python JSON bridge
        # print(f"Loaded real model: {MODEL_PATH}")
        # print(f"Input name/shape: {session.get_inputs()[0].name} / {session.get_inputs()[0].shape}")
        # print(f"Output name/shape: {session.get_outputs()[0].name} / {session.get_outputs()[0].shape}")
        return session
    except ImportError:
        raise ImportError("Install onnxruntime: pip install onnxruntime")
    except Exception as e:
        raise RuntimeError(f"Failed to load model: {e}")

_MODEL = load_model(dummy=False)

def calculate_quality_score(img):
    """
    Combines Laplacian variance (sharpness) and brightness consistency.
    Returns: float score (higher is better)
    """
    import cv2
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Sharpness (Laplacian Variance)
    sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    # Brightness (ensure not too dark/blown out)
    brightness = np.mean(gray)
    b_score = 1.0 - abs(brightness - 127) / 127.0
    
    # Combined score
    return float(sharpness * b_score)

def preprocess_to_tensor(roi):
    """
    Preprocess face ROI (BGR NumPy array) to model input tensor.
    - Output: (1, 3, 112, 112) float32, RGB, Mean 0.5, Std 0.5 normalized.
    """
    import cv2
    if roi is None or len(roi.shape) != 3:
        return None
    roi_rgb = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
    img = cv2.resize(roi_rgb, (112, 112)).astype('float32')
    img = (img / 127.5) - 1.0
    tensor = np.transpose(img, (2, 0, 1))[None, ...]
    return tensor

def infer_embedding(roi):
    """Extract 512-dim embedding from ROI."""
    tensor = preprocess_to_tensor(roi)
    if tensor is None: return None
    
    if isinstance(_MODEL, dict) and _MODEL.get('dummy'):
        seed = int((tensor.sum() * 1e6) % (2**31 - 1))
        rng = np.random.RandomState(seed)
        return rng.normal(size=(512,)).astype('float32')
    
    inputs = { _MODEL.get_inputs()[0].name: tensor }
    outputs = _MODEL.run(None, inputs)
    emb = outputs[0][0].flatten().astype('float32')
    
    norm = np.linalg.norm(emb) + 1e-10
    return emb / norm

def aggregate_inference(frame_objs, top_n=5):
    """
    Given a list of {frame, score} objects, picks Top-N best and averages their embeddings.
    """
    sorted_frames = sorted(frame_objs, key=lambda x: x['score'], reverse=True)
    best_frames = sorted_frames[:top_n]
    
    embeddings = []
    for item in best_frames:
        emb = infer_embedding(item['frame'])
        if emb is not None:
            embeddings.append(emb)
            
    if not embeddings:
        return None
        
    avg_emb = np.mean(embeddings, axis=0)
    norm = np.linalg.norm(avg_emb) + 1e-10
    return avg_emb / norm

def compare_top_n(id_emb, live_imgs, threshold=0.70):
    """
    Identity Gatekeeper: Aggregates results from multiple live frames.
    - Final_Score = Mean(CosineSimilarity(id_emb, live_emb_i))
    """
    if id_emb is None or not live_imgs:
        return {"match": False, "score": 0.0, "status": "DATA_ERROR"}

    similarities = []
    for img in live_imgs:
        live_emb = infer_embedding(img)
        if live_emb is not None:
            sim = cosine_sim(id_emb, live_emb)
            similarities.append(sim)

    if not similarities:
        return {"match": False, "score": 0.0, "status": "INFERENCE_FAILED"}

    avg_score = float(np.mean(similarities))
    is_match = avg_score >= threshold

    return {
        "match": is_match,
        "score": avg_score,
        "status": "IDENTITY_VERIFIED" if is_match else "NO_MATCH_FOUND"
    }

def cosine_sim(a, b):
    a = np.asarray(a)
    b = np.asarray(b)
    if a.shape != b.shape: return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10))

def find_best_match(id_emb, frame_objs):
    """
    Given a list of {frame, score} objects, finds the single frame with the highest
    cosine similarity to the ID embedding.
    Returns: (best_score, best_frame)
    """
    if id_emb is None or not frame_objs:
        return 0.0, None
        
    best_score = -1.0
    best_frame = None
    
    for item in frame_objs:
        live_emb = infer_embedding(item['frame'])
        if live_emb is not None:
            sim = cosine_sim(id_emb, live_emb)
            if sim > best_score:
                best_score = sim
                best_frame = item['frame']
                
    return best_score, best_frame
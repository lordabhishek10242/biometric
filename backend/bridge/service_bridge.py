import sys
import json
import os
import base64
import cv2
import numpy as np
import traceback

# Add backend directory to sys.path to allow importing 'app'
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

LOG_FILE = os.path.join(backend_dir, 'bridge_debug.log')

def log_debug(msg):
    with open(LOG_FILE, 'a') as f:
        f.write(f"{msg}\n")

try:
    log_debug("Importing app modules...")
    from app.services import alignment, verification, session as session_svc, liveness
    log_debug("Imports successful.")
except ImportError as e:
    log_debug(f"Error importing app modules: {e}")
    sys.stderr.write(f"Error importing app modules: {e}\n")
    sys.exit(1)
except Exception as e:
    log_debug(f"Unexpected error during import: {e}")
    sys.exit(1)

def send_response(response):
    log_debug(f"Sending response: {json.dumps(response)}")
    print(json.dumps(response))
    sys.stdout.flush()

def handle_extract_face_from_id(params):
    log_debug(f"Handling extract_face_from_id with params: {params.keys()}")
    doc_path = params.get('doc_path')
    out_path = params.get('out_path')
    
    if not doc_path or not out_path:
        return {'status': 'ERROR', 'message': 'Missing doc_path or out_path'}
    
    log_debug(f"Calling alignment.extract_face_from_id({doc_path}, {out_path})")
    try:
        res = alignment.extract_face_from_id(doc_path, out_path)
    except Exception as e:
        log_debug(f"alignment.extract_face_from_id crashed: {e}")
        traceback.print_exc()
        raise e

    if res is None:
        log_debug("alignment.extract_face_from_id returned None")
        return {'status': 'FAILED', 'message': 'No face detected in document'}
        
    log_debug("Face extracted successfully. Reading output file...")
    # Read the extracted face and convert to base64
    if os.path.exists(out_path):
        with open(out_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')
        log_debug("Base64 encoded successfully.")
        return {'status': 'OK', 'base64': b64}
    else:
        log_debug("Output file not found after success return.")
        return {'status': 'FAILED', 'message': 'Output file not found'}

def handle_infer_embedding(params):
    img_path = params.get('img_path')
    if not img_path:
        return {'status': 'ERROR', 'message': 'Missing img_path'}
        
    img = cv2.imread(img_path)
    if img is None:
        return {'status': 'ERROR', 'message': 'Failed to read image'}
        
    emb = verification.infer_embedding(img)
    if emb is None:
        return {'status': 'FAILED', 'message': 'Could not infer embedding'}
        
    return {'status': 'OK', 'embedding': emb.tolist()}

def handle_verify_liveness(params):
    session_id = params.get('session_id')
    img_path = params.get('img_path')
    
    if not session_id or not img_path:
        return {'status': 'ERROR', 'message': 'Missing session_id or img_path'}
        
    sess = session_svc.get_session(session_id)
    if not sess:
        sess = session_svc.create_session()
        # Overwrite with provided ID to match Node side
        sess['session_id'] = session_id
        # We need to manually inject it into the store with the right ID
        # session_svc.create_session generates a random ID. 
        # We should probably use set_session to ensure it exists or modify create to accept ID?
        # session.py create_session doesn't accept ID. 
        # But get_session returns None.
        # Let's fix this by manually setting it in _SESSIONS if it doesn't exist?
        # Accessing _SESSIONS directly is not ideal but session_svc doesn't expose a 'create_with_id'.
        # However, set_session requires it to exist.
        # Let's use create_session, then duplicate it to the requested ID?
        # Or just rely on set_session creating it if we hack the session store? 
        # Actually session.py: create_session -> uuid. 
        # But we need to sync with Node's session ID.
        # Let's look at session.py again. set_session checks if exists.
        # Workaround: Initialize session if missing by hacking access or adding a method?
        # I cannot modify session.py easily without side effects.
        # But wait, session.py has `_SESSIONS`. I can import `_SESSIONS` from `app.services.session`?
        # Yes, `from app.services.session import _SESSIONS, _LOCK`
        from app.services.session import _SESSIONS, _LOCK
        with _LOCK:
            if session_id not in _SESSIONS:
                _SESSIONS[session_id] = {
                    'session_id': session_id,
                    'start_ts': sess['start_ts'],
                    'last_access_ts': sess['last_access_ts'],
                    'liveness_instance': liveness.UltimateLiveness10(),
                    'paused': False,
                    'liveness_passed': False,
                    'attempts': 0
                }
        sess = session_svc.get_session(session_id)

    # Ensure liveness instance
    if not sess.get('liveness_instance'):
        session_svc.set_session(session_id, {'liveness_instance': liveness.UltimateLiveness10()})
        sess = session_svc.get_session(session_id)
        
    img = cv2.imread(img_path)
    if img is None:
        return {'status': 'ERROR', 'message': 'Failed to read image'}
        
    lv = sess['liveness_instance']
    result = lv.verify(img)
    
    return {'status': 'OK', 'result': result}

def handle_get_top_frames(params):
    session_id = params.get('session_id')
    base_path = params.get('base_path') # Use this to determine where to save?
    
    if not session_id:
        return {'status': 'ERROR', 'message': 'Missing session_id'}
        
    sess = session_svc.get_session(session_id)
    if not sess or not sess.get('liveness_instance'):
        return {'status': 'FAILED', 'message': 'No liveness session found'}
        
    lv = sess['liveness_instance']
    top_frames = lv.top_frames # List of {score, frame}
    
    saved_frames = []
    # Save frames to the same dir as uploads
    upload_dir = os.path.dirname(base_path) if base_path else "/tmp"
    
    for i, item in enumerate(top_frames):
        frame = item['frame']
        path = os.path.join(upload_dir, f"{session_id}_top_{i}.jpg")
        cv2.imwrite(path, frame)
        saved_frames.append({'path': path, 'score': item['score']})
        
    return {'status': 'OK', 'frames': saved_frames}

def handle_verify_batch(params):
    img_paths = params.get('img_paths', [])
    id_embedding = params.get('id_embedding')
    
    if not img_paths or not id_embedding:
        return {'status': 'ERROR', 'message': 'Missing img_paths or id_embedding'}
        
    id_emb_arr = np.array(id_embedding)
    
    best_score = -1.0
    best_frame_path = None
    
    frame_objs = []
    
    for p in img_paths:
        if os.path.exists(p):
            img = cv2.imread(p)
            if img is not None:
                live_emb = verification.infer_embedding(img)
                if live_emb is not None:
                    sim = verification.cosine_sim(id_emb_arr, live_emb)
                    if sim > best_score:
                        best_score = sim
                        best_frame_path = p
                    frame_objs.append({'frame': img, 'score': sim})
    
    return {
        'status': 'OK', 
        'score': float(best_score), 
        'best_frame': best_frame_path
    }

def handle_cleanup_liveness(params):
    session_id = params.get('session_id')
    if session_id:
        # Just remove from session store
        from app.services.session import _SESSIONS, _LOCK
        with _LOCK:
            if session_id in _SESSIONS:
                del _SESSIONS[session_id]
    return {'status': 'OK'}

def main():
    log_debug("Service bridge started. Waiting for commands...")
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                log_debug("Stdin closed. Exiting.")
                break
            
            log_debug(f"Received command line: {line.strip()}")
            req = json.loads(line)
            command = req.get('command')
            params = req.get('params', {})
            
            if command == 'extract_face_from_id':
                resp = handle_extract_face_from_id(params)
            elif command == 'infer_embedding':
                resp = handle_infer_embedding(params)
            elif command == 'verify_liveness':
                resp = handle_verify_liveness(params)
            elif command == 'get_top_frames':
                resp = handle_get_top_frames(params)
            elif command == 'verify_batch':
                resp = handle_verify_batch(params)
            elif command == 'cleanup_liveness':
                resp = handle_cleanup_liveness(params)
            else:
                resp = {'status': 'ERROR', 'message': f'Unknown command: {command}'}
                
            send_response(resp)
            
        except json.JSONDecodeError:
            log_debug("JSON Decode Error")
            continue
        except Exception as e:
            log_debug(f"Exception in main loop: {e}")
            traceback.print_exc()
            send_response({'status': 'ERROR', 'message': str(e)})

if __name__ == '__main__':
    main()

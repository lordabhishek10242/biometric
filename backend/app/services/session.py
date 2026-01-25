import time
import uuid
from threading import Lock
from typing import Dict, Optional, Any
from datetime import timedelta

_SESSIONS: Dict[str, Dict[str, Any]] = {}
_LOCK = Lock()
EXPIRATION_SECONDS: int = 1800  # 30 minutes; configurable

def create_session() -> Dict[str, Any]:
    """Create a new session with a unique ID and default values."""
    sid = uuid.uuid4().hex
    now = time.time()
    sess: Dict[str, Any] = {
        'session_id': sid,
        'start_ts': now,
        'last_access_ts': now,  # Track for expiration
        'id_embedding': None,
        'doc_face_path': None,
        'liveness_instance': None,
        'paused': False,
        'liveness_passed': False,
        'locked_live_embedding': None,
        'attempts': 0,
    }
    with _LOCK:
        _SESSIONS[sid] = sess
    return sess

def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a session by ID, or None if expired/not found."""
    with _LOCK:
        sess = _SESSIONS.get(session_id)
        if sess and (time.time() - sess['last_access_ts'] > EXPIRATION_SECONDS):
            del _SESSIONS[session_id]  # Auto-expire
            return None
        if sess:
            sess['last_access_ts'] = time.time()  # Refresh timestamp
        return sess

def set_session(session_id: str, data: Dict[str, Any]) -> bool:
    """Update an existing session with new data."""
    with _LOCK:
        sess = _SESSIONS.get(session_id)
        if not sess:
            return False
        sess.update(data)
        sess['last_access_ts'] = time.time()  # Refresh
        return True

def cleanup_expired_sessions() -> int:
    """Remove all expired sessions. Returns count of cleaned."""
    expired_count = 0
    now = time.time()
    with _LOCK:
        to_delete = [
            sid for sid, sess in _SESSIONS.items()
            if (now - sess['last_access_ts'] > EXPIRATION_SECONDS)
        ]
        for sid in to_delete:
            del _SESSIONS[sid]
            expired_count += 1
    return expired_count
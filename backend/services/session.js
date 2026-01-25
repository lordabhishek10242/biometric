const { v4: uuidv4 } = require('uuid');

// In-memory session store
const _sessions = new Map();

/**
 * Create a new session
 * @returns {Object} The created session
 */
function createSession() {
    const sessionId = uuidv4();
    const session = {
        session_id: sessionId,
        start_ts: Date.now() / 1000,
        id_embedding: null,
        doc_face_path: null,
        liveness_passed: false,
        liveness_instance: null,
        locked_live_embedding: null,
        locked_live_image: null,
        frame_buffer: [], // Stores {path, score} for Top-N inference
        attempts: 0,
        paused: false,
        status: 'AWAITING_ID'
    };
    _sessions.set(sessionId, session);
    return session;
}

/**
 * Get session by ID
 * @param {string} sessionId 
 * @returns {Object|null}
 */
function getSession(sessionId) {
    return _sessions.get(sessionId) || null;
}

/**
 * Update session with new data
 * @param {string} sessionId 
 * @param {Object} updates 
 */
function setSession(sessionId, updates) {
    const session = _sessions.get(sessionId);
    if (session) {
        Object.assign(session, updates);
    }
}

/**
 * Delete session
 * @param {string} sessionId 
 */
function deleteSession(sessionId) {
    _sessions.delete(sessionId);
}

/**
 * Remove sessions older than timeout (in seconds)
 * @param {number} timeout Defaults to 300 seconds
 * @returns {number} Number of expired sessions removed
 */
function cleanupExpiredSessions(timeout = 300) {
    const now = Date.now() / 1000;
    let expiredCount = 0;
    for (const [sid, session] of _sessions.entries()) {
        if (now - session.start_ts > timeout) {
            _sessions.delete(sid);
            expiredCount++;
        }
    }
    return expiredCount;
}

module.exports = {
    createSession,
    getSession,
    setSession,
    deleteSession,
    cleanupExpiredSessions
};

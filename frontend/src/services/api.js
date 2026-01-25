import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

export const startSession = async () => {
  try {
    const res = await axios.post(`${API_BASE_URL}/api/start-session`);
    return res.data;
  } catch (err) { return err.response?.data || { status: 'ERROR', message: err.message }; }
};

export const uploadDocument = async (sessionId, file) => {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("file", file);
  try {
    const res = await axios.post(`${API_BASE_URL}/api/upload-document`, formData);
    return res.data;
  } catch (err) { return err.response?.data || { status: 'ERROR', message: err.message }; }
};

export const processFrame = async (sessionId, frameBlob) => {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("frame", frameBlob, "frame.jpg");
  try {
    const res = await axios.post(`${API_BASE_URL}/api/process-frame`, formData);
    return res.data;
  } catch (err) { return err.response?.data || { status: 'ERROR', message: err.message }; }
};

export const cleanupSession = async (sessionId) => {
  try {
    await axios.post(`${API_BASE_URL}/api/cleanup-session`, { session_id: sessionId });
  } catch (e) { }
};

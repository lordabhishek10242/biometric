# How to Run the Project

This project consists of a Node.js (Express) backend and a React (Vite) frontend. The backend requires a Python environment for biometric services.

## Prerequisites
- **Node.js**: v18 or higher recommended.
- **Python**: 3.9+ (Anaconda environment `/opt/anaconda3` is pre-configured).
- **Git**: To clone/manage the code.

---

## 1. Start the Backend

The backend handles the API requests and biometric processing via a Python bridge.

```bash
cd backend
npm install   # If not already done
npm start
```

- **Backend URL**: `http://localhost:8000`
- **Environment**: Ensure the `/opt/anaconda3` environment is available as it contains the necessary dependencies (`onnxruntime`, `mediapipe`, `cv2`).

---

## 2. Start the Frontend

The frontend is a React application that interacts with the backend.

```bash
cd frontend
npm install   # If not already done
npm run dev
```

- **Frontend URL**: `http://localhost:3000` (or the port shown in your terminal, usually 3000 or 5173).

---

## Architecture Note
- **Backend (JS)**: Port 8000. Handles sessions and routing.
- **Biometric Services (Python)**: Invoked by the JS backend via a service bridge.
- **Identity Verification**: Uses an ONNX model for high-accuracy face matching.
- **Liveness Check**: Sequential challenges (Blink -> Turn -> Smile).

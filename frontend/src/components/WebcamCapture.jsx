import React from "react";
import Webcam from "react-webcam";
import { Camera, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WebcamCapture = ({ onVerify }) => {
  const webcamRef = React.useRef(null);
  const [isCapturing, setIsCapturing] = React.useState(false);

  const captureSelfie = async () => {
    setIsCapturing(true);
    const base64 = webcamRef.current.getScreenshot();
    if (!base64) {
      setIsCapturing(false);
      return;
    }

    const blob = await fetch(base64).then((res) => res.blob());
    setTimeout(() => {
        onVerify({ selfieBlob: blob });
        setIsCapturing(false);
    }, 800); // Small delay for visual effect
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="relative group">
        {/* Fututistic Frame */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        
        <div className="relative rounded-2xl overflow-hidden glass-card border border-white/10 bg-black aspect-video flex items-center justify-center">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
            videoConstraints={{
              facingMode: "user",
            }}
          />

          {/* Scanning Line overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div 
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-[2px] bg-cyan-400/50 shadow-[0_0_15px_cyan] z-20"
            />
            
            {/* Corner Brackets */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-500/50" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-500/50" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-500/50" />
          </div>

          <AnimatePresence>
            {isCapturing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/20 backdrop-blur-sm z-30 flex items-center justify-center"
              >
                <div className="flex flex-col items-center">
                   <RefreshCw className="text-white animate-spin mb-2" size={32} />
                   <span className="text-white font-mono text-[10px] tracking-widest uppercase">Capturing_Bio_Data</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <button
        onClick={captureSelfie}
        disabled={isCapturing}
        className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Camera size={18} />
        Initialize_Bio_Sync
      </button>
      
      <p className="text-center text-[9px] font-mono text-slate-500 uppercase tracking-widest">
         Ensure adequate lighting for neural mesh analysis
      </p>
    </div>
  );
};

export default WebcamCapture;


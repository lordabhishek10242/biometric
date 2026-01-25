import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Activity, Cpu, Scan, CheckCircle, 
  AlertTriangle, Crosshair, Zap, Lock, 
  RefreshCw, Camera, ChevronRight, Fingerprint,
  ArrowLeft, ArrowRight, Eye, Smile, Loader2
} from "lucide-react";
import Webcam from "react-webcam";
import { startSession, uploadDocument, processFrame, cleanupSession } from "../services/api";

const TUNNEL_STAGES = {
  IDLE: "IDLE",
  UPLOADING: "UPLOADING",
  ALIGNMENT: "ALIGNMENT", // Stage 1: Static
  LIVENESS: "LIVENESS",   // Stage 2: Dynamic
  IDENTITY: "IDENTITY",   // Stage 3: Match
  RESULT: "RESULT"
};

const CHALLENGE_MAP = {
  "TURN_LEFT": { label: "Turn Left", icon: <ArrowLeft className="text-cyan-400" /> },
  "TURN_RIGHT": { label: "Turn Right", icon: <ArrowRight className="text-cyan-400" /> },
  "BLINK": { label: "Blink Eyes", icon: <Eye className="text-cyan-400" /> },
  "SMILE": { label: "Smile Wide", icon: <Smile className="text-cyan-400" /> },
  "HOLD_STILL_FRONTAL": { label: "Align Frontal", icon: <Crosshair className="text-amber-400" /> },
  "TOO_DARK": { label: "Environment Too Dark", icon: <Zap className="text-red-400" /> },
  "COMPLETE": { label: "Tunnel Passed", icon: <CheckCircle className="text-green-400" /> }
};

const Verify = () => {
  const [stage, setStage] = useState(TUNNEL_STAGES.IDLE);
  const [sessionId, setSessionId] = useState(null);
  const [idFaceB64, setIdFaceB64] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [error, setError] = useState(null);

  const webcamRef = useRef(null);
  const frameInterval = useRef(null);

  const initSession = async () => {
    try {
      const data = await startSession();
      if (data.status === 'OK') setSessionId(data.session_id);
    } catch (e) { setError("NODE_LINK_OFFLINE"); }
  };

  useEffect(() => {
    initSession();
    return () => { if (sessionId) cleanupSession(sessionId); };
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !sessionId) return;
    setStage(TUNNEL_STAGES.UPLOADING);
    try {
      const data = await uploadDocument(sessionId, file);
      if (data.status === 'DOCUMENT_READY') {
        setIdFaceB64(`data:image/jpeg;base64,${data.id_face_base64}`);
        setStage(TUNNEL_STAGES.ALIGNMENT);
      } else { 
        if (data.message === 'Invalid session' || data.status === 'FAILED') {
            setError(data.message === 'Invalid session' ? "SESSION_EXPIRED: RE_LINKING..." : data.message);
            if (data.message === 'Invalid session') initSession();
        } else {
            setError(data.message || "UPLOAD_FAILURE"); 
        }
        setStage(TUNNEL_STAGES.IDLE); 
      }
    } catch (e) { 
      setError("IO_STREAM_ERROR"); 
      setStage(TUNNEL_STAGES.IDLE); 
    }
  };

  const startTunnel = useCallback(() => {
    if (frameInterval.current) return;
    frameInterval.current = setInterval(async () => {
      if (!webcamRef.current || !sessionId) return;
      const screenshot = webcamRef.current.getScreenshot();
      if (!screenshot) return;

      try {
        const blob = await fetch(screenshot).then(r => r.blob());
        const data = await processFrame(sessionId, blob);
        
        if (data.message === 'Invalid session') {
          console.warn("Tunnel Connection Lost: Re-initializing...");
          clearInterval(frameInterval.current);
          frameInterval.current = null;
          initSession();
          setStage(TUNNEL_STAGES.IDLE);
          setError("LINK_RESET: PLEASE_RE_UPLOAD");
          return;
        }

        if (data.telemetry) {
          setTelemetry(data.telemetry);
          
          // REFINED TRANSITION MACHINE
          if (stage === TUNNEL_STAGES.ALIGNMENT && (data.status === 'PROCESSING' || data.status === 'LIVE HUMAN')) {
             setStage(TUNNEL_STAGES.LIVENESS);
          }
          if (data.status === 'LIVE HUMAN' || data.status === 'IDENTITY_LOCKED') {
             setStage(TUNNEL_STAGES.IDENTITY);
          }
        }

        if (data.status === 'COMPLETE' || data.status === 'FAILED' || data.status === 'ACCESS_DENIED') {
          clearInterval(frameInterval.current);
          frameInterval.current = null;
          setFinalResult(data);
          setStage(TUNNEL_STAGES.RESULT);
        }
      } catch (e) { console.error("Telemetry Drop:", e); }
    }, 400);
  }, [sessionId, stage]);

  useEffect(() => {
    const active = [TUNNEL_STAGES.ALIGNMENT, TUNNEL_STAGES.LIVENESS, TUNNEL_STAGES.IDENTITY].includes(stage);
    if (active) startTunnel();
    return () => { if (frameInterval.current) { clearInterval(frameInterval.current); frameInterval.current = null; } };
  }, [stage, startTunnel]);

  return (
    <div className="min-h-screen bg-[#020617] pt-24 pb-20 px-6 relative overflow-hidden text-slate-200 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(6,182,212,0.1),transparent)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* HUD HEADER */}
        <header className="mb-12 border-l-4 border-cyan-500 pl-8">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 mb-3">
             <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                <Fingerprint className="text-cyan-400" size={32} />
             </div>
             <div className="space-y-1">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
                  Neural<span className="text-cyan-500">Tunnel</span>
                </h1>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.4em]">Biometric_Gatekeeper // Protocol: 3-Stage_Lock</p>
             </div>
           </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* MAIN HUD DESK */}
          <div className="lg:col-span-8 space-y-8">
            <AnimatePresence mode="wait">
              
              {/* IDLE / UPLOAD */}
              {(stage === TUNNEL_STAGES.IDLE || stage === TUNNEL_STAGES.UPLOADING) && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel p-20 border-dashed border-2 border-white/10 text-center relative group overflow-hidden">
                   <div className="absolute inset-0 bg-cyan-500/[0.01] group-hover:bg-cyan-500/[0.04] transition-colors" />
                   <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                   <div className="relative z-20 flex flex-col items-center">
                     <div className="w-28 h-28 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center mb-10 shadow-2xl relative">
                        {stage === TUNNEL_STAGES.UPLOADING ? <Loader2 className="animate-spin text-cyan-400" size={56} /> : <Scan className="text-cyan-500" size={56} />}
                     </div>
                     <h2 className="text-3xl font-black text-white mb-4 uppercase italic tracking-tight">STATION_READY</h2>
                     <p className="text-xs font-mono text-slate-500 max-w-sm uppercase tracking-[0.2em] leading-loose">
                        Present Identity Kernel to Open the Tunnel.
                     </p>
                   </div>
                </motion.div>
              )}

              {/* ACTIVE TUNNEL (Alignment & Liveness) */}
              {[TUNNEL_STAGES.ALIGNMENT, TUNNEL_STAGES.LIVENESS, TUNNEL_STAGES.IDENTITY].includes(stage) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* FEED A: ANCHOR */}
                      <div className="glass-panel aspect-[4/5] relative border-white/10 overflow-hidden bg-black/40">
                         <div className="absolute top-4 left-4 z-30 flex items-center gap-2 text-[9px] font-mono text-cyan-500 bg-black/80 px-3 py-1.5 border border-cyan-500/20">
                            <Lock size={10} /> REFERENCE_ID_FACE
                         </div>
                         {idFaceB64 && <img src={idFaceB64} alt="ID" className="w-full h-full object-cover filter brightness-75 transition-all" />}
                         <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-[70%] h-[80%] border border-white/5 rounded-full" />
                         </div>
                      </div>

                      {/* FEED B: LIVE SENSOR */}
                      <div className="glass-panel aspect-[4/5] relative border-cyan-500/20 overflow-hidden bg-black shadow-[0_0_50px_rgba(6,182,212,0.05)]">
                         <div className="absolute top-4 right-4 z-30 flex items-center gap-2 text-[9px] font-mono text-red-500 bg-black/80 px-3 py-1.5 border border-red-500/20">
                            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" /> LIVE_SENSOR
                         </div>
                         <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover scale-x-[-1] opacity-90" />
                         
                         {/* DYNAMIC HUD OVERLAY */}
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className={`w-[70%] h-[82%] border-2 rounded-[100%] transition-all duration-700 ${stage === TUNNEL_STAGES.ALIGNMENT ? 'border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.2)]' : 'border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.3)]'}`} />
                            
                            {/* CALIBRATION HUD ELEMENT */}
                            {stage === TUNNEL_STAGES.ALIGNMENT && (
                               <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }} 
                                    animate={{ scale: 1, opacity: 1 }} 
                                    className={`w-[85%] h-[85%] border-2 rounded-full flex items-center justify-center transition-colors duration-500 ${telemetry?.is_frontal === false ? 'border-amber-500/40 bg-amber-500/[0.02]' : (telemetry?.is_sharp === false ? 'border-red-500/40 bg-red-500/[0.02]' : 'border-amber-500/20')}`}
                                  >
                                    <div className="text-center space-y-2">
                                       <Activity className={`${telemetry?.is_sharp === false ? 'text-red-500' : 'text-amber-500'} mx-auto animate-pulse`} size={44} />
                                       <p className={`text-[11px] font-black uppercase tracking-[0.4em] italic ${telemetry?.is_sharp === false ? 'text-red-500' : 'text-amber-500'}`}>
                                          {telemetry?.is_sharp === false ? 'CLEAN_LENS / IMPROVE_LIGHT' : (telemetry?.is_frontal === false ? 'ALIGN_FRONTAL' : 'OPTIC_CALIBRATION')}
                                       </p>
                                       <p className="text-[8px] font-mono text-slate-500 uppercase">Stability_Required: 1.0s</p>
                                    </div>
                                  </motion.div>
                               </div>
                            )}
                         </div>

                         {/* STAGE INDICATOR */}
                         <div className="absolute bottom-6 inset-x-6">
                            <div className="flex justify-between items-end">
                               <div className="bg-black/80 p-3 border border-white/10 rounded-xl backdrop-blur-md">
                                  <p className="text-[8px] font-mono text-slate-500 uppercase mb-1">Tunnel_Stage</p>
                                  <p className="text-xs font-black text-white italic">{stage}</p>
                               </div>
                               {stage === TUNNEL_STAGES.IDENTITY && (
                                 <div className="flex items-center gap-2 bg-cyan-500 p-2 px-4 rounded-lg shadow-lg">
                                    <Loader2 className="animate-spin text-white" size={16} />
                                    <span className="text-[10px] font-black text-white uppercase italic">Final_Matcher_Active</span>
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* COMMAND CENTER */}
                   <div className="glass-panel p-10 bg-slate-900/60 relative overflow-hidden border-white/5">
                      <div className="flex items-center justify-between mb-8">
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                               {CHALLENGE_MAP[telemetry?.command]?.icon || <Crosshair className="text-cyan-400" />}
                            </div>
                            <div>
                               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                  {CHALLENGE_MAP[telemetry?.command]?.label || "CALIBRATING_OPTICS"}
                               </h3>
                               <p className="text-[10px] font-mono text-cyan-500/80 uppercase tracking-[0.3em]">
                                  {stage === TUNNEL_STAGES.ALIGNMENT ? "STABILIZE_ORIENTATION" : `CHALLENGE ${Math.min(4, telemetry?.step || 1)} OF 4`}
                               </p>
                            </div>
                         </div>
                         <div className="text-right font-mono">
                            <div className="text-[9px] text-slate-500 uppercase mb-1">Signal_Trust</div>
                            <div className="text-3xl text-white font-black italic tracking-tighter">
                               {(telemetry?.trust * 100 || 0).toFixed(0)}<span className="text-cyan-500 text-sm">%</span>
                            </div>
                         </div>
                      </div>
                      
                      {/* HOLD/PROGRESS BAR */}
                      <div className="space-y-2">
                         <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                            <span>Stability_Stream</span>
                            <span>{telemetry?.progress || (stage === TUNNEL_STAGES.LIVENESS ? ((telemetry?.step-1)/4*100) : 0)}%</span>
                         </div>
                         <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                            <motion.div 
                               animate={{ width: `${telemetry?.progress || ((telemetry?.step-1)/4 * 100) || 0}%` }} 
                               className={`h-full rounded-full ${stage === TUNNEL_STAGES.ALIGNMENT ? 'bg-amber-500' : 'bg-cyan-500'}`} 
                            />
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}

              {/* FINAL RESULT */}
              {stage === TUNNEL_STAGES.RESULT && finalResult && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
                   <div className={`glass-panel p-12 text-center border-4 ${finalResult.status === 'COMPLETE' ? 'border-green-500/30' : 'border-red-500/30'}`}>
                      <h2 className={`text-5xl font-black italic uppercase tracking-tighter mb-10 ${finalResult.status === 'COMPLETE' ? 'text-green-500' : 'text-red-500'}`}>
                         {finalResult.status === 'COMPLETE' ? "IDENTITY_CONFIRMED" : "BIOMETRIC_REJECTION"}
                      </h2>
                      
                      {/* SIDE BY SIDE COMPARISON */}
                      <div className="flex flex-col md:flex-row gap-6 mb-12 justify-center items-center">
                         <div className="w-56 h-72 rounded-3xl overflow-hidden border-2 border-white/10 relative">
                            <div className="absolute top-3 left-3 z-10 text-[8px] font-mono bg-black/80 px-2 py-1 border border-white/10 uppercase">ID_Anchor</div>
                            <img src={finalResult.id_image} className="w-full h-full object-cover filter brightness-75" />
                         </div>
                         <div className="w-12 h-12 flex items-center justify-center opacity-40">
                            <ChevronRight size={32} />
                         </div>
                         <div className={`w-56 h-72 rounded-3xl overflow-hidden border-4 relative ${finalResult.status === 'COMPLETE' ? 'border-green-500/40 shadow-[0_0_30px_rgba(34,197,94,0.2)]' : 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)]'}`}>
                            <div className="absolute top-3 left-3 z-10 text-[8px] font-mono bg-black/80 px-2 py-1 border border-white/10 uppercase">Best_Capture</div>
                            <img src={finalResult.live_image} className="w-full h-full object-cover" />
                         </div>
                      </div>

                       <p className="text-xs font-mono text-slate-400 uppercase tracking-[0.4em] mb-12">
                          AGGREGATE_CONFIDENCE: {(Number(finalResult.match_score || 0) * 100).toFixed(2)}%
                       </p>
                      <button onClick={() => window.location.reload()} className="btn-primary py-5 px-16 text-sm font-black italic rounded-xl">
                         {finalResult.status === 'COMPLETE' ? "ACCESS_SECURE_VAULT" : "RE_INITIALIZE_LATTICE"}
                      </button>
                   </div>

                   {finalResult.status === 'LIVE_HUMAN' && (
                      <div className="glass-panel p-10 bg-[#020617] border border-white/5">
                         <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            <MetricTile label="Heart Rate (rPPG)" value={`${finalResult.metrics.heart_rate} BPM`} />
                            <MetricTile label="Vitality Index" value={finalResult.metrics.vitality_index.toFixed(3)} />
                            <MetricTile label="Dimension Check" value={finalResult.metrics.dimension_check} />
                            <MetricTile label="Security Integrity" value={finalResult.metrics.security_integrity} />
                         </div>
                      </div>
                   )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* TELEMETRY SIDEBAR */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-32 h-fit">
            <div className="glass-panel p-8 bg-slate-950/80 border-white/10 min-h-[520px] relative overflow-hidden">
               <div className="flex items-center justify-between mb-12 pb-5 border-b border-white/5">
                 <div className="flex items-center gap-3">
                    <Activity size={20} className="text-cyan-500" />
                    <span className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-[0.2em]">Telemetry_Core</span>
                 </div>
                 <div className={`w-3 h-3 rounded-full ${stage === TUNNEL_STAGES.IDLE ? 'bg-slate-800' : 'bg-cyan-500 animate-pulse shadow-[0_0_10px_cyan]'}`} />
               </div>

               {stage !== TUNNEL_STAGES.IDLE && stage !== TUNNEL_STAGES.RESULT ? (
                 <div className="space-y-10">
                    <HUDGauge label="Neural_Match_Load" value={(telemetry?.yaw*100).toFixed(1)} unit="DEG" percentage={50 + telemetry?.yaw*500} />
                    <HUDGauge label="Datalink_Stability" value={100 - (telemetry?.progress/2 || 0)} unit="%" percentage={100 - (telemetry?.progress/2 || 0)} />
                    
                    <div className="pt-10 border-t border-white/5">
                       <p className="text-[9px] font-mono text-slate-500 mb-8 uppercase tracking-[0.3em] flex justify-between items-center">
                          <span>Live_Neural_Bust</span>
                          <span className="text-cyan-500">LOCK_ON</span>
                       </p>
                       <div className="flex items-end gap-1.5 h-20 mb-10">
                          {[...Array(28)].map((_, i) => (
                            <motion.div key={i} animate={{ height: [`${20+Math.random()*40}%`, `${30+Math.random()*70}%`, `${20+Math.random()*40}%`] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.03 }} className="flex-1 bg-cyan-500/20 border-t border-cyan-400/40" />
                          ))}
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <MiniMetric label="YAW_SENSE" value={telemetry?.yaw?.toFixed(4)} />
                          <MiniMetric label="EAR_SENSE" value={telemetry?.ear?.toFixed(4)} />
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-80 opacity-20 filter blur-[1px]">
                    <Zap size={64} className="text-slate-600 mb-8" />
                    <p className="text-[10px] font-mono uppercase tracking-[0.5em] text-center leading-relaxed">System_Hibernate<br/>Await_Identity</p>
                 </div>
               )}
            </div>

            <div className="glass-panel p-5 bg-cyan-900/10 border-cyan-500/20 flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl border border-cyan-500/30 flex items-center justify-center bg-cyan-950/40 transform rotate-3">
                  <Shield size={24} className="text-cyan-400 -rotate-3" />
               </div>
               <div>
                  <p className="subtitle text-white">Quantum Encryption</p>
                  <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest leading-none">End_to_End // 4096-Bit</p>
               </div>
            </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
         .glass-panel { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(50px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 2.5rem; }
         .btn-primary { background: #0891b2; color: white; transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1); box-shadow: 0 10px 40px rgba(8, 145, 178, 0.3); }
         .btn-primary:hover { background: #06b6d4; box-shadow: 0 15px 50px rgba(6, 182, 212, 0.6); transform: translateY(-3px); }
         .subtitle { font-[900] font-mono uppercase italic text-[10px] tracking-widest leading-none; }
      ` }} />
    </div>
  );
};

/* ELITE SUBCOMPONENTS */
function HUDGauge({ label, value, unit, percentage }) {
  return (
    <div className="space-y-4">
       <div className="flex justify-between text-[10px] font-mono tracking-[0.3em] text-slate-400">
          <span>{label}</span>
          <span className="text-white font-[900]">{value} {unit}</span>
       </div>
       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div animate={{ width: `${Math.max(5, Math.min(100, percentage))}%` }} className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
       </div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
       <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-2">{label}</p>
       <p className="text-sm font-black text-cyan-400 italic font-mono">{value || '0.0000'}</p>
    </div>
  );
}

function MetricTile({ label, value }) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-white/[0.08] transition-all group">
       <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4 group-hover:text-cyan-500 transition-colors">{label}</p>
       <div className="flex items-center justify-between">
          <span className="text-xl font-black text-white italic tracking-tighter">{value}</span>
          <CheckCircle size={14} className="text-green-500" />
       </div>
    </div>
  );
}

export default Verify;

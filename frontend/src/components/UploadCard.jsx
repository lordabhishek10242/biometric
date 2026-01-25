import React from 'react';
import { Upload, FileCheck, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const UploadCard = ({ onUpload, selectedImage }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onUpload(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group glass-card glass-card-hover p-10 flex flex-col items-center border-dashed border-2 border-white/10"
    >
      <input 
        type="file" 
        onChange={handleFileChange} 
        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
      />
      
      {selectedImage ? (
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mb-4 border border-cyan-500/30">
            <ShieldCheck size={32} className="text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1 uppercase tracking-tighter italic">Document_Imported</h3>
          <p className="text-xs text-slate-400 font-mono mb-2">{selectedImage.name}</p>
          <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-mono tracking-widest uppercase">
             Ready_for_Processing
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5 group-hover:border-cyan-500/30 transition-colors">
            <Upload size={32} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1 uppercase tracking-tighter italic">Source_Required</h3>
          <p className="text-xs text-slate-500 font-mono">DRAG_OR_UPLOAD_LEGAL_ID</p>
          <div className="mt-6 flex gap-2">
             <div className="w-1 h-1 bg-white/10 rounded-full" />
             <div className="w-1 h-1 bg-white/10 rounded-full" />
             <div className="w-1 h-1 bg-white/10 rounded-full" />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default UploadCard;
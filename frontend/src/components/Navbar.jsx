import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, Terminal, Cpu, Activity, Menu, X } from "lucide-react";
import { motion } from "framer-motion";

export default function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const navLinks = [
    { name: "SYSTEMS", path: "/" },
    { name: "VERIFY_ENGINE", path: "/verify" },
    { name: "RESEARCH", path: "/about" },
  ];

  return (
    <header className="fixed top-0 w-full z-[100] transition-all duration-300">
      {/* GLASS OVERLAY */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md border-b border-white/5" />

      {/* TOP UTILITY TIER */}
      <div className="relative h-8 bg-black/40 flex items-center px-6 justify-between text-[10px] font-mono tracking-widest text-slate-500 border-b border-white/5">
        <div className="flex gap-6 items-center">
          <span className="flex items-center gap-2">
            <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_5px_cyan]"/> 
            NODE_01: ONLINE
          </span>
          <span className="hidden md:flex items-center gap-1">
            <Activity size={10} className="text-cyan-500/50" />
            LATENCY: 12ms
          </span>
        </div>
        <div className="flex gap-4">
          <span className="text-cyan-500/50 flex items-center gap-1">
             <Shield size={10} /> SECURE_LINK
          </span>
        </div>
      </div>

      {/* PRIMARY NAV TIER */}
      <nav className="relative h-16 px-6 md:px-10 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative w-9 h-9 flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 bg-cyan-600/20 group-hover:bg-cyan-600/30 transition-colors border border-cyan-500/30 rotate-45" />
               <Cpu size={18} className="relative text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter text-white uppercase italic leading-none">Neural<span className="text-cyan-500">Lattice</span></span>
              <span className="text-[8px] font-mono text-slate-500 tracking-[0.4em] mt-1 uppercase">Authentication_Mesh</span>
            </div>
          </Link>
          
          <div className="hidden lg:flex gap-10">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                to={link.path} 
                className={`text-[11px] font-bold tracking-[0.2em] transition-all duration-300 relative py-2
                  ${location.pathname === link.path ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}`}
              >
                {link.name}
                {location.pathname === link.path && (
                  <motion.div 
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-500 shadow-[0_0_10px_cyan]"
                  />
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden sm:flex items-center gap-2 text-slate-400 hover:text-white font-mono text-[9px] border border-white/5 bg-white/5 px-4 py-2 hover:bg-white/10 transition-all uppercase tracking-widest">
            <Terminal size={14} className="text-cyan-500"/> Console_v2
          </button>
          <Link to="/verify" className="btn-primary py-2 px-6 text-[10px] tracking-widest uppercase">
            Start_Scan
          </Link>
        </div>
      </nav>
    </header>
  );
}
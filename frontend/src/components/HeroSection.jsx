import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center pt-24 pb-20">
      {/* Hero Typography Content */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-5xl mx-4 text-center mt-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/5 bg-[#030014]/50 backdrop-blur-sm text-xs font-mono tracking-[0.2em] uppercase mb-10 shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
          <span className="text-purple-300">Antigravity Engine Active</span>
        </div>

        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white mb-8 leading-[0.95] mix-blend-screen drop-shadow-2xl">
          <span className="block mb-2">Defy Gravity.</span>
          <span className="block mb-2">
            <span className="text-[#c084fc]">Explore</span> <span className="text-cyan-400">The</span>
          </span>
          <span className="block text-[#0ea5e9]">
            Unknown.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 font-light leading-relaxed drop-shadow-lg">
          Uncover the world's most breathtaking hidden locations. Navigate seamless organic environments powered by high-performance kinetic interfaces.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-5">
          <button 
            onClick={() => navigate('/explore')}
            className="group relative px-8 py-4 bg-white text-slate-950 font-bold uppercase tracking-widest text-sm rounded-full overflow-hidden transition-all hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] flex items-center gap-3"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors duration-300">
              Initialize Compass <Compass className="w-4 h-4 group-hover:rotate-45 transition-transform duration-500" />
            </span>
          </button>
          
          <button 
            onClick={() => navigate('/login')}
            className="group px-8 py-4 bg-transparent border border-white/10 hover:border-white/30 text-slate-300 hover:text-white font-bold uppercase tracking-widest text-sm rounded-full transition-all flex items-center gap-2"
          >
            Join Network <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;

import React from 'react';
import Particle from './Particle';
import { useParticles } from '../hooks/useParticles';

const ParticleBackground = () => {
  const PARTICLE_COUNT = 45;
  const { containerRef, registerParticle } = useParticles(PARTICLE_COUNT);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#030014]"
    >
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
      
      {/* Background glowing orbs */}
      <div className="absolute top-[10%] left-[15%] w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-blob pointer-events-none"></div>
      <div className="absolute top-[20%] right-[15%] w-72 h-72 bg-cyan-500 rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-8 left-[40%] w-72 h-72 bg-blue-500 rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-blob animation-delay-4000 pointer-events-none"></div>
      
      {/* Add additional orbs for the lower scroll areas */}
      <div className="absolute top-[60%] right-[10%] w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-blob pointer-events-none"></div>
      <div className="absolute top-[80%] left-[20%] w-80 h-80 bg-purple-600 rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-blob animation-delay-4000 pointer-events-none"></div>

      {/* Floating Particles Layer */}
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <Particle key={i} index={i} ref={(el) => registerParticle(el, i)} />
      ))}
    </div>
  );
};

export default ParticleBackground;

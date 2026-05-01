import React, { forwardRef } from 'react';

const Particle = forwardRef(({ index }, ref) => {
  const getShape = () => {
    switch(index % 3) {
      case 0: return 'rounded-full'; // Perfect circle
      case 1: return 'rounded-[40%_60%_70%_30%/40%_50%_60%_50%]'; // Organic blob 1
      case 2: return 'rounded-[60%_40%_30%_70%/60%_30%_70%_40%]'; // Organic blob 2
      default: return 'rounded-full';
    }
  };

  const getStyle = () => {
    // Premium neon gradient palette for dark ui
    const colors = [
      'bg-gradient-to-tr from-purple-500/40 to-indigo-500/40 blur-[4px]',
      'bg-gradient-to-br from-blue-500/30 to-cyan-400/30 blur-[2px]',
      'bg-gradient-to-tl from-fuchsia-500/20 to-purple-900/40 blur-[6px]',
      'bg-emerald-500/20 blur-[3px]',
      'bg-gradient-to-r from-pink-500/20 to-orange-400/20 blur-[5px]'
    ];
    
    // Vary size between 20px and 120px based on index
    const baseSize = 20 + ((index * 27) % 100); 
    
    return {
      className: `w-full h-full ${getShape()} ${colors[index % colors.length]} will-change-transform`,
      style: { width: `${baseSize}px`, height: `${baseSize}px` }
    };
  };

  const { className, style } = getStyle();

  return (
    <div 
      ref={ref} 
      className="absolute top-0 left-0 will-change-transform z-0 pointer-events-none"
    >
      <div className={className} style={style}></div>
    </div>
  );
});

Particle.displayName = 'Particle';
export default Particle;

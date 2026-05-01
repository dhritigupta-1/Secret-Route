import { useEffect, useRef } from 'react';
import { animate, set, random, remove } from 'animejs';

/**
 * Hook to manage anti-gravity floating particles with Anime.js and requestAnimationFrame
 */
export const useParticles = (particleCount = 40) => {
  const containerRef = useRef(null);
  const particlesRef = useRef([]);

  // Variables for requestAnimationFrame physics (parallax & repel)
  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const repelTargets = useRef(new Map());

  useEffect(() => {
    if (!containerRef.current) return;
    
    const elements = particlesRef.current.filter(Boolean);
    if (elements.length === 0) return;

    // --- 1. Base Drifting Animation via Anime.js ---
    elements.forEach((el, index) => {
      // Initialize random positions
      const startX = random(-10, 110); // vw
      const startY = random(10, 110); // vh
      const duration = random(15000, 35000); // 15s to 35s loop
      
      // Set initial state
      set(el, {
        translateX: `${startX}vw`,
        translateY: `${startY}vh`,
        scale: random(20, 150) / 100, // 0.2 to 1.5 scale
        opacity: random(20, 80) / 100 // 0.2 to 0.8 opacity
      });

      // Continuous upward drifting and horizontal swaying
      animate(el, {
        translateY: [
          { value: `${startY}vh`, duration: 0 },
          { value: `-20vh`, duration: duration, easing: 'linear' }
        ],
        translateX: [
          { value: `${startX}vw`, duration: 0 },
          { value: `${startX + random(-15, 15)}vw`, duration: duration * 0.5, easing: 'easeInOutSine' },
          { value: `${startX + random(-15, 15)}vw`, duration: duration * 0.5, easing: 'easeInOutSine' }
        ],
        rotate: [
          { value: 0, duration: 0 },
          { value: random(-180, 180), duration: duration, easing: 'linear' }
        ],
        loop: true,
      });
      
      // Reset position when they move completely off-screen top (simulated infinite scroll)
      // Anime.js handles the loop, so they will snap back to startY and drift again smoothly over long durations.
    });

    // --- 2. Interactive Physics via requestAnimationFrame ---
    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    let rafId;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const renderLoop = () => {
      const pX = (mouse.current.x - centerX) / centerX;
      const pY = (mouse.current.y - centerY) / centerY;

      elements.forEach((el, index) => {
        const innerNode = el.firstElementChild;
        if (!innerNode) return;

        // Depth calculation for parallax (layers 1 to 5)
        const depth = (index % 5) + 1;
        
        // 1. Parallax offset (subtle opposite movement to mouse)
        const parallaxX = pX * depth * -15; 
        const parallaxY = pY * depth * -15;

        // 2. Repel Force calculation (particles scatter from cursor)
        const rect = el.getBoundingClientRect();
        // Exact center of the particle in viewport
        const elX = rect.left + rect.width / 2;
        const elY = rect.top + rect.height / 2;
        
        const dx = mouse.current.x - elX;
        const dy = mouse.current.y - elY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const repelRadius = 200; // Activation distance
        
        let currentRepel = repelTargets.current.get(index) || { x: 0, y: 0 };
        let targetRepelX = 0;
        let targetRepelY = 0;

        if (distance < repelRadius) {
          const force = (repelRadius - distance) / repelRadius; // 0 to 1
          // Pushes away from mouse stronger based on closeness
          targetRepelX = -(dx / distance) * force * 60; 
          targetRepelY = -(dy / distance) * force * 60;
        }

        // Lerp (smooth interpolation) towards the target repel position for organicity
        currentRepel.x += (targetRepelX - currentRepel.x) * 0.1;
        currentRepel.y += (targetRepelY - currentRepel.y) * 0.1;
        repelTargets.current.set(index, currentRepel);

        // Combine Parallax and Repel on the inner element to not conflict with anime.js outer element
        innerNode.style.transform = `translate3d(${parallaxX + currentRepel.x}px, ${parallaxY + currentRepel.y}px, 0px)`;
      });

      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
      remove(elements);
    };
  }, []);

  const registerParticle = (el, index) => {
    particlesRef.current[index] = el;
  };

  return { containerRef, registerParticle };
};

import { useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

const useTextRevealAnimation = () => {
  const scope = useRef(null);
  const controls = useAnimation();

  const entranceAnimation = async () => {
    if (!scope.current) return;
    
    // Reset to initial state
    await controls.start({
      opacity: 0,
      y: 50
    });
    
    // Animate in
    return controls.start({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1
      }
    });
  };

  const exitAnimation = () => {
    if (!scope.current) return;
    
    return controls.start({
      opacity: 0,
      y: 50,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    });
  };

  // Run entrance animation when component mounts
  useEffect(() => {
    if (scope.current) {
      entranceAnimation();
    }
  }, []);

  return {
    scope,
    controls,
    entranceAnimation,
    exitAnimation
  };
};

export default useTextRevealAnimation;
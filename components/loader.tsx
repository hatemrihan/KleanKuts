import { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";

const Loader = () => {
  const [percent, setPercent] = useState(0);
  const controls = useAnimation();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let current = 0;
    intervalRef.current = setInterval(() => {
      current += 1;
      setPercent(current);
      if (current >= 100 && intervalRef.current) clearInterval(intervalRef.current);
    }, 30); // slower for a more visible effect

    controls.start({ height: "100%" });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [controls]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent">
      <div className="loader-bg" />
      <svg viewBox="0 0 40 12" className="loader-svg" style={{ position: "relative" }}>
        <mask id="m" fill="#fff">
          <text id="num" x="20" y="11" textAnchor="middle">
            {percent}%
          </text>
        </mask>
        <g mask="url(#m)">
          {/* Black fill text */}
          <text x="20" y="11" textAnchor="middle" fill="#000">
            {percent}%
          </text>
          {/* Animated fill bar */}
          <motion.rect
            id="fill"
            width="100%"
            height="100%"
            fill="#fff"
            initial={{ scaleY: 0.08 }}
            animate={{ scaleY: percent === 100 ? 0.95 : 0.08 }}
            style={{ transformOrigin: "0 100%" }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
          {/* Outlined text */}
          <text
            x="20"
            y="11"
            textAnchor="middle"
            fillOpacity="0"
            stroke="#000"
            strokeWidth="0.75"
          >
            {percent}%
          </text>
        </g>
      </svg>
    </div>
  );
};

export default Loader;
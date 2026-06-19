import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { msg: 'Scanning available servers...', icon: '🔍' },
  { msg: 'Testing connection speed...', icon: '⚡' },
  { msg: 'Checking stream quality...', icon: '📡' },
  { msg: 'Optimizing for your network...', icon: '🌐' },
  { msg: 'Server found! Loading stream...', icon: '🎬' },
];

export default function PlayerLoader({ onComplete, title }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1.2;
      });
    }, 48);

    const stepInterval = setInterval(() => {
      setStep((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 900);

    const completeTimer = setTimeout(() => {
      setDone(true);
      setTimeout(onComplete, 600);
    }, 4200);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      clearTimeout(completeTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-dark overflow-hidden"
    >
      {/* Animated background grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glowing orb */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0,212,255,0.3), transparent)',
        }}
      />

      {/* ── CHARACTER ── */}
      <div className="relative mb-10 flex flex-col items-center">

        {/* Lightning sparks */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-lg pointer-events-none"
            style={{
              top: `${-10 + Math.sin(i) * 60}px`,
              left: `${-10 + Math.cos(i) * 80}px`,
            }}
            animate={{
              x: [0, i % 2 === 0 ? 20 : -20, 0],
              y: [0, -30, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          >
            ⚡
          </motion.div>
        ))}

        {/* Body bouncing */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.4, repeat: Infinity }}
            className="relative w-24 h-24"
          >
            {/* Outer ring */}
            <div
              className="w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, #0a0a1f, #12121a)',
                boxShadow:
                  '0 0 30px rgba(0,212,255,0.5), inset 0 0 20px rgba(0,212,255,0.1)',
              }}
            >
              {/* Film holes */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 rounded-full bg-primary/30 border border-primary/60"
                  style={{
                    transform: `rotate(${i * 45}deg) translateY(-36px)`,
                  }}
                />
              ))}

              {/* Face */}
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="flex gap-3">
                  <motion.div
                    animate={{ scaleY: [1, 0.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    className="w-3 h-3 rounded-full bg-primary"
                    style={{ boxShadow: '0 0 8px #00d4ff' }}
                  />
                  <motion.div
                    animate={{ scaleY: [1, 0.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1.1 }}
                    className="w-3 h-3 rounded-full bg-primary"
                    style={{ boxShadow: '0 0 8px #00d4ff' }}
                  />
                </div>
                <div
                  className="w-5 h-1.5 rounded-full bg-gold"
                  style={{ boxShadow: '0 0 6px #ffd700' }}
                />
              </div>
            </div>

            {/* Spinning dashed ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
            />
          </motion.div>

          {/* Speed lines */}
          <motion.div
            animate={{ scaleX: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 0.3, repeat: Infinity }}
            className="absolute -left-8 top-8 flex flex-col gap-1"
          >
            {[10, 16, 10].map((w, i) => (
              <div
                key={i}
                className="h-0.5 bg-gradient-to-r from-transparent to-primary rounded-full"
                style={{ width: `${w}px` }}
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Running legs */}
        <div className="flex gap-4 mt-1">
          <motion.div
            animate={{ rotate: [20, -20, 20], y: [0, -4, 0] }}
            transition={{ duration: 0.35, repeat: Infinity }}
            className="w-2 h-7 bg-primary rounded-full origin-top"
            style={{ boxShadow: '0 0 8px rgba(0,212,255,0.6)' }}
          />
          <motion.div
            animate={{ rotate: [-20, 20, -20], y: [0, -4, 0] }}
            transition={{ duration: 0.35, repeat: Infinity }}
            className="w-2 h-7 bg-primary rounded-full origin-top"
            style={{ boxShadow: '0 0 8px rgba(0,212,255,0.6)' }}
          />
        </div>

        {/* Ground shadow */}
        <motion.div
          animate={{ scaleX: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="w-16 h-2 rounded-full mt-1"
          style={{
            background: 'radial-gradient(ellipse, rgba(0,212,255,0.4), transparent)',
          }}
        />
      </div>

      {/* Title */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-white font-black text-xl mb-1 tracking-wider text-center px-4"
        style={{ fontFamily: 'Bebas Neue, sans-serif' }}
      >
        {title}
      </motion.p>

      {/* Step message */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 mb-8"
        >
          <span className="text-xl">{STEPS[step].icon}</span>
          <span className="text-primary text-sm tracking-wide">
            {STEPS[step].msg}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Progress bar — FIXED: only ONE style prop */}
      <div className="w-72 sm:w-96 h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #00d4ff, #ffd700)',
            boxShadow: '0 0 10px rgba(0,212,255,0.8)',
          }}
        />
      </div>

      {/* Percentage */}
      <p className="text-gray-500 text-xs tracking-widest">
        {Math.min(Math.round(progress), 100)}% — FINDING BEST SERVER
      </p>

      {/* Step dots */}
      <div className="flex items-center gap-2 mt-6">
        {STEPS.map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: i === step ? 1.4 : 1,
              backgroundColor:
                i <= step ? '#00d4ff' : 'rgba(255,255,255,0.1)',
            }}
            className="w-2 h-2 rounded-full"
            style={{ boxShadow: i === step ? '0 0 8px #00d4ff' : 'none' }}
          />
        ))}
      </div>

      {/* Done flash */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-dark/80"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-3"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(0,212,255,0.2)',
                  boxShadow: '0 0 40px rgba(0,212,255,0.6)',
                  border: '2px solid #00d4ff',
                }}
              >
                <span className="text-4xl">▶️</span>
              </div>
              <p
                className="text-primary font-black text-lg tracking-widest"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                STARTING PLAYBACK!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
import { motion } from 'framer-motion';

export function FlameMark({ size = 28, animate = false, className = '' }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 40 50" fill="none" className={className} aria-hidden="true">
      <motion.path
        d="M20 2c2.5 9 12 14.5 12 25.5a12 12 0 0 1-24 0c0-6.5 3.6-9.4 5.8-14.5 1 4.6 2.8 6.6 4.7 8.4C20.3 16.4 19.7 9.6 20 2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : false}
        animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.path
        d="M20 22c1.9 3.9 6 5.9 6 10.6a6 6 0 0 1-12 0c0-3.6 2.5-5.4 3.6-8.1.5 1.9 1.1 2.8 2 3.6z"
        fill="currentColor"
        initial={animate ? { opacity: 0, scale: 0.6 } : false}
        animate={animate ? { opacity: 1, scale: 1 } : undefined}
        transition={{ delay: 1.1, duration: 0.8 }}
        style={{ transformOrigin: '20px 34px' }}
      />
    </svg>
  );
}

export function Wordmark({ className = '', withTagline = false }) {
  return (
    <span className={`wordmark ${className}`}>
      <span className="wordmark__text">NOORÉ</span>
      {withTagline && <span className="wordmark__tag">Made to make moments.</span>}
    </span>
  );
}

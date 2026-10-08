import { motion, useReducedMotion } from 'framer-motion';
import { Children, useMemo } from 'react';

const EASE = [0.16, 1, 0.3, 1];

/** Fade-up reveal on scroll, with optional stagger of direct children. */
export function Reveal({ children, delay = 0, y = 32, duration = 1, once = true, amount = 0.3, className = '', as = 'div', stagger = 0, blur = false, ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;
  if (stagger) {
    return (
      <Tag
        className={className}
        initial="hidden"
        whileInView="show"
        viewport={{ once, amount }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
        {...rest}
      >
        {Children.map(children, (child) => (
          <motion.div variants={{ hidden: { opacity: 0, y: reduce ? 0 : y, filter: blur ? 'blur(8px)' : 'none' }, show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration, ease: EASE } } }}>
            {child}
          </motion.div>
        ))}
      </Tag>
    );
  }
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y, filter: blur ? 'blur(8px)' : 'none' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Split text into words (or characters) that rise in with a mask — the signature
 * luxury-editorial headline treatment.
 */
export function SplitText({ text, as = 'span', mode = 'word', delay = 0, stagger = 0.045, duration = 1.1, className = '', once = true, inView = true, animateKey }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.span;
  const parts = useMemo(() => {
    if (mode === 'char') return Array.from(text).map((c, i) => ({ c, i }));
    return text.split(' ').map((w, i) => ({ c: w, i }));
  }, [text, mode]);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : stagger, delayChildren: delay } },
  };
  const item = {
    hidden: { y: '110%', rotate: 3, opacity: 0 },
    show: { y: '0%', rotate: 0, opacity: 1, transition: { duration, ease: EASE } },
  };

  return (
    <Tag
      key={animateKey}
      className={`split ${className}`}
      variants={container}
      initial="hidden"
      {...(inView ? { whileInView: 'show', viewport: { once, amount: 0.5 } } : { animate: 'show' })}
    >
      {/* Screen readers ignore aria-label on a plain span, so give them the text itself. */}
      <span className="sr-only">{text}</span>
      {parts.map(({ c, i }) => (
        <span className="split__mask" key={i} aria-hidden="true">
          <motion.span className="split__item" variants={item}>{c === ' ' ? ' ' : c}</motion.span>
          {mode === 'word' && i < parts.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  );
}

/** Line that draws itself in. */
export function DrawLine({ className = '', delay = 0 }) {
  return (
    <motion.span
      className={`drawline ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, delay, ease: EASE }}
    />
  );
}

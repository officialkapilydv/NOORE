import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cx } from '@/lib/format';

/* ─── Rolling hover text (nav/footer links) ─── */
export function SwapText({ text, className = '' }) {
  return (
    <span className={cx('swap', className)}>
      <span className="swap__inner">
        <span>{text}</span>
        <span aria-hidden="true">{text}</span>
      </span>
    </span>
  );
}

/* ─── Section heading ─── */
export function SectionHeading({ eyebrow, title, lead, align = 'left', className = '', children }) {
  return (
    <div className={cx('sec-head', `sec-head--${align}`, className)}>
      {eyebrow && <motion.span className="eyebrow" initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>{eyebrow}</motion.span>}
      {title && <motion.h2 className="sec-head__title" initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}>{title}</motion.h2>}
      {lead && <motion.p className="lead sec-head__lead" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.25 }}>{lead}</motion.p>}
      {children}
    </div>
  );
}

/* ─── Infinite marquee ─── */
export function Marquee({ items, speed = 40, className = '', separator = '✦' }) {
  const list = [...items, ...items];
  return (
    <div className={cx('marquee', className)} aria-hidden="true">
      <div className="marquee__track" style={{ animationDuration: `${speed}s` }}>
        {list.map((item, i) => (
          <span className="marquee__item" key={i}>
            {item}
            <span className="marquee__sep">{separator}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── 3D tilt card (pointer-driven perspective) ─── */
export function TiltCard({ children, className = '', max = 10, glare = true, scale = 1.02, style, ...rest }) {
  const ref = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const srx = useSpring(rx, { stiffness: 180, damping: 22, mass: 0.6 });
  const sry = useSpring(ry, { stiffness: 180, damping: 22, mass: 0.6 });
  const glareBg = useTransform([gx, gy], ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,240,200,0.28), rgba(255,255,255,0) 55%)`);

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * max * 2);
    rx.set(-(py - 0.5) * max * 2);
    gx.set(px * 100);
    gy.set(py * 100);
  };
  const onLeave = () => { rx.set(0); ry.set(0); gx.set(50); gy.set(50); };

  return (
    <motion.div
      ref={ref}
      className={cx('tilt', className)}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 1100, ...style }}
      whileHover={{ scale }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      {...rest}
    >
      {children}
      {glare && <motion.span className="tilt__glare" style={{ background: glareBg }} aria-hidden="true" />}
    </motion.div>
  );
}

/* ─── Animated number counter ─── */
export function Counter({ to, duration = 1.8, prefix = '', suffix = '', decimals = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 4);
      setVal(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return <span ref={ref} className={className}>{prefix}{val.toFixed(decimals)}{suffix}</span>;
}

/* ─── Stars ─── */
export function Stars({ value = 5, size = 14, className = '' }) {
  return (
    <span className={cx('stars', className)} aria-label={`${value} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <linearGradient id={`star-${i}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor="currentColor" />
                <stop offset={`${fill * 100}%`} stopColor="currentColor" stopOpacity="0.22" />
              </linearGradient>
            </defs>
            <path fill={`url(#star-${i}-${Math.round(fill * 100)})`} d="M12 2.5l2.9 6.1 6.7.8-4.9 4.6 1.3 6.6L12 17.3 6 20.6l1.3-6.6L2.4 9.4l6.7-.8z" />
          </svg>
        );
      })}
    </span>
  );
}

/* ─── Badge ─── */
export function Badge({ children, tone = 'gold', className = '' }) {
  return <span className={cx('badge', `badge--${tone}`, className)}>{children}</span>;
}

/* ─── Accordion ─── */
export function Accordion({ items, defaultOpen = 0, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cx('accordion', className)}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div className={cx('accordion__item', isOpen && 'is-open')} key={item.title}>
            <button className="accordion__head" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
              <span className="accordion__title">{item.title}</span>
              <span className="accordion__icon" aria-hidden="true"><span /><span /></span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  className="accordion__body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
                >
                  <div className="accordion__content">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Skeleton ─── */
export function Skeleton({ className = '', style }) {
  return <span className={cx('skeleton', className)} style={style} aria-hidden="true" />;
}

/* ─── Form field ─── */
export function Field({ label, error, hint, as = 'input', className = '', children, ...rest }) {
  const Tag = as;
  const id = rest.id || rest.name;
  const errorId = id && `${id}-error`;
  const hintId = id && `${id}-hint`;
  return (
    <label className={cx('field', error && 'has-error', className)} htmlFor={id}>
      {label && <span className="field__label">{label}</span>}
      {children || <Tag id={id} className="field__input" aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : hint ? hintId : undefined} {...rest} />}
      <span className="field__line" aria-hidden="true" />
      <AnimatePresence>
        {error && <motion.span id={errorId} role="alert" className="field__error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.span>}
      </AnimatePresence>
      {hint && !error && <span id={hintId} className="field__hint">{hint}</span>}
    </label>
  );
}

/* ─── Quantity stepper ─── */
export function Stepper({ value, onChange, min = 1, max = 10, size = 'md', label = 'Quantity' }) {
  return (
    <div className={cx('stepper', `stepper--${size}`)} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label="Decrease" disabled={value <= min}>−</button>
      <span className="sr-only" aria-live="polite">{value}</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={value} aria-hidden="true" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.2 }}>{value}</motion.span>
      </AnimatePresence>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label="Increase" disabled={value >= max}>+</button>
    </div>
  );
}

/* ─── Soft image with blur-up & tiny-source grading ─── */
export function Img({ src, alt = '', className = '', aspect, style, ...rest }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span className={cx('img', loaded && 'is-loaded', className)} style={{ aspectRatio: aspect, ...style }}>
      <img src={src} alt={alt} loading="lazy" decoding="async" onLoad={() => setLoaded(true)} {...rest} />
    </span>
  );
}

import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Open dialogs, newest last: only the topmost one handles Escape and Tab (search can open over the bag).
const stack = [];

/**
 * Modal behaviour for drawers and overlays: moves focus inside on open, keeps Tab within
 * (`trap`), closes on Escape, makes the page behind inert for keyboard and screen readers,
 * and returns focus to whatever opened it on close.
 *
 *  - `initialFocus`: selector inside the dialog to focus first; `false` leaves focus alone
 *  - `inert`: selectors for the background to disable while open
 */
export function useDialog(open, onClose, { initialFocus, trap = true, inert = ['.nav', '.page'] } = {}) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const token = {};
    stack.push(token);
    const background = inert.flatMap((sel) => [...document.querySelectorAll(sel)]).filter((el) => !el.inert);
    background.forEach((el) => { el.inert = true; });

    const raf = requestAnimationFrame(() => {
      const root = ref.current;
      if (!root || initialFocus === false) return;
      const target = (initialFocus && root.querySelector(initialFocus)) || root;
      target.focus({ preventScroll: true });
    });

    const onKey = (e) => {
      if (stack[stack.length - 1] !== token) return;
      if (e.key === 'Escape') { closeRef.current?.(); return; }
      const root = ref.current;
      if (!trap || e.key !== 'Tab' || !root) return;
      const items = [...root.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) { e.preventDefault(); root.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const inside = root.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !inside)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(token), 1);
      background.forEach((el) => { el.inert = false; });
      if (previous && document.contains(previous)) previous.focus?.({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return ref;
}

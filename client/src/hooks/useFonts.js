import { useEffect, useState } from 'react';

let ready = false;
const waiters = new Set();

if (typeof document !== 'undefined' && document.fonts) {
  Promise.all([
    document.fonts.load('400 24px "Cormorant Garamond"'),
    document.fonts.load('300 16px "Jost"'),
    document.fonts.ready,
  ])
    .catch(() => {})
    .finally(() => {
      ready = true;
      waiters.forEach((fn) => fn(true));
      waiters.clear();
    });
} else {
  ready = true;
}

export function useFontsReady() {
  const [isReady, setReady] = useState(ready);
  useEffect(() => {
    if (ready) return setReady(true);
    waiters.add(setReady);
    return () => waiters.delete(setReady);
  }, []);
  return isReady;
}

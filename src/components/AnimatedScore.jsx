import { useEffect, useState } from 'react';

export default function AnimatedScore({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const from = 0;
    const to = Number(value) || 0;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{display}</>;
}

export function scoreTierClass(score) {
  if (score >= 75) return 'text-emerald-500';
  if (score >= 50) return 'text-coral-500';
  if (score >= 25) return 'text-amber-500';
  return 'text-rose-500';
}

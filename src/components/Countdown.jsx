import { useEffect, useState } from 'react';

export default function Countdown({ onDone }) {
  const [n, setN] = useState(3);

  useEffect(() => {
    if (n === 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setN((v) => v - 1), 900);
    return () => clearTimeout(t);
  }, [n, onDone]);

  if (n === 0) return null;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-coral-500/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute inset-8 rounded-3xl border border-coral-500/40 shadow-[0_0_60px_rgba(255,107,61,0.25)]" />
      </div>

      <div
        key={n}
        className="relative font-extrabold text-[18rem] leading-none animate-pop"
        style={{
          color: '#fff',
          textShadow:
            '0 0 24px rgba(255,107,61,0.85), 0 0 60px rgba(255,107,61,0.45)'
        }}
      >
        {n}
      </div>
      <p className="relative mt-6 text-2xl font-semibold tracking-widest text-coral-400">
        Get ready!
      </p>
    </div>
  );
}

import { useState } from 'react';

export default function Registration({ onStart, onLeaderboard }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [tab, setTab] = useState('play');

  const canStart =
    name.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(email) &&
    rollNumber.trim().length > 0;

  function submit(e) {
    e.preventDefault();
    if (!canStart) return;
    onStart({ name: name.trim(), email: email.trim(), rollNumber: rollNumber.trim() });
  }

  function handleTab(next) {
    setTab(next);
    if (next === 'leaderboard') onLeaderboard?.();
  }

  return (
    <div className="checker-bg min-h-screen w-full flex flex-col">
      <header className="w-full px-6 pt-8 pb-2 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            EMOJI MIMIC GAME
          </h1>
          <span className="bg-coral-500 text-white text-xs font-bold rounded-full px-3 py-1">
            GAME
          </span>
        </div>

        <nav className="flex gap-2 bg-white/70 backdrop-blur rounded-full p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => handleTab('play')}
            className={`tab ${tab === 'play' ? 'tab-active' : 'tab-inactive'}`}
          >
            Play
          </button>
          <button
            type="button"
            onClick={() => handleTab('leaderboard')}
            className={`tab ${tab === 'leaderboard' ? 'tab-active' : 'tab-inactive'}`}
          >
            Leaderboard
          </button>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <form
          onSubmit={submit}
          className="w-full max-w-md text-center flex flex-col items-center gap-6"
        >
          <p className="text-slate-500">Match your face. Beat the clock. Have fun!</p>

          <div className="w-16 h-16 rounded-2xl bg-white shadow-card border border-slate-100 flex items-center justify-center text-3xl">
            🎮
          </div>

          <p className="text-slate-700 font-semibold tracking-wide">
            3 rounds · 10 seconds each · Make your best face!
          </p>

          <div className="w-full flex flex-col gap-3 mt-2">
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              autoComplete="name"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              autoComplete="email"
            />
            <input
              type="text"
              placeholder="Roll Number"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              className="input-field"
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={!canStart}
            className={`btn-primary w-full max-w-xs mt-2 text-lg ${
              canStart ? '' : 'opacity-60 cursor-not-allowed'
            }`}
          >
            START GAME
          </button>
        </form>
      </main>

      <footer className="w-full text-center pb-6 text-xs text-slate-400 tracking-wider">
        powered by <span className="font-bold text-slate-600">Technical Hub</span>
      </footer>
    </div>
  );
}

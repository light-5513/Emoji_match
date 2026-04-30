import { MAX_SCORE, getCompliment } from '../utils/rounds.js';

export default function FinalResults({
  player,
  total,
  submitState,
  onPlayAgain,
  onLeaderboard
}) {
  const status = submitState?.status || 'idle';

  return (
    <div className="checker-bg min-h-screen w-full flex flex-col">
      <header className="w-full px-6 pt-6 pb-2 max-w-6xl mx-auto flex items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          EMOJI MIMIC GAME
        </h1>
        <span className="bg-coral-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
          GAME
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="card max-w-xl w-full p-10 text-center flex flex-col items-center gap-6">
          <div className="text-7xl">🏆</div>

          <div>
            <div className="text-7xl sm:text-8xl font-extrabold text-slate-900 leading-none">
              {total}
            </div>
            <div className="mt-2 text-sm font-semibold tracking-widest text-slate-500">
              OUT OF {MAX_SCORE} POSSIBLE
            </div>
          </div>

          <p className="text-lg text-slate-700 max-w-sm">
            {getCompliment(player?.name, total)}
          </p>

          <div className="text-xs text-slate-500 min-h-[18px]">
            {status === 'sending' && 'Saving your score and sending email…'}
            {status === 'sent' && (
              <span className="text-emerald-600 font-semibold">
                ✓ Score saved · Results emailed to {player?.email}
              </span>
            )}
            {status === 'error' && (
              <span className="text-coral-600">
                Could not save score: {submitState.error}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
            <button onClick={onPlayAgain} className="btn-primary px-8 py-3">
              PLAY AGAIN
            </button>
            <button onClick={onLeaderboard} className="btn-outline px-8 py-3">
              LEADERBOARD
            </button>
          </div>
        </div>
      </main>

      <footer className="w-full text-center pb-6 text-xs text-slate-400 tracking-wider">
        powered by <span className="font-bold text-slate-600">Technical Hub</span>
      </footer>
    </div>
  );
}

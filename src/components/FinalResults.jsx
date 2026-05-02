import { useEffect, useState } from 'react';
import { MAX_SCORE, getCompliment } from '../utils/rounds.js';
import AnimatedScore, { scoreTierClass } from './AnimatedScore.jsx';
import { buildResultCard, buildQrDataUrl } from '../utils/cardBuilder.js';

export default function FinalResults({
  player,
  total,
  rounds,
  results,
  submitState,
  onPlayAgain,
  onLeaderboard
}) {
  const status = submitState?.status || 'idle';
  const shareUrl = submitState?.shareUrl || null;
  const tierPct = Math.round((total / MAX_SCORE) * 100);
  const tier = scoreTierClass(tierPct);

  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [cardDataUrl, setCardDataUrl] = useState(null);
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState(null);

  // Build QR as soon as the share URL arrives.
  useEffect(() => {
    if (!shareUrl) return;
    let cancelled = false;
    buildQrDataUrl(shareUrl, 220)
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [shareUrl]);

  // Build the downloadable card once everything is ready.
  useEffect(() => {
    if (!shareUrl || !rounds || !results || results.length === 0) return;
    let cancelled = false;
    setBuilding(true);
    setBuildError(null);

    const cardRounds = rounds.map((r, i) => ({
      emotion: r.emotion,
      emoji: r.emoji,
      score: results[i]?.score ?? 0,
      features: results[i]?.features ?? [],
      imageDataUrl: results[i]?.imageDataUrl
    }));

    buildResultCard({
      player,
      total,
      max: MAX_SCORE,
      rounds: cardRounds,
      shareUrl
    })
      .then((dataUrl) => {
        if (!cancelled) setCardDataUrl(dataUrl);
      })
      .catch((err) => {
        if (!cancelled) setBuildError(err.message);
      })
      .finally(() => {
        if (!cancelled) setBuilding(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shareUrl, rounds, results, player, total]);

  function handleDownload() {
    if (!cardDataUrl) return;
    const a = document.createElement('a');
    a.href = cardDataUrl;
    a.download = `emoji-mimic-${(player?.name || 'report').replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

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
        <div className="card max-w-3xl w-full p-10 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-coral-100 blur-3xl opacity-60 pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
            {/* LEFT: total + compliment */}
            <div className="text-center md:text-left flex flex-col items-center md:items-start gap-4">
              <div className="text-6xl animate-pop">🏆</div>

              <div>
                <div className={`text-7xl sm:text-8xl font-extrabold leading-none ${tier}`}>
                  <AnimatedScore value={total} duration={1200} />
                </div>
                <div className="mt-2 text-sm font-semibold tracking-widest text-slate-500">
                  OUT OF {MAX_SCORE} POSSIBLE
                </div>
              </div>

              <p className="text-base text-slate-700 max-w-xs">
                {getCompliment(player?.name, total)}
              </p>

              <div className="text-xs text-slate-500 min-h-[18px]">
                {status === 'sending' && (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-coral-500 border-t-transparent rounded-full animate-spin" />
                    Saving and uploading photos…
                  </span>
                )}
                {status === 'sent' && shareUrl && (
                  <span className="text-emerald-600 font-semibold">✓ Report saved</span>
                )}
                {status === 'error' && (
                  <span className="text-coral-600">Could not save: {submitState.error}</span>
                )}
              </div>
            </div>

            {/* RIGHT: QR + download */}
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white border-2 border-slate-100 rounded-3xl p-4 shadow-card">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Report QR" className="w-56 h-56" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-sm">
                    {status === 'sending' ? 'Preparing QR…' : 'QR will appear here'}
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="font-extrabold tracking-widest text-sm text-slate-700">
                  SCAN TO VIEW REPORT
                </div>
                {shareUrl ? (
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-coral-600 hover:underline break-all mt-1 inline-block max-w-xs"
                  >
                    {shareUrl}
                  </a>
                ) : null}
              </div>

              <button
                onClick={handleDownload}
                disabled={!cardDataUrl}
                className={`btn-primary px-8 py-3 flex items-center gap-2 ${
                  cardDataUrl ? '' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                {building ? 'Preparing…' : '⬇ DOWNLOAD CARD'}
              </button>

              {buildError ? (
                <div className="text-xs text-coral-600">{buildError}</div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center mt-8 relative">
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

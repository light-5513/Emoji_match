import { useEffect, useState } from 'react';
import { MAX_SCORE, getCompliment } from '../utils/rounds.js';
import AnimatedScore, { scoreTierClass } from './AnimatedScore.jsx';
import { buildResultCard, buildQrDataUrl } from '../utils/cardBuilder.js';
import { uploadCard } from '../utils/api.js';

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
  const cardUrl = submitState?.cardUrl || null;
  const reportId = submitState?.reportId || null;
  const tierPct = Math.round((total / MAX_SCORE) * 100);
  const tier = scoreTierClass(tierPct);

  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [cardDataUrl, setCardDataUrl] = useState(null);
  const [building, setBuilding] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | done | error
  const [uploadError, setUploadError] = useState(null);

  // QR for the GCS card URL (the card itself will live at this exact URL).
  useEffect(() => {
    if (!cardUrl) return;
    let cancelled = false;
    buildQrDataUrl(cardUrl, 220)
      .then((dataUrl) => !cancelled && setQrDataUrl(dataUrl))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cardUrl]);

  // Build the card (with QR baked in pointing to its own GCS URL),
  // then upload to the backend so it lives at that GCS URL. If cardUrl is
  // missing (GCS not configured on server), still build the card without a
  // QR so the user can at least download it locally.
  useEffect(() => {
    if (status !== 'sent') return;
    if (!rounds || !results || results.length === 0) return;

    let cancelled = false;
    setBuilding(true);
    setUploadStatus('idle');
    setUploadError(null);

    const cardRounds = rounds.map((r, i) => ({
      emotion: r.emotion,
      emoji: r.emoji,
      score: results[i]?.score ?? 0,
      features: results[i]?.features ?? [],
      imageDataUrl: results[i]?.imageDataUrl
    }));

    (async () => {
      try {
        const dataUrl = await buildResultCard({
          player,
          total,
          max: MAX_SCORE,
          rounds: cardRounds,
          shareUrl: cardUrl || ''
        });
        if (cancelled) return;
        setCardDataUrl(dataUrl);
        setBuilding(false);

        if (!cardUrl || !reportId) {
          setUploadStatus('error');
          setUploadError('Server returned no cardUrl — GCS not configured on backend');
          return;
        }

        setUploadStatus('uploading');
        await uploadCard(reportId, dataUrl);
        if (cancelled) return;
        setUploadStatus('done');
      } catch (err) {
        if (cancelled) return;
        setBuilding(false);
        setUploadStatus('error');
        setUploadError(err.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cardUrl, reportId, rounds, results, player, total]);

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

              <div className="text-xs min-h-[18px]">
                {status === 'sending' && (
                  <span className="inline-flex items-center gap-2 text-slate-500">
                    <span className="inline-block w-3 h-3 border-2 border-coral-500 border-t-transparent rounded-full animate-spin" />
                    Saving and uploading photos…
                  </span>
                )}
                {status === 'sent' && uploadStatus === 'uploading' && (
                  <span className="inline-flex items-center gap-2 text-slate-500">
                    <span className="inline-block w-3 h-3 border-2 border-coral-500 border-t-transparent rounded-full animate-spin" />
                    Uploading report card to bucket…
                  </span>
                )}
                {status === 'sent' && uploadStatus === 'done' && (
                  <span className="text-emerald-600 font-semibold">
                    ✓ Report uploaded to Cloud Storage
                  </span>
                )}
                {status === 'sent' && !cardUrl && uploadStatus !== 'error' && (
                  <span className="text-coral-600 font-semibold">
                    ⚠ Server didn't return cardUrl — restart the API server
                  </span>
                )}
                {(status === 'error' || uploadStatus === 'error') && (
                  <span className="text-coral-600">
                    {submitState?.error || uploadError || 'Upload failed'}
                  </span>
                )}
              </div>
            </div>

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
                  SCAN TO DOWNLOAD REPORT
                </div>
                {cardUrl ? (
                  <a
                    href={cardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-coral-600 hover:underline break-all mt-1 inline-block max-w-xs"
                  >
                    {cardUrl}
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

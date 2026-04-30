import { useEffect, useRef, useState } from 'react';
import Webcam from './Webcam.jsx';
import CircularTimer from './CircularTimer.jsx';
import { evaluateExpression } from '../utils/evaluator.js';
import { ROUND_DURATION, TOTAL_ROUNDS } from '../utils/rounds.js';

export default function Gameplay({ round, totalScore, onRoundDone, onAdvance }) {
  const [remaining, setRemaining] = useState(ROUND_DURATION);
  const [phase, setPhase] = useState('playing'); // 'playing' | 'evaluating' | 'result'
  const [result, setResult] = useState(null); // { score, features, imageDataUrl }
  const webcamRef = useRef(null);
  const snappedRef = useRef(false);

  // Reset whenever a new round starts.
  useEffect(() => {
    setRemaining(ROUND_DURATION);
    setPhase('playing');
    setResult(null);
    snappedRef.current = false;
  }, [round.index]);

  // Tick the timer.
  useEffect(() => {
    if (phase !== 'playing') return;
    if (remaining <= 0) {
      handleSnap();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, phase]);

  async function handleSnap() {
    if (snappedRef.current) return;
    snappedRef.current = true;
    setPhase('evaluating');

    const image = webcamRef.current?.capture() || null;
    const evalResult = await evaluateExpression({
      imageDataUrl: image,
      targetEmotion: round.emotion
    });

    setResult(evalResult);
    setPhase('result');
    onRoundDone(evalResult);
  }

  const isResult = phase !== 'playing';

  return (
    <div className="checker-bg min-h-screen w-full flex flex-col">
      <header className="w-full px-6 pt-6 pb-4 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            EMOJI MIMIC GAME
          </h1>
          <span className="bg-coral-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
            GAME
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="text-slate-500 font-semibold mr-2">SCORE</span>
            <span className="font-extrabold text-lg">{totalScore}</span>
          </div>
          <div className="text-sm">
            <span className="text-slate-500 font-semibold mr-2">ROUND</span>
            <span className="font-extrabold text-lg">
              {round.index + 1}/{TOTAL_ROUNDS}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 pb-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
          {/* LEFT CARD — MATCH THIS */}
          <section className="card p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold tracking-widest text-slate-500 text-sm">
                MATCH THIS
              </h2>
              {!isResult ? (
                <CircularTimer remaining={remaining} total={ROUND_DURATION} />
              ) : (
                <button
                  onClick={onAdvance}
                  className="btn-primary px-6 py-3 text-sm flex items-center gap-2"
                >
                  NEXT ROUND
                  <span aria-hidden>→</span>
                </button>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-6 py-8">
              <div className="text-[10rem] leading-none select-none">
                {round.emoji}
              </div>
              <div className="text-3xl font-extrabold tracking-widest">
                {round.emotion.toUpperCase()}
              </div>
            </div>
          </section>

          {/* RIGHT CARD — YOUR FACE */}
          <section className="card p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold tracking-widest text-slate-500 text-sm">
                YOUR FACE
              </h2>
              {phase === 'evaluating' ? (
                <span className="text-xs font-semibold text-coral-600 animate-pulse">
                  ANALYZING…
                </span>
              ) : null}
            </div>

            <div className="relative flex-1 mt-4 min-h-[320px]">
              <Webcam ref={webcamRef} frozenImage={result?.imageDataUrl || null} />
            </div>

            <div className="mt-5 flex flex-col items-center">
              {phase === 'playing' ? (
                <button
                  type="button"
                  onClick={handleSnap}
                  className="btn-primary px-10 py-4 text-lg flex items-center gap-3"
                >
                  <span aria-hidden>📸</span>
                  SNAP!
                </button>
              ) : phase === 'result' && result ? (
                <div className="text-center">
                  <div className="text-6xl font-extrabold text-coral-500 leading-none">
                    {result.score}
                  </div>
                  <div className="mt-2 font-extrabold tracking-widest text-slate-700">
                    EXPRESSION MATCH
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {result.features.join(', ')}
                  </div>
                </div>
              ) : (
                <div className="h-[72px]" />
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import Webcam from './Webcam.jsx';
import CircularTimer from './CircularTimer.jsx';
import AnimatedScore, { scoreTierClass } from './AnimatedScore.jsx';
import { evaluateExpression } from '../utils/evaluator.js';
import { ROUND_DURATION, TOTAL_ROUNDS } from '../utils/rounds.js';

export default function Gameplay({ round, totalScore, onRoundDone, onAdvance }) {
  const [remaining, setRemaining] = useState(ROUND_DURATION);
  const [phase, setPhase] = useState('playing'); // 'playing' | 'evaluating' | 'result'
  const [result, setResult] = useState(null); // { score, features, imageDataUrl, breakdown }
  const webcamRef = useRef(null);
  const snappedRef = useRef(false);

  useEffect(() => {
    setRemaining(ROUND_DURATION);
    setPhase('playing');
    setResult(null);
    snappedRef.current = false;
  }, [round.index]);

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
          <div className="text-sm flex items-center gap-2">
            <span className="text-slate-500 font-semibold">ROUND</span>
            <span className="font-extrabold text-lg">
              {round.index + 1}/{TOTAL_ROUNDS}
            </span>
            <div className="flex gap-1 ml-2">
              {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${
                    i < round.index
                      ? 'bg-coral-500'
                      : i === round.index
                      ? 'bg-coral-500/60 ring-2 ring-coral-300'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
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
              <div className="text-[10rem] leading-none select-none drop-shadow-sm">
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
                <span className="flex items-center gap-2 text-xs font-semibold text-coral-600">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-coral-500 border-t-transparent rounded-full animate-spin" />
                  ANALYZING…
                </span>
              ) : null}
            </div>

            <div className="relative flex-1 mt-4 min-h-[320px]">
              <Webcam ref={webcamRef} frozenImage={result?.imageDataUrl || null} />

              {/* Target emoji sticker on the captured frame for instant compare */}
              {phase === 'result' ? (
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-2xl px-3 py-2 shadow-card flex items-center gap-2">
                  <span className="text-3xl leading-none">{round.emoji}</span>
                  <span className="text-[10px] font-bold tracking-widest text-slate-500">
                    TARGET
                  </span>
                </div>
              ) : null}

              {phase === 'evaluating' ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm rounded-2xl">
                  <div className="bg-white px-5 py-3 rounded-full shadow-card flex items-center gap-3">
                    <span className="inline-block w-4 h-4 border-2 border-coral-500 border-t-transparent rounded-full animate-spin" />
                    <span className="font-bold tracking-widest text-sm text-slate-700">
                      ANALYZING
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col items-center min-h-[110px]">
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
                <ResultBlock result={result} />
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function ResultBlock({ result }) {
  const breakdown = result.breakdown;
  return (
    <div className="text-center w-full">
      <div className={`text-7xl font-extrabold leading-none ${scoreTierClass(result.score)}`}>
        <AnimatedScore value={result.score} />
      </div>
      <div className="mt-2 font-extrabold tracking-widest text-slate-700">
        EXPRESSION MATCH
      </div>
      <div className="mt-1 text-xs text-slate-500">{result.features.join(' · ')}</div>

      {breakdown ? (
        <div className="mt-3 grid grid-cols-4 gap-2 max-w-sm mx-auto">
          {[
            ['Mouth', breakdown.mouth],
            ['Eyes', breakdown.eyes],
            ['Brows', breakdown.brows],
            ['Vibe', breakdown.commitment]
          ].map(([label, val]) => (
            <div key={label} className="flex flex-col items-center">
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-coral-500 transition-all duration-700"
                  style={{ width: `${(val / 25) * 100}%` }}
                />
              </div>
              <div className="mt-1 text-[10px] font-bold tracking-widest text-slate-400">
                {label.toUpperCase()}
              </div>
              <div className="text-xs font-extrabold text-slate-700">{val}/25</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

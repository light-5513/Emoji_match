import { useState, useCallback, useEffect } from 'react';
import Registration from './components/Registration.jsx';
import Countdown from './components/Countdown.jsx';
import Gameplay from './components/Gameplay.jsx';
import FinalResults from './components/FinalResults.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import { pickRounds, TOTAL_ROUNDS } from './utils/rounds.js';
import { submitScore } from './utils/api.js';

const SCREENS = {
  REGISTER: 'register',
  COUNTDOWN: 'countdown',
  PLAY: 'play',
  FINAL: 'final',
  LEADERBOARD: 'leaderboard'
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.REGISTER);
  const [player, setPlayer] = useState(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [results, setResults] = useState([]); // [{ score, features, imageDataUrl }]
  const [rounds, setRounds] = useState(() => pickRounds(TOTAL_ROUNDS));
  const [submitState, setSubmitState] = useState({ status: 'idle', error: null });

  const totalScore = results.reduce((sum, r) => sum + (r?.score || 0), 0);

  const handleStart = useCallback((info) => {
    setPlayer(info);
    setResults([]);
    setRoundIndex(0);
    setRounds(pickRounds(TOTAL_ROUNDS));
    setSubmitState({ status: 'idle', error: null });
    setScreen(SCREENS.COUNTDOWN);
  }, []);

  const handleCountdownDone = useCallback(() => {
    setScreen(SCREENS.PLAY);
  }, []);

  const handleRoundDone = useCallback((result) => {
    setResults((prev) => [...prev, result]);
  }, []);

  const handleAdvance = useCallback(() => {
    setRoundIndex((prev) => {
      const next = prev + 1;
      if (next >= TOTAL_ROUNDS) {
        setScreen(SCREENS.FINAL);
        return prev;
      }
      return next;
    });
  }, []);

  const handlePlayAgain = useCallback(() => {
    setResults([]);
    setRoundIndex(0);
    setRounds(pickRounds(TOTAL_ROUNDS));
    setSubmitState({ status: 'idle', error: null });
    setScreen(SCREENS.COUNTDOWN);
  }, []);

  const handleLeaderboard = useCallback(() => {
    setScreen(SCREENS.LEADERBOARD);
  }, []);

  const handleBackToRegister = useCallback(() => {
    setScreen(SCREENS.REGISTER);
  }, []);

  // Submit score + trigger email when arriving at final screen.
  useEffect(() => {
    if (screen !== SCREENS.FINAL) return;
    if (!player) return;
    if (results.length !== TOTAL_ROUNDS) return;
    if (submitState.status !== 'idle') return;

    setSubmitState({ status: 'sending', error: null });

    const payloadRounds = results.map((r, i) => ({
      emotion: rounds[i]?.emotion,
      emoji: rounds[i]?.emoji,
      score: r.score,
      features: r.features,
      imageDataUrl: r.imageDataUrl
    }));

    submitScore({
      name: player.name,
      email: player.email,
      rollNumber: player.rollNumber,
      total: totalScore,
      rounds: payloadRounds
    })
      .then((resp) =>
        setSubmitState({
          status: 'sent',
          error: null,
          cardUrl: resp?.cardUrl || null,
          reportId: resp?.reportId || null
        })
      )
      .catch((err) => setSubmitState({ status: 'error', error: err.message }));
  }, [screen, player, results, rounds, totalScore, submitState.status]);

  if (screen === SCREENS.REGISTER) {
    return <Registration onStart={handleStart} onLeaderboard={handleLeaderboard} />;
  }

  if (screen === SCREENS.LEADERBOARD) {
    return <Leaderboard onBack={handleBackToRegister} />;
  }

  if (screen === SCREENS.COUNTDOWN) {
    return <Countdown onDone={handleCountdownDone} />;
  }

  if (screen === SCREENS.PLAY) {
    const round = { ...rounds[roundIndex], index: roundIndex };
    return (
      <Gameplay
        round={round}
        totalScore={totalScore}
        onRoundDone={handleRoundDone}
        onAdvance={handleAdvance}
      />
    );
  }

  if (screen === SCREENS.FINAL) {
    return (
      <FinalResults
        player={player}
        total={totalScore}
        rounds={rounds}
        results={results}
        submitState={submitState}
        onPlayAgain={handlePlayAgain}
        onLeaderboard={handleLeaderboard}
      />
    );
  }

  return null;
}

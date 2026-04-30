// Pool of possible target emotions. Each game randomly picks TOTAL_ROUNDS of these.
export const EMOJI_POOL = [
  { emotion: 'Happy', emoji: '😄' },
  { emotion: 'Scared', emoji: '😱' },
  { emotion: 'Smirk', emoji: '😏' },
  { emotion: 'Angry', emoji: '😡' },
  { emotion: 'Sad', emoji: '😢' },
  { emotion: 'Surprised', emoji: '😲' },
  { emotion: 'Wink', emoji: '😉' },
  { emotion: 'Tongue Out', emoji: '😜' },
  { emotion: 'Cool', emoji: '😎' },
  { emotion: 'Sleepy', emoji: '😴' },
  { emotion: 'In Love', emoji: '😍' },
  { emotion: 'Confused', emoji: '😕' }
];

export const ROUND_DURATION = 10; // seconds
export const TOTAL_ROUNDS = 3;
export const MAX_SCORE = TOTAL_ROUNDS * 100;

export function pickRounds(count = TOTAL_ROUNDS) {
  const shuffled = [...EMOJI_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getCompliment(name, total) {
  const pct = total / MAX_SCORE;
  const display = name?.trim() || 'You';
  if (pct >= 0.9) return `Legendary! ${display} is basically sunshine in human form!`;
  if (pct >= 0.75) return `Great Face! ${display} is basically sunshine in human form!`;
  if (pct >= 0.6) return `Solid mimic, ${display}! Your face game is strong.`;
  if (pct >= 0.4) return `Not bad, ${display}! Keep flexing those facial muscles.`;
  return `Tough round, ${display}. The mirror called — it wants a rematch!`;
}

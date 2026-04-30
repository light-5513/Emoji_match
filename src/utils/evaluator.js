// Evaluator — calls the backend which runs OpenAI Vision (gpt-4o-mini) for fast,
// accurate expression scoring. Contract:
//   { imageDataUrl, targetEmotion } -> { score, features }

export async function evaluateExpression({ imageDataUrl, targetEmotion }) {
  if (!imageDataUrl) {
    return { score: 0, features: ['No image captured'], imageDataUrl: null };
  }

  try {
    const res = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageDataUrl, targetEmotion })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Evaluator error ${res.status}: ${errText}`);
    }
    const data = await res.json();
    return {
      score: Math.max(0, Math.min(100, Number(data.score) || 0)),
      features: Array.isArray(data.features) ? data.features.slice(0, 3) : [],
      imageDataUrl
    };
  } catch (err) {
    console.error('evaluate failed', err);
    return {
      score: 0,
      features: ['Analysis failed — please try again'],
      imageDataUrl
    };
  }
}

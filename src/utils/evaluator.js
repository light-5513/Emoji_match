// Evaluator — calls the backend which runs OpenAI gpt-4o vision with a strict
// criteria-based rubric. Contract:
//   { imageDataUrl, targetEmotion }
//     -> { score, features, breakdown: { mouth, eyes, brows, commitment } }

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
      breakdown: data.breakdown || null,
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

import express from 'express';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PROMPT = (emotion) => `You are a strict but fair judge for an "Emoji Mimic" party game.

The player is trying to mimic the "${emotion}" emoji with their face.

Look at the captured photo and:
1. Score how well the facial expression matches a "${emotion}" emoji on a scale of 0 to 100. Be generous to genuine, committed attempts (a clear matching expression should score 75+). Penalize blank/neutral faces or wrong emotions. Reward effort and clarity.
2. List exactly 3 short observed facial features (e.g. "Left cheek raised", "Brows furrowed", "Lips parted"). Keep each under 5 words.

Respond ONLY with minified JSON in this exact shape:
{"score": <0-100 integer>, "features": ["...","...","..."]}`;

router.post('/', async (req, res, next) => {
  try {
    const { imageDataUrl, targetEmotion } = req.body || {};
    if (!imageDataUrl || !targetEmotion) {
      return res.status(400).json({ error: 'imageDataUrl and targetEmotion are required' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT(targetEmotion) },
            { type: 'image_url', image_url: { url: imageDataUrl, detail: 'low' } }
          ]
        }
      ]
    });

    const text = completion.choices?.[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { score: 0, features: ['Could not parse model response'] };
    }

    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
    const features = Array.isArray(parsed.features)
      ? parsed.features.slice(0, 3).map(String)
      : [];

    res.json({ score, features });
  } catch (err) {
    next(err);
  }
});

export default router;

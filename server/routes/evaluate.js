import express from 'express';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Criteria-based rubric. Each sub-score is 0-25 and the model is *required* to
// use the full range with non-rounded integers — this prevents the bucketed
// "85 / 45 / 20" output that comes from asking for one round number.
const PROMPT = (emotion) => `You are a STRICT, expert judge for the "Emoji Mimic" game.

The player is trying to mimic the "${emotion}" emoji with their face.

Analyze the photo and score these FOUR independent criteria. Each is an integer from 0 to 25:

1. mouth        — Does the mouth shape match a "${emotion}" emoji? (lips, teeth, jaw, tongue position)
2. eyes         — Do the eyes match? (open/closed/squinted/wide; gaze direction)
3. brows        — Do the eyebrows match? (raised/furrowed/lowered/asymmetric)
4. commitment   — Does the overall expression read clearly as "${emotion}"? Is the player committed, or half-hearted? Reward effort, punish blank/neutral faces.

SCORING DISCIPLINE — read carefully:
- Use the FULL range. Use ANY integer 0..25 — do NOT round to multiples of 5.
- A perfect mouth shape with poor eyes might be 23 + 11 + 14 + 18 = 66, not 65.
- If the face is neutral, looking away, or showing a different emotion: scores below 10 each.
- If the face is a clear, committed mimic of "${emotion}": scores 20–25 each.
- Be HONEST and STRICT. Half-hearted attempts deserve mid-range scores, not generous ones.
- If no face / blurry / blocked: all scores 0.

Also list exactly 3 short observed facial features (each under 5 words, e.g. "Left cheek raised", "Brows furrowed", "Lips parted").

Respond ONLY with minified JSON in this exact shape (no prose, no markdown):
{"mouth":<int>,"eyes":<int>,"brows":<int>,"commitment":<int>,"features":["...","...","..."]}`;

router.post('/', async (req, res, next) => {
  try {
    const { imageDataUrl, targetEmotion } = req.body || {};
    if (!imageDataUrl || !targetEmotion) {
      return res.status(400).json({ error: 'imageDataUrl and targetEmotion are required' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 250,
      temperature: 0, // deterministic for the same input
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT(targetEmotion) },
            { type: 'image_url', image_url: { url: imageDataUrl, detail: 'high' } }
          ]
        }
      ]
    });

    const text = completion.choices?.[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {};
    }

    const clamp = (v) => Math.max(0, Math.min(25, Math.round(Number(v) || 0)));
    const mouth = clamp(parsed.mouth);
    const eyes = clamp(parsed.eyes);
    const brows = clamp(parsed.brows);
    const commitment = clamp(parsed.commitment);
    const score = mouth + eyes + brows + commitment; // 0..100, naturally varied

    const features = Array.isArray(parsed.features)
      ? parsed.features.slice(0, 3).map(String)
      : [];

    res.json({
      score,
      features,
      breakdown: { mouth, eyes, brows, commitment }
    });
  } catch (err) {
    next(err);
  }
});

export default router;

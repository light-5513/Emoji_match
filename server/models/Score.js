import mongoose from 'mongoose';

const RoundSchema = new mongoose.Schema(
  {
    emotion: String,
    emoji: String,
    score: Number,
    features: [String]
  },
  { _id: false }
);

const ScoreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    rollNumber: { type: String, required: true, index: true },
    total: { type: Number, required: true, index: true },
    rounds: { type: [RoundSchema], default: [] }
  },
  { timestamps: true }
);

export const Score = mongoose.models.Score || mongoose.model('Score', ScoreSchema);

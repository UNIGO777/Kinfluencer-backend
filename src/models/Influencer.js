import mongoose from 'mongoose'

const influencerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  followers: { type: String, trim: true },
  engagement: { type: String, trim: true },
  niche: { type: String, trim: true },
  instagramHandle: { type: String, trim: true },
}, { timestamps: true })

export default mongoose.models.Influencer || mongoose.model('Influencer', influencerSchema)

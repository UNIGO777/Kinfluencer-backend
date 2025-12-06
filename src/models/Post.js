import mongoose from 'mongoose'

const engagementSchema = new mongoose.Schema({
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
}, { _id: false })

const postSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  type: { type: String, enum: ['reel', 'post'], required: true },
  notes: { type: String, trim: true },
  planNotes: { type: String, trim: true },
  clientFeedback: { type: String, trim: true },
  engagement: { type: engagementSchema, default: () => ({}) },
}, { timestamps: true })

export default mongoose.models.Post || mongoose.model('Post', postSchema)


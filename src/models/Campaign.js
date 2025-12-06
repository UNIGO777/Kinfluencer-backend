import mongoose from 'mongoose'

const campaignSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  influencerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Influencer', required: true, index: true },
  notesForClient: { type: String, trim: true },
  notesForInfluencer: { type: String, trim: true },
  dueDate: { type: Date },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
}, { timestamps: true })

export default mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema)

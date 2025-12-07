import mongoose from 'mongoose'

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  influencerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Influencer', required: true, index: true },
  notesForClient: { type: String, trim: true },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  notesForInfluencer: { type: String, trim: true },
  dueDate: { type: Date },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
}, { timestamps: true })

export default mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema)

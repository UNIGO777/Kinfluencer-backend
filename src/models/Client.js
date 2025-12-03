import mongoose from 'mongoose'

const clientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  companyName: { type: String, required: true, trim: true },
  industry: { type: String, trim: true },
  website: { type: String, trim: true },
  campaigns: { type: Number, default: 0 },
  
}, { timestamps: true })

export default mongoose.models.Client || mongoose.model('Client', clientSchema)

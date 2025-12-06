import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  receivedFromClient: { type: Number, default: 0 },
  receivableFromClient: { type: Number, default: 0 },
  receivableDueDate: { type: Date },
  payableToInfluencer: { type: Number, default: 0 },
  paidToInfluencer: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema)


import mongoose from 'mongoose'

const ROLES = ['influencer', 'client']

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  role: { type: String, enum: ROLES, required: true, default: 'client' },
  createdByAdmin: { type: Boolean, default: true },
  phoneNumber: { type: String, required: true, unique: true, trim: true },
  profilePictures: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  otpHash: { type: String, select: false },
  otpExpiresAt: { type: Date },
  otpVerifiedAt: { type: Date },
}, { timestamps: true })

export default mongoose.models.User || mongoose.model('User', userSchema)

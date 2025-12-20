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
  authToken: { type: String, index: true },
  authTokenIssuedAt: { type: Date },
  authTokenExpiresAt: { type: Date },
  emailChangeNewEmail: { type: String, lowercase: true, trim: true },
  emailChangeOldVerifiedAt: { type: Date },
  emailChangeOtpHash: { type: String, select: false },
  emailChangeOtpExpiresAt: { type: Date },
  emailChangeNewVerifiedAt: { type: Date },
}, { timestamps: true })

export default mongoose.models.User || mongoose.model('User', userSchema)

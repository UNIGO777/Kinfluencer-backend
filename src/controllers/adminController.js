import crypto from 'crypto'
import { sendEmail } from '../services/emailService.js'
import { issueAdminToken } from '../services/authService.js'
import User from '../models/User.js'
import { otpTemplate } from '../Email Tamplates/otpTemplate.js'

const adminOtpState = { hash: null, expiresAt: null }

export const adminRequestOtp = async (req, res) => {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ error: 'email is required' })
  if (!process.env.ADMIN_EMAIL) {
    return res.status(500).json({ error: 'admin env not configured' })
  }
  if (email !== process.env.ADMIN_EMAIL) {
    return res.status(401).json({ error: 'invalid admin email' })
  }
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const hash = crypto.createHash('sha256').update(code).digest('hex')
  const subject = 'Your admin login code'
  const html = otpTemplate({ code, minutes: 10 })
  try {
    await sendEmail({ to: email, subject, html })
    adminOtpState.hash = hash
    adminOtpState.expiresAt = new Date(Date.now() + 10 * 60 * 1000)
  } catch (err) {
    return res.status(500).json({ error: 'failed to send email code' })
  }
  return res.json({ ok: true })
}

export const adminVerifyOtp = (req, res) => {
  const { email, otp } = req.body || {}
  if (!email || !otp) return res.status(400).json({ error: 'email and otp are required' })
  if (!process.env.ADMIN_EMAIL) {
    return res.status(500).json({ error: 'admin env not configured' })
  }
  if (email !== process.env.ADMIN_EMAIL) {
    return res.status(401).json({ error: 'invalid admin email' })
  }
  if (!adminOtpState.hash || !adminOtpState.expiresAt || adminOtpState.expiresAt.getTime() < Date.now()) {
    return res.status(400).json({ error: 'invalid or expired code' })
  }
  const hash = crypto.createHash('sha256').update(String(otp)).digest('hex')
  if (hash !== adminOtpState.hash) return res.status(400).json({ error: 'invalid code' })
  adminOtpState.hash = null
  adminOtpState.expiresAt = null
  const token = issueAdminToken(120)
  return res.json({ token, role: 'admin' })
}

export const getAdminStats = async (req, res) => {
  try {
    const [clients, influencers] = await Promise.all([
      User.countDocuments({ role: 'client' }),
      User.countDocuments({ role: 'influencer' }),
    ])
    const monthlyRevenue = 13520
    const receivables = 4520
    const campaignsCompleted = 36
    res.json({ clients, influencers, monthlyRevenue, receivables, campaignsCompleted })
  } catch (err) {
    res.status(500).json({ error: 'failed to load stats' })
  }
}

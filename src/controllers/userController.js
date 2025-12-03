import crypto from 'crypto'
import User from '../models/User.js'
import { sendEmail } from '../services/emailService.js'
import { otpTemplate } from '../Email Tamplates/otpTemplate.js'

export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(100)
    res.json(users)
  } catch (err) {
    next(err)
  }
}

export const createUser = async (req, res, next) => {
  try {
    const { name, email, role = 'client' } = req.body || {}
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' })
    }
    if (!['influencer', 'client'].includes(role)) {
      return res.status(400).json({ error: 'invalid role' })
    }
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' })
    }
    const user = await User.create({ name, email, role, createdByAdmin: true })
    const subject = 'Welcome to Kingfluencer'
    const html = `<div><p>Hi ${name},</p><p>Welcome to Kingfluencer.</p></div>`
    try {
      await sendEmail({ to: email, subject, html })
    } catch {}
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
}

export const sendCustomEmail = async (req, res, next) => {
  try {
    const { to, subject, html } = req.body || {}
    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'to, subject, html are required' })
    }
    const info = await sendEmail({ to, subject, html })
    res.json({ messageId: info.messageId })
  } catch (err) {
    next(err)
  }
}

export const requestOtp = async (req, res, next) => {
  try {
    const { email } = req.body || {}
    if (!email) return res.status(400).json({ error: 'email is required' })
    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ error: 'user not found' })
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const hash = crypto.createHash('sha256').update(code).digest('hex')
    user.otpHash = hash
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()
    const subject = 'Your login code'
    const html = otpTemplate({ code, minutes: 10 })
    try {
      await sendEmail({ to: email, subject, html })
    } catch {}
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body || {}
    if (!email || !otp) return res.status(400).json({ error: 'email and otp are required' })
    const user = await User.findOne({ email }).select('+otpHash')
    if (!user || !user.otpHash) return res.status(400).json({ error: 'invalid or expired code' })
    if (!user.otpExpiresAt || user.otpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: 'code expired' })
    }
    const hash = crypto.createHash('sha256').update(String(otp)).digest('hex')
    if (hash !== user.otpHash) return res.status(400).json({ error: 'invalid code' })
    user.isVerified = true
    user.otpVerifiedAt = new Date()
    user.otpHash = undefined
    user.otpExpiresAt = undefined
    await user.save()
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

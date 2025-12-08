import crypto from 'crypto'
import { sendEmail } from '../services/emailService.js'
import { issueAdminToken, revokeAdminToken } from '../services/authService.js'
import User from '../models/User.js'
import Campaign from '../models/Campaign.js'
import Payment from '../models/Payment.js'
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
  const token = issueAdminToken()
  return res.json({ token, role: 'admin' })
}

export const getAdminStats = async (_req, res) => {
  try {
    const [clients, influencers] = await Promise.all([
      User.countDocuments({ role: 'client' }),
      User.countDocuments({ role: 'influencer' }),
    ])
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const monthlyAgg = await Payment.aggregate([
      { $match: { updatedAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, sum: { $sum: { $toDouble: '$receivedFromClient' } } } }
    ])
    const monthlyRevenue = Number(monthlyAgg[0]?.sum || 0)
    const receivableAgg = await Payment.aggregate([
      { $match: { receivableFromClient: { $gt: 0 } } },
      { $group: { _id: null, sum: { $sum: { $toDouble: '$receivableFromClient' } } } }
    ])
    const receivables = Number(receivableAgg[0]?.sum || 0)
    const campaignsCompleted = await Campaign.countDocuments({ status: 'completed' })

    const campaignCounts = await Campaign.aggregate([
      { $group: { _id: '$clientId', count: { $sum: 1 } } }
    ])
    const baseClients = campaignCounts.length
    const returningClients = campaignCounts.filter(x => Number(x.count || 0) >= 2).length
    const clientRetentionPercent = baseClients ? Math.round((returningClients * 100) / baseClients) : 0

    const totalPayments = await Payment.countDocuments({})
    const paidPayments = await Payment.countDocuments({ receivedFromClient: { $gt: 0 } })
    const paymentStatusPercent = totalPayments ? Math.round((paidPayments * 100) / totalPayments) : 0

    const twelveStart = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const monthlySeries = await Payment.aggregate([
      { $match: { updatedAt: { $gte: twelveStart, $lte: endOfMonth } } },
      { $group: { _id: { y: { $year: '$updatedAt' }, m: { $month: '$updatedAt' } }, amount: { $sum: { $toDouble: '$receivedFromClient' } } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ])
    const seriesMap = new Map()
    for (const row of monthlySeries) {
      const key = `${row._id.y}-${String(row._id.m).padStart(2, '0')}`
      seriesMap.set(key, Number(row.amount || 0))
    }
    const revenueByMonth = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('en-US', { month: 'short' })
      revenueByMonth.push({ label, amount: seriesMap.get(key) || 0 })
    }

    const sixStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const sixSeries = await Payment.aggregate([
      { $match: { updatedAt: { $gte: sixStart, $lte: endOfMonth } } },
      { $group: { _id: { y: { $year: '$updatedAt' }, m: { $month: '$updatedAt' } }, amount: { $sum: { $toDouble: '$receivedFromClient' } } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ])
    const sixMap = new Map()
    for (const row of sixSeries) {
      const key = `${row._id.y}-${String(row._id.m).padStart(2, '0')}`
      sixMap.set(key, Number(row.amount || 0))
    }
    const fundsReceivedLast6 = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('en-US', { month: 'short' })
      fundsReceivedLast6.push({ label, amount: sixMap.get(key) || 0 })
    }

    res.json({
      clients,
      influencers,
      monthlyRevenue,
      receivables,
      campaignsCompleted,
      donuts: { clientRetentionPercent, paymentStatusPercent },
      charts: { revenueByMonth, fundsReceivedLast6 }
    })
  } catch (err) {
    res.status(500).json({ error: 'failed to load stats' })
  }
}
export const adminLogout = (req, res) => {
  const token = req.headers['x-admin-token']
  if (!token) return res.status(400).json({ error: 'missing token' })
  revokeAdminToken(token)
  return res.json({ ok: true })
}

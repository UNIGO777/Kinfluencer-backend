import crypto from 'crypto'
import User from '../models/User.js'
import Client from '../models/Client.js'
import Influencer from '../models/Influencer.js'
import Campaign from '../models/Campaign.js'
import Payment from '../models/Payment.js'
import Post from '../models/Post.js'
import { sendEmail } from '../services/emailService.js'
import { otpTemplate } from '../Email Tamplates/otpTemplate.js'
import { clientAddedTemplate } from '../Email Tamplates/clientAddedTemplate.js'
import { influencerAddedTemplate } from '../Email Tamplates/influencerAddedTemplate.js'

export const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1)
    const limit = Math.max(1, parseInt(req.query.limit || '10', 10) || 10)
    const query = {}
    const total = await User.countDocuments(query)
    const rawItems = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const ids = rawItems.map(u => u._id)
    const clientProfiles = await Client.find({ userId: { $in: ids } }).lean()
    const influencerProfiles = await Influencer.find({ userId: { $in: ids } }).lean()
    const clientMap = Object.create(null)
    const influencerMap = Object.create(null)
    for (const c of clientProfiles) clientMap[String(c.userId)] = c
    for (const i of influencerProfiles) influencerMap[String(i.userId)] = i

    const items = rawItems.map(u => {
      const key = String(u._id)
      const profile = u.role === 'client' ? (clientMap[key] || null) : (influencerMap[key] || null)
      return { ...u, profile }
    })
    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    next(err)
  }
}

export const searchUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1)
    const limit = Math.max(1, parseInt(req.query.limit || '10', 10) || 10)
    const q = (req.query.q || '').toString().trim()
    const role = (req.query.role || '').toString().trim()
    const query = {}
    if (role && ['client', 'influencer'].includes(role)) query.role = role
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ]
    }
    const total = await User.countDocuments(query)
    const rawItems = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const ids = rawItems.map(u => u._id)
    const clientProfiles = await Client.find({ userId: { $in: ids } }).lean()
    const influencerProfiles = await Influencer.find({ userId: { $in: ids } }).lean()
    const clientMap = Object.create(null)
    const influencerMap = Object.create(null)
    for (const c of clientProfiles) clientMap[String(c.userId)] = c
    for (const i of influencerProfiles) influencerMap[String(i.userId)] = i

    const items = rawItems.map(u => {
      const key = String(u._id)
      const profile = u.role === 'client' ? (clientMap[key] || null) : (influencerMap[key] || null)
      return { ...u, profile }
    })
    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    next(err)
  }
}

export const createUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      role = 'client',
      phoneNumber,
      profilePictures,
      companyName,
      industry,
      website,
      campaigns,
      niche,
      followers,
      engagement,
      instagramHandle
    } = req.body || {}
    if (!name || !email || !phoneNumber) {
      return res.status(400).json({ error: 'name, email and phoneNumber are required' })
    }
    if (!['influencer', 'client'].includes(role)) {
      return res.status(400).json({ error: 'invalid role' })
    }
    const existingEmail = await User.findOne({ email })
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already exists' })
    }
    const existingPhone = await User.findOne({ phoneNumber })
    if (existingPhone) {
      return res.status(409).json({ error: 'Phone number already exists' })
    }
    const user = await User.create({ name, email, role, createdByAdmin: true, phoneNumber, profilePictures })
    let profile = null
    if (role === 'client') {
      profile = await Client.create({ userId: user._id, companyName, industry, website, campaigns: Number(campaigns) || 0, niche })
      const subject = 'You have been added as a Client'
      const html = clientAddedTemplate({ name, companyName, industry, website, campaigns: Number(campaigns) || 0 })
      try { await sendEmail({ to: email, subject, html }) } catch {}
    } else {
      profile = await Influencer.create({ userId: user._id, followers, engagement, niche, instagramHandle })
      const subject = 'You have been added as an Influencer'
      const html = influencerAddedTemplate({ name, followers, engagement, niche, instagramHandle })
      try { await sendEmail({ to: email, subject, html }) } catch {}
    }
    res.status(201).json({ user, profile })
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
    const token = crypto.randomBytes(32).toString('hex')
    user.authToken = token
    user.authTokenIssuedAt = new Date()
    await user.save()
    res.json({ ok: true, role: user.role, userId: user._id, email: user.email, token })
  } catch (err) {
    next(err)
  }
}

export const getMe = async (req, res, next) => {
  try {
    const u = await User.findById(req.user?._id).lean()
    if (!u) return res.status(404).json({ error: 'user not found' })
    let profile = null
    if (u.role === 'client') {
      profile = await Client.findOne({ userId: u._id }).lean()
    } else if (u.role === 'influencer') {
      profile = await Influencer.findOne({ userId: u._id }).lean()
    }
    res.json({ ...u, profile })
  } catch (err) {
    next(err)
  }
}

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params
    const u = await User.findById(id).lean()
    if (!u) return res.status(404).json({ error: 'user not found' })
    let profile = null
    if (u.role === 'client') {
      profile = await Client.findOne({ userId: u._id }).lean()
    } else if (u.role === 'influencer') {
      profile = await Influencer.findOne({ userId: u._id }).lean()
    }
    res.json({ ...u, profile })
  } catch (err) {
    next(err)
  }
}

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, email, phoneNumber, profilePictures, client = {}, influencer = {} } = req.body || {}
    const u = await User.findById(id)
    if (!u) return res.status(404).json({ error: 'user not found' })
    if (email && email !== u.email) {
      const exists = await User.findOne({ email })
      if (exists) return res.status(409).json({ error: 'Email already exists' })
      u.email = email
    }
    if (phoneNumber && phoneNumber !== u.phoneNumber) {
      const exists = await User.findOne({ phoneNumber })
      if (exists) return res.status(409).json({ error: 'Phone number already exists' })
      u.phoneNumber = phoneNumber
    }
    if (name !== undefined) u.name = name
    if (profilePictures !== undefined) u.profilePictures = profilePictures
    await u.save()
    let profile = null
    if (u.role === 'client') {
      const p = await Client.findOne({ userId: u._id })
      if (p) {
        p.companyName = client.companyName ?? p.companyName
        p.industry = client.industry ?? p.industry
        p.website = client.website ?? p.website
        p.campaigns = client.campaigns !== undefined ? Number(client.campaigns || 0) : p.campaigns
        p.niche = client.niche ?? p.niche
        await p.save()
        profile = p.toObject()
      }
    } else if (u.role === 'influencer') {
      const p = await Influencer.findOne({ userId: u._id })
      if (p) {
        p.followers = influencer.followers ?? p.followers
        p.engagement = influencer.engagement ?? p.engagement
        p.niche = influencer.niche ?? p.niche
        p.instagramHandle = influencer.instagramHandle ?? p.instagramHandle
        await p.save()
        profile = p.toObject()
      }
    }
    res.json({ user: u.toObject(), profile })
  } catch (err) {
    next(err)
  }
}

export const requestEmailChangeOldOtp = async (req, res, next) => {
  try {
    const u = await User.findById(req.user?._id)
    if (!u) return res.status(404).json({ error: 'user not found' })
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const hash = crypto.createHash('sha256').update(code).digest('hex')
    u.otpHash = hash
    u.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await u.save()
    const subject = 'Confirm your email change'
    const html = otpTemplate({ code, minutes: 10 })
    try { await sendEmail({ to: u.email, subject, html }) } catch {}
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export const verifyEmailChangeOldOtp = async (req, res, next) => {
  try {
    const { otp } = req.body || {}
    const u = await User.findById(req.user?._id).select('+otpHash')
    if (!u) return res.status(404).json({ error: 'user not found' })
    if (!otp) return res.status(400).json({ error: 'otp is required' })
    if (!u.otpHash) return res.status(400).json({ error: 'invalid or expired code' })
    if (!u.otpExpiresAt || u.otpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: 'code expired' })
    }
    const hash = crypto.createHash('sha256').update(String(otp)).digest('hex')
    if (hash !== u.otpHash) return res.status(400).json({ error: 'invalid code' })
    u.otpHash = undefined
    u.otpExpiresAt = undefined
    u.emailChangeOldVerifiedAt = new Date()
    await u.save()
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export const requestEmailChangeNewOtp = async (req, res, next) => {
  try {
    const { newEmail } = req.body || {}
    const u = await User.findById(req.user?._id)
    if (!u) return res.status(404).json({ error: 'user not found' })
    if (!u.emailChangeOldVerifiedAt) return res.status(400).json({ error: 'old email not verified' })
    const e = (newEmail || '').toString().trim().toLowerCase()
    if (!e) return res.status(400).json({ error: 'newEmail is required' })
    if (e === u.email) return res.status(400).json({ error: 'new email must be different' })
    const exists = await User.findOne({ email: e })
    if (exists) return res.status(409).json({ error: 'Email already exists' })
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const hash = crypto.createHash('sha256').update(code).digest('hex')
    u.emailChangeNewEmail = e
    u.emailChangeOtpHash = hash
    u.emailChangeOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await u.save()
    const subject = 'Verify your new email'
    const html = otpTemplate({ code, minutes: 10 })
    try { await sendEmail({ to: e, subject, html }) } catch {}
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export const verifyEmailChangeNewOtp = async (req, res, next) => {
  try {
    const { otp } = req.body || {}
    const u = await User.findById(req.user?._id).select('+emailChangeOtpHash')
    if (!u) return res.status(404).json({ error: 'user not found' })
    if (!otp) return res.status(400).json({ error: 'otp is required' })
    const e = (u.emailChangeNewEmail || '').toString().trim().toLowerCase()
    if (!e) return res.status(400).json({ error: 'new email not set' })
    const exists = await User.findOne({ email: e })
    if (exists) return res.status(409).json({ error: 'Email already exists' })
    const hash = crypto.createHash('sha256').update(String(otp)).digest('hex')
    if (!u.emailChangeOtpHash || !u.emailChangeOtpExpiresAt) return res.status(400).json({ error: 'invalid or expired code' })
    if (u.emailChangeOtpExpiresAt.getTime() < Date.now()) return res.status(400).json({ error: 'code expired' })
    if (hash !== u.emailChangeOtpHash) return res.status(400).json({ error: 'invalid code' })
    u.email = e
    u.emailChangeNewVerifiedAt = new Date()
    u.emailChangeNewEmail = undefined
    u.emailChangeOtpHash = undefined
    u.emailChangeOtpExpiresAt = undefined
    u.emailChangeOldVerifiedAt = undefined
    await u.save()
    res.json({ ok: true, email: u.email })
  } catch (err) {
    next(err)
  }
}

export const updateMe = async (req, res, next) => {
  try {
    const me = req.user?._id
    const u = await User.findById(me)
    if (!u) return res.status(404).json({ error: 'user not found' })
    const { name, phoneNumber, profilePictures, client = {}, influencer = {} } = req.body || {}
    if (phoneNumber && phoneNumber !== u.phoneNumber) {
      const exists = await User.findOne({ phoneNumber })
      if (exists) return res.status(409).json({ error: 'Phone number already exists' })
      u.phoneNumber = phoneNumber
    }
    if (name !== undefined) u.name = name
    if (profilePictures !== undefined) u.profilePictures = profilePictures
    await u.save()
    let profile = null
    if (u.role === 'client') {
      const p = await Client.findOne({ userId: u._id })
      if (p) {
        p.companyName = client.companyName ?? p.companyName
        p.industry = client.industry ?? p.industry
        p.website = client.website ?? p.website
        p.campaigns = client.campaigns !== undefined ? Number(client.campaigns || 0) : p.campaigns
        p.niche = client.niche ?? p.niche
        await p.save()
        profile = p.toObject()
      }
    } else if (u.role === 'influencer') {
      const p = await Influencer.findOne({ userId: u._id })
      if (p) {
        p.followers = influencer.followers ?? p.followers
        p.engagement = influencer.engagement ?? p.engagement
        p.niche = influencer.niche ?? p.niche
        p.instagramHandle = influencer.instagramHandle ?? p.instagramHandle
        await p.save()
        profile = p.toObject()
      }
    }
    res.json({ user: u.toObject(), profile })
  } catch (err) {
    next(err)
  }
}

export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body || {}
    const allowed = ['active', 'completed']
    if (!allowed.includes(String(status))) return res.status(400).json({ error: 'invalid status' })
    const u = await User.findById(id)
    if (!u) return res.status(404).json({ error: 'user not found' })
    u.isVerified = String(status) === 'completed'
    await u.save()
    res.json({ user: u.toObject() })
  } catch (err) {
    next(err)
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const u = await User.findById(id)
    if (!u) return res.status(404).json({ error: 'user not found' })
    const clientProfile = await Client.findOne({ userId: id }).lean()
    const influencerProfile = await Influencer.findOne({ userId: id }).lean()
    const or = []
    if (clientProfile) or.push({ clientId: clientProfile._id })
    if (influencerProfile) or.push({ influencerId: influencerProfile._id })
    let campaignIds = []
    if (or.length) {
      const campaigns = await Campaign.find({ $or: or }, { _id: 1 }).lean()
      campaignIds = campaigns.map((c) => c._id)
      if (campaignIds.length) {
        await Post.deleteMany({ campaignId: { $in: campaignIds } })
        await Payment.deleteMany({ campaignId: { $in: campaignIds } })
        await Campaign.deleteMany({ _id: { $in: campaignIds } })
      }
    }
    await u.deleteOne()
    res.json({ ok: true, deletedCampaigns: campaignIds.length })
  } catch (err) {
    next(err)
  }
}

export const getClientStats = async (req, res, next) => {
  try {
    const me = req.user
    if (!me || me.role !== 'client') return res.status(403).json({ error: 'client role required' })
    const clientProfile = await Client.findOne({ userId: me._id }).lean()
    if (!clientProfile) return res.status(404).json({ error: 'client profile not found' })
    const campaigns = await Campaign.find({ clientId: clientProfile._id }, { _id: 1, status: 1, dueDate: 1, createdAt: 1 }).lean()
    const campaignIds = campaigns.map(c => c._id)
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length
    const now = new Date()
    const in30 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30)
    const upcomingDeliverables = campaigns.filter(c => c.dueDate && c.dueDate >= now && c.dueDate <= in30).length
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const monthlyAgg = await Payment.aggregate([
      { $match: { campaignId: { $in: campaignIds }, updatedAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, sum: { $sum: { $toDouble: '$receivedFromClient' } } } }
    ])
    const paymentsThisMonth = Number(monthlyAgg[0]?.sum || 0)
    const receivableAgg = await Payment.aggregate([
      { $match: { campaignId: { $in: campaignIds }, receivableFromClient: { $gt: 0 } } },
      { $group: { _id: null, sum: { $sum: { $toDouble: '$receivableFromClient' } } } }
    ])
    const receivables = Number(receivableAgg[0]?.sum || 0)
    const dueAgg = await Payment.aggregate([
      { $match: { campaignId: { $in: campaignIds }, receivableFromClient: { $gt: 0 }, receivableDueDate: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, sum: { $sum: { $toDouble: '$receivableFromClient' } } } }
    ])
    const dueThisMonth = Number(dueAgg[0]?.sum || 0)
    const totalAgg = await Payment.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      { $group: { _id: null, sum: { $sum: { $toDouble: '$receivedFromClient' } } } }
    ])
    const totalInvested = Number(totalAgg[0]?.sum || 0)
    const twelveStart = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const monthlySeries = await Payment.aggregate([
      { $match: { campaignId: { $in: campaignIds }, updatedAt: { $gte: twelveStart, $lte: endOfMonth } } },
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

    const postsTotalsAgg = await Post.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      { $group: {
        _id: null,
        count: { $sum: 1 },
        views: { $sum: { $ifNull: ['$engagement.views', 0] } },
        likes: { $sum: { $ifNull: ['$engagement.likes', 0] } },
        comments: { $sum: { $ifNull: ['$engagement.comments', 0] } },
        shares: { $sum: { $ifNull: ['$engagement.shares', 0] } },
        saves: { $sum: { $ifNull: ['$engagement.saves', 0] } },
      } }
    ])
    const postsCount = Number(postsTotalsAgg[0]?.count || 0)
    const engagementTotals = {
      views: Number(postsTotalsAgg[0]?.views || 0),
      likes: Number(postsTotalsAgg[0]?.likes || 0),
      comments: Number(postsTotalsAgg[0]?.comments || 0),
      shares: Number(postsTotalsAgg[0]?.shares || 0),
      saves: Number(postsTotalsAgg[0]?.saves || 0),
    }

    const sixStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const viewsMonthlyAgg = await Post.aggregate([
      { $match: { campaignId: { $in: campaignIds }, updatedAt: { $gte: sixStart, $lte: endOfMonth } } },
      { $group: { _id: { y: { $year: '$updatedAt' }, m: { $month: '$updatedAt' } }, views: { $sum: { $ifNull: ['$engagement.views', 0] } } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ])
    const viewsSeriesMap = new Map()
    for (const row of viewsMonthlyAgg) {
      const key = `${row._id.y}-${String(row._id.m).padStart(2, '0')}`
      viewsSeriesMap.set(key, Number(row.views || 0))
    }
    const viewsByMonth = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('en-US', { month: 'short' })
      viewsByMonth.push({ label, views: viewsSeriesMap.get(key) || 0 })
    }

    const postsTypeAgg = await Post.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ])
    const postsByType = postsTypeAgg.map(r => ({ label: r._id === 'reel' ? 'Reels' : 'Posts', count: Number(r.count || 0) }))

    res.json({
      activeCampaigns,
      upcomingDeliverables,
      paymentsThisMonth,
      receivables,
      totals: { campaigns: campaigns.length, posts: postsCount },
      engagementTotals,
      charts: { revenueByMonth, viewsByMonth, postsByType },
      dueThisMonth,
      totalInvested
    })
  } catch (err) {
    next(err)
  }
}

export const getInfluencerStats = async (req, res, next) => {
  try {
    const me = req.user
    if (!me || me.role !== 'influencer') return res.status(403).json({ error: 'influencer role required' })
    const influencerProfile = await Influencer.findOne({ userId: me._id }).lean()
    if (!influencerProfile) return res.status(404).json({ error: 'influencer profile not found' })

    const campaigns = await Campaign.find({ influencerId: influencerProfile._id }, { _id: 1, status: 1, dueDate: 1, createdAt: 1 }).lean()
    const campaignIds = campaigns.map(c => c._id)
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length
    const now = new Date()
    const in30 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30)
    const upcomingDeliverables = campaigns.filter(c => c.dueDate && c.dueDate >= now && c.dueDate <= in30).length

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const monthlyAgg = await Payment.aggregate([
      { $match: { campaignId: { $in: campaignIds }, updatedAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, sum: { $sum: { $toDouble: '$paidToInfluencer' } } } }
    ])
    const paymentsThisMonth = Number(monthlyAgg[0]?.sum || 0)

    const payableAgg = await Payment.aggregate([
      { $match: { campaignId: { $in: campaignIds }, payableToInfluencer: { $gt: 0 } } },
      { $group: { _id: null, sum: { $sum: { $toDouble: '$payableToInfluencer' } } } }
    ])
    const receivables = Number(payableAgg[0]?.sum || 0)

    const dueAgg = await Payment.aggregate([
      { $match: { campaignId: { $in: campaignIds }, payableToInfluencer: { $gt: 0 }, paidDueDate: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, sum: { $sum: { $toDouble: '$payableToInfluencer' } } } }
    ])
    const dueThisMonth = Number(dueAgg[0]?.sum || 0)

    const totalAgg = await Payment.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      { $group: { _id: null, sum: { $sum: { $toDouble: '$paidToInfluencer' } } } }
    ])
    const totalEarned = Number(totalAgg[0]?.sum || 0)

    const twelveStart = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const monthlySeries = await Payment.aggregate([
      { $match: { campaignId: { $in: campaignIds }, updatedAt: { $gte: twelveStart, $lte: endOfMonth } } },
      { $group: { _id: { y: { $year: '$updatedAt' }, m: { $month: '$updatedAt' } }, amount: { $sum: { $toDouble: '$paidToInfluencer' } } } },
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

    const postsTotalsAgg = await Post.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      { $group: {
        _id: null,
        count: { $sum: 1 },
        views: { $sum: { $ifNull: ['$engagement.views', 0] } },
        likes: { $sum: { $ifNull: ['$engagement.likes', 0] } },
        comments: { $sum: { $ifNull: ['$engagement.comments', 0] } },
        shares: { $sum: { $ifNull: ['$engagement.shares', 0] } },
        saves: { $sum: { $ifNull: ['$engagement.saves', 0] } },
      } }
    ])
    const postsCount = Number(postsTotalsAgg[0]?.count || 0)
    const engagementTotals = {
      views: Number(postsTotalsAgg[0]?.views || 0),
      likes: Number(postsTotalsAgg[0]?.likes || 0),
      comments: Number(postsTotalsAgg[0]?.comments || 0),
      shares: Number(postsTotalsAgg[0]?.shares || 0),
      saves: Number(postsTotalsAgg[0]?.saves || 0),
    }

    const sixStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const viewsMonthlyAgg = await Post.aggregate([
      { $match: { campaignId: { $in: campaignIds }, updatedAt: { $gte: sixStart, $lte: endOfMonth } } },
      { $group: { _id: { y: { $year: '$updatedAt' }, m: { $month: '$updatedAt' } }, views: { $sum: { $ifNull: ['$engagement.views', 0] } } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ])
    const viewsSeriesMap = new Map()
    for (const row of viewsMonthlyAgg) {
      const key = `${row._id.y}-${String(row._id.m).padStart(2, '0')}`
      viewsSeriesMap.set(key, Number(row.views || 0))
    }
    const viewsByMonth = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('en-US', { month: 'short' })
      viewsByMonth.push({ label, views: viewsSeriesMap.get(key) || 0 })
    }

    const postsTypeAgg = await Post.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ])
    const postsByType = postsTypeAgg.map(r => ({ label: r._id === 'reel' ? 'Reels' : 'Posts', count: Number(r.count || 0) }))

    res.json({
      activeCampaigns,
      upcomingDeliverables,
      paymentsThisMonth,
      receivables,
      totals: { campaigns: campaigns.length, posts: postsCount },
      engagementTotals,
      charts: { revenueByMonth, viewsByMonth, postsByType },
      dueThisMonth,
      totalInvested: totalEarned
    })
  } catch (err) {
    next(err)
  }
}

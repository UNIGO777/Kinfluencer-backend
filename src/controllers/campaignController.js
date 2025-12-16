import Campaign from '../models/Campaign.js'
import Post from '../models/Post.js'
import Payment from '../models/Payment.js'
import Client from '../models/Client.js'
import Influencer from '../models/Influencer.js'

export const createCampaign = async (req, res, next) => {
  try {
    const { clientId, influencerId, campaign = {}, posts = [], payment = {} } = req.body || {}
    if (!clientId || !influencerId) {
      return res.status(400).json({ error: 'clientId and influencerId are required' })
    }
    const name = (campaign.name || '').toString().trim()
    if (!name) return res.status(400).json({ error: 'campaign name required' })
    const clientProfile = await Client.findOne({ userId: clientId }).lean() || await Client.findById(clientId).lean()
    const influencerProfile = await Influencer.findOne({ userId: influencerId }).lean() || await Influencer.findById(influencerId).lean()
    if (!clientProfile) return res.status(400).json({ error: 'client profile not found' })
    if (!influencerProfile) return res.status(400).json({ error: 'influencer profile not found' })
    const dueDate = campaign.dueDate ? new Date(campaign.dueDate) : undefined
    const c = await Campaign.create({
      name,
      clientId: clientProfile._id,
      influencerId: influencerProfile._id,
      notesForClient: campaign.notesForClient || '',
      notesForInfluencer: campaign.notesForInfluencer || '',
      dueDate,
    })
    const createdPosts = []
    for (const p of Array.isArray(posts) ? posts : []) {
      if (!p || !p.type) continue
      const created = await Post.create({
        campaignId: c._id,
        type: p.type,
        notes: p.notes || '',
        planNotes: p.planNotes || '',
      })
      createdPosts.push(created)
    }
    if (createdPosts.length) {
      c.posts = createdPosts.map((x) => x._id)
      await c.save()
    }
    const hasPayment = payment && (
      payment.receivedFromClient ||
      payment.receivableFromClient ||
      payment.receivableDueDate ||
      payment.payableToInfluencer ||
      payment.paidToInfluencer
    )
    if (hasPayment) {
      await Payment.create({
        campaignId: c._id,
        receivedFromClient: Number(payment.receivedFromClient || 0),
        receivableFromClient: Number(payment.receivableFromClient || 0),
        receivableDueDate: payment.receivableDueDate ? new Date(payment.receivableDueDate) : undefined,
        payableToInfluencer: Number(payment.payableToInfluencer || 0),
        paidToInfluencer: Number(payment.paidToInfluencer || 0),
        paidDueDate: payment.paidDueDate ? new Date(payment.paidDueDate) : undefined,
      })
    }
    const populated = await Campaign.findById(c._id)
      .populate({ path: 'clientId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'influencerId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'posts', select: 'type createdAt' })
      .lean()
    res.status(201).json({ campaign: populated, posts: createdPosts })
  } catch (err) {
    next(err)
  }
}

export const listCampaigns = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1)
    const limit = Math.max(1, parseInt(req.query.limit || '10', 10) || 10)
    const query = {}
    const total = await Campaign.countDocuments(query)
    const items = await Campaign.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'clientId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'influencerId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'posts', select: 'type createdAt' })
      .lean()
    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    next(err)
  }
}

export const searchCampaigns = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1)
    const limit = Math.max(1, parseInt(req.query.limit || '10', 10) || 10)
    const q = (req.query.q || '').toString().trim()
    const query = {}
    if (q) query.name = { $regex: q, $options: 'i' }
    const total = await Campaign.countDocuments(query)
    const items = await Campaign.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'clientId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'influencerId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'posts', select: 'type createdAt' })
      .lean()
    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    next(err)
  }
}

export const getCampaign = async (req, res, next) => {
  try {
    const { id } = req.params
    const c = await Campaign.findById(id)
      .populate({ path: 'clientId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'influencerId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'posts' })
      .lean()
    if (!c) return res.status(404).json({ error: 'campaign not found' })
    const payment = await Payment.findOne({ campaignId: id }).lean()
    res.json({ campaign: c, posts: c.posts || [], payment: payment || null })
  } catch (err) {
    next(err)
  }
}

export const updateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params
    const { clientId: newClientId, influencerId: newInfluencerId, campaign = {}, posts = [], payment = {} } = req.body || {}
    const c = await Campaign.findById(id)
    if (!c) return res.status(404).json({ error: 'campaign not found' })
    if (newClientId) {
      const clientProfile = await Client.findOne({ userId: newClientId }).lean() || await Client.findById(newClientId).lean()
      if (!clientProfile) return res.status(400).json({ error: 'client profile not found' })
      c.clientId = clientProfile._id
    }
    if (newInfluencerId) {
      const influencerProfile = await Influencer.findOne({ userId: newInfluencerId }).lean() || await Influencer.findById(newInfluencerId).lean()
      if (!influencerProfile) return res.status(400).json({ error: 'influencer profile not found' })
      c.influencerId = influencerProfile._id
    }
    if (campaign.name !== undefined) {
      const nm = (campaign.name || '').toString().trim()
      c.name = nm || c.name
    }
    c.notesForClient = campaign.notesForClient ?? c.notesForClient
    c.notesForInfluencer = campaign.notesForInfluencer ?? c.notesForInfluencer
    c.dueDate = campaign.dueDate ? new Date(campaign.dueDate) : c.dueDate
    await c.save()
    await Post.deleteMany({ campaignId: id })
    const createdPosts = []
    for (const p of Array.isArray(posts) ? posts : []) {
      if (!p || !p.type) continue
      const created = await Post.create({
        campaignId: id,
        type: p.type,
        notes: p.notes || '',
        planNotes: p.planNotes || '',
      })
      createdPosts.push(created)
    }
    c.posts = createdPosts.map((x) => x._id)
    await c.save()
    const existingPayment = await Payment.findOne({ campaignId: id })
    const hasPayment = payment && (
      payment.receivedFromClient !== undefined ||
      payment.receivableFromClient !== undefined ||
      payment.receivableDueDate !== undefined ||
      payment.payableToInfluencer !== undefined ||
      payment.paidToInfluencer !== undefined
    )
    if (hasPayment) {
      if (!existingPayment) {
        await Payment.create({
          campaignId: id,
          receivedFromClient: Number(payment.receivedFromClient || 0),
          receivableFromClient: Number(payment.receivableFromClient || 0),
          receivableDueDate: payment.receivableDueDate ? new Date(payment.receivableDueDate) : undefined,
          payableToInfluencer: Number(payment.payableToInfluencer || 0),
          paidToInfluencer: Number(payment.paidToInfluencer || 0),
          paidDueDate: payment.paidDueDate ? new Date(payment.paidDueDate) : undefined,
        })
      } else {
        existingPayment.receivedFromClient = Number(payment.receivedFromClient ?? existingPayment.receivedFromClient ?? 0)
        existingPayment.receivableFromClient = Number(payment.receivableFromClient ?? existingPayment.receivableFromClient ?? 0)
        existingPayment.receivableDueDate = payment.receivableDueDate ? new Date(payment.receivableDueDate) : existingPayment.receivableDueDate
        existingPayment.payableToInfluencer = Number(payment.payableToInfluencer ?? existingPayment.payableToInfluencer ?? 0)
        existingPayment.paidToInfluencer = Number(payment.paidToInfluencer ?? existingPayment.paidToInfluencer ?? 0)
        existingPayment.paidDueDate = payment.paidDueDate ? new Date(payment.paidDueDate) : existingPayment.paidDueDate
        await existingPayment.save()
      }
    }
    const populated = await Campaign.findById(id)
      .populate({ path: 'clientId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'influencerId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'posts', select: 'type createdAt' })
      .lean()
    res.json({ campaign: populated, posts: createdPosts })
  } catch (err) {
    next(err)
  }
}

export const deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params
    const c = await Campaign.findById(id)
    if (!c) return res.status(404).json({ error: 'campaign not found' })
    await Post.deleteMany({ campaignId: id })
    await Payment.deleteMany({ campaignId: id })
    await c.deleteOne()
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export const updateCampaignStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body || {}
    const allowed = ['active', 'completed']
    if (!allowed.includes(String(status))) return res.status(400).json({ error: 'invalid status' })
    const c = await Campaign.findById(id)
    if (!c) return res.status(404).json({ error: 'campaign not found' })
    c.status = String(status)
    await c.save()
    const populated = await Campaign.findById(id)
      .populate({ path: 'clientId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'influencerId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'posts', select: 'type createdAt' })
      .lean()
    res.json({ campaign: populated })
  } catch (err) {
    next(err)
  }
}

export const listCampaignsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params
    const clientProfile = await Client.findOne({ userId }).lean()
    const influencerProfile = await Influencer.findOne({ userId }).lean()
    const or = []
    if (clientProfile) or.push({ clientId: clientProfile._id })
    if (influencerProfile) or.push({ influencerId: influencerProfile._id })
    if (or.length === 0) return res.json({ items: [], total: 0 })
    const items = await Campaign.find({ $or: or })
      .sort({ createdAt: -1 })
      .populate({ path: 'clientId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'influencerId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'posts', select: 'type createdAt' })
      .lean()
    res.json({ items, total: items.length })
  } catch (err) {
    next(err)
  }
}

export const listCampaignsByMe = async (req, res, next) => {
  try {
    const userId = req.user?._id
    const clientProfile = await Client.findOne({ userId }).lean()
    const influencerProfile = await Influencer.findOne({ userId }).lean()
    const or = []
    if (clientProfile) or.push({ clientId: clientProfile._id })
    if (influencerProfile) or.push({ influencerId: influencerProfile._id })
    if (or.length === 0) return res.json({ items: [], total: 0 })
    const items = await Campaign.find({ $or: or })
      .sort({ createdAt: -1 })
      .populate({ path: 'clientId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'influencerId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'posts', select: 'type createdAt' })
      .lean()
    res.json({ items, total: items.length })
  } catch (err) {
    next(err)
  }
}

export const listClientCampaigns = async (req, res, next) => {
  try {
    const userId = req.user?._id
    const clientProfile = await Client.findOne({ userId }).lean()
    if (!clientProfile) return res.json({ items: [], total: 0 })
    const items = await Campaign.find({ clientId: clientProfile._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'clientId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'influencerId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'posts', select: 'type createdAt' })
      .lean()
    res.json({ items, total: items.length })
  } catch (err) {
    next(err)
  }
}

export const getClientCampaign = async (req, res, next) => {
  try {
    const userId = req.user?._id
    const clientProfile = await Client.findOne({ userId }).lean()
    if (!clientProfile) return res.status(404).json({ error: 'client profile not found' })
    const { id } = req.params
    const c = await Campaign.findOne({ _id: id, clientId: clientProfile._id })
      .populate({ path: 'clientId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'influencerId', populate: { path: 'userId', select: 'name email', model: 'User' } })
      .populate({ path: 'posts', select: 'type notes createdAt engagement' })
      .lean()
    if (!c) return res.status(404).json({ error: 'campaign not found' })
    const p = await Payment.findOne({ campaignId: id }).lean()
    const payment = p ? {
      receivedFromClient: Number(p.receivedFromClient || 0),
      receivableFromClient: Number(p.receivableFromClient || 0),
      receivableDueDate: p.receivableDueDate || null,
      statusForClient: p.statusForClient || 'pending',
    } : null
    const posts = Array.isArray(c.posts) ? c.posts.map((post) => {
      const eng = post?.engagement || {}
      const total = Number(eng.views || 0) + Number(eng.likes || 0) + Number(eng.comments || 0) + Number(eng.shares || 0) + Number(eng.saves || 0)
      return { ...post, posted: total > 0 }
    }) : []
    res.json({ campaign: c, posts, payment })
  } catch (err) {
    next(err)
  }
}

export const getClientCampaignPost = async (req, res, next) => {
  try {
    const userId = req.user?._id
    const clientProfile = await Client.findOne({ userId }).lean()
    if (!clientProfile) return res.status(404).json({ error: 'client profile not found' })
    const { id, postId } = req.params
    const exists = await Campaign.exists({ _id: id, clientId: clientProfile._id })
    if (!exists) return res.status(404).json({ error: 'campaign not found' })
    const post = await Post.findOne({ _id: postId, campaignId: id }, { type: 1, notes: 1, engagement: 1, createdAt: 1 }).lean()
    if (!post) return res.status(404).json({ error: 'post not found' })
    const eng = post?.engagement || {}
    const total = Number(eng.views || 0) + Number(eng.likes || 0) + Number(eng.comments || 0) + Number(eng.shares || 0) + Number(eng.saves || 0)
    const posted = total > 0
    res.json({ post: { ...post, posted } })
  } catch (err) {
    next(err)
  }
}

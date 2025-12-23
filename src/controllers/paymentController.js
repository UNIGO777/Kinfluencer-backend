import Payment from '../models/Payment.js'
import Campaign from '../models/Campaign.js'
import Client from '../models/Client.js'
import Influencer from '../models/Influencer.js'

const startOfDay = (d) => {
  const dt = new Date(d)
  dt.setHours(0, 0, 0, 0)
  return dt
}
const endOfDay = (d) => {
  const dt = new Date(d)
  dt.setHours(23, 59, 59, 999)
  return dt
}

export const listPayments = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1)
    const limit = Math.max(1, parseInt(req.query.limit || '10', 10) || 10)
    const total = await Payment.countDocuments({})
    const items = await Payment.find({})
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'campaignId', select: 'name' })
      .lean()
    const rows = items.map((p) => ({
      id: String(p._id),
      campaignName: p.campaignId?.name || '',
      receivedFromClient: Number(p.receivedFromClient || 0),
      receivableFromClient: Number(p.receivableFromClient || 0),
      receivableDueDate: p.receivableDueDate || null,
      payableToInfluencer: Number(p.payableToInfluencer || 0),
      paidToInfluencer: Number(p.paidToInfluencer || 0),
      statusForClient: p.statusForClient || 'pending',
      statusForInfluencer: p.statusForInfluencer || 'pending',
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
    }))
    res.json({ items: rows, page, limit, total, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    next(err)
  }
}

export const todaySummary = async (req, res, next) => {
  try {
    const today = new Date()
    const s = startOfDay(today)
    const e = endOfDay(today)
    const receivableAgg = await Payment.aggregate([
      { $match: { receivableDueDate: { $gte: s, $lte: e } } },
      { $group: { _id: null, sum: { $sum: { $toDouble: '$receivableFromClient' } } } }
    ])
    const receivableToday = receivableAgg[0]?.sum || 0

    const paidAgg = await Payment.aggregate([
      { $match: { updatedAt: { $gte: s, $lte: e } } },
      { $group: { _id: null, sum: { $sum: { $toDouble: '$paidToInfluencer' } } } }
    ])
    const paidToday = paidAgg[0]?.sum || 0

    const receivedAgg = await Payment.aggregate([
      { $match: { updatedAt: { $gte: s, $lte: e } } },
      { $group: { _id: null, sum: { $sum: { $toDouble: '$receivedFromClient' } } } }
    ])
    const receivedToday = receivedAgg[0]?.sum || 0

    const payableAgg = await Payment.aggregate([
      { $match: { updatedAt: { $gte: s, $lte: e } } },
      { $group: { _id: null, sum: { $sum: { $toDouble: '$payableToInfluencer' } } } }
    ])
    const payableToday = payableAgg[0]?.sum || 0

    res.json({ receivableToday, payableToday, receivedToday, paidToday })
  } catch (err) {
    next(err)
  }
}

export const todayReceived = async (req, res, next) => {
  try {
    const s = startOfDay(new Date())
    const e = endOfDay(new Date())
    const items = await Payment.find({ updatedAt: { $gte: s, $lte: e }, receivedFromClient: { $gt: 0 } })
      .sort({ updatedAt: -1 })
      .populate({ path: 'campaignId', select: 'name' })
      .lean()
    const rows = items.map((p) => ({
      id: String(p._id),
      campaignName: p.campaignId?.name || '',
      amount: Number(p.receivedFromClient || 0),
      type: 'client',
      date: p.updatedAt,
      status: p.statusForClient || 'pending',
    }))
    res.json({ items: rows, total: rows.length })
  } catch (err) {
    next(err)
  }
}

export const todayPaid = async (req, res, next) => {
  try {
    const s = startOfDay(new Date())
    const e = endOfDay(new Date())
    const items = await Payment.find({ updatedAt: { $gte: s, $lte: e }, paidToInfluencer: { $gt: 0 } })
      .sort({ updatedAt: -1 })
      .populate({ path: 'campaignId', select: 'name' })
      .lean()
    const rows = items.map((p) => ({
      id: String(p._id),
      campaignName: p.campaignId?.name || '',
      amount: Number(p.paidToInfluencer || 0),
      type: 'influencer',
      date: p.updatedAt,
      status: p.statusForInfluencer || 'pending',
    }))
    res.json({ items: rows, total: rows.length })
  } catch (err) {
    next(err)
  }
}

export const receivableTodayList = async (req, res, next) => {
  try {
    const s = startOfDay(new Date())
    const e = endOfDay(new Date())
    const items = await Payment.find({ receivableDueDate: { $gte: s, $lte: e }, receivableFromClient: { $gt: 0 } })
      .sort({ receivableDueDate: 1 })
      .populate({ path: 'campaignId', select: 'name' })
      .lean()
    const rows = items.map((p) => ({
      id: String(p._id),
      campaignName: p.campaignId?.name || '',
      amount: Number(p.receivableFromClient || 0),
      dueDate: p.receivableDueDate,
      type: 'client',
      status: p.statusForClient || 'pending',
    }))
    res.json({ items: rows, total: rows.length })
  } catch (err) {
    next(err)
  }
}

export const payableDueTodayList = async (req, res, next) => {
  try {
    const s = startOfDay(new Date())
    const e = endOfDay(new Date())
    const items = await Payment.find({ paidDueDate: { $gte: s, $lte: e }, payableToInfluencer: { $gt: 0 } })
      .sort({ paidDueDate: 1 })
      .populate({ path: 'campaignId', select: 'name' })
      .lean()
    const rows = items.map((p) => ({
      id: String(p._id),
      campaignName: p.campaignId?.name || '',
      amount: Number(p.payableToInfluencer || 0),
      dueDate: p.paidDueDate,
      type: 'influencer',
      status: p.statusForInfluencer || 'pending',
    }))
    res.json({ items: rows, total: rows.length })
  } catch (err) {
    next(err)
  }
}

export const allReceived = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1)
    const limit = Math.max(1, parseInt(req.query.limit || '10', 10) || 10)
    const q = (req.query.q || '').toString().trim()
    const sd = req.query.startDate ? startOfDay(new Date(req.query.startDate)) : null
    const ed = req.query.endDate ? endOfDay(new Date(req.query.endDate)) : null
    const match = { receivedFromClient: { $gt: 0 } }
    if (sd || ed) {
      match.updatedAt = {}
      if (sd) match.updatedAt.$gte = sd
      if (ed) match.updatedAt.$lte = ed
    }
    const base = [
      { $match: match },
      { $lookup: { from: 'campaigns', localField: 'campaignId', foreignField: '_id', as: 'campaign' } },
      { $unwind: { path: '$campaign', preserveNullAndEmptyArrays: true } },
    ]
    const nameFilter = q ? [{ $match: { 'campaign.name': { $regex: q, $options: 'i' } } }] : []
    const totalAgg = await Payment.aggregate([...base, ...nameFilter, { $count: 'count' }])
    const total = totalAgg[0]?.count || 0
    const itemsAgg = await Payment.aggregate([
      ...base,
      ...nameFilter,
      { $sort: { updatedAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $project: { _id: 1, campaignName: '$campaign.name', receivedFromClient: 1, statusForClient: 1, updatedAt: 1 } }
    ])
    const rows = itemsAgg.map((p) => ({
      id: String(p._id),
      campaignName: p.campaignName || '',
      amount: Number(p.receivedFromClient || 0),
      type: 'client',
      date: p.updatedAt,
      status: p.statusForClient || 'pending',
    }))
    res.json({ items: rows, page, limit, total, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    next(err)
  }
}

export const allPaid = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1)
    const limit = Math.max(1, parseInt(req.query.limit || '10', 10) || 10)
    const q = (req.query.q || '').toString().trim()
    const sd = req.query.startDate ? startOfDay(new Date(req.query.startDate)) : null
    const ed = req.query.endDate ? endOfDay(new Date(req.query.endDate)) : null
    const match = { paidToInfluencer: { $gt: 0 } }
    if (sd || ed) {
      match.updatedAt = {}
      if (sd) match.updatedAt.$gte = sd
      if (ed) match.updatedAt.$lte = ed
    }
    const base = [
      { $match: match },
      { $lookup: { from: 'campaigns', localField: 'campaignId', foreignField: '_id', as: 'campaign' } },
      { $unwind: { path: '$campaign', preserveNullAndEmptyArrays: true } },
    ]
    const nameFilter = q ? [{ $match: { 'campaign.name': { $regex: q, $options: 'i' } } }] : []
    const totalAgg = await Payment.aggregate([...base, ...nameFilter, { $count: 'count' }])
    const total = totalAgg[0]?.count || 0
    const itemsAgg = await Payment.aggregate([
      ...base,
      ...nameFilter,
      { $sort: { updatedAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $project: { _id: 1, campaignName: '$campaign.name', paidToInfluencer: 1, statusForInfluencer: 1, updatedAt: 1 } }
    ])
    const rows = itemsAgg.map((p) => ({
      id: String(p._id),
      campaignName: p.campaignName || '',
      amount: Number(p.paidToInfluencer || 0),
      type: 'influencer',
      date: p.updatedAt,
      status: p.statusForInfluencer || 'pending',
    }))
    res.json({ items: rows, page, limit, total, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    next(err)
  }
}

export const updatePayment = async (req, res, next) => {
  try {
    const { id } = req.params
    const p = await Payment.findById(id)
    if (!p) return res.status(404).json({ error: 'payment not found' })
    const {
      receivedFromClient,
      receivableFromClient,
      receivableDueDate,
      payableToInfluencer,
      paidToInfluencer,
      paidDueDate,
      statusForClient,
      statusForInfluencer,
    } = req.body || {}
    if (receivedFromClient !== undefined) p.receivedFromClient = Number(receivedFromClient || 0)
    if (receivableFromClient !== undefined) p.receivableFromClient = Number(receivableFromClient || 0)
    if (receivableDueDate !== undefined) p.receivableDueDate = receivableDueDate ? new Date(receivableDueDate) : undefined
    if (payableToInfluencer !== undefined) p.payableToInfluencer = Number(payableToInfluencer || 0)
    if (paidToInfluencer !== undefined) p.paidToInfluencer = Number(p.paidToInfluencer || 0)
    if (paidDueDate !== undefined) p.paidDueDate = paidDueDate ? new Date(paidDueDate) : undefined
    if (statusForClient !== undefined) p.statusForClient = String(statusForClient || 'pending')
    if (statusForInfluencer !== undefined) p.statusForInfluencer = String(statusForInfluencer || 'pending')
    await p.save()
    const populated = await Payment.findById(id).populate({ path: 'campaignId', select: 'name' }).lean()
    res.json({ payment: populated })
  } catch (err) {
    next(err)
  }
}

export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { type = 'client', status } = req.body || {}
    const allowed = ['pending', 'completed']
    if (!allowed.includes(String(status))) return res.status(400).json({ error: 'invalid status' })
    const p = await Payment.findById(id)
    if (!p) return res.status(404).json({ error: 'payment not found' })
    if (String(type) === 'influencer') {
      p.statusForInfluencer = String(status)
    } else {
      p.statusForClient = String(status)
    }
    await p.save()
    const populated = await Payment.findById(id).populate({ path: 'campaignId', select: 'name' }).lean()
    res.json({ payment: populated })
  } catch (err) {
    next(err)
  }
}

export const getPayment = async (req, res, next) => {
  try {
    const { id } = req.params
    const p = await Payment.findById(id)
      .populate({ path: 'campaignId', select: 'name' })
      .lean()
    if (!p) return res.status(404).json({ error: 'payment not found' })
    res.json({ payment: p })
  } catch (err) {
    next(err)
  }
}

export const listClientPayments = async (req, res, next) => {
  try {
    const userId = req.user?._id
    const clientProfile = await Client.findOne({ userId }).lean()
    if (!clientProfile) return res.json({ items: [], total: 0 })
    const itemsAgg = await Payment.aggregate([
      { $lookup: { from: 'campaigns', localField: 'campaignId', foreignField: '_id', as: 'campaign' } },
      { $unwind: { path: '$campaign', preserveNullAndEmptyArrays: false } },
      { $match: { 'campaign.clientId': clientProfile._id } },
      { $sort: { updatedAt: -1 } },
      { $project: {
          _id: 1,
          campaignId: '$campaign._id',
          campaignName: '$campaign.name',
          receivedFromClient: 1,
          receivableFromClient: 1,
          receivableDueDate: 1,
          statusForClient: 1,
          updatedAt: 1,
          createdAt: 1
        }
      },
    ])
    const rows = itemsAgg.map((p) => ({
      id: String(p._id),
      campaignId: String(p.campaignId || ''),
      campaignName: p.campaignName || '',
      receivedFromClient: Number(p.receivedFromClient || 0),
      receivableFromClient: Number(p.receivableFromClient || 0),
      receivableDueDate: p.receivableDueDate || null,
      statusForClient: p.statusForClient || 'pending',
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
    }))
    res.json({ items: rows, total: rows.length })
  } catch (err) {
    next(err)
  }
}

export const listInfluencerPayments = async (req, res, next) => {
  try {
    const userId = req.user?._id
    const influencerProfile = await Influencer.findOne({ userId }).lean()
    if (!influencerProfile) return res.json({ items: [], total: 0 })
    const itemsAgg = await Payment.aggregate([
      { $lookup: { from: 'campaigns', localField: 'campaignId', foreignField: '_id', as: 'campaign' } },
      { $unwind: { path: '$campaign', preserveNullAndEmptyArrays: false } },
      { $match: { 'campaign.influencerId': influencerProfile._id } },
      { $sort: { updatedAt: -1 } },
      { $project: {
          _id: 1,
          campaignId: '$campaign._id',
          campaignName: '$campaign.name',
          payableToInfluencer: 1,
          paidToInfluencer: 1,
          paidDueDate: 1,
          statusForInfluencer: 1,
          updatedAt: 1,
          createdAt: 1
        }
      },
    ])
    const rows = itemsAgg.map((p) => ({
      id: String(p._id),
      campaignId: String(p.campaignId || ''),
      campaignName: p.campaignName || '',
      payableToInfluencer: Number(p.payableToInfluencer || 0),
      paidToInfluencer: Number(p.paidToInfluencer || 0),
      paidDueDate: p.paidDueDate || null,
      statusForInfluencer: p.statusForInfluencer || 'pending',
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
    }))
    res.json({ items: rows, total: rows.length })
  } catch (err) {
    next(err)
  }
}

export const listInfluencerCampaignPayments = async (req, res, next) => {
  try {
    const userId = req.user?._id
    const influencerProfile = await Influencer.findOne({ userId }).lean()
    if (!influencerProfile) return res.json({ items: [], total: 0 })
    const itemsAgg = await Campaign.aggregate([
      { $match: { influencerId: influencerProfile._id } },
      { $lookup: { from: 'payments', localField: '_id', foreignField: 'campaignId', as: 'payment' } },
      { $unwind: { path: '$payment', preserveNullAndEmptyArrays: true } },
      { $sort: { updatedAt: -1 } },
      { $project: {
          _id: 1,
          name: 1,
          payableToInfluencer: '$payment.payableToInfluencer',
          paidToInfluencer: '$payment.paidToInfluencer',
          paidDueDate: '$payment.paidDueDate',
          statusForInfluencer: '$payment.statusForInfluencer',
          updatedAt: '$payment.updatedAt',
          createdAt: '$payment.createdAt'
        }
      },
    ])
    const rows = itemsAgg.map((c) => ({
      id: String(c._id),
      campaignId: String(c._id),
      campaignName: c.name || '',
      payableToInfluencer: Number(c.payableToInfluencer || 0),
      paidToInfluencer: Number(c.paidToInfluencer || 0),
      paidDueDate: c.paidDueDate || null,
      statusForInfluencer: c.statusForInfluencer || 'pending',
      updatedAt: c.updatedAt || null,
      createdAt: c.createdAt || null,
    }))
    res.json({ items: rows, total: rows.length })
  } catch (err) {
    next(err)
  }
}

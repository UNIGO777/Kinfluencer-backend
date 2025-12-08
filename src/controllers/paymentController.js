import Payment from '../models/Payment.js'
import Campaign from '../models/Campaign.js'

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
    if (paidToInfluencer !== undefined) p.paidToInfluencer = Number(paidToInfluencer || 0)
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

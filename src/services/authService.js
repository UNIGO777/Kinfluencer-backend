import User from '../models/User.js'
import crypto from 'crypto'

const adminTokens = new Map()

export const issueAdminToken = (ttlMinutes = 120) => {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000
  adminTokens.set(token, expiresAt)
  return token
}

const isValidAdminToken = (token) => {
  if (!token) return false
  const exp = adminTokens.get(token)
  if (!exp) return false
  if (exp < Date.now()) {
    adminTokens.delete(token)
    return false
  }
  return true
}

export const requireAdmin = (req, res, next) => {
  const token = req.headers['x-admin-token']
  if (!isValidAdminToken(token)) {
    return res.status(403).json({ error: 'admin authorization required' })
  }
  next()
}

export const requireUser = async (req, res, next) => {
  try {
    const email = req.headers['x-user-email']
    if (!email) return res.status(401).json({ error: 'x-user-email header required' })
    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ error: 'user not found' })
    if (!user.isVerified) return res.status(401).json({ error: 'user not verified' })
    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

export const requireClient = async (req, res, next) => {
  await requireUser(req, res, (err) => {
    if (err) return next(err)
    if (req.user.role !== 'client') return res.status(403).json({ error: 'client role required' })
    next()
  })
}

export const requireInfluencer = async (req, res, next) => {
  await requireUser(req, res, (err) => {
    if (err) return next(err)
    if (req.user.role !== 'influencer') return res.status(403).json({ error: 'influencer role required' })
    next()
  })
}

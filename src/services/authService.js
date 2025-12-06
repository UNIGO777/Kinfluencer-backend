import User from '../models/User.js'
import crypto from 'crypto'
import { hasToken, addToken, removeToken } from './tokenStore.js'

export const issueAdminToken = () => {
  const token = crypto.randomBytes(32).toString('hex')
  addToken(token)
  return token
}

export const revokeAdminToken = (token) => {
  if (!token) return false
  return removeToken(token)
}

const isValidAdminToken = (token) => {
  if (!token) return false
  return hasToken(token)
}

export const requireAdmin = (req, res, next) => {
  const token = req.headers['x-admin-token']
  const envToken = process.env.ADMIN_TOKEN || ''
  const bypass = (process.env.ADMIN_BYPASS || '').toString() === 'true'
  const ok = isValidAdminToken(token) || (envToken && token === envToken) || bypass
  if (!ok) return res.status(403).json({ error: 'admin authorization required' })
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

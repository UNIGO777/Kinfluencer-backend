import { Router } from 'express'
import { listUsers, createUser, sendCustomEmail, requestOtp, verifyOtp } from '../controllers/userController.js'
import { requireAdmin, requireClient, requireInfluencer } from '../services/authService.js'

const router = Router()

router.get('/', requireAdmin, listUsers)
router.post('/', requireAdmin, createUser)
router.post('/send-email', requireAdmin, sendCustomEmail)
router.post('/login/request-otp', requestOtp)
router.post('/login/verify-otp', verifyOtp)

// examples for role-protected routes
router.get('/me/client-area', requireClient, (req, res) => res.json({ role: 'client', user: req.user }))
router.get('/me/influencer-area', requireInfluencer, (req, res) => res.json({ role: 'influencer', user: req.user }))

export default router

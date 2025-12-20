import { Router } from 'express'
import { listUsers, searchUsers, createUser, sendCustomEmail, requestOtp, verifyOtp, getUserById, updateUser, updateUserStatus, deleteUser, updateMe, getClientStats, getMe, requestEmailChangeOldOtp, verifyEmailChangeOldOtp, requestEmailChangeNewOtp, verifyEmailChangeNewOtp } from '../controllers/userController.js'
import { requireAdmin, requireClient, requireInfluencer, requireUser } from '../services/authService.js'

const router = Router()

router.get('/', requireAdmin, listUsers)
router.get('/search', requireAdmin, searchUsers)
router.post('/', requireAdmin, createUser)
router.post('/send-email', requireAdmin, sendCustomEmail)
router.post('/login/request-otp', requestOtp)
router.post('/login/verify-otp', verifyOtp)

// examples for role-protected routes
router.get('/me/client-area', requireClient, (req, res) => res.json({ role: 'client', user: req.user }))
router.get('/me/influencer-area', requireInfluencer, (req, res) => res.json({ role: 'influencer', user: req.user }))
router.get('/stats', requireClient, getClientStats)
router.get('/me', requireUser, getMe)
router.post('/me/email-change/request-old-otp', requireUser, requestEmailChangeOldOtp)
router.post('/me/email-change/verify-old-otp', requireUser, verifyEmailChangeOldOtp)
router.post('/me/email-change/request-new-otp', requireUser, requestEmailChangeNewOtp)
router.post('/me/email-change/verify-new-otp', requireUser, verifyEmailChangeNewOtp)

router.get('/:id', requireAdmin, getUserById)
router.put('/:id', requireAdmin, updateUser)
router.patch('/:id/status', requireAdmin, updateUserStatus)
router.delete('/:id', requireAdmin, deleteUser)
router.put('/me', requireUser, updateMe)

export default router

import { Router } from 'express'
import { adminRequestOtp, adminVerifyOtp, getAdminStats } from '../controllers/adminController.js'
import { requireAdmin } from '../services/authService.js'

const router = Router()

router.post('/login/request-otp', adminRequestOtp)
router.post('/login/verify-otp', adminVerifyOtp)
router.get('/stats', requireAdmin, getAdminStats)

export default router

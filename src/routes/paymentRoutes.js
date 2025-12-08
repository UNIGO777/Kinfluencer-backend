import { Router } from 'express'
import { requireAdmin } from '../services/authService.js'
import { listPayments, todaySummary, todayReceived, todayPaid, receivableTodayList, payableDueTodayList, updatePayment, updatePaymentStatus, getPayment } from '../controllers/paymentController.js'

const router = Router()

router.get('/', requireAdmin, listPayments)
router.get('/today/summary', requireAdmin, todaySummary)
router.get('/today/received', requireAdmin, todayReceived)
router.get('/today/paid', requireAdmin, todayPaid)
router.get('/today/receivable', requireAdmin, receivableTodayList)
router.get('/today/payable-due', requireAdmin, payableDueTodayList)

router.put('/:id', requireAdmin, updatePayment)
router.patch('/:id/status', requireAdmin, updatePaymentStatus)
router.get('/:id', requireAdmin, getPayment)

export default router

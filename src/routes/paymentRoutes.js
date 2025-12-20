import { Router } from 'express'
import { requireAdmin, requireClient } from '../services/authService.js'
import { listPayments, todaySummary, todayReceived, todayPaid, receivableTodayList, payableDueTodayList, allReceived, allPaid, updatePayment, updatePaymentStatus, getPayment, listClientPayments } from '../controllers/paymentController.js'

const router = Router()

router.get('/', requireAdmin, listPayments)
router.get('/today/summary', requireAdmin, todaySummary)
router.get('/today/received', requireAdmin, todayReceived)
router.get('/today/paid', requireAdmin, todayPaid)
router.get('/today/receivable', requireAdmin, receivableTodayList)
router.get('/today/payable-due', requireAdmin, payableDueTodayList)
router.get('/all/received', requireAdmin, allReceived)
router.get('/all/paid', requireAdmin, allPaid)

router.get('/by-client', requireClient, listClientPayments)

router.put('/:id', requireAdmin, updatePayment)
router.patch('/:id/status', requireAdmin, updatePaymentStatus)
router.get('/:id', requireAdmin, getPayment)

export default router

import { Router } from 'express'
import { requireAdmin, requireClient, requireInfluencer } from '../services/authService.js'
import { listPayments, todaySummary, todayReceived, todayPaid, receivableTodayList, payableDueTodayList, allReceived, allPaid, updatePayment, updatePaymentStatus, getPayment, listClientPayments, listInfluencerPayments, listInfluencerCampaignPayments } from '../controllers/paymentController.js'

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
router.get('/by-influencer', requireInfluencer, listInfluencerPayments)
router.get('/by-influencer/campaigns', requireInfluencer, listInfluencerCampaignPayments)

router.put('/:id', requireAdmin, updatePayment)
router.patch('/:id/status', requireAdmin, updatePaymentStatus)
router.get('/:id', requireAdmin, getPayment)

export default router

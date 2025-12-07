import { Router } from 'express'
import { requireAdmin, requireUser } from '../services/authService.js'
import { createCampaign, listCampaigns, searchCampaigns, getCampaign, updateCampaign, deleteCampaign, updateCampaignStatus, listCampaignsByUser, listCampaignsByMe } from '../controllers/campaignController.js'

const router = Router()

router.post('/', requireAdmin, createCampaign)
router.get('/', requireAdmin, listCampaigns)
router.get('/search', requireAdmin, searchCampaigns)
router.get('/:id', requireAdmin, getCampaign)
router.put('/:id', requireAdmin, updateCampaign)
router.delete('/:id', requireAdmin, deleteCampaign)
router.patch('/:id/status', requireAdmin, updateCampaignStatus)

router.get('/by-user/:userId', requireAdmin, listCampaignsByUser)
router.get('/by-me', requireUser, listCampaignsByMe)

export default router

import { Router } from 'express'
import { requireAdmin, requireUser, requireClient, requireInfluencer } from '../services/authService.js'
import { createCampaign, listCampaigns, searchCampaigns, getCampaign, updateCampaign, deleteCampaign, updateCampaignStatus, listCampaignsByUser, listCampaignsByMe, listClientCampaigns, getClientCampaign, listInfluencerCampaigns, getInfluencerCampaign, getInfluencerCampaignPost, updateInfluencerPostEngagement, listInfluencerPosts } from '../controllers/campaignController.js'

const router = Router()

router.post('/', requireAdmin, createCampaign)
router.get('/', requireAdmin, listCampaigns)
router.get('/search', requireAdmin, searchCampaigns)

router.get('/by-user/:userId', requireAdmin, listCampaignsByUser)
router.get('/by-me', requireUser, listCampaignsByMe)
router.get('/by-client', requireClient, listClientCampaigns)
router.get('/by-client/:id', requireClient, getClientCampaign)
router.get('/by-influencer', requireInfluencer, listInfluencerCampaigns)
router.get('/by-influencer/posts', requireInfluencer, listInfluencerPosts)
router.get('/by-influencer/:id', requireInfluencer, getInfluencerCampaign)
router.get('/by-influencer/:id/post/:postId', requireInfluencer, getInfluencerCampaignPost)
router.patch('/by-influencer/:id/post/:postId/engagement', requireInfluencer, updateInfluencerPostEngagement)

router.get('/:id', requireAdmin, getCampaign)
router.put('/:id', requireAdmin, updateCampaign)
router.delete('/:id', requireAdmin, deleteCampaign)
router.patch('/:id/status', requireAdmin, updateCampaignStatus)

export default router

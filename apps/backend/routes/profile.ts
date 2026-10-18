import { Router } from 'express';
import { upsertUserProfile, getUserProfile } from '../controllers/profileController';
import { requireAuth } from '.././middleware/auth';

const router = Router();

router.get('/profile', requireAuth, getUserProfile); // Fetch for editing
router.put('/profile', requireAuth, upsertUserProfile); // Create or Update

export default router;
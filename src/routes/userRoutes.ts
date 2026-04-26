import { Router } from 'express'
import { z } from 'zod'
import { getProfile, updateProfile } from '../controllers/userController.ts'
import { authenticateToken } from '../middleware/auth.ts'
import { validateBody } from '../middleware/validation.ts'

const router = Router()

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(120),
})

router.use(authenticateToken)
router.get('/me', getProfile)
router.put('/me', validateBody(updateProfileSchema), updateProfile)

export default router

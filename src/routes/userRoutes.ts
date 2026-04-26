import { Router } from 'express'
import { z } from 'zod'
import {
  changePassword,
  getProfile,
  updateProfile,
} from '../controllers/userController.ts'
import { authenticateToken } from '../middleware/auth.ts'
import { validateBody } from '../middleware/validation.ts'

const router = Router()

const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(60),
  lastName: z.string().trim().min(1, 'Last name is required').max(60),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

router.use(authenticateToken)
router.get('/me', getProfile)
router.put('/me', validateBody(updateProfileSchema), updateProfile)
router.put(
  '/me/password',
  validateBody(changePasswordSchema),
  changePassword,
)

export default router

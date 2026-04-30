import { Router } from 'express'
import { z } from 'zod'
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  updateCategory,
} from '../controllers/categoryController.ts'
import { authenticateToken } from '../middleware/auth.ts'
import { requireRole } from '../middleware/requireRole.ts'
import { validateBody, validateParams } from '../middleware/validation.ts'

const router = Router()

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(100),
})

const uuidSchema = z.object({
  id: z.uuid('Invalid category ID format'),
})

router.get('/', listCategories)
router.get('/:id', validateParams(uuidSchema), getCategoryById)

router.use(authenticateToken)
router.post(
  '/',
  requireRole('admin'),
  validateBody(categorySchema),
  createCategory,
)
router.put(
  '/:id',
  requireRole('admin'),
  validateParams(uuidSchema),
  validateBody(categorySchema),
  updateCategory,
)
router.delete(
  '/:id',
  requireRole('admin'),
  validateParams(uuidSchema),
  deleteCategory,
)

export default router

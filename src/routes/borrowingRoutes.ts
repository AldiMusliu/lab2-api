import { Router } from 'express'
import { z } from 'zod'
import {
  createBorrowing,
  getBorrowingById,
  listBorrowings,
  returnBorrowing,
} from '../controllers/borrowingController.ts'
import { authenticateToken } from '../middleware/auth.ts'
import { validateBody, validateParams } from '../middleware/validation.ts'

const router = Router()

const borrowingSchema = z.object({
  bookId: z.uuid('Invalid book ID format'),
  dueAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Invalid due date',
  }),
  userId: z.uuid('Invalid user ID format').optional(),
})

const uuidSchema = z.object({
  id: z.uuid('Invalid borrowing ID format'),
})

router.use(authenticateToken)
router.get('/', listBorrowings)
router.post('/', validateBody(borrowingSchema), createBorrowing)
router.get('/:id', validateParams(uuidSchema), getBorrowingById)
router.patch('/:id/return', validateParams(uuidSchema), returnBorrowing)

export default router

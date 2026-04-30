import { Router } from 'express'
import { z } from 'zod'
import {
  createBook,
  deleteBook,
  getBookById,
  listBooks,
  updateBook,
} from '../controllers/bookController.ts'
import { bookFormatValues } from '../db/schema.ts'
import { authenticateToken } from '../middleware/auth.ts'
import { requireRole } from '../middleware/requireRole.ts'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validation.ts'

const router = Router()

const currentYear = new Date().getFullYear()

const bookSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(255),
    author: z.string().trim().min(1, 'Author is required').max(255),
    categoryId: z.uuid('Invalid category ID format'),
    availableCopies: z.number().int().min(0),
    totalCopies: z.number().int().min(1),
    publishedYear: z.number().int().min(1000).max(currentYear + 1),
    language: z.string().trim().min(1, 'Language is required').max(80),
    pages: z.number().int().min(1),
    isbn: z.string().trim().max(32).optional().default(''),
    shelfLocation: z.string().trim().max(80).optional().default(''),
    formats: z.array(z.enum(bookFormatValues)).min(1),
    readOnline: z.boolean().optional().default(false),
    description: z.string().trim().min(1, 'Description is required'),
    tags: z.array(z.string().trim().min(1)).optional().default([]),
    coverImage: z.string().trim().min(1, 'Cover image is required').max(1000),
    coverTone: z.string().trim().max(40).optional().default(''),
  })
  .refine((book) => book.availableCopies <= book.totalCopies, {
    path: ['availableCopies'],
    message: 'Available copies cannot be greater than total copies',
  })

const uuidSchema = z.object({
  id: z.uuid('Invalid book ID format'),
})

const bookQuerySchema = z.object({
  q: z.string().optional(),
  categoryId: z.uuid('Invalid category ID format').optional(),
  availability: z.enum(['available', 'online', 'waitlist', 'all']).optional(),
  sort: z.enum(['title', 'author', 'newest', 'copies']).optional(),
  page: z
    .string()
    .regex(/^[1-9]\d*$/, 'Page must be a positive integer')
    .optional(),
  pageSize: z
    .string()
    .regex(/^[1-9]\d*$/, 'Page size must be a positive integer')
    .optional(),
})

router.get('/', validateQuery(bookQuerySchema), listBooks)
router.get('/:id', validateParams(uuidSchema), getBookById)

router.use(authenticateToken)
router.post('/', requireRole('admin'), validateBody(bookSchema), createBook)
router.put(
  '/:id',
  requireRole('admin'),
  validateParams(uuidSchema),
  validateBody(bookSchema),
  updateBook,
)
router.delete(
  '/:id',
  requireRole('admin'),
  validateParams(uuidSchema),
  deleteBook,
)

export default router

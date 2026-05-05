import type { Response } from 'express'
import { and, desc, eq, gt, isNull, lt, ne, sql } from 'drizzle-orm'
import { db } from '../db/connection.ts'
import {
  books,
  borrowings,
  users,
  type Borrowing,
  type BorrowingStatus,
} from '../db/schema.ts'
import type { AuthenticatedRequest } from '../middleware/auth.ts'

type CreateBorrowingBody = {
  bookId: string
  dueAt: string
  userId?: string
}

type ErrorBody = {
  error: string
  message?: string
}

class HttpError extends Error {
  statusCode: number
  body: ErrorBody

  constructor(statusCode: number, body: ErrorBody) {
    super(body.message ?? body.error)
    this.statusCode = statusCode
    this.body = body
  }
}

const isHttpError = (error: unknown): error is HttpError => {
  return error instanceof HttpError
}

const hasDbErrorCode = (error: unknown, code: string) => {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  if ('code' in error && error.code === code) {
    return true
  }

  const cause = 'cause' in error ? error.cause : undefined

  return (
    typeof cause === 'object' &&
    cause !== null &&
    'code' in cause &&
    cause.code === code
  )
}

const toBorrowingStatus = (borrowing: Borrowing): BorrowingStatus => {
  if (borrowing.status === 'returned' || borrowing.returnedAt) {
    return 'returned'
  }

  if (borrowing.dueAt.getTime() < Date.now()) {
    return 'overdue'
  }

  return 'active'
}

const toBorrowing = (borrowing: Borrowing) => ({
  id: borrowing.id,
  userId: borrowing.userId,
  bookId: borrowing.bookId,
  borrowedAt: borrowing.borrowedAt.toISOString(),
  dueAt: borrowing.dueAt.toISOString(),
  returnedAt: borrowing.returnedAt?.toISOString() ?? null,
  status: toBorrowingStatus(borrowing),
})

type BorrowingWithUserRow = {
  borrowing: Borrowing
  user: {
    id: string
    firstName: string
    lastName: string
  }
}

const toBorrowingWithUser = (row: BorrowingWithUserRow) => ({
  ...toBorrowing(row.borrowing),
  user: {
    id: row.user.id,
    firstName: row.user.firstName,
    lastName: row.user.lastName,
    name: `${row.user.firstName} ${row.user.lastName}`.trim(),
  },
})

const handleControllerError = (
  error: unknown,
  res: Response,
  logMessage: string,
  responseError: string,
) => {
  if (isHttpError(error)) {
    return res.status(error.statusCode).json(error.body)
  }

  if (hasDbErrorCode(error, '23505')) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'You already have an active borrowing for this book',
    })
  }

  console.error(logMessage, error)
  return res.status(500).json({ error: responseError })
}

export const listBorrowings = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (req.user!.role === 'admin') {
      const allBorrowings = await db
        .select({
          borrowing: borrowings,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(borrowings)
        .innerJoin(users, eq(borrowings.userId, users.id))
        .orderBy(desc(borrowings.borrowedAt))

      return res.json(allBorrowings.map(toBorrowingWithUser))
    }

    const ownBorrowings = await db
      .select()
      .from(borrowings)
      .where(eq(borrowings.userId, req.user!.userId))
      .orderBy(desc(borrowings.borrowedAt))

    return res.json(ownBorrowings.map(toBorrowing))
  } catch (error) {
    return handleControllerError(
      error,
      res,
      'List borrowings error:',
      'Failed to fetch borrowings',
    )
  }
}

export const getBorrowingById = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const [borrowing] = await db
      .select()
      .from(borrowings)
      .where(eq(borrowings.id, req.params.id))

    if (!borrowing) {
      return res.status(404).json({ error: 'Borrowing not found' })
    }

    if (req.user!.role !== 'admin' && borrowing.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    return res.json(toBorrowing(borrowing))
  } catch (error) {
    return handleControllerError(
      error,
      res,
      'Get borrowing error:',
      'Failed to fetch borrowing',
    )
  }
}

export const createBorrowing = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const body = req.body as CreateBorrowingBody
    const targetUserId =
      req.user!.role === 'admin' && body.userId ? body.userId : req.user!.userId
    const dueAt = new Date(body.dueAt)

    const borrowing = await db.transaction(async (tx) => {
      const [user] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, targetUserId))

      if (!user) {
        throw new HttpError(404, { error: 'User not found' })
      }

      const [book] = await tx
        .select({
          id: books.id,
          availableCopies: books.availableCopies,
        })
        .from(books)
        .where(eq(books.id, body.bookId))

      if (!book) {
        throw new HttpError(404, { error: 'Book not found' })
      }

      const [openBorrowing] = await tx
        .select({ id: borrowings.id })
        .from(borrowings)
        .where(
          and(
            eq(borrowings.userId, targetUserId),
            eq(borrowings.bookId, body.bookId),
            isNull(borrowings.returnedAt),
            ne(borrowings.status, 'returned'),
          ),
        )

      if (openBorrowing) {
        throw new HttpError(409, {
          error: 'Conflict',
          message: 'You already have an active borrowing for this book',
        })
      }

      if (book.availableCopies <= 0) {
        throw new HttpError(409, {
          error: 'Conflict',
          message: 'Book has no available copies',
        })
      }

      const [updatedBook] = await tx
        .update(books)
        .set({
          availableCopies: sql<number>`${books.availableCopies} - 1`,
          updatedAt: new Date(),
        })
        .where(and(eq(books.id, body.bookId), gt(books.availableCopies, 0)))
        .returning({ id: books.id })

      if (!updatedBook) {
        throw new HttpError(409, {
          error: 'Conflict',
          message: 'Book has no available copies',
        })
      }

      const status: BorrowingStatus =
        dueAt.getTime() < Date.now() ? 'overdue' : 'active'
      const [createdBorrowing] = await tx
        .insert(borrowings)
        .values({
          userId: targetUserId,
          bookId: body.bookId,
          dueAt,
          status,
        })
        .returning()

      return createdBorrowing
    })

    return res.status(201).json(toBorrowing(borrowing))
  } catch (error) {
    return handleControllerError(
      error,
      res,
      'Create borrowing error:',
      'Failed to create borrowing',
    )
  }
}

export const returnBorrowing = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const borrowing = await db.transaction(async (tx) => {
      const [existingBorrowing] = await tx
        .select()
        .from(borrowings)
        .where(eq(borrowings.id, req.params.id))

      if (!existingBorrowing) {
        throw new HttpError(404, { error: 'Borrowing not found' })
      }

      if (
        req.user!.role !== 'admin' &&
        existingBorrowing.userId !== req.user!.userId
      ) {
        throw new HttpError(403, { error: 'Forbidden' })
      }

      if (
        existingBorrowing.status === 'returned' ||
        existingBorrowing.returnedAt
      ) {
        throw new HttpError(409, {
          error: 'Conflict',
          message: 'Borrowing has already been returned',
        })
      }

      const now = new Date()
      const [updatedBorrowing] = await tx
        .update(borrowings)
        .set({
          returnedAt: now,
          status: 'returned',
          updatedAt: now,
        })
        .where(
          and(eq(borrowings.id, req.params.id), isNull(borrowings.returnedAt)),
        )
        .returning()

      if (!updatedBorrowing) {
        throw new HttpError(409, {
          error: 'Conflict',
          message: 'Borrowing has already been returned',
        })
      }

      const [updatedBook] = await tx
        .update(books)
        .set({
          availableCopies: sql<number>`${books.availableCopies} + 1`,
          updatedAt: now,
        })
        .where(
          and(
            eq(books.id, existingBorrowing.bookId),
            lt(books.availableCopies, books.totalCopies),
          ),
        )
        .returning({ id: books.id })

      if (!updatedBook) {
        throw new HttpError(409, {
          error: 'Conflict',
          message: 'Book already has all copies available',
        })
      }

      return updatedBorrowing
    })

    return res.json(toBorrowing(borrowing))
  } catch (error) {
    return handleControllerError(
      error,
      res,
      'Return borrowing error:',
      'Failed to return borrowing',
    )
  }
}

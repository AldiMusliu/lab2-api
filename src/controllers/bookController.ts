import type { Request, Response } from 'express'
import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  or,
  sql,
  type SQL,
} from 'drizzle-orm'
import { db } from '../db/connection.ts'
import {
  books,
  categories,
  type Book,
  type BookFormat,
  type NewBook,
} from '../db/schema.ts'
import type { AuthenticatedRequest } from '../middleware/auth.ts'

type BookBody = {
  title: string
  author: string
  categoryId: string
  availableCopies: number
  totalCopies: number
  publishedYear: number
  language: string
  pages: number
  isbn?: string
  shelfLocation?: string
  formats: BookFormat[]
  readOnline?: boolean
  description: string
  tags?: string[]
  coverImage: string
  coverTone?: string
}

const toBook = (book: Book) => ({
  id: book.id,
  title: book.title,
  author: book.author,
  categoryId: book.categoryId,
  availableCopies: book.availableCopies,
  totalCopies: book.totalCopies,
  publishedYear: book.publishedYear,
  language: book.language,
  pages: book.pages,
  isbn: book.isbn ?? '',
  shelfLocation: book.shelfLocation,
  formats: book.formats,
  readOnline: book.readOnline,
  description: book.description,
  tags: book.tags,
  coverImage: book.coverImage,
  coverTone: book.coverTone,
})

const toBookValues = (body: BookBody): NewBook => ({
  title: body.title,
  author: body.author,
  categoryId: body.categoryId,
  availableCopies: body.availableCopies,
  totalCopies: body.totalCopies,
  publishedYear: body.publishedYear,
  language: body.language,
  pages: body.pages,
  isbn: body.isbn || null,
  shelfLocation: body.shelfLocation ?? '',
  formats: body.formats,
  readOnline: body.readOnline ?? false,
  description: body.description,
  tags: body.tags ?? [],
  coverImage: body.coverImage,
  coverTone: body.coverTone ?? '',
})

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

const parsePositiveInteger = (value: unknown) => {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

const getSingleQueryValue = (value: unknown) => {
  if (typeof value === 'string') {
    return value.trim()
  }

  return undefined
}

const buildBookFilters = (req: Request) => {
  const filters: SQL[] = []
  const q = getSingleQueryValue(req.query.q)
  const categoryId = getSingleQueryValue(req.query.categoryId)
  const availability = getSingleQueryValue(req.query.availability)

  if (q) {
    const pattern = `%${q}%`
    const searchFilter = or(
      ilike(books.title, pattern),
      ilike(books.author, pattern),
      ilike(books.description, pattern),
      sql`${books.tags}::text ILIKE ${pattern}`,
    )

    if (searchFilter) {
      filters.push(searchFilter)
    }
  }

  if (categoryId) {
    filters.push(eq(books.categoryId, categoryId))
  }

  if (availability === 'available') {
    filters.push(gt(books.availableCopies, 0))
  } else if (availability === 'online') {
    filters.push(eq(books.readOnline, true))
  } else if (availability === 'waitlist') {
    filters.push(eq(books.availableCopies, 0))
  }

  return filters.length > 0 ? and(...filters) : undefined
}

const getBookOrderBy = (sort?: string) => {
  switch (sort) {
    case 'author':
      return asc(books.author)
    case 'newest':
      return desc(books.createdAt)
    case 'copies':
      return desc(books.availableCopies)
    case 'title':
    default:
      return asc(books.title)
  }
}

const ensureCategoryExists = async (categoryId: string) => {
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId))

  return !!category
}

const handleBookWriteError = (error: unknown, res: Response) => {
  if (hasDbErrorCode(error, '23505')) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Book with this ISBN already exists',
    })
  }

  if (hasDbErrorCode(error, '23503')) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Category does not exist',
    })
  }

  return undefined
}

export const listBooks = async (req: Request, res: Response) => {
  try {
    const where = buildBookFilters(req)
    const orderBy = getBookOrderBy(getSingleQueryValue(req.query.sort))
    const page = parsePositiveInteger(req.query.page)
    const pageSize = parsePositiveInteger(req.query.pageSize)

    const allBooks =
      page || pageSize
        ? await db
            .select()
            .from(books)
            .where(where)
            .orderBy(orderBy)
            .limit(Math.min(pageSize ?? 10, 100))
            .offset(((page ?? 1) - 1) * Math.min(pageSize ?? 10, 100))
        : await db.select().from(books).where(where).orderBy(orderBy)

    return res.json(allBooks.map(toBook))
  } catch (error) {
    console.error('List books error:', error)
    return res.status(500).json({ error: 'Failed to fetch books' })
  }
}

export const getBookById = async (req: Request, res: Response) => {
  try {
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.id, req.params.id))

    if (!book) {
      return res.status(404).json({ error: 'Book not found' })
    }

    return res.json(toBook(book))
  } catch (error) {
    console.error('Get book error:', error)
    return res.status(500).json({ error: 'Failed to fetch book' })
  }
}

export const createBook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookData = toBookValues(req.body)
    const categoryExists = await ensureCategoryExists(bookData.categoryId)

    if (!categoryExists) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Category does not exist',
      })
    }

    const [book] = await db.insert(books).values(bookData).returning()

    return res.status(201).json(toBook(book))
  } catch (error) {
    const handled = handleBookWriteError(error, res)

    if (handled) {
      return handled
    }

    console.error('Create book error:', error)
    return res.status(500).json({ error: 'Failed to create book' })
  }
}

export const updateBook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookData = toBookValues(req.body)
    const categoryExists = await ensureCategoryExists(bookData.categoryId)

    if (!categoryExists) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Category does not exist',
      })
    }

    const [book] = await db
      .update(books)
      .set({
        ...bookData,
        updatedAt: new Date(),
      })
      .where(eq(books.id, req.params.id))
      .returning()

    if (!book) {
      return res.status(404).json({ error: 'Book not found' })
    }

    return res.json(toBook(book))
  } catch (error) {
    const handled = handleBookWriteError(error, res)

    if (handled) {
      return handled
    }

    console.error('Update book error:', error)
    return res.status(500).json({ error: 'Failed to update book' })
  }
}

export const deleteBook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [book] = await db
      .delete(books)
      .where(eq(books.id, req.params.id))
      .returning()

    if (!book) {
      return res.status(404).json({ error: 'Book not found' })
    }

    return res.status(204).send()
  } catch (error) {
    if (hasDbErrorCode(error, '23503')) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Book is still referenced by borrowings',
      })
    }

    console.error('Delete book error:', error)
    return res.status(500).json({ error: 'Failed to delete book' })
  }
}

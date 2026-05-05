import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { app } from '../src/server.ts'
import { db } from '../src/db/connection.ts'
import { books } from '../src/db/schema.ts'
import {
  cleanupDatabase,
  createTestBook,
  createTestBorrowing,
  createTestUser,
} from './helpers/dbHelpers.ts'

const futureDueAt = () =>
  new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

const pastDueAt = () =>
  new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

const getBook = async (id: string) => {
  const [book] = await db.select().from(books).where(eq(books.id, id))

  return book
}

describe('Borrowings API', () => {
  afterEach(async () => {
    await cleanupDatabase()
  })

  it('creates a borrowing for the authenticated user and decrements copies', async () => {
    const { user, accessToken } = await createTestUser()
    const book = await createTestBook({
      availableCopies: 2,
      totalCopies: 2,
    })

    const response = await request(app)
      .post('/api/borrowings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bookId: book.id,
        dueAt: futureDueAt(),
      })
      .expect(201)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        userId: user.id,
        bookId: book.id,
        returnedAt: null,
        status: 'active',
      }),
    )

    const updatedBook = await getBook(book.id)
    expect(updatedBook.availableCopies).toBe(1)
  })

  it('does not let regular users borrow on behalf of another user', async () => {
    const { user, accessToken } = await createTestUser()
    const otherUser = await createTestUser()
    const book = await createTestBook({
      availableCopies: 1,
      totalCopies: 1,
    })

    const response = await request(app)
      .post('/api/borrowings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userId: otherUser.user.id,
        bookId: book.id,
        dueAt: futureDueAt(),
      })
      .expect(201)

    expect(response.body.userId).toBe(user.id)
  })

  it('rejects borrowing the same book twice while the first borrowing is active', async () => {
    const { accessToken } = await createTestUser()
    const book = await createTestBook({
      availableCopies: 2,
      totalCopies: 2,
    })

    await request(app)
      .post('/api/borrowings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bookId: book.id,
        dueAt: futureDueAt(),
      })
      .expect(201)

    const response = await request(app)
      .post('/api/borrowings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bookId: book.id,
        dueAt: futureDueAt(),
      })
      .expect(409)

    expect(response.body).toEqual({
      error: 'Conflict',
      message: 'You already have an active borrowing for this book',
    })

    const updatedBook = await getBook(book.id)
    expect(updatedBook.availableCopies).toBe(1)
  })

  it('allows admins to create a borrowing for another user', async () => {
    const { accessToken } = await createTestUser({ role: 'admin' })
    const borrower = await createTestUser()
    const book = await createTestBook({
      availableCopies: 1,
      totalCopies: 1,
    })

    const response = await request(app)
      .post('/api/borrowings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userId: borrower.user.id,
        bookId: book.id,
        dueAt: futureDueAt(),
      })
      .expect(201)

    expect(response.body).toEqual(
      expect.objectContaining({
        userId: borrower.user.id,
        bookId: book.id,
      }),
    )
  })

  it('rejects borrowing when no copies are available', async () => {
    const { accessToken } = await createTestUser()
    const book = await createTestBook({
      availableCopies: 0,
      totalCopies: 1,
    })

    const response = await request(app)
      .post('/api/borrowings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bookId: book.id,
        dueAt: futureDueAt(),
      })
      .expect(409)

    expect(response.body).toHaveProperty('error', 'Conflict')
  })

  it('marks newly created past-due borrowings as overdue', async () => {
    const { accessToken } = await createTestUser()
    const book = await createTestBook({
      availableCopies: 1,
      totalCopies: 1,
    })

    const response = await request(app)
      .post('/api/borrowings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bookId: book.id,
        dueAt: pastDueAt(),
      })
      .expect(201)

    expect(response.body.status).toBe('overdue')
  })

  it('allows borrowing the same book again after returning it', async () => {
    const { accessToken } = await createTestUser()
    const book = await createTestBook({
      availableCopies: 1,
      totalCopies: 1,
    })

    const createResponse = await request(app)
      .post('/api/borrowings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bookId: book.id,
        dueAt: futureDueAt(),
      })
      .expect(201)

    await request(app)
      .patch(`/api/borrowings/${createResponse.body.id}/return`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    const secondBorrowResponse = await request(app)
      .post('/api/borrowings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bookId: book.id,
        dueAt: futureDueAt(),
      })
      .expect(201)

    expect(secondBorrowResponse.body).toEqual(
      expect.objectContaining({
        bookId: book.id,
        status: 'active',
      }),
    )
  })

  it('lists only own borrowings for users and all borrowings for admins', async () => {
    const userA = await createTestUser()
    const userB = await createTestUser()
    const admin = await createTestUser({ role: 'admin' })
    const bookA = await createTestBook()
    const bookB = await createTestBook()
    const borrowingA = await createTestBorrowing({
      userId: userA.user.id,
      bookId: bookA.id,
    })
    const borrowingB = await createTestBorrowing({
      userId: userB.user.id,
      bookId: bookB.id,
    })

    const userResponse = await request(app)
      .get('/api/borrowings')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .expect(200)

    expect(userResponse.body).toHaveLength(1)
    expect(userResponse.body[0]).toEqual(
      expect.objectContaining({
        id: borrowingA.id,
        userId: userA.user.id,
      }),
    )

    const adminResponse = await request(app)
      .get('/api/borrowings')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200)

    expect(adminResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: borrowingA.id }),
        expect.objectContaining({ id: borrowingB.id }),
      ]),
    )
  })

  it('forbids users from viewing another user borrowing', async () => {
    const owner = await createTestUser()
    const otherUser = await createTestUser()
    const book = await createTestBook()
    const borrowing = await createTestBorrowing({
      userId: owner.user.id,
      bookId: book.id,
    })

    await request(app)
      .get(`/api/borrowings/${borrowing.id}`)
      .set('Authorization', `Bearer ${otherUser.accessToken}`)
      .expect(403)
  })

  it('returns a borrowing once and increments copies', async () => {
    const { accessToken } = await createTestUser()
    const book = await createTestBook({
      availableCopies: 2,
      totalCopies: 2,
    })

    const createResponse = await request(app)
      .post('/api/borrowings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bookId: book.id,
        dueAt: futureDueAt(),
      })
      .expect(201)

    const returnResponse = await request(app)
      .patch(`/api/borrowings/${createResponse.body.id}/return`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(returnResponse.body).toEqual(
      expect.objectContaining({
        id: createResponse.body.id,
        status: 'returned',
        returnedAt: expect.any(String),
      }),
    )

    const updatedBook = await getBook(book.id)
    expect(updatedBook.availableCopies).toBe(2)

    const secondReturnResponse = await request(app)
      .patch(`/api/borrowings/${createResponse.body.id}/return`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409)

    expect(secondReturnResponse.body).toHaveProperty('error', 'Conflict')
  })

  it('allows admins to return any borrowing', async () => {
    const owner = await createTestUser()
    const admin = await createTestUser({ role: 'admin' })
    const book = await createTestBook({
      availableCopies: 1,
      totalCopies: 2,
    })
    const borrowing = await createTestBorrowing({
      userId: owner.user.id,
      bookId: book.id,
    })

    const response = await request(app)
      .patch(`/api/borrowings/${borrowing.id}/return`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: borrowing.id,
        status: 'returned',
      }),
    )
  })
})

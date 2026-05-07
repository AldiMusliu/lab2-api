import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { app } from '../src/server.ts'
import {
  cleanupDatabase,
  createTestBook,
  createTestBorrowing,
  createTestCategory,
  createTestUser,
} from './helpers/dbHelpers.ts'

const futureDate = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000)

const pastDate = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000)

describe('Dashboard API', () => {
  afterEach(async () => {
    await cleanupDatabase()
  })

  it('requires authentication', async () => {
    await request(app).get('/api/dashboard/stats').expect(401)
  })

  it('returns library-wide stats for admins', async () => {
    const admin = await createTestUser({ role: 'admin' })
    const userA = await createTestUser()
    const userB = await createTestUser()
    const category = await createTestCategory('Dashboard Stats')
    const bookA = await createTestBook({
      categoryId: category.id,
      availableCopies: 1,
      totalCopies: 3,
    })
    const bookB = await createTestBook({
      categoryId: category.id,
      availableCopies: 1,
      totalCopies: 1,
    })

    await createTestBorrowing({
      userId: userA.user.id,
      bookId: bookA.id,
      dueAt: futureDate(14),
      status: 'active',
    })
    await createTestBorrowing({
      userId: userB.user.id,
      bookId: bookB.id,
      dueAt: pastDate(2),
      status: 'active',
    })
    await createTestBorrowing({
      userId: userB.user.id,
      bookId: bookA.id,
      dueAt: pastDate(10),
      returnedAt: pastDate(1),
      status: 'returned',
    })

    const response = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200)

    expect(response.body).toEqual({
      role: 'admin',
      totalBooks: 2,
      totalCopies: 4,
      availableCopies: 2,
      borrowedCopies: 2,
      availableBooks: 2,
      totalCategories: 1,
      totalUsers: 2,
      adminUsers: 1,
      activeUsers: 2,
      totalBorrowings: 3,
      activeBorrowings: 1,
      overdueBorrowings: 1,
      returnedBorrowings: 1,
    })
  })

  it('returns personal borrowing stats for regular users', async () => {
    const user = await createTestUser()
    const otherUser = await createTestUser()
    const category = await createTestCategory('Personal Stats')
    const activeBook = await createTestBook({ categoryId: category.id })
    const overdueBook = await createTestBook({ categoryId: category.id })
    const returnedBook = await createTestBook({ categoryId: category.id })
    const otherBook = await createTestBook({ categoryId: category.id })

    await createTestBorrowing({
      userId: user.user.id,
      bookId: activeBook.id,
      dueAt: futureDate(3),
      status: 'active',
    })
    await createTestBorrowing({
      userId: user.user.id,
      bookId: overdueBook.id,
      dueAt: pastDate(1),
      status: 'active',
    })
    await createTestBorrowing({
      userId: user.user.id,
      bookId: returnedBook.id,
      dueAt: pastDate(12),
      returnedAt: pastDate(4),
      status: 'returned',
    })
    await createTestBorrowing({
      userId: otherUser.user.id,
      bookId: otherBook.id,
      dueAt: futureDate(2),
      status: 'active',
    })

    const response = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200)

    expect(response.body).toEqual({
      role: 'user',
      totalBorrowings: 3,
      activeBorrowings: 1,
      overdueBorrowings: 1,
      returnedBorrowings: 1,
      currentBorrowings: 2,
      dueSoonBorrowings: 1,
    })
  })
})

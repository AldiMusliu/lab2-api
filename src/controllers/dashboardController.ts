import type { Response } from 'express'
import { eq, sql } from 'drizzle-orm'
import { db } from '../db/connection.ts'
import { books, borrowings, categories, users } from '../db/schema.ts'
import type { AuthenticatedRequest } from '../middleware/auth.ts'

const toNumber = (value: unknown) => Number(value ?? 0)

const getAdminStats = async () => {
  const now = new Date()

  const [inventoryStats, categoryStats, userStats, borrowingStats] =
    await Promise.all([
      db
        .select({
          totalBooks: sql<number>`count(*)::int`,
          totalCopies: sql<number>`coalesce(sum(${books.totalCopies}), 0)::int`,
          availableCopies: sql<number>`coalesce(sum(${books.availableCopies}), 0)::int`,
          availableBooks: sql<number>`count(*) filter (where ${books.availableCopies} > 0)::int`,
        })
        .from(books),
      db
        .select({
          totalCategories: sql<number>`count(*)::int`,
        })
        .from(categories),
      db
        .select({
          totalUsers: sql<number>`count(*) filter (where ${users.role} = 'user')::int`,
          adminUsers: sql<number>`count(*) filter (where ${users.role} = 'admin')::int`,
        })
        .from(users),
      db
        .select({
          totalBorrowings: sql<number>`count(*)::int`,
          activeBorrowings: sql<number>`count(*) filter (where ${borrowings.returnedAt} is null and ${borrowings.status} <> 'returned' and ${borrowings.dueAt} >= ${now})::int`,
          overdueBorrowings: sql<number>`count(*) filter (where ${borrowings.returnedAt} is null and ${borrowings.status} <> 'returned' and ${borrowings.dueAt} < ${now})::int`,
          returnedBorrowings: sql<number>`count(*) filter (where ${borrowings.returnedAt} is not null or ${borrowings.status} = 'returned')::int`,
          activeUsers: sql<number>`count(distinct ${borrowings.userId}) filter (where ${borrowings.returnedAt} is null and ${borrowings.status} <> 'returned')::int`,
        })
        .from(borrowings),
    ])

  const inventory = inventoryStats[0]
  const category = categoryStats[0]
  const user = userStats[0]
  const borrowing = borrowingStats[0]
  const totalCopies = toNumber(inventory?.totalCopies)
  const availableCopies = toNumber(inventory?.availableCopies)

  return {
    role: 'admin' as const,
    totalBooks: toNumber(inventory?.totalBooks),
    totalCopies,
    availableCopies,
    borrowedCopies: Math.max(totalCopies - availableCopies, 0),
    availableBooks: toNumber(inventory?.availableBooks),
    totalCategories: toNumber(category?.totalCategories),
    totalUsers: toNumber(user?.totalUsers),
    adminUsers: toNumber(user?.adminUsers),
    activeUsers: toNumber(borrowing?.activeUsers),
    totalBorrowings: toNumber(borrowing?.totalBorrowings),
    activeBorrowings: toNumber(borrowing?.activeBorrowings),
    overdueBorrowings: toNumber(borrowing?.overdueBorrowings),
    returnedBorrowings: toNumber(borrowing?.returnedBorrowings),
  }
}

const getUserStats = async (userId: string) => {
  const now = new Date()
  const dueSoonCutoff = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [stats] = await db
    .select({
      totalBorrowings: sql<number>`count(*)::int`,
      activeBorrowings: sql<number>`count(*) filter (where ${borrowings.returnedAt} is null and ${borrowings.status} <> 'returned' and ${borrowings.dueAt} >= ${now})::int`,
      overdueBorrowings: sql<number>`count(*) filter (where ${borrowings.returnedAt} is null and ${borrowings.status} <> 'returned' and ${borrowings.dueAt} < ${now})::int`,
      returnedBorrowings: sql<number>`count(*) filter (where ${borrowings.returnedAt} is not null or ${borrowings.status} = 'returned')::int`,
      dueSoonBorrowings: sql<number>`count(*) filter (where ${borrowings.returnedAt} is null and ${borrowings.status} <> 'returned' and ${borrowings.dueAt} >= ${now} and ${borrowings.dueAt} <= ${dueSoonCutoff})::int`,
    })
    .from(borrowings)
    .where(eq(borrowings.userId, userId))

  const activeBorrowings = toNumber(stats?.activeBorrowings)
  const overdueBorrowings = toNumber(stats?.overdueBorrowings)

  return {
    role: 'user' as const,
    totalBorrowings: toNumber(stats?.totalBorrowings),
    activeBorrowings,
    overdueBorrowings,
    returnedBorrowings: toNumber(stats?.returnedBorrowings),
    currentBorrowings: activeBorrowings + overdueBorrowings,
    dueSoonBorrowings: toNumber(stats?.dueSoonBorrowings),
  }
}

export const getDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const stats =
      req.user!.role === 'admin'
        ? await getAdminStats()
        : await getUserStats(req.user!.userId)

    return res.json(stats)
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
}

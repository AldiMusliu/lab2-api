import { db } from '../../src/db/connection.ts'
import {
  books,
  categories,
  users,
  type BookFormat,
  type UserRole,
} from '../../src/db/schema.ts'
import { generateToken } from '../../src/utils/jwt.ts'
import { hashPassword } from '../../src/utils/password.ts'

export async function createTestUser(
  userData: Partial<{
    firstName: string
    lastName: string
    email: string
    password: string
    role: UserRole
  }> = {},
) {
  const defaultData = {
    firstName: 'Test',
    lastName: 'User',
    email: `test-${Date.now()}-${Math.random()}@example.com`,
    password: 'TestPassword123!',
    role: 'user' as UserRole,
    ...userData,
  }

  const passwordHash = await hashPassword(defaultData.password)
  const [user] = await db
    .insert(users)
    .values({
      firstName: defaultData.firstName,
      lastName: defaultData.lastName,
      email: defaultData.email,
      passwordHash,
      role: defaultData.role,
    })
    .returning()

  const accessToken = await generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  return { user, accessToken, rawPassword: defaultData.password }
}

export async function createTestCategory(name = `Category ${Date.now()}`) {
  const [category] = await db.insert(categories).values({ name }).returning()

  return category
}

export async function createTestBook(
  bookData: Partial<{
    title: string
    author: string
    categoryId: string
    availableCopies: number
    totalCopies: number
    publishedYear: number
    language: string
    pages: number
    isbn: string | null
    shelfLocation: string
    formats: BookFormat[]
    readOnline: boolean
    description: string
    tags: string[]
    coverImage: string
    coverTone: string
  }> = {},
) {
  const categoryId = bookData.categoryId ?? (await createTestCategory()).id

  const [book] = await db
    .insert(books)
    .values({
      title: `Test Book ${Date.now()} ${Math.random()}`,
      author: 'Test Author',
      categoryId,
      availableCopies: 2,
      totalCopies: 3,
      publishedYear: 2020,
      language: 'English',
      pages: 250,
      isbn: `978${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(
        0,
        32,
      ),
      shelfLocation: 'T1-API-001',
      formats: ['Print'],
      readOnline: false,
      description: 'A test book for API coverage.',
      tags: ['Testing'],
      coverImage: 'https://example.com/test-cover.jpg',
      coverTone: 'teal',
      ...bookData,
    })
    .returning()

  return book
}

export async function cleanupDatabase() {
  await db.delete(books)
  await db.delete(categories)
  await db.delete(users)
}

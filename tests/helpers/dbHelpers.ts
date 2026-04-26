import { db } from '../../src/db/connection.ts'
import { categories, users, type UserRole } from '../../src/db/schema.ts'
import { generateToken } from '../../src/utils/jwt.ts'
import { hashPassword } from '../../src/utils/password.ts'

export async function createTestUser(
  userData: Partial<{
    fullName: string
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
  const fullName =
    defaultData.fullName ??
    `${defaultData.firstName} ${defaultData.lastName}`.trim()

  const passwordHash = await hashPassword(defaultData.password)
  const [user] = await db
    .insert(users)
    .values({
      fullName,
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

export async function cleanupDatabase() {
  await db.delete(categories)
  await db.delete(users)
}

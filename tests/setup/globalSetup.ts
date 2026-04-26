import { execSync } from 'child_process'
import { sql } from 'drizzle-orm'
import { db } from '../../src/db/connection.ts'

const resetDatabase = async () => {
  await db.execute(sql`DROP TABLE IF EXISTS habit_tags CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS entries CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS habits CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS tags CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS categories CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`)
  await db.execute(sql`DROP TYPE IF EXISTS user_role CASCADE`)
}

export default async function setup() {
  console.log('Setting up test database...')

  try {
    await resetDatabase()

    console.log('Pushing schema using drizzle-kit...')
    execSync(
      `npx drizzle-kit push --url="${process.env.DATABASE_URL}" --schema="./src/db/schema.ts" --dialect="postgresql"`,
      {
        stdio: 'inherit',
        cwd: process.cwd(),
      },
    )

    console.log('Test database setup complete')
  } catch (error) {
    console.error('Failed to setup test database:', error)
    throw error
  }

  return async () => {
    console.log('Tearing down test database...')

    try {
      await resetDatabase()
      console.log('Test database teardown complete')
      process.exit(0)
    } catch (error) {
      console.error('Failed to teardown test database:', error)
    }
  }
}

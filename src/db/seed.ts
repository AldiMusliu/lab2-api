import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { db } from './connection.ts'
import { categories, users } from './schema.ts'
import { hashPassword } from '../utils/password.ts'

const seed = async () => {
  console.log('Starting Smart Library database seed...')

  try {
    console.log('Clearing existing data...')
    await db.delete(categories)
    await db.delete(users)

    console.log('Creating demo users...')
    const passwordHash = await hashPassword('password123')

    await db.insert(users).values([
      {
        fullName: 'Library Admin',
        email: 'admin@library.local',
        passwordHash,
        role: 'admin',
      },
      {
        fullName: 'Alex Reader',
        email: 'user@library.local',
        passwordHash,
        role: 'user',
      },
    ])

    console.log('Creating categories...')
    await db.insert(categories).values([
      { name: 'Software Engineering' },
      { name: 'Data & AI' },
      { name: 'Product Design' },
      { name: 'Business & Leadership' },
      { name: 'Modern Fiction' },
    ])

    console.log('Smart Library DB seeded successfully')
    console.log('admin@library.local / password123')
    console.log('user@library.local / password123')
  } catch (error) {
    console.error('Seed failed', error)
    process.exit(1)
  }
}

const isDirectRun =
  !!process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export default seed

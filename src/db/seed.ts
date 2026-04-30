import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { db } from './connection.ts'
import { books, categories, users } from './schema.ts'
import { hashPassword } from '../utils/password.ts'

const seed = async () => {
  console.log('Starting Smart Library database seed...')

  try {
    console.log('Clearing existing data...')
    await db.delete(books)
    await db.delete(categories)
    await db.delete(users)

    console.log('Creating demo users...')
    const passwordHash = await hashPassword('password123')

    await db.insert(users).values([
      {
        firstName: 'Aldi',
        lastName: 'Admin',
        email: 'aldi@admin.com',
        passwordHash,
        role: 'admin',
      },
      {
        firstName: 'Aldi',
        lastName: 'Reader',
        email: 'aldi@user.com',
        passwordHash,
        role: 'user',
      },
    ])

    console.log('Creating categories...')
    const createdCategories = await db
      .insert(categories)
      .values([
        { name: 'Software Engineering' },
        { name: 'Data & AI' },
        { name: 'Product Design' },
        { name: 'Business & Leadership' },
        { name: 'Modern Fiction' },
      ])
      .returning()

    const categoryByName = new Map(
      createdCategories.map((category) => [category.name, category.id]),
    )

    console.log('Creating books...')
    await db.insert(books).values([
      {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        categoryId: categoryByName.get('Software Engineering')!,
        availableCopies: 4,
        totalCopies: 6,
        publishedYear: 2008,
        language: 'English',
        pages: 464,
        isbn: '9780132350884',
        shelfLocation: 'A2-SW-014',
        formats: ['Print', 'E-book'],
        readOnline: true,
        description:
          'A practical guide to writing readable, maintainable software.',
        tags: ['Refactoring', 'Testing', 'Craftsmanship'],
        coverImage:
          'https://images-na.ssl-images-amazon.com/images/I/41xShlnTZTL._SX374_BO1,204,203,200_.jpg',
        coverTone: 'teal',
      },
      {
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        categoryId: categoryByName.get('Data & AI')!,
        availableCopies: 2,
        totalCopies: 4,
        publishedYear: 2017,
        language: 'English',
        pages: 616,
        isbn: '9781449373320',
        shelfLocation: 'B1-DA-021',
        formats: ['Print', 'E-book', 'Audiobook'],
        readOnline: true,
        description:
          'A deep look at reliable, scalable, and maintainable data systems.',
        tags: ['Distributed Systems', 'Databases', 'Architecture'],
        coverImage:
          'https://covers.openlibrary.org/b/isbn/9781449373320-L.jpg',
        coverTone: 'blue',
      },
      {
        title: 'The Design of Everyday Things',
        author: 'Don Norman',
        categoryId: categoryByName.get('Product Design')!,
        availableCopies: 3,
        totalCopies: 3,
        publishedYear: 2013,
        language: 'English',
        pages: 368,
        isbn: '9780465050659',
        shelfLocation: 'C3-PD-008',
        formats: ['Print'],
        readOnline: false,
        description:
          'A classic introduction to human-centered product design.',
        tags: ['UX', 'Usability', 'Product'],
        coverImage:
          'https://covers.openlibrary.org/b/isbn/9780465050659-L.jpg',
        coverTone: 'amber',
      },
      {
        title: 'The Lean Startup',
        author: 'Eric Ries',
        categoryId: categoryByName.get('Business & Leadership')!,
        availableCopies: 1,
        totalCopies: 2,
        publishedYear: 2011,
        language: 'English',
        pages: 336,
        isbn: '9780307887894',
        shelfLocation: 'D2-BL-017',
        formats: ['Print', 'Audiobook'],
        readOnline: false,
        description:
          'A business framework for testing ideas and building products faster.',
        tags: ['Startup', 'Leadership', 'Product'],
        coverImage:
          'https://covers.openlibrary.org/b/isbn/9780307887894-L.jpg',
        coverTone: 'green',
      },
      {
        title: 'Tomorrow, and Tomorrow, and Tomorrow',
        author: 'Gabrielle Zevin',
        categoryId: categoryByName.get('Modern Fiction')!,
        availableCopies: 0,
        totalCopies: 2,
        publishedYear: 2022,
        language: 'English',
        pages: 416,
        isbn: '9780593321201',
        shelfLocation: 'E5-MF-003',
        formats: ['Print', 'E-book'],
        readOnline: true,
        description:
          'A novel about friendship, ambition, art, and the making of games.',
        tags: ['Fiction', 'Games', 'Friendship'],
        coverImage:
          'https://covers.openlibrary.org/b/isbn/9780593321201-L.jpg',
        coverTone: 'rose',
      },
    ])

    console.log('Smart Library DB seeded successfully')
    console.log('aldi@admin.com / password123')
    console.log('aldi@user.com / password123')
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

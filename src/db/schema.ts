import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  check,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

export const userRoleEnum = pgEnum('user_role', ['admin', 'user'])
export const borrowingStatusEnum = pgEnum('borrowing_status', [
  'active',
  'returned',
  'overdue',
])
export const bookFormatValues = ['Print', 'E-book', 'Audiobook'] as const

export type BookFormat = (typeof bookFormatValues)[number]

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 60 }).default('').notNull(),
  lastName: varchar('last_name', { length: 60 }).default('').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const books = pgTable(
  'books',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    author: varchar('author', { length: 255 }).notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    availableCopies: integer('available_copies').notNull(),
    totalCopies: integer('total_copies').notNull(),
    publishedYear: integer('published_year').notNull(),
    language: varchar('language', { length: 80 }).notNull(),
    pages: integer('pages').notNull(),
    isbn: varchar('isbn', { length: 32 }).unique(),
    shelfLocation: varchar('shelf_location', { length: 80 })
      .default('')
      .notNull(),
    formats: jsonb('formats')
      .$type<BookFormat[]>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    readOnline: boolean('read_online').default(false).notNull(),
    description: text('description').notNull(),
    tags: jsonb('tags').$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
    coverImage: varchar('cover_image', { length: 1000 }).notNull(),
    coverTone: varchar('cover_tone', { length: 40 }).default('').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    check(
      'books_available_copies_nonnegative',
      sql`${table.availableCopies} >= 0`,
    ),
    check('books_total_copies_positive', sql`${table.totalCopies} >= 1`),
    check(
      'books_available_copies_lte_total',
      sql`${table.availableCopies} <= ${table.totalCopies}`,
    ),
    check('books_pages_positive', sql`${table.pages} >= 1`),
  ],
)

export const borrowings = pgTable('borrowings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  bookId: uuid('book_id')
    .notNull()
    .references(() => books.id, { onDelete: 'restrict' }),
  borrowedAt: timestamp('borrowed_at').defaultNow().notNull(),
  dueAt: timestamp('due_at').notNull(),
  returnedAt: timestamp('returned_at'),
  status: borrowingStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const userRelations = relations(users, ({ many }) => ({
  borrowings: many(borrowings),
}))
export const categoryRelations = relations(categories, ({ many }) => ({
  books: many(books),
}))
export const bookRelations = relations(books, ({ many, one }) => ({
  category: one(categories, {
    fields: [books.categoryId],
    references: [categories.id],
  }),
  borrowings: many(borrowings),
}))
export const borrowingRelations = relations(borrowings, ({ one }) => ({
  user: one(users, {
    fields: [borrowings.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [borrowings.bookId],
    references: [books.id],
  }),
}))

export type UserRole = (typeof userRoleEnum.enumValues)[number]
export type BorrowingStatus = (typeof borrowingStatusEnum.enumValues)[number]
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Book = typeof books.$inferSelect
export type NewBook = typeof books.$inferInsert
export type Borrowing = typeof borrowings.$inferSelect
export type NewBorrowing = typeof borrowings.$inferInsert

export const insertUserSchema = createInsertSchema(users)
export const selectUserSchema = createSelectSchema(users)
export const insertCategorySchema = createInsertSchema(categories)
export const selectCategorySchema = createSelectSchema(categories)
export const insertBookSchema = createInsertSchema(books)
export const selectBookSchema = createSelectSchema(books)
export const insertBorrowingSchema = createInsertSchema(borrowings)
export const selectBorrowingSchema = createSelectSchema(borrowings)

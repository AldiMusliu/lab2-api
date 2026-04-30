import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { app } from '../src/server.ts'
import {
  cleanupDatabase,
  createTestBook,
  createTestCategory,
  createTestUser,
} from './helpers/dbHelpers.ts'

const buildBookBody = (categoryId: string) => ({
  title: 'Practical API Design',
  author: 'Casey Endpoint',
  categoryId,
  availableCopies: 2,
  totalCopies: 5,
  publishedYear: 2024,
  language: 'English',
  pages: 320,
  isbn: `978${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(
    0,
    32,
  ),
  shelfLocation: 'A1-API-001',
  formats: ['Print', 'E-book'],
  readOnline: true,
  description: 'A focused guide to building useful HTTP APIs.',
  tags: ['API', 'Backend'],
  coverImage: 'https://example.com/api-design.jpg',
  coverTone: 'teal',
})

describe('Books API', () => {
  afterEach(async () => {
    await cleanupDatabase()
  })

  it('lists books publicly as an array', async () => {
    await createTestBook({ title: 'Zebra Patterns' })
    await createTestBook({ title: 'API Patterns' })

    const response = await request(app).get('/api/books').expect(200)

    expect(response.body).toEqual([
      expect.objectContaining({ title: 'API Patterns' }),
      expect.objectContaining({ title: 'Zebra Patterns' }),
    ])
  })

  it('gets a book by id publicly', async () => {
    const book = await createTestBook({ title: 'Clean Architecture' })

    const response = await request(app).get(`/api/books/${book.id}`).expect(200)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: book.id,
        title: 'Clean Architecture',
        author: book.author,
        categoryId: book.categoryId,
        availableCopies: book.availableCopies,
        totalCopies: book.totalCopies,
        formats: book.formats,
        tags: book.tags,
      }),
    )
    expect(response.body).not.toHaveProperty('createdAt')
    expect(response.body).not.toHaveProperty('updatedAt')
  })

  it('filters books by search, category, and availability', async () => {
    const software = await createTestCategory('Software Engineering')
    const fiction = await createTestCategory('Modern Fiction')

    await createTestBook({
      title: 'Refactoring in TypeScript',
      categoryId: software.id,
      availableCopies: 1,
      tags: ['Refactoring', 'TypeScript'],
    })
    await createTestBook({
      title: 'Quiet Novel',
      categoryId: fiction.id,
      availableCopies: 0,
      tags: ['Fiction'],
    })

    const response = await request(app)
      .get('/api/books')
      .query({
        q: 'refactoring',
        categoryId: software.id,
        availability: 'available',
      })
      .expect(200)

    expect(response.body).toHaveLength(1)
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        title: 'Refactoring in TypeScript',
        categoryId: software.id,
      }),
    )
  })

  it('allows admins to create books', async () => {
    const category = await createTestCategory('Data & AI')
    const { accessToken } = await createTestUser({ role: 'admin' })

    const response = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(buildBookBody(category.id))
      .expect(201)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: 'Practical API Design',
        categoryId: category.id,
        availableCopies: 2,
        totalCopies: 5,
        formats: ['Print', 'E-book'],
        tags: ['API', 'Backend'],
      }),
    )
  })

  it('rejects book writes from normal users', async () => {
    const category = await createTestCategory('Business & Leadership')
    const { accessToken } = await createTestUser()

    const response = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(buildBookBody(category.id))
      .expect(403)

    expect(response.body).toHaveProperty('error', 'Forbidden')
  })

  it('validates that available copies cannot exceed total copies', async () => {
    const category = await createTestCategory('Product Design')
    const { accessToken } = await createTestUser({ role: 'admin' })

    const response = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...buildBookBody(category.id),
        availableCopies: 5,
        totalCopies: 2,
      })
      .expect(400)

    expect(response.body).toHaveProperty('error', 'Validation failed')
  })

  it('returns 409 for duplicate ISBNs', async () => {
    const category = await createTestCategory('Software Engineering')
    const isbn = '9780000000001'
    await createTestBook({ categoryId: category.id, isbn })
    const { accessToken } = await createTestUser({ role: 'admin' })

    const response = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...buildBookBody(category.id),
        isbn,
      })
      .expect(409)

    expect(response.body).toHaveProperty('error', 'Conflict')
  })

  it('allows admins to update books', async () => {
    const book = await createTestBook({ title: 'Old Book Title' })
    const category = await createTestCategory('Updated Category')
    const { accessToken } = await createTestUser({ role: 'admin' })

    const response = await request(app)
      .put(`/api/books/${book.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...buildBookBody(category.id),
        title: 'Updated Book Title',
        isbn: '9780000000002',
      })
      .expect(200)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: book.id,
        title: 'Updated Book Title',
        categoryId: category.id,
      }),
    )
  })

  it('allows admins to delete books', async () => {
    const book = await createTestBook()
    const { accessToken } = await createTestUser({ role: 'admin' })

    await request(app)
      .delete(`/api/books/${book.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204)

    await request(app).get(`/api/books/${book.id}`).expect(404)
  })
})

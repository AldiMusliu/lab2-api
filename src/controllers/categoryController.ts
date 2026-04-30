import type { Request, Response } from 'express'
import { asc, eq } from 'drizzle-orm'
import { db } from '../db/connection.ts'
import { categories, type Category } from '../db/schema.ts'
import type { AuthenticatedRequest } from '../middleware/auth.ts'

const toCategory = (category: Category) => ({
  id: category.id,
  name: category.name,
})

const isUniqueViolation = (error: unknown) => {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  if ('code' in error && error.code === '23505') {
    return true
  }

  const cause = 'cause' in error ? error.cause : undefined

  return (
    typeof cause === 'object' &&
    cause !== null &&
    'code' in cause &&
    cause.code === '23505'
  )
}

const isForeignKeyViolation = (error: unknown) => {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  if ('code' in error && error.code === '23503') {
    return true
  }

  const cause = 'cause' in error ? error.cause : undefined

  return (
    typeof cause === 'object' &&
    cause !== null &&
    'code' in cause &&
    cause.code === '23503'
  )
}

export const listCategories = async (req: Request, res: Response) => {
  try {
    const allCategories = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.name))

    return res.json(allCategories.map(toCategory))
  } catch (error) {
    console.error('List categories error:', error)
    return res.status(500).json({ error: 'Failed to fetch categories' })
  }
}

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, req.params.id))

    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }

    return res.json(toCategory(category))
  } catch (error) {
    console.error('Get category error:', error)
    return res.status(500).json({ error: 'Failed to fetch category' })
  }
}

export const createCategory = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const [category] = await db
      .insert(categories)
      .values({
        name: req.body.name,
      })
      .returning()

    return res.status(201).json(toCategory(category))
  } catch (error) {
    if (isUniqueViolation(error)) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Category with this name already exists',
      })
    }

    console.error('Create category error:', error)
    return res.status(500).json({ error: 'Failed to create category' })
  }
}

export const updateCategory = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const [category] = await db
      .update(categories)
      .set({
        name: req.body.name,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, req.params.id))
      .returning()

    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }

    return res.json(toCategory(category))
  } catch (error) {
    if (isUniqueViolation(error)) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Category with this name already exists',
      })
    }

    console.error('Update category error:', error)
    return res.status(500).json({ error: 'Failed to update category' })
  }
}

export const deleteCategory = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const [category] = await db
      .delete(categories)
      .where(eq(categories.id, req.params.id))
      .returning()

    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }

    return res.status(204).send()
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Category still has books assigned to it',
      })
    }

    console.error('Delete category error:', error)
    return res.status(500).json({ error: 'Failed to delete category' })
  }
}

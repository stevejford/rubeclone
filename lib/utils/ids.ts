import { z } from 'zod'

// Strict numeric ID parser with descriptive errors
export function parseIdStrict(value: unknown, name: string): number {
  const num = typeof value === 'string' ? Number(value) : (value as number)
  if (!Number.isFinite(num) || !Number.isInteger(num) || num <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }
  return num
}

// zod helper that safely coerces to number and validates integer > 0
export const zId = () =>
  z.preprocess((v) => (typeof v === 'string' ? Number(v) : v), z.number().int().positive())

// Route param schema for ids coming from URL params
export const idParamSchema = z
  .string()
  .regex(/^\d+$/)
  .transform((s) => Number(s))

import { z } from 'zod'

// Enhanced schema for marketplace apps API
export const marketplaceQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(['name', 'tool_count', 'category', 'popularity', 'rating']).optional().default('name'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(24),
  pricing: z.enum(['free', 'paid', 'freemium']).optional(),
  auth: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  tags: z.string().optional(), // Comma-separated tags
})

// Legacy schema for backward compatibility
export const toolsQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(['name', 'stars', 'views']).optional().default('name'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
})

export const appSlugParamsSchema = z.object({
  slug: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid app slug format'),
})

export const toolDetailParamsSchema = z.object({
  slug: z.string().min(1),
})

// App installation schema
export const appInstallationSchema = z.object({
  app_slug: z.string().min(1),
  workspace_id: z.string().min(1),
  action: z.enum(['install', 'uninstall']).optional().default('install'),
})

// Connection parameters schema
export const connectionParamsSchema = z.object({
  toolkit: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid toolkit name'),
  workspace_id: z.string().min(1),
  redirect_url: z.string().url().optional(),
})

// Search suggestions schema
export const searchSuggestionsSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(20).optional().default(10),
})

// Partner API response validation
export const partnerApiAppSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  logo: z.string().url().optional(),
  category: z.union([z.string(), z.array(z.string())]),
  tool_count: z.number().optional(),
  mcp_url: z.string().url().optional(),
  requires_auth: z.boolean().optional().default(false),
  auth_schemes: z.array(z.string()).optional(),
  pricing: z.string().optional(),
  tags: z.array(z.string()).optional(),
  website_url: z.string().url().optional(),
  documentation_url: z.string().url().optional(),
  support_url: z.string().url().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  popularity_score: z.number().optional(),
  rating: z.number().min(0).max(5).optional(),
  review_count: z.number().optional(),
})

export const partnerApiResponseSchema = z.object({
  apps: z.array(partnerApiAppSchema),
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  success: z.boolean(),
  message: z.string().optional(),
})

// Type exports
export type MarketplaceQueryInput = z.infer<typeof marketplaceQuerySchema>
export type ToolsQueryInput = z.infer<typeof toolsQuerySchema>
export type AppSlugParamsInput = z.infer<typeof appSlugParamsSchema>
export type ToolDetailParamsInput = z.infer<typeof toolDetailParamsSchema>
export type AppInstallationInput = z.infer<typeof appInstallationSchema>
export type ConnectionParamsInput = z.infer<typeof connectionParamsSchema>
export type SearchSuggestionsInput = z.infer<typeof searchSuggestionsSchema>
export type PartnerApiAppInput = z.infer<typeof partnerApiAppSchema>
export type PartnerApiResponseInput = z.infer<typeof partnerApiResponseSchema>

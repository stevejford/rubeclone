import { z } from 'zod'

/**
 * Environment variable validation schema using Zod
 * This ensures type safety and validates required environment variables at runtime
 *
 * WARNING: This module is server-only and should not be imported into client components
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // NextAuth.js
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  
  // OpenAI (optional for base boot)
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required').optional(),

  // Composio (optional for base boot)
  COMPOSIO_API_KEY: z.string().optional(),
  COMPOSIO_CALLBACK_URL: z.string().url().optional(),
  COMPOSIO_WEBHOOK_SECRET: z.string().optional(),
  COMPOSIO_BASE_URL: z.string().url().optional(),
  
  // Application Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Optional OAuth Providers
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // Optional Stripe
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Optional Redis
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  
  // Optional Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  
  // Optional AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  // Partner API Configuration
  PARTNER_API_BASE_URL: z.string().url().optional(),
  PARTNER_API_CACHE_TTL: z.string().optional(),
  MARKETPLACE_PAGE_SIZE: z.string().optional(),
  MARKETPLACE_SEARCH_DEBOUNCE: z.string().optional(),
})

/**
 * Validate and parse environment variables
 */
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      const details = `❌ Environment validation failed:\n${missingVars}\n\n📝 Please check your .env.local file and ensure all required variables are set.\n📖 See .env.example for reference.`

      throw new Error(`Environment validation failed...\n${details}`)
    }
    throw error
  }
}

/**
 * Memoized environment validation for lazy loading
 */
let _env: z.infer<typeof envSchema> | null = null

function memoizedValidateEnv() {
  if (_env === null) {
    _env = validateEnv()
  }
  return _env
}

/**
 * Validated environment variables with proper TypeScript types
 * Only available on server-side
 */
export function getEnv() {
  // Only validate on server-side
  if (typeof window !== 'undefined') {
    throw new Error('Environment variables are only available on the server side')
  }
  return memoizedValidateEnv()
}

/**
 * Helper functions for environment-specific logic
 */
export const isDevelopment = () => getEnv().NODE_ENV === 'development'
export const isProduction = () => getEnv().NODE_ENV === 'production'
export const isTest = () => getEnv().NODE_ENV === 'test'

/**
 * Database configuration
 */
export const dbConfig = () => {
  const env = getEnv()
  return {
    url: env.DATABASE_URL,
    ssl: isProduction(),
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 20, // Maximum number of connections in the pool
  }
}

/**
 * Authentication configuration
 */
export const authConfig = () => {
  const env = getEnv()
  return {
    secret: env.NEXTAUTH_SECRET,
    url: env.NEXTAUTH_URL,
    providers: {
      github: {
        enabled: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
      google: {
        enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
  }
}

/**
 * AI service configuration
 */
export const aiConfig = () => {
  const env = getEnv()
  return {
    openai: {
      enabled: !!env.OPENAI_API_KEY,
      apiKey: env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
    },
    composio: {
      enabled: !!env.COMPOSIO_API_KEY,
      apiKey: env.COMPOSIO_API_KEY,
      baseURL: env.COMPOSIO_BASE_URL || 'https://backend.composio.dev/api/v1',
      callbackURL: env.COMPOSIO_CALLBACK_URL,
      webhookSecret: env.COMPOSIO_WEBHOOK_SECRET,
    },
    partnerApi: {
      baseUrl: env.PARTNER_API_BASE_URL || 'https://mcp.composio.dev/api',
      cacheTtl: env.PARTNER_API_CACHE_TTL ? parseInt(env.PARTNER_API_CACHE_TTL) : 3600,
      pageSize: env.MARKETPLACE_PAGE_SIZE ? parseInt(env.MARKETPLACE_PAGE_SIZE) : 24,
      searchDebounce: env.MARKETPLACE_SEARCH_DEBOUNCE ? parseInt(env.MARKETPLACE_SEARCH_DEBOUNCE) : 300,
    },
  }
}

/**
 * Payment configuration
 */
export const paymentConfig = () => {
  const env = getEnv()
  return {
    stripe: {
      enabled: !!(env.STRIPE_PUBLISHABLE_KEY && env.STRIPE_SECRET_KEY),
      publishableKey: env.STRIPE_PUBLISHABLE_KEY,
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    },
  }
}

/**
 * Email configuration
 */
export const emailConfig = () => {
  const env = getEnv()
  return {
    enabled: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD),
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ? parseInt(env.SMTP_PORT) : 587,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
  }
}

/**
 * File storage configuration
 */
export const storageConfig = () => {
  const env = getEnv()
  return {
    aws: {
      enabled: !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_S3_BUCKET),
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION || 'us-east-1',
      bucket: env.AWS_S3_BUCKET,
    },
  }
}

/**
 * Cache configuration
 */
export const cacheConfig = () => {
  const env = getEnv()
  return {
    redis: {
      enabled: !!(env.REDIS_HOST && env.REDIS_PASSWORD),
      url: env.REDIS_URL,
      host: env.REDIS_HOST,
      port: env.REDIS_PORT ? parseInt(env.REDIS_PORT) : 6379,
      username: env.REDIS_USERNAME || 'default',
      password: env.REDIS_PASSWORD,
    },
  }
}

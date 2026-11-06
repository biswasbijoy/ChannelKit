const DEV_FALLBACK_SECRET = 'dev-only-insecure-secret-do-not-use-in-prod'

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET

  if (secret) return secret

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET environment variable is required in production. Refusing to start with an insecure default.',
    )
  }

  console.warn(
    'JWT_SECRET is not set. Using an insecure development-only fallback. Set JWT_SECRET before deploying.',
  )
  return DEV_FALLBACK_SECRET
}

export const JWT_SECRET = resolveJwtSecret()

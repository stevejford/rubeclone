import crypto from 'node:crypto'

type Claims = {
  sub: string
  ws: string | number
  iat: number
  exp: number
  iss?: string
}

export function signToken(claims: Omit<Claims, 'iat' | 'exp' | 'iss'>, secret: string, opts?: { ttlMs?: number; issuer?: string }) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const exp = now + Math.floor((opts?.ttlMs ?? 15 * 60 * 1000) / 1000)
  const payload: Claims = { sub: claims.sub, ws: claims.ws, iat: now, exp, ...(opts?.issuer ? { iss: opts.issuer } : {}) }
  const base64url = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const data = `${base64url(header)}.${base64url(payload)}`
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verifyToken(token: string, secret: string): Claims | null {
  try {
    const [h, p, s] = token.split('.')
    const sig = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url')
    if (sig !== s) return null
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString()) as Claims
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return null
    return payload
  } catch {
    return null
  }
}

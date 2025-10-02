import crypto from 'node:crypto'

function toBase64Url(input: string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromBase64Url(input: string) {
  let b64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4
  if (pad) b64 += '='.repeat(4 - pad)
  return Buffer.from(b64, 'base64').toString('utf8')
}

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
  const base64url = (obj: any) => toBase64Url(JSON.stringify(obj))
  const data = `${base64url(header)}.${base64url(payload)}`
  const sig = toBase64Url(crypto.createHmac('sha256', secret).update(data).digest('base64').toString())
  return `${data}.${sig}`
}

export function verifyToken(token: string, secret: string): Claims | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [h, p, s] = parts as [string, string, string]
    const expected = toBase64Url(crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest('base64').toString())
    if (expected !== s) return null
    const payload = JSON.parse(fromBase64Url(p)) as Claims
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return null
    return payload
  } catch {
    return null
  }
}

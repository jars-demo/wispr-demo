// Anonymous ownership: a random id plus an HMAC-SHA256 signature, kept in an HttpOnly cookie.
// Pure Web Crypto, so it runs in the proxy, route handlers and tests alike.

export const OWNER_COOKIE = 'rc_owner'
export const OWNER_COOKIE_MAX_AGE = 60 * 60 * 24 * 400 // the longest lifetime browsers accept

const OWNER_ID = /^[A-Za-z0-9_-]{22}$/
const encoder = new TextEncoder()

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) return null
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function hmacKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  )
}

export function newOwnerId(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(16)))
}

export async function signOwner(ownerId: string, secret: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    'HMAC',
    await hmacKey(secret, 'sign'),
    encoder.encode(ownerId),
  )
  return `${ownerId}.${toBase64Url(new Uint8Array(signature))}`
}

/** Returns the owner id when the cookie value is well formed and correctly signed. */
export async function verifyOwner(
  value: string | undefined,
  secret: string,
): Promise<string | null> {
  if (!value) return null
  const [ownerId, signature, ...rest] = value.split('.')
  if (!ownerId || !signature || rest.length > 0 || !OWNER_ID.test(ownerId)) return null
  const bytes = fromBase64Url(signature)
  if (!bytes) return null
  // subtle.verify compares in constant time.
  const valid = await crypto.subtle.verify(
    'HMAC',
    await hmacKey(secret, 'verify'),
    bytes,
    encoder.encode(ownerId),
  )
  return valid ? ownerId : null
}

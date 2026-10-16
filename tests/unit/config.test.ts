import { describe, expect, it } from 'vitest'

import { ConfigError, parseConfig } from '@/server/config'

const SECRET = 'x'.repeat(32)
const base = { SESSION_SECRET: SECRET }

describe('parseConfig', () => {
  it('needs only a session secret in development and defaults to embedded PGlite', () => {
    const config = parseConfig(base)

    expect(config.logLevel).toBe('info')
    expect(config.environment).toBe('development')
    expect(config.database).toEqual({ kind: 'pglite', dir: '.data/pglite' })
    expect(config.model).toBeNull()
  })

  it('uses hosted Postgres when DATABASE_URL is set', () => {
    const config = parseConfig({ ...base, DATABASE_URL: 'postgresql://u:p@db.example.com/app' })
    expect(config.database).toEqual({
      kind: 'postgres',
      url: 'postgresql://u:p@db.example.com/app',
    })
  })

  it('treats an empty DATABASE_URL as unset', () => {
    expect(parseConfig({ ...base, DATABASE_URL: '' }).database.kind).toBe('pglite')
  })

  it('requires DATABASE_URL in production', () => {
    expect(() => parseConfig({ ...base, NODE_ENV: 'production' })).toThrow(/DATABASE_URL/)
  })

  it('enables the model only when an API key is present', () => {
    const config = parseConfig({ ...base, ANTHROPIC_API_KEY: 'test-key' })
    expect(config.model).toEqual({
      provider: 'anthropic',
      apiKey: 'test-key',
      model: 'claude-opus-5-5',
    })
  })

  it.each([
    [{ SESSION_SECRET: undefined }, /SESSION_SECRET/],
    [{ LOG_LEVEL: 'loud' }, /LOG_LEVEL/],
    [{ SESSION_SECRET: 'short' }, /SESSION_SECRET/],
    [{ DATABASE_URL: 'mysql://nope' }, /DATABASE_URL/],
  ])('rejects %o', (override, message) => {
    expect(() => parseConfig({ ...base, ...override })).toThrow(ConfigError)
    expect(() => parseConfig({ ...base, ...override })).toThrow(message)
  })

  it('never echoes a rejected value in the error message', () => {
    const secretLooking = 'mysql://admin:hunter2@prod'

    expect(() => parseConfig({ ...base, DATABASE_URL: secretLooking })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining('hunter2') }),
    )
  })

  it('returns a frozen object', () => {
    expect(Object.isFrozen(parseConfig(base))).toBe(true)
  })
})

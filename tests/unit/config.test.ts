import { describe, expect, it } from 'vitest'

import { ConfigError, parseConfig } from '@/server/config'

describe('parseConfig', () => {
  it('needs nothing in development and leaves AI off', () => {
    const config = parseConfig({})

    expect(config.logLevel).toBe('info')
    expect(config.environment).toBe('development')
    expect(config.groq).toBeNull()
    expect(config.breakdownsPerHour).toBe(30)
    expect(config.database).toEqual({ kind: 'pglite', dir: '.data/pglite' })
  })

  it('uses hosted Postgres when DATABASE_URL is set, and requires it in production', () => {
    expect(parseConfig({ DATABASE_URL: 'postgresql://u:p@db.example.com/app' }).database).toEqual({
      kind: 'postgres',
      url: 'postgresql://u:p@db.example.com/app',
    })
    expect(() => parseConfig({ NODE_ENV: 'production' })).toThrow(/DATABASE_URL/)
  })

  it('enables Groq only when a key is present, with the default model', () => {
    expect(parseConfig({ GROQ_API_KEY: 'test-key' }).groq).toEqual({
      apiKey: 'test-key',
      model: 'openai/gpt-oss-120b',
    })
    expect(parseConfig({ GROQ_API_KEY: '' }).groq).toBeNull()
  })

  it('reads the hourly limit as a number', () => {
    expect(parseConfig({ BREAKDOWNS_PER_HOUR: '5' }).breakdownsPerHour).toBe(5)
  })

  it('names the variable but never echoes its value', () => {
    let message = ''
    try {
      parseConfig({ LOG_LEVEL: 'super-secret-value' })
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError)
      message = (error as Error).message
    }
    expect(message).toContain('LOG_LEVEL')
    expect(message).not.toContain('super-secret-value')
  })
})

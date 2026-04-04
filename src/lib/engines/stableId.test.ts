import { describe, expect, it } from 'vitest'
import { hashString } from './stableId'

describe('hashString', () => {
  it('is deterministic for the same input', () => {
    expect(hashString('https://example.com/a')).toBe(hashString('https://example.com/a'))
  })

  it('differs for different URLs', () => {
    expect(hashString('https://example.com/a')).not.toBe(hashString('https://example.com/b'))
  })
})

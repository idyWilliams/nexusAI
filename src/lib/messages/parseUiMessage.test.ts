import { describe, expect, it } from 'vitest'
import { looksLikeNexusUiMessage, parseUiToBackgroundMessage } from './parseUiMessage'

describe('parseUiToBackgroundMessage', () => {
  it('parses HYDRATE_REQUEST', () => {
    expect(parseUiToBackgroundMessage({ type: 'HYDRATE_REQUEST' })).toEqual({ type: 'HYDRATE_REQUEST' })
  })

  it('rejects USER_DISMISS with wrong suggestionType', () => {
    expect(
      parseUiToBackgroundMessage({
        type: 'USER_DISMISS',
        payload: { suggestionId: 'x', suggestionType: 'OTHER' }
      })
    ).toBeNull()
  })

  it('rejects GAME_SESSION_END with non-finite endedAt', () => {
    expect(
      parseUiToBackgroundMessage({
        type: 'GAME_SESSION_END',
        payload: { endedAt: NaN }
      })
    ).toBeNull()
  })

  it('coerces SETTINGS_PATCH to safe partial', () => {
    const m = parseUiToBackgroundMessage({
      type: 'SETTINGS_PATCH',
      payload: { mode: 'focus', evil: 'nope' }
    })
    expect(m).toEqual({ type: 'SETTINGS_PATCH', payload: { mode: 'focus' } })
  })

  it('looksLikeNexusUiMessage is true for malformed known type', () => {
    const raw = { type: 'GAME_SESSION_END', payload: {} }
    expect(looksLikeNexusUiMessage(raw)).toBe(true)
    expect(parseUiToBackgroundMessage(raw)).toBeNull()
  })
})

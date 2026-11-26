import { afterEach, describe, expect, it } from 'vitest'

import { readCachedBackendLayer, writeCachedBackendLayer } from './backend-pack-cache'
import { type BackendLocaleRequest, syncBackendLocalePacks } from './backend-packs'
import { replaceAppLocaleSource, resetAppLocaleRegistry, resolveTranslations } from './registry'

afterEach(() => {
  resetAppLocaleRegistry()
  window.localStorage.clear()
})

const polishBackend: BackendLocaleRequest = async <T>(method: string) =>
  (method === 'i18n.languages'
    ? { languages: [{ id: 'pl', endonym: 'Polski', surfaces: ['desktop'] }] }
    : { lang: 'pl', surface: 'desktop', messages: { 'common.save': 'Zapisz' } }) as T

describe('backend language layer cache', () => {
  it('repaints the last synced layer for the same scope before the gateway answers', async () => {
    const layer = await syncBackendLocalePacks(polishBackend, 'pl')
    expect(layer).not.toBeNull()
    writeCachedBackendLayer('scope-a', layer ?? [])

    // A reload: the registry starts empty and only the cache is there.
    resetAppLocaleRegistry()
    expect(resolveTranslations('pl').common.save).not.toBe('Zapisz')

    const cached = readCachedBackendLayer('scope-a')
    expect(cached).not.toBeNull()
    replaceAppLocaleSource('backend', cached ?? [])
    expect(resolveTranslations('pl').common.save).toBe('Zapisz')
  })

  it('never hands one scope the layer cached for another', async () => {
    writeCachedBackendLayer('scope-a', (await syncBackendLocalePacks(polishBackend, 'pl')) ?? [])

    expect(readCachedBackendLayer('scope-b')).toBeNull()
  })

  it('reads a corrupt or foreign-shaped entry as no cache', () => {
    window.localStorage.setItem('hermes-desktop-backend-locale-layer-v1', '{not json')
    expect(readCachedBackendLayer('scope-a')).toBeNull()

    window.localStorage.setItem(
      'hermes-desktop-backend-locale-layer-v1',
      JSON.stringify({ scope: 'scope-a', registrations: [{ id: 7 }] })
    )
    expect(readCachedBackendLayer('scope-a')).toBeNull()
  })
})

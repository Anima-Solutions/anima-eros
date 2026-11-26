import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/i18n/context'
import { registerAppLocale } from '@/i18n/registry'
import { $notifications, dismissNotification } from '@/store/notifications'

import { RemoteDisplayBanner } from './remote-display-banner'

const toast = () => $notifications.get().find(item => item.id === 'remote-display')

describe('RemoteDisplayBanner', () => {
  afterEach(() => {
    cleanup()
    $notifications.set([])
    vi.unstubAllGlobals()
  })

  it('re-words the toast when a language pack lands after it, and never brings back a dismissed one', async () => {
    vi.stubGlobal('hermesDesktop', { getRemoteDisplayReason: async () => 'RDP' })
    const disposeEmpty = registerAppLocale('pl', { endonym: 'Polski', translations: {} }, 'backend')

    render(
      <I18nProvider configClient={null} initialLocale="pl">
        <RemoteDisplayBanner />
      </I18nProvider>
    )

    await waitFor(() => expect(toast()?.message).toContain('Software rendering active'))

    const dispose = registerAppLocale(
      'pl',
      { endonym: 'Polski', translations: { 'remoteDisplayBanner.message': 'Zdalny ekran ({0})' } },
      'backend'
    )

    try {
      await waitFor(() => expect(toast()?.message).toBe('Zdalny ekran (RDP)'))
      expect($notifications.get().filter(item => item.id === 'remote-display')).toHaveLength(1)

      act(() => dismissNotification('remote-display'))
      dispose()
      await waitFor(() => expect(toast()).toBeUndefined())
      registerAppLocale('pl', { translations: { 'remoteDisplayBanner.message': 'Inny ({0})' } }, 'backend')()
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(toast()).toBeUndefined()
    } finally {
      dispose()
      disposeEmpty()
    }
  })
})

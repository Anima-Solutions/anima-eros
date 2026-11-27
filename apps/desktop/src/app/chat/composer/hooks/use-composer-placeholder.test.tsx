import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'

import { I18nProvider, useI18n } from '@/i18n'
import { TRANSLATIONS } from '@/i18n/catalog'
import { beginBackendTransition, resetBackendTransitionsForTests } from '@/store/backend-transition'
import { $activeGatewayProfile } from '@/store/profile'

import { useComposerPlaceholder } from './use-composer-placeholder'

afterEach(() => {
  resetBackendTransitionsForTests()
  $activeGatewayProfile.set('default')
})

it("names the profile's sandbox restart instead of 'Reconnecting to Hermes…' while the socket is down", () => {
  $activeGatewayProfile.set('work')
  beginBackendTransition('work', 'restarting', { source: 'launcher' })

  const { result, rerender } = renderHook(props => useComposerPlaceholder(props), {
    initialProps: { disabled: true, reconnecting: true, sessionId: 's1' } as Parameters<
      typeof useComposerPlaceholder
    >[0]
  })

  expect(result.current).toBe('Restarting sandbox…')

  rerender({ disabled: true, profile: 'default', reconnecting: true, sessionId: 's1' })
  expect(result.current).toBe('Reconnecting to Hermes…')
})

it("names the profile's sandbox start while the connection is still open", () => {
  beginBackendTransition('work', 'starting', { source: 'switch' })

  const { result, rerender } = renderHook(props => useComposerPlaceholder(props), {
    initialProps: { disabled: false, profile: 'work', reconnecting: false, sessionId: 's1' } as Parameters<
      typeof useComposerPlaceholder
    >[0]
  })

  expect(result.current).toBe('Starting sandbox…')

  rerender({ disabled: false, profile: 'default', reconnecting: false, sessionId: 's1' })
  expect(result.current).not.toBe('Starting sandbox…')
})

it('follows a language change instead of keeping the starter it drew in the old language', async () => {
  let i18n: ReturnType<typeof useI18n> | undefined

  const { result } = renderHook(
    props => {
      i18n = useI18n()

      return useComposerPlaceholder(props)
    },
    {
      initialProps: { disabled: false, reconnecting: false, sessionId: null } as Parameters<
        typeof useComposerPlaceholder
      >[0],
      wrapper: ({ children }) => (
        <I18nProvider configClient={null} initialLocale="en">
          {children}
        </I18nProvider>
      )
    }
  )

  const drawn = TRANSLATIONS.en.composer.newSessionPlaceholders.indexOf(result.current)
  expect(drawn).toBeGreaterThanOrEqual(0)

  await act(() => i18n!.setLocale('de'))
  expect(TRANSLATIONS.de.composer.newSessionPlaceholders).toContain(result.current)
})

it('keeps the starter when the new session it was shown on gets persisted', () => {
  const { result, rerender } = renderHook(props => useComposerPlaceholder(props), {
    initialProps: { disabled: false, reconnecting: false, sessionId: null } as Parameters<
      typeof useComposerPlaceholder
    >[0]
  })

  const starter = result.current
  rerender({ disabled: false, reconnecting: false, sessionId: 's1' })
  expect(result.current).toBe(starter)
})

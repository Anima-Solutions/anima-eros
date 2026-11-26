import type * as HermesSdk from '@hermes/plugin-sdk'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { BotChatEmpty } from './chat-empty'
import { $lastRoster } from './data'
import { translateBotsIn } from './i18n-test-helper'
import type { RosterRow } from './types'

vi.mock('@hermes/plugin-sdk', async importOriginal => {
  const sdk = await importOriginal<typeof HermesSdk>()

  return { ...sdk, usePluginI18n: () => translateBotsIn('en') }
})

afterEach(() => {
  cleanup()
  $lastRoster.set([])
})

// An empty bot chat keeps the Ânima Eros brand and titles itself with the
// bot's name as text, not with the oversized Hermes display lettering.
it('shows the Eros lockup and the bot name as a heading on an empty bot chat', () => {
  $lastRoster.set([{ name: 'atlas', canonical_session: { id: 'stored-1' } } as RosterRow])

  const { container } = render(<BotChatEmpty sessionId="stored-1" />)

  expect(screen.getByRole('img', { name: 'Ânima Eros' })).toBeTruthy()
  expect(screen.getByRole('heading', { level: 2 }).textContent?.toLowerCase()).toContain('atlas')
  expect(container.querySelector('.wordmark')).toBeNull()
})

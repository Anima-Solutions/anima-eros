/**
 * Ânima palette, read from the design system's own token files
 * (`@anima-solutions/design-system/tokens/*.json`, W3C design-token format).
 *
 * The package is the single source of truth: bumping it repaints the app with
 * no hand-copied hex here. The DS ships dark as its primary theme and light as
 * a derivation; both map onto Hermes's `DesktopThemeColors` below.
 *
 * Hermes runs color math on theme values (accent retint, contrast checks), so
 * every color leaves this module as an opaque `#rrggbb`: translucent DS tokens
 * (border, input) are composited over the surface they sit on.
 */

import base from '@anima-solutions/design-system/tokens/base.json'
import dark from '@anima-solutions/design-system/tokens/dark.json'
import light from '@anima-solutions/design-system/tokens/light.json'

import { normalizeHex } from './color'
import type { DesktopThemeColors } from './types'

interface TokenColor {
  hex: string
  alpha?: number
}

interface Token {
  $value: TokenColor | string | unknown
}

type TokenGroup = Record<string, Token | string>

const REF = /^\{color\.([\w-]+)\}$/

function tokenResolver(...groups: TokenGroup[]) {
  const find = (key: string): Token => {
    for (const group of groups) {
      const token = group[key]

      if (token && typeof token === 'object') {
        return token
      }
    }

    throw new Error(`Ânima design system: missing color token "${key}"`)
  }

  const resolve = (key: string): TokenColor => {
    const value = find(key).$value

    if (typeof value === 'string') {
      const ref = REF.exec(value)

      if (!ref) {
        throw new Error(`Ânima design system: unsupported token value "${value}" for "${key}"`)
      }

      return resolve(ref[1])
    }

    return value as TokenColor
  }

  /** Opaque hex; a translucent token is flattened over `backdrop`. */
  return (key: string, backdrop?: string): string => {
    const { hex, alpha = 1 } = resolve(key)

    if (alpha >= 1) {
      return hex
    }

    const alphaHex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0')

    return normalizeHex(`${hex}${alphaHex}`, backdrop) ?? hex
  }
}

function paletteFor(mode: { color: TokenGroup }, accentStroke: string): DesktopThemeColors {
  const color = tokenResolver(mode.color, base.color as TokenGroup)
  const background = color('background')
  const sidebar = color('sidebar')

  return {
    background,
    foreground: color('foreground'),
    card: color('card'),
    cardForeground: color('card-foreground'),
    muted: color('muted'),
    mutedForeground: color('muted-foreground'),
    popover: color('popover'),
    popoverForeground: color('popover-foreground'),
    primary: color('primary'),
    primaryForeground: color('primary-foreground'),
    secondary: color('secondary'),
    secondaryForeground: color('secondary-foreground'),
    accent: color('accent'),
    accentForeground: color('accent-foreground'),
    border: color('border', background),
    input: color('input', background),
    ring: color('ring'),
    midground: color(accentStroke),
    composerRing: color('ring'),
    destructive: color('destructive'),
    destructiveForeground: color('destructive-foreground'),
    sidebarBackground: sidebar,
    sidebarBorder: color('sidebar-border', sidebar),
    // Hermes paints bubble text with the foreground, so the user bubble takes
    // the DS's neutral `secondary` bubble rather than the lime `default` one.
    userBubble: color('secondary'),
    userBubbleBorder: color('border', background)
  }
}

export const ANIMA_PALETTE: { colors: DesktopThemeColors; darkColors: DesktopThemeColors } = {
  // Lime on near-white fails contrast, so light strokes use the DS's darkened
  // ring; dark strokes carry the brand lime itself.
  colors: paletteFor(light as { color: TokenGroup }, 'ring'),
  darkColors: paletteFor(dark as { color: TokenGroup }, 'primary')
}

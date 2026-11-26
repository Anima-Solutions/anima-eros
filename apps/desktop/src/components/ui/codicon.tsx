import * as React from 'react'

import { CODICON_GLYPHS } from '@/components/ui/codicon-glyphs'
import { ICON_WEIGHT, type IconComponent } from '@/lib/icons'
import { cn } from '@/lib/utils'

export interface CodiconProps extends React.HTMLAttributes<HTMLElement> {
  name: string
  size?: number | string
  spinning?: boolean
}

/**
 * A named icon. Mapped names draw a Phosphor glyph sized `1em`; it keeps the
 * `codicon codicon-<name>` classes, so codicon.css (16px, spin) and every rule
 * aimed at `.codicon` still size and animate it. Unmapped names fall back to the
 * codicon font.
 */
export function Codicon({ className, name, size, spinning, style, ...props }: CodiconProps) {
  const classes = cn('codicon', `codicon-${name}`, spinning && 'codicon-modifier-spin', className)
  const sized = { ...(size != null && size !== '' ? { fontSize: size } : {}), ...style }
  const glyph = CODICON_GLYPHS[name]

  if (glyph) {
    return React.createElement(glyph.icon, {
      ...(props as React.SVGProps<SVGSVGElement>),
      'aria-hidden': true,
      className: classes,
      size: '1em',
      style: sized,
      weight: glyph.weight ?? ICON_WEIGHT
    })
  }

  return <i aria-hidden="true" className={classes} style={sized} {...props} />
}

/** Wrap a codicon as an icon component for nav rows that expect `IconComponent`. */
export function codiconIcon(name: string): IconComponent {
  function CodiconIcon({ className }: { className?: string }) {
    return <Codicon aria-hidden className={cn('leading-none', className)} name={name} size="1em" />
  }

  CodiconIcon.displayName = `Codicon(${name})`

  return CodiconIcon
}

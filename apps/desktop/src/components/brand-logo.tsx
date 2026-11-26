import erosOnDark from '@anima-solutions/design-system/brand/solucoes/eros-branco.svg?url'
import erosOnLight from '@anima-solutions/design-system/brand/solucoes/eros-preto.svg?url'

import { cn } from '@/lib/utils'
import { useTheme } from '@/themes'

// The Eros lockup (Ânima symbol + "Ânima" + "Eros") from the Ânima design
// system package, theme-aware: the white artwork in dark mode, the black one in
// light. Sized by className; the SVG keeps its own aspect ratio.
export function ErosLogo({ className, ...props }: React.ComponentProps<'img'>) {
  const { renderedMode } = useTheme()

  return (
    <img
      alt="Ânima Eros"
      className={cn('block h-auto select-none', className)}
      draggable={false}
      src={renderedMode === 'dark' ? erosOnDark : erosOnLight}
      {...props}
    />
  )
}

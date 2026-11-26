import symbolOnDark from '@anima-solutions/design-system/brand/anima/simbolo-branco.svg?url'
import symbolOnLight from '@anima-solutions/design-system/brand/anima/simbolo-preto.svg?url'

import { cn } from '@/lib/utils'
import { useTheme } from '@/themes'

// Brand badge: the Ânima symbol from the design system package (the same mark
// that opens the Eros lockup), theme-aware: white in dark mode, black in light.
// Size via className (default size-14).
export function BrandMark({ className, ...props }: React.ComponentProps<'span'>) {
  const { renderedMode } = useTheme()
  const dark = renderedMode === 'dark'

  return (
    <span className={cn('inline-flex size-14 shrink-0 items-center justify-center', className)} {...props}>
      <img alt="" className="size-full object-contain" src={dark ? symbolOnDark : symbolOnLight} />
    </span>
  )
}

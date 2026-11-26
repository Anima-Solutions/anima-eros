import { useEffect, useState } from 'react'

import { translateNow, useI18n } from '@/i18n'
import { $notifications, notify } from '@/store/notifications'

const NOTICE_ID = 'remote-display'

const show = (message: string) => notify({ id: NOTICE_ID, durationMs: 0, kind: 'info', message, placement: 'default' })

// GPU acceleration is disabled under remote display (RDP/VNC/etc) to avoid
// flicker. Surfaces once per launch as a persistent toast through the shared
// notification stack — was a hand-rolled second top-center card at these same
// exact fixed coordinates, which could overlap a real toast.
export function RemoteDisplayBanner() {
  const { t } = useI18n()
  const [reason, setReason] = useState<null | string>(null)

  useEffect(() => {
    void window.hermesDesktop?.getRemoteDisplayReason?.().then(found => {
      if (found) {
        show(translateNow('remoteDisplayBanner.message', found))
        setReason(found)
      }
    })
  }, [])

  const message = reason ? t.remoteDisplayBanner.message(reason) : null

  useEffect(() => {
    // A backend language pack can land after the toast is up: re-word it in place. A toast that is
    // gone (dismissed or cleared) stays gone.
    if (message && $notifications.get().some(item => item.id === NOTICE_ID)) {
      show(message)
    }
  }, [message])

  return null
}

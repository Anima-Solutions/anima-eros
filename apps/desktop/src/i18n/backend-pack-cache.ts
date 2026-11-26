/**
 * The last backend language layer this window received, kept for the next
 * load. The gateway answers `i18n.catalog` only once its socket is up (seconds
 * on a cold backend), so without it every reload paints in English first and
 * then switches. One entry, for the scope it came from: a different connection
 * or profile never sees another one's strings, and the live sync replaces the
 * cached layer as soon as it answers.
 */

import { isRecord } from '@hermes/shared/i18n'

import { readJson, writeJson } from '@/lib/storage'

import type { AppLocaleRegistration } from './registry'

export type BackendLocaleRegistration = { id: string } & AppLocaleRegistration

const STORAGE_KEY = 'hermes-desktop-backend-locale-layer-v1'

function isRegistration(value: unknown): value is BackendLocaleRegistration {
  return isRecord(value) && typeof value.id === 'string' && (value.translations === undefined || isRecord(value.translations))
}

/** The cached layer for `scope`, or null when there is none for it (or it does not parse). */
export function readCachedBackendLayer(scope: string): BackendLocaleRegistration[] | null {
  const parsed = readJson<unknown>(STORAGE_KEY)

  if (!isRecord(parsed) || parsed.scope !== scope || !Array.isArray(parsed.registrations)) {
    return null
  }

  return parsed.registrations.every(isRegistration) ? parsed.registrations : null
}

export function writeCachedBackendLayer(scope: string, registrations: readonly BackendLocaleRegistration[]): void {
  writeJson(STORAGE_KEY, { scope, registrations })
}

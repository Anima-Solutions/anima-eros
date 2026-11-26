import { describe, expect, it } from 'vitest'

import type { AutomationBlueprint } from '@/hermes'

import { initialBlueprintValues, localizeBlueprint } from './blueprints'

function blueprint(fields: AutomationBlueprint['fields']): AutomationBlueprint {
  return {
    key: 'test',
    title: 'Test',
    description: '',
    category: 'general',
    tags: [],
    command: '',
    appUrl: '',
    fields
  }
}

describe('initialBlueprintValues', () => {
  it('seeds each field from its default', () => {
    const values = initialBlueprintValues(
      blueprint([
        { name: 'time', type: 'time', label: 'Time', default: '08:00', options: [], optional: false, help: '' },
        {
          name: 'topic',
          type: 'enum',
          label: 'Topic',
          default: 'news',
          options: ['news', 'sports'],
          optional: false,
          help: ''
        }
      ])
    )

    expect(values).toEqual({ time: '08:00', topic: 'news' })
  })

  it('falls back to an empty string when a field has no default', () => {
    const values = initialBlueprintValues(
      blueprint([{ name: 'topic', type: 'text', label: 'Topic', default: null, options: [], optional: true, help: '' }])
    )

    expect(values).toEqual({ topic: '' })
  })

  it('returns an empty object for a blueprint with no fields', () => {
    expect(initialBlueprintValues(blueprint([]))).toEqual({})
  })

  it("seeds the deliver slot to 'local' when its default is the dashboard-only 'origin'", () => {
    const values = initialBlueprintValues(
      blueprint([
        {
          name: 'deliver',
          type: 'enum',
          label: 'Deliver',
          default: 'origin',
          options: ['origin', 'local', 'telegram'],
          optional: false,
          help: ''
        }
      ])
    )

    expect(values).toEqual({ deliver: 'local' })
  })

  it("seeds the deliver slot to 'local' when it has no default", () => {
    const values = initialBlueprintValues(
      blueprint([
        {
          name: 'deliver',
          type: 'enum',
          label: 'Deliver',
          default: null,
          options: ['origin', 'local'],
          optional: false,
          help: ''
        }
      ])
    )

    expect(values).toEqual({ deliver: 'local' })
  })

  it('leaves a non-origin deliver default untouched', () => {
    const values = initialBlueprintValues(
      blueprint([
        {
          name: 'deliver',
          type: 'enum',
          label: 'Deliver',
          default: 'telegram',
          options: ['origin', 'local', 'telegram'],
          optional: false,
          help: ''
        }
      ])
    )

    expect(values).toEqual({ deliver: 'telegram' })
  })
})

describe('localizeBlueprint', () => {
  const source = blueprint([
    { name: 'time', type: 'time', label: 'What time?', default: '08:00', options: [], optional: false, help: '24h' },
    { name: 'day', type: 'enum', label: 'Which day?', default: 'sunday', options: ['sunday'], optional: false, help: '' }
  ])

  it('replaces the shown text and keeps the key, slot names, defaults and option values', () => {
    const localized = localizeBlueprint(source, {
      test: { title: 'Teste', fields: { time: { label: 'Que horas?' }, missing: { label: 'x' } } }
    })

    expect(localized.key).toBe('test')
    expect(localized.title).toBe('Teste')
    expect(localized.description).toBe(source.description)
    expect(localized.fields.map(field => [field.name, field.label, field.help, field.default, field.options])).toEqual([
      ['time', 'Que horas?', '24h', '08:00', []],
      ['day', 'Which day?', '', 'sunday', ['sunday']]
    ])
  })

  it('returns the backend blueprint untouched when the catalog has no copy for it', () => {
    expect(localizeBlueprint(source, { other: { title: 'Outro' } })).toBe(source)
  })
})

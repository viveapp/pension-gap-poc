import { describe, expect, it } from 'vitest'

import {
  interpolate,
  translate,
  translateAround,
  translations,
  type MessageKey,
} from './translations'
import { LOCALES, LOCALE_TAGS, type Locale } from './types'
import { euros, formatEuros } from '@/lib/pension/money'

const placeholders = (template: string): string[] =>
  [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()

describe('translation parity', () => {
  it('has the same key set in both languages', () => {
    const nlKeys = Object.keys(translations.nl).sort()
    const enKeys = Object.keys(translations.en).sort()

    // Report the difference rather than just a boolean, so a failure is useful.
    expect(enKeys.filter((key) => !nlKeys.includes(key))).toEqual([])
    expect(nlKeys.filter((key) => !enKeys.includes(key))).toEqual([])
    expect(enKeys).toEqual(nlKeys)
  })

  it('has no empty or placeholder-only values', () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(translations[locale])) {
        expect(value.trim(), `${locale}.${key}`).not.toBe('')
        expect(value.trim().length, `${locale}.${key}`).toBeGreaterThan(1)
      }
    }
  })

  it('uses identical placeholders in both languages', () => {
    for (const key of Object.keys(translations.nl)) {
      expect(placeholders(translations.en[key]), `key ${key}`).toEqual(
        placeholders(translations.nl[key]),
      )
    }
  })

  it('never leaves a Dutch string sitting in the English dictionary', () => {
    // Cheap smell test: a few Dutch-only function words that should never
    // survive translation. Catches copy-paste misses.
    const dutchTells = [
      / je /i,
      / niet /i,
      / voor je pensioen/i,
      /medewerkers/i,
      /aannames/i,
    ]
    const offenders: string[] = []
    for (const [key, value] of Object.entries(translations.en)) {
      if (dutchTells.some((pattern) => pattern.test(value))) {
        offenders.push(`${key}: ${value}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('resolves every key in both languages without falling back', () => {
    // Checked by presence, not by comparing output to the key: some values
    // legitimately equal their key (the key `net` is the English word "net").
    for (const locale of LOCALES) {
      for (const key of Object.keys(translations.nl)) {
        expect(
          Object.hasOwn(translations[locale], key),
          `${locale} is missing ${key}`,
        ).toBe(true)
      }
    }
  })

  it('returns the key itself for a genuinely unknown key', () => {
    expect(translate('nl', 'does.not.exist' as MessageKey)).toBe(
      'does.not.exist',
    )
  })
})

describe('interpolation', () => {
  it('substitutes named placeholders', () => {
    expect(interpolate('Over {years} jaar', { years: 22 })).toBe('Over 22 jaar')
  })

  it('leaves unknown placeholders intact rather than printing undefined', () => {
    expect(interpolate('{a} en {b}', { a: 'x' })).toBe('x en {b}')
  })

  it('returns the template untouched when there are no vars', () => {
    expect(interpolate('geen placeholders')).toBe('geen placeholders')
  })

  it('substitutes every occurrence of a repeated placeholder', () => {
    expect(interpolate('{pct}% van {pct}%', { pct: 70 })).toBe('70% van 70%')
  })
})

describe('splitting a message around a node', () => {
  it('puts the placeholder position in the right place per language', () => {
    const nl = translateAround('nl', 'result.gap.heading', 'amount')
    const en = translateAround('en', 'result.gap.heading', 'amount')

    expect(nl.before).toBe('Je komt ')
    expect(nl.after).toBe(' per maand tekort.')

    // English puts the amount in a different position; both halves are non-empty.
    expect(en.before.length).toBeGreaterThan(0)
    expect(en.after.length).toBeGreaterThan(0)
    expect(en.before + en.after).not.toContain('{amount}')
  })

  it('still interpolates other vars in both halves', () => {
    const { before, after } = translateAround(
      'nl',
      'action.conditional',
      'income',
      { amount: '€ 300' },
    )
    expect(before).toContain('€ 300')
    expect(before + after).not.toContain('{amount}')
    expect(before + after).not.toContain('{income}')
  })

  it('degrades gracefully when the placeholder is absent', () => {
    const { before, after } = translateAround('nl', 'result.aow.label', 'nope')
    expect(before).toBe('AOW')
    expect(after).toBe('')
  })
})

describe('locale-aware money formatting', () => {
  it('formats Dutch with a dot thousands separator', () => {
    expect(formatEuros(euros(1552.15), LOCALE_TAGS.nl)).toMatch(/1\.552/)
  })

  it('formats English with a comma thousands separator', () => {
    expect(formatEuros(euros(1552.15), LOCALE_TAGS.en)).toMatch(/1,552/)
  })

  it('defaults to Dutch when no locale is given, so the pure module is stable', () => {
    expect(formatEuros(euros(1552.15))).toBe(
      formatEuros(euros(1552.15), LOCALE_TAGS.nl),
    )
  })

  it('rounds to whole euros in both locales', () => {
    for (const locale of LOCALES as readonly Locale[]) {
      const formatted = formatEuros(euros(1552.95), LOCALE_TAGS[locale])
      expect(formatted).toMatch(/1[.,]553/)
      expect(formatted).not.toMatch(/,\d{2}$|\.\d{2}$/)
    }
  })

  it('keeps the euro symbol in both locales', () => {
    for (const locale of LOCALES as readonly Locale[]) {
      expect(formatEuros(euros(100), LOCALE_TAGS[locale])).toContain('€')
    }
  })
})

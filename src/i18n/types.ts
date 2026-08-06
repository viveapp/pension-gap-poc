/**
 * Bilingual support: Dutch (default) and English.
 *
 * Dutch is the product language — the app targets Dutch consumers and Dutch
 * pension institutions, and the copy is written at B1 level. English exists for
 * international employees and for stakeholders who do not read Dutch. Dutch is
 * always the fallback: a missing English key shows Dutch rather than a key name.
 */

export type Locale = 'nl' | 'en'

export const LOCALES = ['nl', 'en'] as const satisfies readonly Locale[]

export const DEFAULT_LOCALE: Locale = 'nl'

/** Human label for the language switch. */
export const LOCALE_LABELS: Record<Locale, string> = {
  nl: 'NL',
  en: 'EN',
}

/** Full name, used for the switch's accessible label. */
export const LOCALE_NAMES: Record<Locale, string> = {
  nl: 'Nederlands',
  en: 'English',
}

/**
 * BCP 47 tag used for number and currency formatting.
 *
 * English uses en-IE rather than en-GB: it is an English locale whose currency
 * is the euro, so amounts read "€1,552" instead of a pound-shaped format.
 */
export const LOCALE_TAGS: Record<Locale, string> = {
  nl: 'nl-NL',
  en: 'en-IE',
}

/**
 * A string that exists in both languages, used where copy has to live next to
 * the data it describes (persona summaries, consent source descriptions).
 */
export type LocalizedText = Record<Locale, string>

/** Interpolation values for `t('key', vars)`. Placeholders are `{name}`. */
export type Vars = Record<string, string | number>

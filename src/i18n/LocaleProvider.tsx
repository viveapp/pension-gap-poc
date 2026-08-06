'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { formatEuros as formatEurosIn, type Cents } from '@/lib/pension/money'
import {
  translate,
  translateAround,
  type MessageKey,
} from './translations'
import {
  DEFAULT_LOCALE,
  LOCALE_TAGS,
  type Locale,
  type LocalizedText,
  type Vars,
} from './types'

/**
 * Locale state, in memory only — like the rest of the prototype, nothing is
 * persisted. Dutch is the default.
 */

type I18nState = {
  locale: Locale
  setLocale: (locale: Locale) => void
  /** Translate a key. */
  t: (key: MessageKey, vars?: Vars) => string
  /** Pick the current language out of a `LocalizedText` living beside data. */
  tx: (text: LocalizedText) => string
  /** Split a message around one placeholder so a node can sit inside it. */
  tAround: (
    key: MessageKey,
    placeholder: string,
    vars?: Vars,
  ) => { before: string; after: string }
  /** Currency formatter bound to the current locale. */
  formatEuros: (cents: Cents) => string
  /** Percentage formatter bound to the current locale. */
  formatPercent: (share: number, fractionDigits?: number) => string
}

const I18nContext = createContext<I18nState | null>(null)

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE)

  // Keep the document language in sync for screen readers and hyphenation.
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const t = useCallback(
    (key: MessageKey, vars?: Vars) => translate(locale, key, vars),
    [locale],
  )

  const tx = useCallback((text: LocalizedText) => text[locale], [locale])

  const tAround = useCallback(
    (key: MessageKey, placeholder: string, vars?: Vars) =>
      translateAround(locale, key, placeholder, vars),
    [locale],
  )

  const formatEuros = useCallback(
    (cents: Cents) => formatEurosIn(cents, LOCALE_TAGS[locale]),
    [locale],
  )

  const formatPercent = useCallback(
    (share: number, fractionDigits = 0) =>
      new Intl.NumberFormat(LOCALE_TAGS[locale], {
        style: 'percent',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(share),
    [locale],
  )

  const value = useMemo<I18nState>(
    () => ({
      locale,
      setLocale,
      t,
      tx,
      tAround,
      formatEuros,
      formatPercent,
    }),
    [locale, t, tx, tAround, formatEuros, formatPercent],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = (): I18nState => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used inside a LocaleProvider')
  }
  return context
}

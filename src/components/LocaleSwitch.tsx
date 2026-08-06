'use client'

import { useI18n } from '@/i18n/LocaleProvider'
import { LOCALES, LOCALE_LABELS, LOCALE_NAMES } from '@/i18n/types'

/**
 * NL / EN toggle. A segmented control, per the DESIGN.md controls table: active
 * segment gets the brand fill, inactive stays outlined.
 *
 * Dutch is the product language and the default; English is there for
 * international employees and for stakeholders who do not read Dutch.
 */
export const LocaleSwitch = ({ className = '' }: { className?: string }) => {
  const { locale, setLocale, t } = useI18n()

  return (
    <div
      role="group"
      aria-label={t('locale.switch')}
      className={`inline-flex overflow-hidden rounded-pill border-[1.5px] border-ui-primary ${className}`}
    >
      {LOCALES.map((option) => {
        const active = option === locale
        return (
          <button
            key={option}
            type="button"
            lang={option}
            aria-pressed={active}
            aria-label={LOCALE_NAMES[option]}
            onClick={() => setLocale(option)}
            className={`px-2.5 py-1 text-label uppercase transition-colors ${
              active
                ? 'bg-highlight-brand text-white'
                : 'bg-transparent text-text-secondary'
            }`}
          >
            {LOCALE_LABELS[option]}
          </button>
        )
      })}
    </div>
  )
}

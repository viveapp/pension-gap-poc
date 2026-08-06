'use client'

import Link from 'next/link'

import { LocaleSwitch } from '@/components/LocaleSwitch'
import { PersonaSwitcher } from '@/components/PersonaSwitcher'
import {
  ButtonLink,
  Gutter,
  MicroLabel,
  Screen,
  StickyFooter,
} from '@/components/ui'
import { useI18n } from '@/i18n/LocaleProvider'
import { CONSENT_SOURCES, NOT_SHARED_KEYS } from '@/lib/pension/sources'

/** Screen 1 — intro. Warm canvas, one question, one action. */
export default function IntroPage() {
  const { t } = useI18n()

  return (
    <Screen tone="warm">
      <Gutter wide className="pt-10">
        <div className="flex items-start justify-between gap-4">
          <MicroLabel className="text-highlight-turquoise">
            {t('app.name')}
          </MicroLabel>
          <LocaleSwitch />
        </div>

        <h1 className="text-headline-lg mt-6 text-text-primary">
          {t('intro.title')}
        </h1>

        <p className="text-body-lg mt-4 text-text-secondary">
          {t('intro.lead')}
        </p>

        <div className="mt-8 rounded-dashboard bg-canvas-primary p-6 card-elevation-sm">
          <h2 className="text-headline-sm text-text-primary">
            {t('intro.sources.title')}
          </h2>
          <p className="mt-1 text-sub text-text-secondary">
            {t('intro.sources.lead')}
          </p>

          <ul className="mt-4 space-y-3">
            {CONSENT_SOURCES.map((source) => (
              <li key={source.id} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 size-2 shrink-0 rounded-full bg-highlight-brand"
                />
                <div>
                  <p className="text-body text-text-primary">
                    {t(source.partyKey)}
                  </p>
                  <p className="text-sub text-text-tertiary">
                    {t(source.reasonKey)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-ui-secondary pt-4">
            <MicroLabel>{t('intro.notShared.title')}</MicroLabel>
            <p className="mt-2 text-sub text-text-secondary">
              {NOT_SHARED_KEYS.map((key) => t(key)).join(' · ')}
            </p>
          </div>
        </div>

        <p className="mt-6 text-sub text-text-tertiary">
          {t('intro.footnote')}
        </p>
      </Gutter>

      <StickyFooter>
        <ButtonLink href="/consent">{t('intro.cta')}</ButtonLink>
        <Link
          href="/werkgever"
          className="mt-3 block text-center text-sub text-text-tertiary underline underline-offset-2"
        >
          {t('intro.employerLink')}
        </Link>
      </StickyFooter>

      <PersonaSwitcher />
    </Screen>
  )
}

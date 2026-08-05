'use client'

import Link from 'next/link'

import { PersonaSwitcher } from '@/components/PersonaSwitcher'
import {
  ButtonLink,
  Gutter,
  MicroLabel,
  Screen,
  StickyFooter,
} from '@/components/ui'
import { CONSENT_SOURCES, NOT_SHARED } from '@/lib/pension/sources'

/** Screen 1 — intro. Warm canvas, one question, one action. */
export default function IntroPage() {
  return (
    <Screen tone="warm">
      <Gutter wide className="pt-10">
        <MicroLabel className="text-highlight-turquoise">Vive</MicroLabel>

        <h1 className="text-headline-lg mt-6 text-text-primary">
          Ben je op koers voor later?
        </h1>

        <p className="text-body-lg mt-4 text-text-secondary">
          In één keer zie je hoeveel geld je na je pensioen per maand krijgt. En
          of dat genoeg is.
        </p>

        <div className="mt-8 rounded-dashboard bg-canvas-primary p-6 card-elevation-sm">
          <h2 className="text-headline-sm text-text-primary">
            Wat we voor je ophalen
          </h2>
          <p className="mt-1 text-sub text-text-secondary">
            Je geeft eenmalig toestemming. Daarna rekenen we het uit.
          </p>

          <ul className="mt-4 space-y-3">
            {CONSENT_SOURCES.map((source) => (
              <li key={source.id} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 size-2 shrink-0 rounded-full bg-highlight-brand"
                />
                <div>
                  <p className="text-body text-text-primary">{source.party}</p>
                  <p className="text-sub text-text-tertiary">{source.reason}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-ui-secondary pt-4">
            <MicroLabel>Wat we niet ophalen</MicroLabel>
            <p className="mt-2 text-sub text-text-secondary">
              {NOT_SHARED.join(' · ')}
            </p>
          </div>
        </div>

        <p className="mt-6 text-sub text-text-tertiary">
          Je krijgt een indicatie op basis van aannames. Dat is informatie, geen
          advies. Je beslist zelf wat je ermee doet.
        </p>
      </Gutter>

      <StickyFooter>
        <ButtonLink href="/consent">Check mijn pensioen</ButtonLink>
        <Link
          href="/werkgever"
          className="mt-3 block text-center text-sub text-text-tertiary underline underline-offset-2"
        >
          Ik ben werkgever
        </Link>
      </StickyFooter>

      <PersonaSwitcher />
    </Screen>
  )
}

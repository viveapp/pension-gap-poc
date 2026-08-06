'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { PersonaSwitcher } from '@/components/PersonaSwitcher'
import {
  AppBar,
  Button,
  Gutter,
  MicroLabel,
  Screen,
  StickyFooter,
} from '@/components/ui'
import { useI18n } from '@/i18n/LocaleProvider'
import { MOCK_HANDOFF_STAGES } from '@/lib/pension/ockto'
import { CONSENT_SOURCES, NOT_SHARED_KEYS } from '@/lib/pension/sources'
import { usePension } from '@/state/PensionProvider'

/**
 * Screen 2 — the mocked Ockto / DigiD handoff.
 *
 * Three steps: an honest and specific consent screen, a stand-in for the DigiD
 * login, then the data being fetched per source before returning to the app.
 *
 * The login step is deliberately marked as a demo. It carries no DigiD logo and
 * no real branding: a convincing copy of a government login screen is not
 * something to build, even in a prototype.
 */

type Step = 'consent' | 'login' | 'fetching'

export default function ConsentPage() {
  const [step, setStep] = useState<Step>('consent')

  return (
    <Screen tone="warm">
      {step === 'consent' ? <ConsentStep onNext={() => setStep('login')} /> : null}
      {step === 'login' ? <LoginStep onNext={() => setStep('fetching')} /> : null}
      {step === 'fetching' ? <FetchingStep /> : null}
      <PersonaSwitcher />
    </Screen>
  )
}

/* -------------------------------------------------------------------------- */

const ConsentStep = ({ onNext }: { onNext: () => void }) => {
  const { t } = useI18n()
  const [agreed, setAgreed] = useState(false)

  return (
    <>
      <AppBar backHref="/" title={t('consent.title')} />

      <Gutter wide>
        <h2 className="text-headline-md text-text-primary">
          {t('consent.heading')}
        </h2>
        <p className="mt-2 text-body text-text-secondary">
          {t('consent.lead')}
        </p>

        <ul className="mt-6 space-y-3">
          {CONSENT_SOURCES.map((source) => (
            <li
              key={source.id}
              className="rounded-card bg-canvas-primary p-4 card-elevation-sm"
            >
              <p className="text-headline-sm text-text-primary">
                {t(source.partyKey)}
              </p>
              <ul className="mt-3 space-y-1.5">
                {source.shareKeys.map((shareKey) => (
                  <li key={shareKey} className="flex gap-2">
                    <Check />
                    <span className="text-sub text-text-secondary">
                      {t(shareKey)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-ui-secondary pt-3 text-sub text-text-tertiary">
                {t(source.reasonKey)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-card bg-ui-warm p-4">
          <MicroLabel>{t('consent.notShared.title')}</MicroLabel>
          <ul className="mt-2 space-y-1">
            {NOT_SHARED_KEYS.map((key) => (
              <li key={key} className="text-sub text-text-secondary">
                — {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-sub text-text-tertiary">
          {t('consent.retention')}
        </p>

        <label className="mt-6 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-1 size-5 shrink-0 accent-highlight-brand"
          />
          <span className="text-body text-text-primary">
            {t('consent.checkbox')}
          </span>
        </label>
      </Gutter>

      <StickyFooter>
        <Button disabled={!agreed} onClick={onNext}>
          {t('consent.cta')}
        </Button>
      </StickyFooter>
    </>
  )
}

const Check = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className="mt-1 shrink-0 text-highlight-brand"
  >
    <path
      d="m3 8.5 3 3 7-7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/* -------------------------------------------------------------------------- */

const LoginStep = ({ onNext }: { onNext: () => void }) => {
  const { t } = useI18n()

  return (
    <>
      <AppBar title={t('login.title')} />

      <Gutter wide>
        <div className="rounded-card border-[1.5px] border-dashed border-highlight-orange bg-highlight-orange/10 p-3">
          <p className="text-sub text-text-primary">
            <strong>{t('login.demoNoticeStrong')}</strong>{' '}
            {t('login.demoNotice')}
          </p>
        </div>

        <div className="mt-6 rounded-dashboard bg-canvas-primary p-6 card-elevation-md">
          <MicroLabel>{t('login.step')}</MicroLabel>
          <h2 className="text-headline-md mt-2 text-text-primary">
            {t('login.heading')}
          </h2>
          <p className="mt-2 text-sub text-text-secondary">{t('login.lead')}</p>

          <div className="mt-6 space-y-3">
            <FakeField label={t('login.username')} />
            <FakeField label={t('login.password')} />
          </div>

          <p className="mt-4 text-sub text-text-tertiary">
            {t('login.afterwards')}
          </p>
        </div>
      </Gutter>

      <StickyFooter>
        <Button onClick={onNext}>{t('login.cta')}</Button>
        <p className="mt-3 text-center text-sub text-text-tertiary">
          {t('login.footnote')}
        </p>
      </StickyFooter>
    </>
  )
}

const FakeField = ({ label }: { label: string }) => (
  <div>
    <label className="text-sub text-text-secondary">{label}</label>
    <div
      aria-hidden="true"
      className="mt-1 h-[54px] rounded-card border-[1.5px] border-ui-primary bg-ui-tertiary"
    />
  </div>
)

/* -------------------------------------------------------------------------- */

const FetchingStep = () => {
  const router = useRouter()
  const { personaId, loadPersona } = usePension()
  const { t } = useI18n()
  const [doneCount, setDoneCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []

    const run = async () => {
      let elapsed = 0
      MOCK_HANDOFF_STAGES.forEach((stage, index) => {
        elapsed += stage.durationMs
        timers.push(
          setTimeout(() => {
            if (!cancelled) setDoneCount(index + 1)
          }, elapsed),
        )
      })

      await new Promise((resolve) => {
        timers.push(setTimeout(resolve, elapsed + 400))
      })
      if (cancelled) return

      await loadPersona(personaId)
      if (cancelled) return
      router.push('/resultaat')
    }

    void run()

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [personaId, loadPersona, router])

  return (
    <>
      <AppBar title={t('fetching.title')} />

      <Gutter wide>
        <h2 className="text-headline-md text-text-primary">
          {t('fetching.heading')}
        </h2>
        <p className="mt-2 text-body text-text-secondary">
          {t('fetching.lead')}
        </p>

        <ul className="mt-8 space-y-4">
          {MOCK_HANDOFF_STAGES.map((stage, index) => {
            const done = index < doneCount
            const active = index === doneCount
            return (
              <li key={stage.id} className="flex items-center gap-3">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                    done
                      ? 'bg-highlight-brand text-white'
                      : active
                        ? 'border-2 border-highlight-brand'
                        : 'border-2 border-ui-primary'
                  }`}
                >
                  {done ? <SmallCheck /> : null}
                  {active ? (
                    <span className="size-2 animate-pulse rounded-full bg-highlight-brand" />
                  ) : null}
                </span>
                <div>
                  <p
                    className={`text-body ${
                      done || active ? 'text-text-primary' : 'text-text-tertiary'
                    }`}
                  >
                    {t(stage.labelKey)}
                  </p>
                  <p className="text-sub text-text-tertiary">
                    {t(stage.partyKey)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </Gutter>
    </>
  )
}

const SmallCheck = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="m3 8.5 3 3 7-7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

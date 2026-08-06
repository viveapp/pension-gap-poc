'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { BandBar } from '@/components/charts'
import { PersonaSwitcher } from '@/components/PersonaSwitcher'
import {
  AnimatedEuros,
  AppBar,
  Badge,
  Button,
  ButtonLink,
  Card,
  Gutter,
  IndicationNote,
  InfoBanner,
  MicroLabel,
  Row,
  Screen,
  Slider,
  StickyFooter,
} from '@/components/ui'
import { useI18n } from '@/i18n/LocaleProvider'
import { euros } from '@/lib/pension/money'
import { SCENARIOS, SCENARIO_LABEL_KEYS } from '@/lib/pension/types'
import { usePension } from '@/state/PensionProvider'

/**
 * Screen 4 — what a contribution would do.
 *
 * Every sentence here is conditional: "als je X zou inleggen, dan …" / "if you
 * were to contribute X, then …". Nothing recommends an amount, nothing tells the
 * user what they must do, and the user initiates the contribution. That is the
 * Wft line between informeren and adviseren.
 */
export default function ActionPage() {
  const router = useRouter()
  const { analysis, picture, hasConsented, extraMonthly, setExtraMonthly } =
    usePension()
  const { t, tAround, formatEuros } = useI18n()
  const [stubOpen, setStubOpen] = useState(false)

  useEffect(() => {
    if (!hasConsented || !analysis) router.replace('/')
  }, [hasConsented, analysis, router])

  if (!analysis || !picture) return null

  const { scenarios, target, required } = analysis
  const expected = scenarios.expected

  // Reach far enough that the slider can cover the pessimistic scenario too.
  const sliderMaxEuros = Math.max(
    200,
    Math.ceil((required.pessimistic.monthly / 100) * 1.3 / 25) * 25,
  )

  const deductibleCeilingMonthly = Math.floor(picture.jaarruimteAnnual / 12)
  const overJaarruimte = extraMonthly > deductibleCeilingMonthly
  const deductiblePart = Math.min(extraMonthly, deductibleCeilingMonthly)
  const nonDeductiblePart = extraMonthly - deductiblePart

  const remainingGap = Math.max(0, expected.gapNet)

  // Conditional sentence wrapping a live-updating number.
  const conditional = tAround('action.conditional', 'income', {
    amount: formatEuros(extraMonthly),
  })

  return (
    <Screen>
      <AppBar backHref="/resultaat" title={t('action.title')} />

      <Gutter>
        {/* ------------------------------------------------- cost to close */}
        <Card dashboard elevated>
          <MicroLabel>{t('action.costLabel')}</MicroLabel>
          <p className="text-headline-lg mt-2 tabular-nums text-text-primary">
            {formatEuros(required.expected.monthly)}
          </p>
          <p className="text-sub text-text-secondary">
            {t('action.costDetail', {
              rate: (scenarios.expected.annualReturn * 100).toFixed(0),
            })}
          </p>

          <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-ui-secondary pt-4">
            {SCENARIOS.map((scenario) => (
              <div key={scenario}>
                <dt className="text-label uppercase text-text-tertiary">
                  {t(SCENARIO_LABEL_KEYS[scenario])}{' '}
                  {(scenarios[scenario].annualReturn * 100).toFixed(0)}%
                </dt>
                <dd className="text-headline-sm mt-1 tabular-nums text-text-primary">
                  {formatEuros(required[scenario].monthly)}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-sub text-text-tertiary">
            {t('action.scenarioNote')}
          </p>
        </Card>

        {/* ------------------------------------------------------- slider */}
        <Card className="mt-4">
          <Slider
            label={t('action.slider.label')}
            value={Math.round(extraMonthly / 100)}
            min={0}
            max={sliderMaxEuros}
            step={5}
            onChange={(value) => setExtraMonthly(euros(value))}
            valueLabel={formatEuros(extraMonthly)}
            minLabel={formatEuros(0)}
            maxLabel={formatEuros(euros(sliderMaxEuros))}
          />

          <div className="mt-5 rounded-card bg-ui-tertiary p-4">
            {extraMonthly === 0 ? (
              <p className="text-body text-text-secondary">
                {t('action.slider.idle')}
              </p>
            ) : (
              <p className="text-body text-text-primary">
                {conditional.before}
                <span className="text-headline-sm tabular-nums text-text-primary">
                  <AnimatedEuros cents={expected.projectedNet} durationMs={350} />
                </span>
                {conditional.after}
              </p>
            )}

            <div className="mt-4">
              <BandBar
                low={scenarios.pessimistic.projectedNet}
                high={scenarios.optimistic.projectedNet}
                expected={expected.projectedNet}
                target={target.targetNet}
              />
            </div>

            <div className="mt-4 border-t border-ui-secondary pt-3">
              {remainingGap === 0 ? (
                <div className="flex items-center gap-2">
                  <Badge tone="green">{t('action.gapClosed.badge')}</Badge>
                  <p className="text-sub text-text-secondary">
                    {t('action.gapClosed.body')}
                  </p>
                </div>
              ) : (
                <Row
                  label={t('action.gapRemains')}
                  amount={
                    <span className="tabular-nums">
                      <AnimatedEuros cents={remainingGap} durationMs={350} />{' '}
                      {t('perMonthShort')}
                    </span>
                  }
                />
              )}
            </div>
          </div>
        </Card>

        {/* -------------------------------------------- jaarruimte notice */}
        {required.expected.exceedsJaarruimte || overJaarruimte ? (
          <div className="mt-4">
            <InfoBanner tone="warning" title={t('action.jaarruimte.title')}>
              <p>
                {t('action.jaarruimte.body', {
                  annual: formatEuros(picture.jaarruimteAnnual),
                  monthly: formatEuros(deductibleCeilingMonthly),
                })}
              </p>

              {extraMonthly > 0 ? (
                <figure className="m-0 mt-4">
                  <div className="flex h-7 w-full gap-[2px]">
                    <div
                      className="rounded-l-[4px] bg-highlight-brand"
                      style={{
                        width: `${(deductiblePart / extraMonthly) * 100}%`,
                      }}
                    />
                    {nonDeductiblePart > 0 ? (
                      <div
                        className="rounded-r-[4px] border-2 border-dashed border-highlight-orange bg-highlight-orange/15"
                        style={{
                          width: `${(nonDeductiblePart / extraMonthly) * 100}%`,
                        }}
                      />
                    ) : null}
                  </div>
                  <figcaption className="mt-2 space-y-1">
                    <Row
                      label={t('action.jaarruimte.deductible')}
                      amount={`${formatEuros(deductiblePart)} ${t('perMonthShort')}`}
                      tone="muted"
                    />
                    {nonDeductiblePart > 0 ? (
                      <Row
                        label={t('action.jaarruimte.nonDeductible')}
                        amount={`${formatEuros(nonDeductiblePart)} ${t('perMonthShort')}`}
                        tone="muted"
                      />
                    ) : null}
                  </figcaption>
                </figure>
              ) : null}

              <p className="mt-3 text-text-tertiary">
                {t('action.jaarruimte.footnote')}
              </p>
            </InfoBanner>
          </div>
        ) : null}

        <IndicationNote className="mt-4" />

        <p className="mt-4 text-sub text-text-tertiary">
          {t('disclaimer.notAdvice')}
        </p>
      </Gutter>

      <div className="h-24" />

      <StickyFooter>
        {stubOpen ? (
          <div className="mb-3 rounded-dialog bg-ui-tertiary p-4">
            <p className="text-headline-sm text-text-primary">
              {t('prototype.title')}
            </p>
            <p className="mt-1 text-sub text-text-secondary">
              {t('action.stub.body', { amount: formatEuros(extraMonthly) })}
            </p>
            <Button
              variant="secondary"
              size="md"
              className="mt-3"
              onClick={() => setStubOpen(false)}
            >
              {t('nav.close')}
            </Button>
          </div>
        ) : null}

        <Button disabled={extraMonthly === 0} onClick={() => setStubOpen(true)}>
          {extraMonthly === 0
            ? t('action.cta.pickAmount')
            : t('action.cta.commit', { amount: formatEuros(extraMonthly) })}
        </Button>
        <ButtonLink href="/aannames" variant="link" className="mx-auto mt-3">
          {t('action.cta.assumptions')}
        </ButtonLink>
      </StickyFooter>

      <PersonaSwitcher />
    </Screen>
  )
}

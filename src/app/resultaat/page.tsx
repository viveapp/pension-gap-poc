'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { BandBar, DataTable } from '@/components/charts'
import { PersonaSwitcher } from '@/components/PersonaSwitcher'
import {
  AnimatedEuros,
  AppBar,
  Badge,
  ButtonLink,
  Card,
  Disclosure,
  Gutter,
  IndicationNote,
  InfoBanner,
  MicroLabel,
  Row,
  Screen,
  StickyFooter,
} from '@/components/ui'
import { useI18n } from '@/i18n/LocaleProvider'
import { SCENARIOS, SCENARIO_LABEL_KEYS } from '@/lib/pension/types'
import type { BreakdownLine } from '@/lib/pension/types'
import { usePension } from '@/state/PensionProvider'

/**
 * Screen 3 — the gap analysis.
 *
 * One headline number first (projected net monthly income), then the gap, then
 * the breakdown behind progressive disclosure. Nothing here tells the user what
 * to do.
 */
export default function ResultPage() {
  const router = useRouter()
  const { analysis, picture, hasConsented } = usePension()
  const { t, tAround, formatEuros } = useI18n()

  useEffect(() => {
    if (!hasConsented || !analysis) router.replace('/')
  }, [hasConsented, analysis, router])

  if (!analysis || !picture) return null

  const { scenarios, target, required } = analysis
  const expected = scenarios.expected
  const onTrack = expected.onTrack

  // The gap heading wraps an animated number, so the sentence is split around
  // its placeholder rather than assuming Dutch word order.
  const gapHeading = tAround('result.gap.heading', 'amount')

  const period = (line: BreakdownLine) =>
    line.toYear === null
      ? t('result.employers.periodOpen', { from: line.fromYear })
      : t('result.employers.periodClosed', {
          from: line.fromYear,
          to: line.toYear,
        })

  const employerCount = expected.breakdown.secondPillar.length

  return (
    <Screen>
      <AppBar
        backHref="/"
        action={
          <Link
            href="/aannames"
            className="text-sub text-highlight-turquoise underline underline-offset-2"
          >
            {t('nav.assumptions')}
          </Link>
        }
      />

      <Gutter>
        {/* ------------------------------------------------ headline reveal */}
        <Card dashboard elevated>
          <MicroLabel>{t('result.headlineLabel')}</MicroLabel>
          <p className="text-headline-lg mt-2 tabular-nums text-text-primary">
            <AnimatedEuros cents={expected.projectedNet} revealFromZero />
          </p>
          <p className="text-sub text-text-tertiary">
            {t('result.fromAge', {
              age: analysis.assumptions.retirementAge,
              year: target.retirementYear,
            })}
          </p>

          <div className="mt-6">
            <BandBar
              low={scenarios.pessimistic.projectedNet}
              high={scenarios.optimistic.projectedNet}
              expected={expected.projectedNet}
              target={target.targetNet}
            />
          </div>
        </Card>

        {/* ----------------------------------------------------- the gap */}
        <Card className="mt-4">
          {onTrack ? (
            <>
              <Badge tone="green">{t('result.onTrack.badge')}</Badge>
              <h2 className="text-headline-md mt-3 text-text-primary">
                {t('result.onTrack.heading')}
              </h2>
              <p className="mt-2 text-body text-text-secondary">
                {t('result.onTrack.body')}
              </p>
            </>
          ) : (
            <>
              <Badge tone="orange">{t('result.gap.badge')}</Badge>
              <h2 className="text-headline-md mt-3 text-text-primary">
                {gapHeading.before}
                <span className="text-highlight-red tabular-nums">
                  <AnimatedEuros cents={expected.gapNet} durationMs={700} />
                </span>
                {gapHeading.after}
              </h2>
              <p className="mt-2 text-body text-text-secondary">
                {t('result.gap.body', {
                  target: formatEuros(target.targetNet),
                  projected: formatEuros(expected.projectedNet),
                })}
              </p>

              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-ui-secondary pt-4">
                {SCENARIOS.map((scenario) => (
                  <div key={scenario}>
                    <dt className="text-label uppercase text-text-tertiary">
                      {t(SCENARIO_LABEL_KEYS[scenario])}{' '}
                      {(scenarios[scenario].annualReturn * 100).toFixed(0)}%
                    </dt>
                    <dd className="text-headline-sm mt-1 tabular-nums text-text-primary">
                      {formatEuros(Math.max(0, scenarios[scenario].gapNet))}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-sub text-text-tertiary">
                {t('result.gap.bandNote')}
              </p>
            </>
          )}
        </Card>

        <IndicationNote className="mt-4" />

        {/* ---------------------------------------- breakdown: what you get */}
        <h2 className="text-headline-sm mt-8 text-text-primary">
          {t('result.sources.heading')}
        </h2>
        <Card className="mt-3 py-0">
          <Disclosure
            summary={
              <>
                <p className="text-body text-text-primary">
                  {t('result.aow.label')}
                </p>
                <p className="text-sub text-text-tertiary">
                  {t('result.aow.detail', {
                    household: t(
                      picture.household === 'single'
                        ? 'result.household.single'
                        : 'result.household.partner',
                    ),
                  })}
                </p>
              </>
            }
            amount={formatEuros(expected.breakdown.aow)}
          >
            <p className="text-sub text-text-secondary">
              {t('result.aow.body')}
            </p>
          </Disclosure>

          <Disclosure
            summary={
              <>
                <p className="text-body text-text-primary">
                  {t('result.employers.label')}
                </p>
                <p className="text-sub text-text-tertiary">
                  {employerCount === 0
                    ? t('result.employers.none')
                    : t(
                        employerCount === 1
                          ? 'result.employers.count.one'
                          : 'result.employers.count.other',
                        { count: employerCount },
                      )}
                </p>
              </>
            }
            amount={formatEuros(expected.breakdown.secondPillarTotal)}
          >
            {employerCount === 0 ? (
              <p className="text-sub text-text-secondary">
                {t('result.employers.zzpBody')}
              </p>
            ) : (
              <>
                {expected.breakdown.secondPillar.map((line) => (
                  <Row
                    key={line.id}
                    label={line.label}
                    detail={period(line)}
                    amount={formatEuros(line.amountNet)}
                    tone="muted"
                  />
                ))}
                <p className="mt-2 text-sub text-text-tertiary">
                  {t('result.employers.netNote')}
                </p>
                {picture.secondPillar
                  .filter((item) => item.noteKey)
                  .map((item) => (
                    <div key={item.id} className="mt-3">
                      <InfoBanner title={item.employer}>
                        {t(item.noteKey!)}
                      </InfoBanner>
                    </div>
                  ))}
              </>
            )}
          </Disclosure>

          <Disclosure
            summary={
              <>
                <p className="text-body text-text-primary">
                  {t('result.vive.label')}
                </p>
                <p className="text-sub text-text-tertiary">
                  {t('result.vive.detail', {
                    balance: formatEuros(picture.vive.balance),
                    monthly: formatEuros(picture.vive.monthlyContribution),
                  })}
                </p>
              </>
            }
            amount={formatEuros(expected.breakdown.vive)}
          >
            <Row
              label={t('result.vive.fromBalance')}
              amount={formatEuros(expected.viveAttribution.fromBalance)}
              tone="muted"
            />
            <Row
              label={t('result.vive.fromCurrent')}
              amount={formatEuros(
                expected.viveAttribution.fromCurrentContribution,
              )}
              tone="muted"
            />
            {analysis.extraMonthlyContribution > 0 ? (
              <Row
                label={t('result.vive.fromExtra')}
                amount={formatEuros(
                  expected.viveAttribution.fromExtraContribution,
                )}
                tone="muted"
              />
            ) : null}
            <p className="mt-2 text-sub text-text-tertiary">
              {t('result.vive.growth', {
                rate: (expected.annualReturn * 100).toFixed(0),
                capital: formatEuros(expected.viveCapitalAtRetirement),
                years: analysis.assumptions.payoutYears,
              })}
            </p>
          </Disclosure>
        </Card>

        <DataTable
          caption={t('result.table.caption')}
          columns={[t('result.table.source'), t('result.table.amount')]}
          rows={[
            {
              label: t('result.aow.label'),
              value: formatEuros(expected.breakdown.aow),
            },
            ...expected.breakdown.secondPillar.map((line) => ({
              label: line.label,
              value: formatEuros(line.amountNet),
            })),
            {
              label: t('result.vive.label'),
              value: formatEuros(expected.breakdown.vive),
            },
            {
              label: t('result.table.total'),
              value: formatEuros(expected.projectedNet),
            },
          ]}
        />

        {/* --------------------------------------- breakdown: what you need */}
        <h2 className="text-headline-sm mt-8 text-text-primary">
          {t('result.need.heading')}
        </h2>
        <Card className="mt-3 py-0">
          <Disclosure
            summary={
              <>
                <p className="text-body text-text-primary">
                  {t('result.need.pct.label', {
                    pct: (analysis.assumptions.targetIncomePct * 100).toFixed(0),
                  })}
                </p>
                <p className="text-sub text-text-tertiary">
                  {t('result.need.pct.detail', {
                    income: formatEuros(picture.currentNetMonthlyIncome),
                  })}
                </p>
              </>
            }
            amount={formatEuros(target.baseTarget)}
          >
            <p className="text-sub text-text-secondary">
              {t('result.need.pct.body', {
                pct: (analysis.assumptions.targetIncomePct * 100).toFixed(0),
              })}
            </p>
          </Disclosure>

          {picture.mortgage ? (
            <Disclosure
              summary={
                <>
                  <p className="text-body text-text-primary">
                    {t('result.home.label')}
                  </p>
                  <p className="text-sub text-text-tertiary">
                    {t(
                      target.mortgagePaidOffBeforeRetirement
                        ? 'result.home.paidOff'
                        : 'result.home.runsOn',
                      { year: picture.mortgage.paidOffYear },
                    )}
                  </p>
                </>
              }
              amount={
                target.mortgageOffset > 0
                  ? `− ${formatEuros(target.mortgageOffset)}`
                  : formatEuros(0)
              }
            >
              {target.mortgageOffset > 0 ? (
                <>
                  <p className="text-sub text-text-secondary">
                    {t('result.home.offsetBody', {
                      year: picture.mortgage.paidOffYear,
                      retirementYear: target.retirementYear,
                      amount: formatEuros(picture.mortgage.netMonthlyPayment),
                    })}
                  </p>
                  <p className="mt-2 text-sub text-text-secondary">
                    {t('result.home.offsetCaveat')}
                  </p>
                </>
              ) : (
                <p className="text-sub text-text-secondary">
                  {t('result.home.runsOnBody', {
                    year: picture.mortgage.paidOffYear,
                    retirementYear: target.retirementYear,
                  })}
                </p>
              )}
              {picture.homeValue ? (
                <p className="mt-2 text-sub text-text-tertiary">
                  {t('result.home.kadaster', {
                    value: formatEuros(picture.homeValue),
                  })}
                </p>
              ) : null}
            </Disclosure>
          ) : (
            <Disclosure
              summary={
                <>
                  <p className="text-body text-text-primary">
                    {t('result.home.label')}
                  </p>
                  <p className="text-sub text-text-tertiary">
                    {t('result.home.noHome')}
                  </p>
                </>
              }
              amount={formatEuros(0)}
            >
              <p className="text-sub text-text-secondary">
                {t('result.home.renterBody')}
              </p>
            </Disclosure>
          )}

          <div className="border-t border-ui-secondary py-4">
            <Row
              label={<strong>{t('result.need.total')}</strong>}
              amount={<strong>{formatEuros(target.targetNet)}</strong>}
            />
          </div>
        </Card>
      </Gutter>

      <div className="h-24" />

      <StickyFooter>
        {onTrack ? (
          <ButtonLink href="/actie" variant="secondary">
            {t('result.cta.onTrack')}
          </ButtonLink>
        ) : (
          <ButtonLink href="/actie">{t('result.cta.gap')}</ButtonLink>
        )}
        {!onTrack ? (
          <p className="mt-3 text-center text-sub text-text-tertiary">
            {t('result.cta.footnote', {
              amount: formatEuros(required.expected.monthly),
            })}
          </p>
        ) : null}
      </StickyFooter>

      <PersonaSwitcher />
    </Screen>
  )
}

'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { BarChart, DataTable, ReferenceBar, StatTile } from '@/components/charts'
import { LocaleSwitch } from '@/components/LocaleSwitch'
import { Card, InfoBanner, MicroLabel, Slider } from '@/components/ui'
import { useI18n } from '@/i18n/LocaleProvider'
import { euros } from '@/lib/pension/money'
import { SCENARIOS, SCENARIO_LABEL_KEYS, type Scenario } from '@/lib/pension/types'
import {
  COHORT_FILTER_OPTIONS,
  EMPLOYER_CONTRIBUTION_BOUNDS,
  MIN_GROUP_SIZE,
  aggregateWorkforce,
  type CohortFilter,
} from '@/lib/pension/workforce'
import { usePension } from '@/state/PensionProvider'

/**
 * Screen 6 — the employer view.
 *
 * A deliberately different context: wider layout, its own header, neutral
 * dashboard surface, and no persona switcher. Nothing here is part of the
 * employee flow.
 *
 * Built only on aggregates. The data module physically cannot hand this page a
 * single employee, and any segment below the minimum group size arrives without
 * a number attached.
 */
export default function EmployerPage() {
  const { assumptions } = usePension()
  const { t, formatEuros, formatPercent } = useI18n()
  const [contribution, setContribution] = useState(50)
  const [filter, setFilter] = useState<CohortFilter>('all')

  const baseline = useMemo(
    () => aggregateWorkforce(assumptions, 'expected', 0, filter),
    [assumptions, filter],
  )

  const whatIf = useMemo(
    () =>
      ({
        pessimistic: aggregateWorkforce(
          assumptions,
          'pessimistic',
          euros(contribution),
        ),
        expected: aggregateWorkforce(assumptions, 'expected', euros(contribution)),
        optimistic: aggregateWorkforce(
          assumptions,
          'optimistic',
          euros(contribution),
        ),
      }) satisfies Record<Scenario, ReturnType<typeof aggregateWorkforce>>,
    [assumptions, contribution],
  )

  const suppressed = t('employer.suppressed')

  return (
    <div className="min-h-dvh bg-canvas-tertiary">
      {/* --------------------------------------------------------- header */}
      <header className="border-b border-ui-secondary bg-canvas-primary">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 sm:px-6">
          <div>
            <MicroLabel className="text-highlight-turquoise">
              {t('employer.eyebrow')}
            </MicroLabel>
            <h1 className="text-headline-md mt-1 text-text-primary">
              {t('employer.company')}
            </h1>
          </div>
          <p className="text-sub text-text-tertiary">
            {t('employer.headcount', { count: baseline.headcount })}
          </p>
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/"
              className="text-sub text-highlight-turquoise underline underline-offset-2"
            >
              {t('employer.toEmployeeView')}
            </Link>
            <LocaleSwitch />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <InfoBanner title={t('employer.privacy.title')}>
          {t('employer.privacy.body', { min: MIN_GROUP_SIZE })}
        </InfoBanner>

        {/* ------------------------------------------------------- KPI row */}
        <section>
          <h2 className="text-headline-sm text-text-primary">
            {t('employer.now')}
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label={t('employer.kpi.withGap')}
              value={formatPercent(baseline.withGapShare)}
              detail={t('employer.kpi.withGapDetail', {
                count: baseline.headcount,
              })}
            />
            <StatTile
              label={t('employer.kpi.avgGap')}
              value={
                baseline.averageGapOfThoseWithGap === null
                  ? suppressed
                  : formatEuros(baseline.averageGapOfThoseWithGap)
              }
              detail={t('employer.kpi.avgGapDetail')}
              suppressed={baseline.averageGapOfThoseWithGap === null}
            />
            <StatTile
              label={t('employer.kpi.ranCheck')}
              value={formatPercent(baseline.ranCheckShare)}
              detail={t('employer.kpi.ranCheckDetail')}
            />
            <StatTile
              label={t('employer.kpi.acted')}
              value={formatPercent(baseline.actedShare)}
              detail={t('employer.kpi.actedDetail')}
            />
          </div>
        </section>

        {/* -------------------------------------------------- distribution */}
        <section className="grid gap-6 lg:grid-cols-2">
          <Card dashboard>
            <h2 className="text-headline-sm text-text-primary">
              {t('employer.distribution.title')}
            </h2>
            <p className="mt-1 text-sub text-text-secondary">
              {t('employer.distribution.lead')}
            </p>

            {/* Filters sit in one row above the chart they control. */}
            <div
              role="group"
              aria-label={t('employer.filter.label')}
              className="mt-4 flex flex-wrap gap-2"
            >
              {COHORT_FILTER_OPTIONS.map((option) => {
                const active = filter === option.id
                const label =
                  option.id === 'all'
                    ? t(option.labelKey)
                    : t('cohort.withYears', { range: t(option.labelKey) })
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilter(option.id)}
                    className={`rounded-card border-[1.5px] px-2.5 py-1.5 text-sub whitespace-nowrap ${
                      active
                        ? 'border-highlight-brand bg-highlight-brand text-white'
                        : 'border-ui-primary text-text-secondary'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            <p className="mt-3 text-sub text-text-tertiary">
              {filter === 'all'
                ? t('employer.filter.allNote', { count: baseline.filteredCount })
                : t('employer.filter.cohortNote', {
                    count: baseline.filteredCount,
                  })}
            </p>

            <div className="mt-4">
              <BarChart
                bars={baseline.distribution.map((segment) => ({
                  label: t(segment.labelKey),
                  value: segment.count,
                  valueLabel: String(segment.count),
                  suppressed: segment.suppressed,
                  detail: segment.suppressed
                    ? suppressed
                    : `${t(segment.labelKey)}: ${segment.count}`,
                }))}
              />
            </div>

            {baseline.distribution.some((segment) => segment.suppressed) ? (
              <p className="mt-4 text-sub text-text-secondary">
                {t('employer.distribution.suppressionNote', {
                  min: MIN_GROUP_SIZE,
                })}
              </p>
            ) : null}

            <DataTable
              caption={t('employer.distribution.table.caption')}
              columns={[
                t('employer.distribution.table.bucket'),
                t('employer.distribution.table.count'),
              ]}
              rows={baseline.distribution.map((segment) => ({
                label: t(segment.labelKey),
                value: segment.suppressed ? suppressed : String(segment.count),
              }))}
            />
          </Card>

          {/* ----------------------------------------------------- cohorts */}
          <Card dashboard>
            <h2 className="text-headline-sm text-text-primary">
              {t('employer.cohorts.title')}
            </h2>
            <p className="mt-1 text-sub text-text-secondary">
              {t('employer.cohorts.lead')}
            </p>

            <div className="mt-6">
              <BarChart
                bars={baseline.cohorts.map((cohort) => ({
                  label: t('cohort.withYears', { range: t(cohort.labelKey) }),
                  value: cohort.averageGapMonthly ?? 0,
                  valueLabel:
                    cohort.averageGapMonthly === null
                      ? suppressed
                      : formatEuros(cohort.averageGapMonthly),
                  suppressed: cohort.suppressed,
                  detail: t('employer.cohorts.table.row', {
                    range: t(cohort.labelKey),
                    count: cohort.count,
                  }),
                }))}
              />
            </div>

            <p className="mt-4 text-sub text-text-secondary">
              {t('employer.cohorts.story')}
            </p>

            <DataTable
              caption={t('employer.cohorts.table.caption')}
              columns={[
                t('employer.cohorts.table.cohort'),
                t('employer.cohorts.table.average'),
              ]}
              rows={baseline.cohorts.map((cohort) => ({
                label: t('employer.cohorts.table.row', {
                  range: t(cohort.labelKey),
                  count: cohort.count,
                }),
                value:
                  cohort.averageGapMonthly === null
                    ? suppressed
                    : formatEuros(cohort.averageGapMonthly),
              }))}
            />
          </Card>
        </section>

        {/* --------------------------------------------------- what-if */}
        <section>
          <Card dashboard>
            <h2 className="text-headline-sm text-text-primary">
              {t('employer.whatIf.title')}
            </h2>
            <p className="mt-1 text-sub text-text-secondary">
              {t('employer.whatIf.lead')}
            </p>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <Slider
                  label={t('employer.whatIf.slider')}
                  value={contribution}
                  min={EMPLOYER_CONTRIBUTION_BOUNDS.min}
                  max={EMPLOYER_CONTRIBUTION_BOUNDS.max}
                  step={EMPLOYER_CONTRIBUTION_BOUNDS.step}
                  onChange={setContribution}
                  valueLabel={`${formatEuros(euros(contribution))} ${t('perMonthShort')}`}
                  minLabel={formatEuros(euros(EMPLOYER_CONTRIBUTION_BOUNDS.min))}
                  maxLabel={formatEuros(euros(EMPLOYER_CONTRIBUTION_BOUNDS.max))}
                  hint={t('employer.whatIf.sliderHint', {
                    annual: formatEuros(
                      euros(contribution * baseline.headcount * 12),
                    ),
                    count: baseline.headcount,
                  })}
                />

                <div className="mt-6">
                  <MicroLabel>{t('employer.whatIf.barLabel')}</MicroLabel>
                  <div className="mt-2">
                    <ReferenceBar
                      value={whatIf.expected.withGapShare * 100}
                      low={whatIf.optimistic.withGapShare * 100}
                      high={whatIf.pessimistic.withGapShare * 100}
                      baseline={baseline.withGapShare * 100}
                      valueLabel={t('employer.whatIf.barValue', {
                        low: formatPercent(whatIf.optimistic.withGapShare),
                        high: formatPercent(whatIf.pessimistic.withGapShare),
                      })}
                      baselineLabel={t('employer.whatIf.barBaseline', {
                        share: formatPercent(baseline.withGapShare),
                      })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <MicroLabel>{t('employer.whatIf.perScenario')}</MicroLabel>
                <dl className="mt-2 divide-y divide-ui-secondary">
                  {SCENARIOS.map((scenario) => {
                    const scenarioResult = whatIf[scenario]
                    const delta =
                      baseline.withGapShare - scenarioResult.withGapShare
                    return (
                      <div
                        key={scenario}
                        className="flex items-baseline justify-between gap-3 py-3"
                      >
                        <dt className="text-sub text-text-secondary">
                          {t(SCENARIO_LABEL_KEYS[scenario])}{' '}
                          <span className="text-text-tertiary">
                            {(assumptions.returns[scenario] * 100).toFixed(0)}%
                          </span>
                        </dt>
                        <dd className="text-right">
                          <span className="text-headline-sm tabular-nums text-text-primary">
                            {formatPercent(scenarioResult.withGapShare)}
                          </span>
                          <span className="ml-2 text-sub tabular-nums text-highlight-turquoise">
                            −{Math.round(delta * 100)} pp
                          </span>
                        </dd>
                      </div>
                    )
                  })}
                </dl>
                <p className="mt-3 text-sub text-text-tertiary">
                  {t('employer.whatIf.scenarioNote')}{' '}
                  <Link
                    href="/aannames"
                    className="text-highlight-turquoise underline underline-offset-2"
                  >
                    {t('disclaimer.viewAssumptions')}
                  </Link>
                </p>
              </div>
            </div>

            <p className="mt-6 border-t border-ui-secondary pt-4 text-sub text-text-tertiary">
              {t('employer.whatIf.disclaimer')}
            </p>
          </Card>
        </section>

        {/* ---------------------------------------------------- privacy */}
        <footer className="pb-10">
          <p className="text-sub text-text-secondary">
            {t('employer.privacy.footer')}
          </p>
          <p className="mt-2 text-sub text-text-tertiary">
            {t('employer.privacy.footerNote', { min: MIN_GROUP_SIZE })}
          </p>
        </footer>
      </main>
    </div>
  )
}

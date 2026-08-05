'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { BarChart, DataTable, ReferenceBar, StatTile } from '@/components/charts'
import { Card, InfoBanner, MicroLabel, Slider, formatEuros } from '@/components/ui'
import { euros } from '@/lib/pension/money'
import { SCENARIO_LABELS_NL, type Scenario } from '@/lib/pension/types'
import {
  COHORT_FILTER_OPTIONS,
  EMPLOYER_CONTRIBUTION_BOUNDS,
  MIN_GROUP_SIZE,
  aggregateWorkforce,
  type CohortFilter,
} from '@/lib/pension/workforce'
import { usePension } from '@/state/PensionProvider'

const SUPPRESSED = 'Groep te klein om te tonen'

const percent = (share: number) => `${Math.round(share * 100)}%`

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

  return (
    <div className="min-h-dvh bg-canvas-tertiary">
      {/* --------------------------------------------------------- header */}
      <header className="border-b border-ui-secondary bg-canvas-primary">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 sm:px-6">
          <div>
            <MicroLabel className="text-highlight-turquoise">
              Vive · Werkgeversdashboard
            </MicroLabel>
            <h1 className="text-headline-md mt-1 text-text-primary">
              Kernwaarde Groep
            </h1>
          </div>
          <p className="text-sub text-text-tertiary">
            {baseline.headcount} medewerkers
          </p>
          <Link
            href="/"
            className="ml-auto text-sub text-highlight-turquoise underline underline-offset-2"
          >
            Naar de medewerkersweergave
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <InfoBanner title="Je ziet alleen totalen">
          Dit dashboard is gebouwd op geanonimiseerde totalen. Je ziet nooit
          gegevens van één medewerker. Groepen kleiner dan {MIN_GROUP_SIZE}{' '}
          personen laten we niet zien.
        </InfoBanner>

        {/* ------------------------------------------------------- KPI row */}
        <section>
          <h2 className="text-headline-sm text-text-primary">Nu</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Heeft een pensioengat"
              value={percent(baseline.withGapShare)}
              detail={`van de ${baseline.headcount} medewerkers`}
            />
            <StatTile
              label="Gemiddeld gat"
              value={
                baseline.averageGapOfThoseWithGap === null
                  ? SUPPRESSED
                  : `${formatEuros(baseline.averageGapOfThoseWithGap)}`
              }
              detail="per maand, van wie een gat heeft"
              suppressed={baseline.averageGapOfThoseWithGap === null}
              suppressedNote={SUPPRESSED}
            />
            <StatTile
              label="Deed de check"
              value={percent(baseline.ranCheckShare)}
              detail="heeft het pensioenoverzicht bekeken"
            />
            <StatTile
              label="Zette een stap"
              value={percent(baseline.actedShare)}
              detail="is daarna iets gaan doen"
            />
          </div>
        </section>

        {/* -------------------------------------------------- distribution */}
        <section className="grid gap-6 lg:grid-cols-2">
          <Card dashboard>
            <h2 className="text-headline-sm text-text-primary">
              Hoe groot zijn de gaten?
            </h2>
            <p className="mt-1 text-sub text-text-secondary">
              Aantal medewerkers per gat, netto per maand.
            </p>

            {/* Filters sit in one row above the chart they control. */}
            <div
              role="group"
              aria-label="Filter op leeftijdsgroep"
              className="mt-4 flex flex-wrap gap-2"
            >
              {COHORT_FILTER_OPTIONS.map((option) => {
                const active = filter === option.id
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
                    {option.label}
                  </button>
                )
              })}
            </div>

            <p className="mt-3 text-sub text-text-tertiary">
              {filter === 'all'
                ? `Alle ${baseline.filteredCount} medewerkers.`
                : `${baseline.filteredCount} medewerkers in deze groep. Het filter geldt alleen voor deze grafiek.`}
            </p>

            <div className="mt-4">
              <BarChart
                suppressedNote={SUPPRESSED}
                bars={baseline.distribution.map((segment) => ({
                  label: segment.label,
                  value: segment.count,
                  valueLabel: String(segment.count),
                  suppressed: segment.suppressed,
                  detail: segment.suppressed
                    ? SUPPRESSED
                    : `${segment.label}: ${segment.count} medewerkers`,
                }))}
              />
            </div>

            {baseline.distribution.some((segment) => segment.suppressed) ? (
              <p className="mt-4 text-sub text-text-secondary">
                Eén of meer groepen zijn te klein om te tonen. Dat is met opzet:
                bij minder dan {MIN_GROUP_SIZE} personen zou een getal te veel
                over één medewerker zeggen.
              </p>
            ) : null}

            <DataTable
              caption="Aantal medewerkers per grootte van het pensioengat"
              columns={['Gat per maand', 'Medewerkers']}
              rows={baseline.distribution.map((segment) => ({
                label: segment.label,
                value: segment.suppressed ? SUPPRESSED : String(segment.count),
              }))}
            />
          </Card>

          {/* ----------------------------------------------------- cohorts */}
          <Card dashboard>
            <h2 className="text-headline-sm text-text-primary">
              Gemiddeld gat per leeftijdsgroep
            </h2>
            <p className="mt-1 text-sub text-text-secondary">
              Netto per maand. Wie het minste tijd heeft, heeft het grootste gat.
            </p>

            <div className="mt-6">
              <BarChart
                suppressedNote={SUPPRESSED}
                bars={baseline.cohorts.map((cohort) => ({
                  label: `${cohort.label} jaar`,
                  value: cohort.averageGapMonthly ?? 0,
                  valueLabel:
                    cohort.averageGapMonthly === null
                      ? SUPPRESSED
                      : formatEuros(cohort.averageGapMonthly),
                  suppressed: cohort.suppressed,
                  detail: `${cohort.label} jaar · ${cohort.count} medewerkers`,
                }))}
              />
            </div>

            <p className="mt-4 text-sub text-text-secondary">
              De groep van 50 jaar en ouder heeft het grootste gat. Zij hebben de
              minste jaren om iets bij te leggen. Dat is de groep waar een
              compensatieregeling het meeste verschil maakt.
            </p>

            <DataTable
              caption="Gemiddeld pensioengat per leeftijdsgroep"
              columns={['Leeftijd', 'Gemiddeld gat per maand']}
              rows={baseline.cohorts.map((cohort) => ({
                label: `${cohort.label} jaar (${cohort.count} medewerkers)`,
                value:
                  cohort.averageGapMonthly === null
                    ? SUPPRESSED
                    : formatEuros(cohort.averageGapMonthly),
              }))}
            />
          </Card>
        </section>

        {/* --------------------------------------------------- what-if */}
        <section>
          <Card dashboard>
            <h2 className="text-headline-sm text-text-primary">
              Wat als je zou bijdragen?
            </h2>
            <p className="mt-1 text-sub text-text-secondary">
              Schuif om te zien wat een extra bijdrage per medewerker per maand
              zou doen met het aandeel medewerkers dat een gat heeft.
            </p>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <Slider
                  label="Extra bijdrage per medewerker"
                  value={contribution}
                  min={EMPLOYER_CONTRIBUTION_BOUNDS.min}
                  max={EMPLOYER_CONTRIBUTION_BOUNDS.max}
                  step={EMPLOYER_CONTRIBUTION_BOUNDS.step}
                  onChange={setContribution}
                  valueLabel={`${formatEuros(euros(contribution))} p/m`}
                  minLabel={formatEuros(
                    euros(EMPLOYER_CONTRIBUTION_BOUNDS.min),
                  )}
                  maxLabel={formatEuros(
                    euros(EMPLOYER_CONTRIBUTION_BOUNDS.max),
                  )}
                  hint={`Dat is ${formatEuros(
                    euros(contribution * baseline.headcount * 12),
                  )} per jaar voor ${baseline.headcount} medewerkers.`}
                />

                <div className="mt-6">
                  <MicroLabel>
                    Aandeel met een gat na deze bijdrage
                  </MicroLabel>
                  <div className="mt-2">
                    <ReferenceBar
                      value={whatIf.expected.withGapShare * 100}
                      low={whatIf.optimistic.withGapShare * 100}
                      high={whatIf.pessimistic.withGapShare * 100}
                      baseline={baseline.withGapShare * 100}
                      valueLabel={`${percent(
                        whatIf.optimistic.withGapShare,
                      )} – ${percent(whatIf.pessimistic.withGapShare)} houdt een gat`}
                      baselineLabel={`nu ${percent(baseline.withGapShare)}`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <MicroLabel>Per scenario</MicroLabel>
                <dl className="mt-2 divide-y divide-ui-secondary">
                  {(['pessimistic', 'expected', 'optimistic'] as const).map(
                    (scenario) => {
                      const result = whatIf[scenario]
                      const delta =
                        baseline.withGapShare - result.withGapShare
                      return (
                        <div
                          key={scenario}
                          className="flex items-baseline justify-between gap-3 py-3"
                        >
                          <dt className="text-sub text-text-secondary">
                            {SCENARIO_LABELS_NL[scenario]}{' '}
                            <span className="text-text-tertiary">
                              {(
                                assumptions.returns[scenario] * 100
                              ).toFixed(0)}
                              %
                            </span>
                          </dt>
                          <dd className="text-right">
                            <span className="text-headline-sm tabular-nums text-text-primary">
                              {percent(result.withGapShare)}
                            </span>
                            <span className="ml-2 text-sub tabular-nums text-highlight-turquoise">
                              −{Math.round(delta * 100)} pp
                            </span>
                          </dd>
                        </div>
                      )
                    },
                  )}
                </dl>
                <p className="mt-3 text-sub text-text-tertiary">
                  We laten altijd drie scenario&apos;s zien, nooit één bedrag. Wat
                  beleggen opbrengt weet niemand vooraf.{' '}
                  <Link
                    href="/aannames"
                    className="text-highlight-turquoise underline underline-offset-2"
                  >
                    Bekijk de aannames
                  </Link>
                </p>
              </div>
            </div>

            <p className="mt-6 border-t border-ui-secondary pt-4 text-sub text-text-tertiary">
              Indicatie op basis van aannames. Dit is informatie, geen advies over
              een pensioenregeling.
            </p>
          </Card>
        </section>

        {/* ---------------------------------------------------- privacy */}
        <footer className="pb-10">
          <p className="text-sub text-text-secondary">
            Op basis van geanonimiseerde totalen. Individuele gegevens zijn nooit
            zichtbaar voor je werkgever.
          </p>
          <p className="mt-2 text-sub text-text-tertiary">
            Groepen kleiner dan {MIN_GROUP_SIZE} personen tonen we niet. Dan zie
            je &ldquo;{SUPPRESSED.toLowerCase()}&rdquo; in plaats van een getal.
          </p>
        </footer>
      </main>
    </div>
  )
}

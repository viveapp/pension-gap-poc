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
  formatEuros,
} from '@/components/ui'
import { SCENARIO_LABELS_NL } from '@/lib/pension/types'
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

  useEffect(() => {
    if (!hasConsented || !analysis) router.replace('/')
  }, [hasConsented, analysis, router])

  if (!analysis || !picture) return null

  const { scenarios, target, required } = analysis
  const expected = scenarios.expected
  const onTrack = expected.onTrack

  return (
    <Screen>
      <AppBar
        backHref="/"
        action={
          <Link
            href="/aannames"
            className="text-sub text-highlight-turquoise underline underline-offset-2"
          >
            Aannames
          </Link>
        }
      />

      <Gutter>
        {/* ------------------------------------------------ headline reveal */}
        <Card dashboard elevated>
          <MicroLabel>Verwacht netto per maand na je pensioen</MicroLabel>
          <p className="text-headline-lg mt-2 tabular-nums text-text-primary">
            <AnimatedEuros cents={expected.projectedNet} revealFromZero />
          </p>
          <p className="text-sub text-text-tertiary">
            vanaf je {analysis.assumptions.retirementAge}e, in{' '}
            {target.retirementYear}
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
              <Badge tone="green">Op koers</Badge>
              <h2 className="text-headline-md mt-3 text-text-primary">
                Je bent op koers.
              </h2>
              <p className="mt-2 text-body text-text-secondary">
                Je verwachte inkomen is hoger dan het bedrag dat je volgens deze
                aannames nodig hebt. Je hoeft niets te doen.
              </p>
            </>
          ) : (
            <>
              <Badge tone="orange">Er is een gat</Badge>
              <h2 className="text-headline-md mt-3 text-text-primary">
                Je komt{' '}
                <span className="text-highlight-red tabular-nums">
                  <AnimatedEuros cents={expected.gapNet} durationMs={700} />
                </span>{' '}
                per maand tekort.
              </h2>
              <p className="mt-2 text-body text-text-secondary">
                Je hebt {formatEuros(target.targetNet)} per maand nodig. Volgens
                deze aannames krijg je {formatEuros(expected.projectedNet)}.
              </p>

              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-ui-secondary pt-4">
                {(['pessimistic', 'expected', 'optimistic'] as const).map(
                  (scenario) => (
                    <div key={scenario}>
                      <dt className="text-label uppercase text-text-tertiary">
                        {SCENARIO_LABELS_NL[scenario]}{' '}
                        {(scenarios[scenario].annualReturn * 100).toFixed(0)}%
                      </dt>
                      <dd className="text-headline-sm mt-1 tabular-nums text-text-primary">
                        {formatEuros(Math.max(0, scenarios[scenario].gapNet))}
                      </dd>
                    </div>
                  ),
                )}
              </dl>
              <p className="mt-2 text-sub text-text-tertiary">
                Het gat per maand, bij drie mogelijke rendementen.
              </p>
            </>
          )}
        </Card>

        <IndicationNote className="mt-4" />

        {/* ---------------------------------------- breakdown: what you get */}
        <h2 className="text-headline-sm mt-8 text-text-primary">
          Waar je inkomen vandaan komt
        </h2>
        <Card className="mt-3 py-0">
          <Disclosure
            summary={
              <>
                <p className="text-body text-text-primary">AOW</p>
                <p className="text-sub text-text-tertiary">
                  Van de overheid ·{' '}
                  {picture.household === 'single'
                    ? 'alleenstaand'
                    : 'met partner'}
                </p>
              </>
            }
            amount={formatEuros(expected.breakdown.aow)}
          >
            <p className="text-sub text-text-secondary">
              Dit is het netto AOW-bedrag van 2026 voor jouw situatie. Je krijgt
              AOW vanaf je AOW-leeftijd. Het bedrag kan later veranderen.
            </p>
          </Disclosure>

          <Disclosure
            summary={
              <>
                <p className="text-body text-text-primary">
                  Pensioen via werkgevers
                </p>
                <p className="text-sub text-text-tertiary">
                  {expected.breakdown.secondPillar.length === 0
                    ? 'Je hebt geen pensioen via een werkgever'
                    : `${expected.breakdown.secondPillar.length} ${
                        expected.breakdown.secondPillar.length === 1
                          ? 'potje'
                          : 'potjes'
                      }`}
                </p>
              </>
            }
            amount={formatEuros(expected.breakdown.secondPillarTotal)}
          >
            {expected.breakdown.secondPillar.length === 0 ? (
              <p className="text-sub text-text-secondary">
                Je werkt voor jezelf. Daarom bouw je geen pensioen op via een
                werkgever. Je AOW en je eigen inleg bepalen samen je inkomen.
              </p>
            ) : (
              <>
                {expected.breakdown.secondPillar.map((line) => (
                  <Row
                    key={line.id}
                    label={line.label}
                    detail={line.detail}
                    amount={formatEuros(line.amountNet)}
                    tone="muted"
                  />
                ))}
                <p className="mt-2 text-sub text-text-tertiary">
                  Deze bedragen zijn netto. Mijnpensioenoverzicht laat bruto
                  bedragen zien.
                </p>
                {picture.secondPillar
                  .filter((item) => item.note)
                  .map((item) => (
                    <div key={item.id} className="mt-3">
                      <InfoBanner title={item.employer}>{item.note}</InfoBanner>
                    </div>
                  ))}
              </>
            )}
          </Disclosure>

          <Disclosure
            summary={
              <>
                <p className="text-body text-text-primary">Je Vive-pot</p>
                <p className="text-sub text-text-tertiary">
                  Nu {formatEuros(picture.vive.balance)} ·{' '}
                  {formatEuros(picture.vive.monthlyContribution)} per maand
                </p>
              </>
            }
            amount={formatEuros(expected.breakdown.vive)}
          >
            <Row
              label="Uit wat je nu al hebt"
              amount={formatEuros(expected.viveAttribution.fromBalance)}
              tone="muted"
            />
            <Row
              label="Uit je huidige inleg"
              amount={formatEuros(
                expected.viveAttribution.fromCurrentContribution,
              )}
              tone="muted"
            />
            {analysis.extraMonthlyContribution > 0 ? (
              <Row
                label="Uit je extra inleg"
                amount={formatEuros(
                  expected.viveAttribution.fromExtraContribution,
                )}
                tone="muted"
              />
            ) : null}
            <p className="mt-2 text-sub text-text-tertiary">
              Bij een rendement van{' '}
              {(expected.annualReturn * 100).toFixed(0)}% groeit je pot naar{' '}
              {formatEuros(expected.viveCapitalAtRetirement)}. Dat bedrag keren
              we daarna uit over {analysis.assumptions.payoutYears} jaar.
            </p>
          </Disclosure>
        </Card>

        <DataTable
          caption="Verwacht netto inkomen per maand, per bron"
          columns={['Bron', 'Netto per maand']}
          rows={[
            { label: 'AOW', value: formatEuros(expected.breakdown.aow) },
            ...expected.breakdown.secondPillar.map((line) => ({
              label: line.label,
              value: formatEuros(line.amountNet),
            })),
            { label: 'Vive', value: formatEuros(expected.breakdown.vive) },
            { label: 'Totaal', value: formatEuros(expected.projectedNet) },
          ]}
        />

        {/* --------------------------------------- breakdown: what you need */}
        <h2 className="text-headline-sm mt-8 text-text-primary">
          Wat je nodig hebt
        </h2>
        <Card className="mt-3 py-0">
          <Disclosure
            summary={
              <>
                <p className="text-body text-text-primary">
                  {(analysis.assumptions.targetIncomePct * 100).toFixed(0)}% van
                  je inkomen nu
                </p>
                <p className="text-sub text-text-tertiary">
                  Nu netto {formatEuros(picture.currentNetMonthlyIncome)} per
                  maand
                </p>
              </>
            }
            amount={formatEuros(target.baseTarget)}
          >
            <p className="text-sub text-text-secondary">
              Na je pensioen heb je meestal minder geld nodig dan nu. We rekenen
              standaard met{' '}
              {(analysis.assumptions.targetIncomePct * 100).toFixed(0)}%. Je kunt
              dit zelf aanpassen bij de aannames.
            </p>
          </Disclosure>

          {picture.mortgage ? (
            <Disclosure
              summary={
                <>
                  <p className="text-body text-text-primary">
                    Effect van je woning
                  </p>
                  <p className="text-sub text-text-tertiary">
                    {target.mortgagePaidOffBeforeRetirement
                      ? `Hypotheek afgelost in ${picture.mortgage.paidOffYear}`
                      : `Hypotheek loopt door tot ${picture.mortgage.paidOffYear}`}
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
                <p className="text-sub text-text-secondary">
                  Je hypotheek is in {picture.mortgage.paidOffYear} afgelost, dus
                  vóór je pensioen in {target.retirementYear}. Dan stopt je
                  maandlast van{' '}
                  {formatEuros(picture.mortgage.netMonthlyPayment)}. Daarom heb je
                  later minder geld nodig.{' '}
                  <strong>Dit is een aanname:</strong> we gaan ervan uit dat je
                  in je woning blijft en de hypotheek niet verandert.
                </p>
              ) : (
                <p className="text-sub text-text-secondary">
                  Je hypotheek loopt tot {picture.mortgage.paidOffYear} en dus
                  door na je pensioen in {target.retirementYear}. We halen je
                  maandlast daarom niet van je doelbedrag af.
                </p>
              )}
              {picture.homeValue ? (
                <p className="mt-2 text-sub text-text-tertiary">
                  Waarde van je woning volgens het Kadaster:{' '}
                  {formatEuros(picture.homeValue)}. We rekenen de waarde van je
                  woning niet mee als inkomen.
                </p>
              ) : null}
            </Disclosure>
          ) : (
            <Disclosure
              summary={
                <>
                  <p className="text-body text-text-primary">
                    Effect van je woning
                  </p>
                  <p className="text-sub text-text-tertiary">
                    Je hebt geen koopwoning
                  </p>
                </>
              }
              amount={formatEuros(0)}
            >
              <p className="text-sub text-text-secondary">
                Je huurt. We gaan ervan uit dat je ook na je pensioen huur
                betaalt. Daarom halen we niets van je doelbedrag af.
              </p>
            </Disclosure>
          )}

          <div className="border-t border-ui-secondary py-4">
            <Row
              label={<strong>Totaal per maand</strong>}
              amount={<strong>{formatEuros(target.targetNet)}</strong>}
            />
          </div>
        </Card>
      </Gutter>

      <div className="h-24" />

      <StickyFooter>
        {onTrack ? (
          <ButtonLink href="/actie" variant="secondary">
            Bekijk wat extra inleggen doet
          </ButtonLink>
        ) : (
          <ButtonLink href="/actie">
            Wat kost het om dit gat te dichten?
          </ButtonLink>
        )}
        {!onTrack ? (
          <p className="mt-3 text-center text-sub text-text-tertiary">
            Ongeveer {formatEuros(required.expected.monthly)} per maand. Jij
            beslist.
          </p>
        ) : null}
      </StickyFooter>

      <PersonaSwitcher />
    </Screen>
  )
}

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
  formatEuros,
} from '@/components/ui'
import { euros } from '@/lib/pension/money'
import { SCENARIO_LABELS_NL } from '@/lib/pension/types'
import { usePension } from '@/state/PensionProvider'

/**
 * Screen 4 — what a contribution would do.
 *
 * Every sentence here is conditional: "als je X zou inleggen, dan …". Nothing
 * recommends an amount, nothing tells the user what they must do, and the user
 * initiates the contribution themselves. That is the Wft line between
 * informeren and adviseren.
 */
export default function ActionPage() {
  const router = useRouter()
  const { analysis, picture, hasConsented, extraMonthly, setExtraMonthly } =
    usePension()
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

  return (
    <Screen>
      <AppBar backHref="/resultaat" title="Wat kun je doen?" />

      <Gutter>
        {/* ------------------------------------------------- cost to close */}
        <Card dashboard elevated>
          <MicroLabel>Om dit gat te dichten</MicroLabel>
          <p className="text-headline-lg mt-2 tabular-nums text-text-primary">
            {formatEuros(required.expected.monthly)}
          </p>
          <p className="text-sub text-text-secondary">
            per maand extra inleggen, bij een rendement van{' '}
            {(scenarios.expected.annualReturn * 100).toFixed(0)}%
          </p>

          <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-ui-secondary pt-4">
            {(['pessimistic', 'expected', 'optimistic'] as const).map(
              (scenario) => (
                <div key={scenario}>
                  <dt className="text-label uppercase text-text-tertiary">
                    {SCENARIO_LABELS_NL[scenario]}{' '}
                    {(scenarios[scenario].annualReturn * 100).toFixed(0)}%
                  </dt>
                  <dd className="text-headline-sm mt-1 tabular-nums text-text-primary">
                    {formatEuros(required[scenario].monthly)}
                  </dd>
                </div>
              ),
            )}
          </dl>
          <p className="mt-2 text-sub text-text-tertiary">
            Wat je nodig hebt, hangt af van het rendement. Daarom laten we drie
            mogelijkheden zien.
          </p>
        </Card>

        {/* ------------------------------------------------------- slider */}
        <Card className="mt-4">
          <Slider
            label="Extra inleg per maand"
            value={Math.round(extraMonthly / 100)}
            min={0}
            max={sliderMaxEuros}
            step={5}
            onChange={(value) => setExtraMonthly(euros(value))}
            valueLabel={formatEuros(extraMonthly)}
            minLabel="€ 0"
            maxLabel={formatEuros(euros(sliderMaxEuros))}
          />

          <div className="mt-5 rounded-card bg-ui-tertiary p-4">
            {extraMonthly === 0 ? (
              <p className="text-body text-text-secondary">
                Schuif om te zien wat een extra inleg met je verwachte inkomen
                zou doen.
              </p>
            ) : (
              <p className="text-body text-text-primary">
                Als je {formatEuros(extraMonthly)} per maand extra zou inleggen,
                dan wordt je verwachte inkomen{' '}
                <span className="text-headline-sm tabular-nums text-text-primary">
                  <AnimatedEuros cents={expected.projectedNet} durationMs={350} />
                </span>{' '}
                netto per maand.
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
                  <Badge tone="green">Gat gedicht</Badge>
                  <p className="text-sub text-text-secondary">
                    In het verwachte scenario is er dan geen gat meer.
                  </p>
                </div>
              ) : (
                <Row
                  label="Dan blijft er een gat van"
                  amount={
                    <span className="tabular-nums">
                      <AnimatedEuros cents={remainingGap} durationMs={350} /> p/m
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
            <InfoBanner tone="warning" title="Let op de aftrek">
              <p>
                Je jaarruimte is ongeveer{' '}
                {formatEuros(picture.jaarruimteAnnual)} per jaar, dus{' '}
                {formatEuros(deductibleCeilingMonthly)} per maand. Leg je meer in?
                Dan is dat deel niet aftrekbaar van de belasting.
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
                      label="Wel aftrekbaar"
                      amount={`${formatEuros(deductiblePart)} p/m`}
                      tone="muted"
                    />
                    {nonDeductiblePart > 0 ? (
                      <Row
                        label="Niet aftrekbaar"
                        amount={`${formatEuros(nonDeductiblePart)} p/m`}
                        tone="muted"
                      />
                    ) : null}
                  </figcaption>
                </figure>
              ) : null}

              <p className="mt-3 text-text-tertiary">
                Dit is een indicatie op basis van een voorbeeldbedrag. Je echte
                jaarruimte berekenen we pas als je verder gaat.
              </p>
            </InfoBanner>
          </div>
        ) : null}

        <IndicationNote className="mt-4" />

        <p className="mt-4 text-sub text-text-tertiary">
          We vertellen je niet wat je moet doen en welk product bij je past. Je
          ziet hier wat een inleg zou betekenen. Jij kiest zelf of je iets doet.
        </p>
      </Gutter>

      <div className="h-24" />

      <StickyFooter>
        {stubOpen ? (
          <div className="mb-3 rounded-dialog bg-ui-tertiary p-4">
            <p className="text-headline-sm text-text-primary">
              Prototype
            </p>
            <p className="mt-1 text-sub text-text-secondary">
              Hier zou de inleg-flow starten met{' '}
              {formatEuros(extraMonthly)} per maand. In dit prototype gebeurt er
              niets: er is geen koppeling en er wordt niets opgeslagen.
            </p>
            <Button
              variant="secondary"
              size="md"
              className="mt-3"
              onClick={() => setStubOpen(false)}
            >
              Sluiten
            </Button>
          </div>
        ) : null}

        <Button disabled={extraMonthly === 0} onClick={() => setStubOpen(true)}>
          {extraMonthly === 0
            ? 'Kies eerst een bedrag'
            : `Ik wil ${formatEuros(extraMonthly)} per maand inleggen`}
        </Button>
        <ButtonLink href="/aannames" variant="link" className="mx-auto mt-3">
          Pas de aannames aan
        </ButtonLink>
      </StickyFooter>

      <PersonaSwitcher />
    </Screen>
  )
}

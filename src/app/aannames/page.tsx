'use client'

import { PersonaSwitcher } from '@/components/PersonaSwitcher'
import {
  AppBar,
  Button,
  ButtonLink,
  Card,
  Gutter,
  InfoBanner,
  MicroLabel,
  Row,
  Screen,
  Slider,
  formatEuros,
} from '@/components/ui'
import {
  AOW_NET_MONTHLY_2026,
  ASSUMPTION_BOUNDS,
  REFERENCE_YEAR,
} from '@/lib/pension/constants'
import type { Scenario } from '@/lib/pension/types'
import { SCENARIO_LABELS_NL } from '@/lib/pension/types'
import { usePension } from '@/state/PensionProvider'

/**
 * Screen 5 — every assumption, editable, with the results recomputing live.
 *
 * Always reachable: if no data has been fetched yet, the assumptions are still
 * shown and editable, just without the live summary on top.
 */
export default function AssumptionsPage() {
  const {
    analysis,
    picture,
    assumptions,
    updateAssumption,
    resetAssumptions,
    hasConsented,
  } = usePension()

  const percent = (value: number) => `${(value * 100).toFixed(0)}%`
  const setReturn = (scenario: Scenario, value: number) =>
    updateAssumption('returns', { ...assumptions.returns, [scenario]: value })

  return (
    <Screen>
      <AppBar
        backHref={hasConsented ? '/resultaat' : '/'}
        title="Aannames"
        action={
          <Button
            variant="link"
            onClick={resetAssumptions}
            className="text-sub"
          >
            Standaard
          </Button>
        }
      />

      <Gutter>
        <p className="text-body text-text-secondary">
          Een pensioenberekening is altijd een schatting. Hieronder staat elke
          aanname die we gebruiken. Pas ze aan en je ziet meteen wat er verandert.
        </p>

        {/* --------------------------------------------- live mini summary */}
        {analysis ? (
          <Card className="mt-4 sticky top-2 z-10" elevated>
            <MicroLabel>Resultaat met deze aannames</MicroLabel>
            <div className="mt-2">
              <Row
                label="Je hebt nodig"
                amount={formatEuros(analysis.target.targetNet)}
              />
              <Row
                label="Je krijgt (verwacht)"
                amount={formatEuros(analysis.scenarios.expected.projectedNet)}
              />
              <div className="border-t border-ui-secondary pt-2">
                <Row
                  label={
                    <strong>
                      {analysis.scenarios.expected.onTrack
                        ? 'Je bent op koers'
                        : 'Je gat per maand'}
                    </strong>
                  }
                  amount={
                    <strong
                      className={
                        analysis.scenarios.expected.onTrack
                          ? 'text-highlight-turquoise'
                          : 'text-highlight-red'
                      }
                    >
                      {formatEuros(
                        Math.abs(analysis.scenarios.expected.gapNet),
                      )}
                    </strong>
                  }
                />
              </div>
            </div>
          </Card>
        ) : (
          <div className="mt-4">
            <InfoBanner>
              Je hebt nog geen gegevens opgehaald. Je kunt de aannames wel al
              aanpassen.
            </InfoBanner>
          </div>
        )}

        {/* ------------------------------------------------- what you need */}
        <h2 className="text-headline-sm mt-8 text-text-primary">
          Wat je later nodig hebt
        </h2>

        <Card className="mt-3 space-y-6">
          <Slider
            label="Deel van je inkomen dat je later nodig hebt"
            value={assumptions.targetIncomePct}
            min={ASSUMPTION_BOUNDS.targetIncomePct.min}
            max={ASSUMPTION_BOUNDS.targetIncomePct.max}
            step={ASSUMPTION_BOUNDS.targetIncomePct.step}
            onChange={(value) => updateAssumption('targetIncomePct', value)}
            valueLabel={percent(assumptions.targetIncomePct)}
            minLabel="50%"
            maxLabel="100%"
            hint="Na je pensioen heb je meestal minder geld nodig. Standaard rekenen we met 70% van je inkomen nu."
          />

          <div className="border-t border-ui-secondary pt-5">
            <Toggle
              label="Hypotheek afgelost? Dan minder nodig"
              checked={assumptions.applyMortgageOffset}
              onChange={(value) => updateAssumption('applyMortgageOffset', value)}
              hint={
                !picture?.mortgage
                  ? 'Geldt alleen als je een koopwoning hebt.'
                  : analysis?.target.mortgagePaidOffBeforeRetirement
                    ? `Je hypotheek is afgelost in ${picture.mortgage.paidOffYear}, dus vóór je pensioen. Je maandlast van ${formatEuros(
                        picture.mortgage.netMonthlyPayment,
                      )} stopt dan. Zet dit uit als je verwacht te verhuizen of opnieuw te lenen.`
                    : `Je hypotheek loopt tot ${picture.mortgage.paidOffYear} en dus door na je pensioen in ${analysis?.target.retirementYear}. Daarom halen we nu niets van je doelbedrag af.`
              }
            />
          </div>
        </Card>

        {/* ------------------------------------------------ when you retire */}
        <h2 className="text-headline-sm mt-8 text-text-primary">
          Wanneer je stopt
        </h2>

        <Card className="mt-3">
          <Slider
            label="Leeftijd waarop je stopt met werken"
            value={assumptions.retirementAge}
            min={ASSUMPTION_BOUNDS.retirementAge.min}
            max={ASSUMPTION_BOUNDS.retirementAge.max}
            step={ASSUMPTION_BOUNDS.retirementAge.step}
            onChange={(value) => updateAssumption('retirementAge', value)}
            valueLabel={`${assumptions.retirementAge} jaar`}
            minLabel="60 jaar"
            maxLabel="72 jaar"
            hint={
              analysis
                ? `Dat is het jaar ${analysis.target.retirementYear}, over ${Math.round(
                    analysis.monthsToRetirement / 12,
                  )} jaar.`
                : 'De AOW-leeftijd is nu 67 jaar.'
            }
          />
        </Card>

        {/* ------------------------------------------------------- returns */}
        <h2 className="text-headline-sm mt-8 text-text-primary">
          Rendement voor je pensioen
        </h2>
        <p className="mt-1 text-sub text-text-secondary">
          Niemand weet wat beleggen opbrengt. Daarom rekenen we altijd met drie
          mogelijkheden. Je ziet nooit één bedrag, maar een reeks.
        </p>

        <Card className="mt-3 space-y-6">
          {(['pessimistic', 'expected', 'optimistic'] as const).map(
            (scenario) => (
              <Slider
                key={scenario}
                label={`${SCENARIO_LABELS_NL[scenario]} rendement per jaar`}
                value={assumptions.returns[scenario]}
                min={ASSUMPTION_BOUNDS.returnRate.min}
                max={ASSUMPTION_BOUNDS.returnRate.max}
                step={ASSUMPTION_BOUNDS.returnRate.step}
                onChange={(value) => setReturn(scenario, value)}
                valueLabel={`${(assumptions.returns[scenario] * 100).toFixed(1)}%`}
                minLabel="0%"
                maxLabel="10%"
              />
            ),
          )}
          <p className="border-t border-ui-secondary pt-4 text-sub text-text-tertiary">
            We rekenen met maandelijkse groei. Een rendement van 4% per jaar is
            dus niet 0,33% per maand, maar iets minder.
          </p>
        </Card>

        {/* -------------------------------------------------- payout phase */}
        <h2 className="text-headline-sm mt-8 text-text-primary">
          Uitkeren na je pensioen
        </h2>

        <Card className="mt-3 space-y-6">
          <Slider
            label="Aantal jaren dat je pot wordt uitgekeerd"
            value={assumptions.payoutYears}
            min={ASSUMPTION_BOUNDS.payoutYears.min}
            max={ASSUMPTION_BOUNDS.payoutYears.max}
            step={ASSUMPTION_BOUNDS.payoutYears.step}
            onChange={(value) => updateAssumption('payoutYears', value)}
            valueLabel={`${assumptions.payoutYears} jaar`}
            minLabel="10 jaar"
            maxLabel="30 jaar"
            hint={`We verdelen je pot in gelijke bedragen over ${assumptions.payoutYears} jaar. Dus van je ${assumptions.retirementAge}e tot je ${assumptions.retirementAge + assumptions.payoutYears}e. We rekenen niet met levenslange uitkering en niet met indexatie.`}
          />

          <div className="border-t border-ui-secondary pt-5">
            <Slider
              label="Rendement tijdens uitkeren"
              value={assumptions.payoutReturnRate}
              min={ASSUMPTION_BOUNDS.returnRate.min}
              max={ASSUMPTION_BOUNDS.returnRate.max}
              step={ASSUMPTION_BOUNDS.returnRate.step}
              onChange={(value) => updateAssumption('payoutReturnRate', value)}
              valueLabel={`${(assumptions.payoutReturnRate * 100).toFixed(1)}%`}
              minLabel="0%"
              maxLabel="10%"
              hint="Wat er nog in je pot zit, blijft groeien terwijl je uitkeert."
            />
          </div>
        </Card>

        {/* ------------------------------------------------------- tax */}
        <h2 className="text-headline-sm mt-8 text-text-primary">Belasting</h2>

        <Card className="mt-3">
          <Slider
            label="Belasting die je na je pensioen betaalt"
            value={assumptions.retireeTaxRate}
            min={ASSUMPTION_BOUNDS.retireeTaxRate.min}
            max={ASSUMPTION_BOUNDS.retireeTaxRate.max}
            step={ASSUMPTION_BOUNDS.retireeTaxRate.step}
            onChange={(value) => updateAssumption('retireeTaxRate', value)}
            valueLabel={percent(assumptions.retireeTaxRate)}
            minLabel="0%"
            maxLabel="50%"
            hint="We rekenen met één vast percentage over je werkgeverspensioen en je Vive-pot. In het echt gaat dat per belastingschijf. Alle bedragen in de app zijn netto: dat wat je echt overhoudt."
          />
        </Card>

        {/* -------------------------------------------------- fixed inputs */}
        <h2 className="text-headline-sm mt-8 text-text-primary">
          Vaste bedragen die we gebruiken
        </h2>

        <Card className="mt-3">
          <Row
            label="AOW alleenstaand (2026)"
            detail="Netto per maand"
            amount={formatEuros(AOW_NET_MONTHLY_2026.single)}
          />
          <Row
            label="AOW met partner (2026)"
            detail="Netto per maand, per persoon"
            amount={formatEuros(AOW_NET_MONTHLY_2026.partner)}
          />
          <Row
            label="Rekenjaar"
            detail="Vanaf dit jaar rekenen we vooruit"
            amount={String(REFERENCE_YEAR)}
          />
          {picture ? (
            <Row
              label="Jaarruimte"
              detail="Voorbeeldbedrag in dit prototype, geen echte berekening"
              amount={formatEuros(picture.jaarruimteAnnual)}
            />
          ) : null}
          <p className="mt-3 border-t border-ui-secondary pt-3 text-sub text-text-tertiary">
            De AOW-bedragen zijn indicatief. Je pensioen via werkgevers komt van
            Mijnpensioenoverzicht en is daar bruto. Wij rekenen het om naar netto
            met het percentage hierboven.
          </p>
        </Card>

        <div className="mt-8">
          <InfoBanner>
            Alles op deze pagina is een aanname. Verandert de wet, de rente of je
            eigen situatie? Dan verandert de uitkomst. Wij geven informatie, geen
            advies.
          </InfoBanner>
        </div>

        <div className="mt-6 space-y-3">
          <Button variant="secondary" onClick={resetAssumptions}>
            Zet alles terug op standaard
          </Button>
          {hasConsented ? (
            <ButtonLink href="/resultaat">Terug naar je resultaat</ButtonLink>
          ) : (
            <ButtonLink href="/">Start de check</ButtonLink>
          )}
        </div>
      </Gutter>

      <div className="h-24" />

      <PersonaSwitcher />
    </Screen>
  )
}

/* -------------------------------------------------------------------------- */

const Toggle = ({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  hint?: string
}) => (
  <div>
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="text-body text-text-primary">{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      {/* The knob is a descendant, so the peer variant has to reach into it. */}
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-ui-primary transition-colors peer-checked:bg-highlight-brand peer-checked:[&>span]:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-highlight-brand"
      >
        <span className="absolute top-1 left-1 size-5 rounded-full bg-white transition-transform" />
      </span>
    </label>
    {hint ? (
      <p className="mt-2 text-sub text-text-tertiary">{hint}</p>
    ) : null}
  </div>
)

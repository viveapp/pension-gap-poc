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
} from '@/components/ui'
import { useI18n } from '@/i18n/LocaleProvider'
import {
  AOW_NET_MONTHLY_2026,
  ASSUMPTION_BOUNDS,
  REFERENCE_YEAR,
} from '@/lib/pension/constants'
import { SCENARIOS, SCENARIO_LABEL_KEYS, type Scenario } from '@/lib/pension/types'
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
  const { t, formatEuros, formatPercent } = useI18n()

  const setReturn = (scenario: Scenario, value: number) =>
    updateAssumption('returns', { ...assumptions.returns, [scenario]: value })

  const mortgageHint = () => {
    if (!picture?.mortgage) return t('assumptions.mortgage.hintNoHome')
    if (analysis?.target.mortgagePaidOffBeforeRetirement) {
      return t('assumptions.mortgage.hintApplies', {
        year: picture.mortgage.paidOffYear,
        amount: formatEuros(picture.mortgage.netMonthlyPayment),
      })
    }
    return t('assumptions.mortgage.hintDoesNotApply', {
      year: picture.mortgage.paidOffYear,
      retirementYear: analysis?.target.retirementYear ?? '',
    })
  }

  return (
    <Screen>
      <AppBar
        backHref={hasConsented ? '/resultaat' : '/'}
        title={t('assumptions.title')}
        action={
          <Button variant="link" onClick={resetAssumptions} className="text-sub">
            {t('assumptions.reset.short')}
          </Button>
        }
      />

      <Gutter>
        <p className="text-body text-text-secondary">{t('assumptions.lead')}</p>

        {/* --------------------------------------------- live mini summary */}
        {analysis ? (
          <Card className="mt-4 sticky top-2 z-10" elevated>
            <MicroLabel>{t('assumptions.summary.label')}</MicroLabel>
            <div className="mt-2">
              <Row
                label={t('assumptions.summary.need')}
                amount={formatEuros(analysis.target.targetNet)}
              />
              <Row
                label={t('assumptions.summary.get')}
                amount={formatEuros(analysis.scenarios.expected.projectedNet)}
              />
              <div className="border-t border-ui-secondary pt-2">
                <Row
                  label={
                    <strong>
                      {analysis.scenarios.expected.onTrack
                        ? t('assumptions.summary.onTrack')
                        : t('assumptions.summary.gap')}
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
            <InfoBanner>{t('assumptions.noData')}</InfoBanner>
          </div>
        )}

        {/* ------------------------------------------------- what you need */}
        <h2 className="text-headline-sm mt-8 text-text-primary">
          {t('assumptions.need.heading')}
        </h2>

        <Card className="mt-3 space-y-6">
          <Slider
            label={t('assumptions.targetPct.label')}
            value={assumptions.targetIncomePct}
            min={ASSUMPTION_BOUNDS.targetIncomePct.min}
            max={ASSUMPTION_BOUNDS.targetIncomePct.max}
            step={ASSUMPTION_BOUNDS.targetIncomePct.step}
            onChange={(value) => updateAssumption('targetIncomePct', value)}
            valueLabel={formatPercent(assumptions.targetIncomePct)}
            minLabel={formatPercent(ASSUMPTION_BOUNDS.targetIncomePct.min)}
            maxLabel={formatPercent(ASSUMPTION_BOUNDS.targetIncomePct.max)}
            hint={t('assumptions.targetPct.hint')}
          />

          <div className="border-t border-ui-secondary pt-5">
            <Toggle
              label={t('assumptions.mortgage.label')}
              checked={assumptions.applyMortgageOffset}
              onChange={(value) => updateAssumption('applyMortgageOffset', value)}
              hint={mortgageHint()}
            />
          </div>
        </Card>

        {/* ------------------------------------------------ when you retire */}
        <h2 className="text-headline-sm mt-8 text-text-primary">
          {t('assumptions.retire.heading')}
        </h2>

        <Card className="mt-3">
          <Slider
            label={t('assumptions.retireAge.label')}
            value={assumptions.retirementAge}
            min={ASSUMPTION_BOUNDS.retirementAge.min}
            max={ASSUMPTION_BOUNDS.retirementAge.max}
            step={ASSUMPTION_BOUNDS.retirementAge.step}
            onChange={(value) => updateAssumption('retirementAge', value)}
            valueLabel={t('years', { count: assumptions.retirementAge })}
            minLabel={t('years', { count: ASSUMPTION_BOUNDS.retirementAge.min })}
            maxLabel={t('years', { count: ASSUMPTION_BOUNDS.retirementAge.max })}
            hint={
              analysis
                ? t('assumptions.retireAge.hint', {
                    year: analysis.target.retirementYear,
                    years: Math.round(analysis.monthsToRetirement / 12),
                  })
                : t('assumptions.retireAge.hintNoData')
            }
          />
          <p className="mt-3 border-t border-ui-secondary pt-3 text-sub text-text-tertiary">
            {t('assumptions.retireAge.aowCaveat')}
          </p>
        </Card>

        {/* ------------------------------------------------------- returns */}
        <h2 className="text-headline-sm mt-8 text-text-primary">
          {t('assumptions.returns.heading')}
        </h2>
        <p className="mt-1 text-sub text-text-secondary">
          {t('assumptions.returns.lead')}
        </p>

        <Card className="mt-3 space-y-6">
          {SCENARIOS.map((scenario) => (
            <Slider
              key={scenario}
              label={t('assumptions.returns.label', {
                scenario: t(SCENARIO_LABEL_KEYS[scenario]),
              })}
              value={assumptions.returns[scenario]}
              min={ASSUMPTION_BOUNDS.returnRate.min}
              max={ASSUMPTION_BOUNDS.returnRate.max}
              step={ASSUMPTION_BOUNDS.returnRate.step}
              onChange={(value) => setReturn(scenario, value)}
              valueLabel={formatPercent(assumptions.returns[scenario], 1)}
              minLabel={formatPercent(ASSUMPTION_BOUNDS.returnRate.min)}
              maxLabel={formatPercent(ASSUMPTION_BOUNDS.returnRate.max)}
            />
          ))}
          <p className="border-t border-ui-secondary pt-4 text-sub text-text-tertiary">
            {t('assumptions.returns.note')}
          </p>
        </Card>

        {/* -------------------------------------------------- payout phase */}
        <h2 className="text-headline-sm mt-8 text-text-primary">
          {t('assumptions.payout.heading')}
        </h2>

        <Card className="mt-3 space-y-6">
          <Slider
            label={t('assumptions.payoutYears.label')}
            value={assumptions.payoutYears}
            min={ASSUMPTION_BOUNDS.payoutYears.min}
            max={ASSUMPTION_BOUNDS.payoutYears.max}
            step={ASSUMPTION_BOUNDS.payoutYears.step}
            onChange={(value) => updateAssumption('payoutYears', value)}
            valueLabel={t('years', { count: assumptions.payoutYears })}
            minLabel={t('years', { count: ASSUMPTION_BOUNDS.payoutYears.min })}
            maxLabel={t('years', { count: ASSUMPTION_BOUNDS.payoutYears.max })}
            hint={t('assumptions.payoutYears.hint', {
              years: assumptions.payoutYears,
              fromAge: assumptions.retirementAge,
              toAge: assumptions.retirementAge + assumptions.payoutYears,
            })}
          />

          <div className="border-t border-ui-secondary pt-5">
            <Slider
              label={t('assumptions.payoutReturn.label')}
              value={assumptions.payoutReturnRate}
              min={ASSUMPTION_BOUNDS.returnRate.min}
              max={ASSUMPTION_BOUNDS.returnRate.max}
              step={ASSUMPTION_BOUNDS.returnRate.step}
              onChange={(value) => updateAssumption('payoutReturnRate', value)}
              valueLabel={formatPercent(assumptions.payoutReturnRate, 1)}
              minLabel={formatPercent(ASSUMPTION_BOUNDS.returnRate.min)}
              maxLabel={formatPercent(ASSUMPTION_BOUNDS.returnRate.max)}
              hint={t('assumptions.payoutReturn.hint')}
            />
          </div>
        </Card>

        {/* ------------------------------------------------------- tax */}
        <h2 className="text-headline-sm mt-8 text-text-primary">
          {t('assumptions.tax.heading')}
        </h2>

        <Card className="mt-3">
          <Slider
            label={t('assumptions.tax.label')}
            value={assumptions.retireeTaxRate}
            min={ASSUMPTION_BOUNDS.retireeTaxRate.min}
            max={ASSUMPTION_BOUNDS.retireeTaxRate.max}
            step={ASSUMPTION_BOUNDS.retireeTaxRate.step}
            onChange={(value) => updateAssumption('retireeTaxRate', value)}
            valueLabel={formatPercent(assumptions.retireeTaxRate)}
            minLabel={formatPercent(ASSUMPTION_BOUNDS.retireeTaxRate.min)}
            maxLabel={formatPercent(ASSUMPTION_BOUNDS.retireeTaxRate.max)}
            hint={t('assumptions.tax.hint')}
          />
        </Card>

        {/* -------------------------------------------------- fixed inputs */}
        <h2 className="text-headline-sm mt-8 text-text-primary">
          {t('assumptions.fixed.heading')}
        </h2>

        <Card className="mt-3">
          <Row
            label={t('assumptions.fixed.aowSingle')}
            detail={t('assumptions.fixed.aowSingleDetail')}
            amount={formatEuros(AOW_NET_MONTHLY_2026.single)}
          />
          <Row
            label={t('assumptions.fixed.aowPartner')}
            detail={t('assumptions.fixed.aowPartnerDetail')}
            amount={formatEuros(AOW_NET_MONTHLY_2026.partner)}
          />
          <Row
            label={t('assumptions.fixed.year')}
            detail={t('assumptions.fixed.yearDetail')}
            amount={String(REFERENCE_YEAR)}
          />
          {picture ? (
            <Row
              label={t('assumptions.fixed.jaarruimte')}
              detail={t('assumptions.fixed.jaarruimteDetail')}
              amount={formatEuros(picture.jaarruimteAnnual)}
            />
          ) : null}
          <p className="mt-3 border-t border-ui-secondary pt-3 text-sub text-text-tertiary">
            {t('assumptions.fixed.note')}
          </p>
        </Card>

        <div className="mt-8">
          <InfoBanner>{t('assumptions.closing')}</InfoBanner>
        </div>

        <div className="mt-6 space-y-3">
          <Button variant="secondary" onClick={resetAssumptions}>
            {t('assumptions.reset.long')}
          </Button>
          {hasConsented ? (
            <ButtonLink href="/resultaat">
              {t('assumptions.backToResult')}
            </ButtonLink>
          ) : (
            <ButtonLink href="/">{t('assumptions.startCheck')}</ButtonLink>
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

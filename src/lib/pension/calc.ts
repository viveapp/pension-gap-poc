/**
 * Pension gap calculation. Pure functions, no React, no I/O, no clock.
 *
 * The model, in one paragraph: a target net monthly income is derived from
 * today's net income (optionally reduced by a mortgage that is repaid before
 * retirement). A projected net monthly income is built from AOW plus
 * second-pillar entitlements plus the income the Vive pot can buy. The gap is
 * the difference. The cost of closing it is a future-value annuity solve back
 * to a monthly contribution. Everything runs three times, once per scenario.
 *
 * Every conversion between gross and net goes through the branded helpers in
 * `money.ts`, so a net/gross mix-up cannot compile.
 */

import { AOW_NET_MONTHLY_2026, REFERENCE_YEAR } from './constants'
import {
  allocateCents,
  gross,
  grossToNet,
  net,
  netToGross,
  scale,
  sumNet,
  type Cents,
  type GrossCents,
  type NetCents,
} from './money'
import {
  SCENARIOS,
  type Assumptions,
  type BreakdownLine,
  type FinancialPicture,
  type GapAnalysis,
  type RequiredContribution,
  type Scenario,
  type ScenarioResult,
  type TargetIncome,
} from './types'

/* -------------------------------------------------------------------------- */
/* Rate and annuity primitives                                                */
/* -------------------------------------------------------------------------- */

/**
 * Effective monthly rate from an annual rate.
 *
 * Compounded, not `annual / 12` — over a 38-year horizon the difference is
 * material enough to matter.
 */
export const monthlyRate = (annualRate: number): number =>
  Math.pow(1 + annualRate, 1 / 12) - 1

export const monthsToRetirement = (
  picture: FinancialPicture,
  assumptions: Assumptions,
): number => Math.max(0, Math.round((assumptions.retirementAge - picture.age) * 12))

/** Future value of a single amount left to compound. */
export const growLumpSum = (
  amount: Cents,
  months: number,
  annualRate: number,
): Cents => {
  if (months <= 0) return Math.round(amount)
  return Math.round(amount * Math.pow(1 + monthlyRate(annualRate), months))
}

/**
 * Future value of a fixed monthly contribution, paid at the end of each month
 * (ordinary annuity).
 */
export const growMonthlyContributions = (
  monthlyAmount: Cents,
  months: number,
  annualRate: number,
): Cents => {
  if (months <= 0 || monthlyAmount === 0) return 0
  const rate = monthlyRate(annualRate)
  if (rate === 0) return Math.round(monthlyAmount * months)
  return Math.round(monthlyAmount * ((Math.pow(1 + rate, months) - 1) / rate))
}

/**
 * What gross monthly income a capital sum buys, as a level annuity paid out
 * over `payoutYears` while the remainder keeps earning `payoutReturnRate`.
 *
 * Deliberately simple: no indexation, no mortality table, no guarantees. The
 * assumptions screen states this in plain Dutch.
 */
export const capitalToGrossMonthlyIncome = (
  capital: Cents,
  assumptions: Pick<Assumptions, 'payoutYears' | 'payoutReturnRate'>,
): GrossCents => {
  const months = Math.round(assumptions.payoutYears * 12)
  if (months <= 0 || capital <= 0) return gross(0)
  const rate = monthlyRate(assumptions.payoutReturnRate)
  if (rate === 0) return gross(capital / months)
  return gross((capital * rate) / (1 - Math.pow(1 + rate, -months)))
}

/** Inverse of {@link capitalToGrossMonthlyIncome}. */
export const grossMonthlyIncomeToCapital = (
  income: GrossCents,
  assumptions: Pick<Assumptions, 'payoutYears' | 'payoutReturnRate'>,
): Cents => {
  const months = Math.round(assumptions.payoutYears * 12)
  if (months <= 0 || income <= 0) return 0
  const rate = monthlyRate(assumptions.payoutReturnRate)
  if (rate === 0) return Math.round(income * months)
  return Math.round((income * (1 - Math.pow(1 + rate, -months))) / rate)
}

/**
 * Monthly contribution needed to reach `targetCapital` in `months`.
 *
 * Rounded up, so the solved amount never lands just short of closing the gap.
 */
export const solveMonthlyContribution = (
  targetCapital: Cents,
  months: number,
  annualRate: number,
): Cents => {
  if (targetCapital <= 0) return 0
  // No time left: the only way to get there is to pay it in full.
  if (months <= 0) return Math.ceil(targetCapital)
  const rate = monthlyRate(annualRate)
  if (rate === 0) return Math.ceil(targetCapital / months)
  return Math.ceil((targetCapital * rate) / (Math.pow(1 + rate, months) - 1))
}

/* -------------------------------------------------------------------------- */
/* Target income                                                              */
/* -------------------------------------------------------------------------- */

/**
 * What this person needs per month, net, after retiring.
 *
 * A mortgage that is repaid on or before the retirement date lowers the target
 * by its current net monthly payment: that money simply stops going out. This
 * is the home-equity effect, and it is labelled as an assumption in the UI
 * because the repayment date is itself a projection.
 */
export const computeTargetIncome = (
  picture: FinancialPicture,
  assumptions: Assumptions,
): TargetIncome => {
  const yearsToRetirement = Math.max(0, assumptions.retirementAge - picture.age)
  const retirementYear = REFERENCE_YEAR + yearsToRetirement

  const baseTarget = net(
    scale(picture.currentNetMonthlyIncome, assumptions.targetIncomePct),
  )

  const mortgagePaidOffBeforeRetirement =
    picture.mortgage !== null && picture.mortgage.paidOffYear <= retirementYear

  const mortgageOffset =
    assumptions.applyMortgageOffset &&
    mortgagePaidOffBeforeRetirement &&
    picture.mortgage !== null
      ? picture.mortgage.netMonthlyPayment
      : net(0)

  return {
    baseTarget,
    mortgageOffset,
    targetNet: net(Math.max(0, baseTarget - mortgageOffset)),
    mortgagePaidOffBeforeRetirement,
    retirementYear,
  }
}

/* -------------------------------------------------------------------------- */
/* Projection                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Run one scenario.
 *
 * `extraMonthlyContribution` is the amount the action-screen slider adds on top
 * of whatever the person already pays in.
 */
export const computeScenario = (
  picture: FinancialPicture,
  assumptions: Assumptions,
  scenario: Scenario,
  target: TargetIncome,
  extraMonthlyContribution: Cents = 0,
): ScenarioResult => {
  const months = monthsToRetirement(picture, assumptions)
  const annualReturn = assumptions.returns[scenario]

  const aow = AOW_NET_MONTHLY_2026[picture.household]

  const secondPillar: BreakdownLine[] = picture.secondPillar.map((item) => ({
    id: item.id,
    label: item.employer,
    amountNet: grossToNet(
      item.grossMonthlyAtRetirement,
      assumptions.retireeTaxRate,
    ),
    detail: item.toYear === null
      ? `${item.fromYear} – nu`
      : `${item.fromYear} – ${item.toYear}`,
  }))
  const secondPillarTotal = sumNet(
    ...secondPillar.map((line) => line.amountNet),
  )

  // Capital is tracked per source so the net income it buys can be attributed
  // back to each source without the parts drifting from the whole.
  const capitalFromBalance = growLumpSum(
    picture.vive.balance,
    months,
    annualReturn,
  )
  const capitalFromCurrentContribution = growMonthlyContributions(
    picture.vive.monthlyContribution,
    months,
    annualReturn,
  )
  const capitalFromExtraContribution = growMonthlyContributions(
    extraMonthlyContribution,
    months,
    annualReturn,
  )
  const viveCapitalAtRetirement =
    capitalFromBalance +
    capitalFromCurrentContribution +
    capitalFromExtraContribution

  const viveNet = grossToNet(
    capitalToGrossMonthlyIncome(viveCapitalAtRetirement, assumptions),
    assumptions.retireeTaxRate,
  )

  const [fromBalance, fromCurrentContribution, fromExtraContribution] =
    allocateCents(viveNet, [
      capitalFromBalance,
      capitalFromCurrentContribution,
      capitalFromExtraContribution,
    ])

  const projectedNet = sumNet(aow, secondPillarTotal, viveNet)
  const gapNet = net(target.targetNet - projectedNet)

  return {
    scenario,
    annualReturn,
    projectedNet,
    breakdown: {
      aow,
      secondPillar,
      secondPillarTotal,
      vive: viveNet,
    },
    viveCapitalAtRetirement,
    viveAttribution: {
      fromBalance: net(fromBalance),
      fromCurrentContribution: net(fromCurrentContribution),
      fromExtraContribution: net(fromExtraContribution),
    },
    gapNet,
    onTrack: gapNet <= 0,
  }
}

/* -------------------------------------------------------------------------- */
/* Cost of closing the gap                                                    */
/* -------------------------------------------------------------------------- */

/**
 * What it would cost per month to close `gapNet` in this scenario.
 *
 * Works backwards through the same chain the projection runs forwards:
 * net income → gross income → capital needed at retirement → monthly inleg.
 *
 * The jaarruimte figure comes from the persona data and is only used to
 * demonstrate the deductibility cap. It is not a real jaarruimte computation.
 */
export const computeRequiredContribution = (
  picture: FinancialPicture,
  assumptions: Assumptions,
  scenario: Scenario,
  gapNet: NetCents,
): RequiredContribution => {
  const deductibleMonthlyCeiling = Math.floor(picture.jaarruimteAnnual / 12)

  if (gapNet <= 0) {
    return {
      scenario,
      monthly: 0,
      extraCapitalNeeded: 0,
      deductibleMonthly: 0,
      nonDeductibleMonthly: 0,
      exceedsJaarruimte: false,
    }
  }

  const neededGrossIncome = netToGross(gapNet, assumptions.retireeTaxRate)
  const extraCapitalNeeded = grossMonthlyIncomeToCapital(
    neededGrossIncome,
    assumptions,
  )
  const monthly = solveMonthlyContribution(
    extraCapitalNeeded,
    monthsToRetirement(picture, assumptions),
    assumptions.returns[scenario],
  )

  const deductibleMonthly = Math.min(monthly, deductibleMonthlyCeiling)

  return {
    scenario,
    monthly,
    extraCapitalNeeded,
    deductibleMonthly,
    nonDeductibleMonthly: monthly - deductibleMonthly,
    exceedsJaarruimte: monthly * 12 > picture.jaarruimteAnnual,
  }
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The one function the UI calls.
 *
 * `scenarios` reflect `extraMonthlyContribution` so the action slider updates
 * them live. `required` is always measured from the untouched starting point,
 * so "closing this gap costs about €X per month" does not move as the user
 * drags the slider past it.
 */
export const analyseGap = (
  picture: FinancialPicture,
  assumptions: Assumptions,
  extraMonthlyContribution: Cents = 0,
): GapAnalysis => {
  const target = computeTargetIncome(picture, assumptions)

  const scenarios = {} as Record<Scenario, ScenarioResult>
  const required = {} as Record<Scenario, RequiredContribution>

  for (const scenario of SCENARIOS) {
    scenarios[scenario] = computeScenario(
      picture,
      assumptions,
      scenario,
      target,
      extraMonthlyContribution,
    )
    const baseline =
      extraMonthlyContribution === 0
        ? scenarios[scenario]
        : computeScenario(picture, assumptions, scenario, target, 0)
    required[scenario] = computeRequiredContribution(
      picture,
      assumptions,
      scenario,
      baseline.gapNet,
    )
  }

  const results = SCENARIOS.map((scenario) => scenarios[scenario])

  return {
    picture,
    assumptions,
    target,
    monthsToRetirement: monthsToRetirement(picture, assumptions),
    extraMonthlyContribution,
    scenarios,
    required,
    onTrackInAllScenarios: results.every((result) => result.onTrack),
    gapInAllScenarios: results.every((result) => !result.onTrack),
  }
}

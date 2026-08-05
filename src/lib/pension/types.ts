import type { Cents, GrossCents, NetCents } from './money'

/* -------------------------------------------------------------------------- */
/* Scenarios                                                                  */
/* -------------------------------------------------------------------------- */

/** Never show one number. Every projection is a band of these three. */
export type Scenario = 'pessimistic' | 'expected' | 'optimistic'

export const SCENARIOS = [
  'pessimistic',
  'expected',
  'optimistic',
] as const satisfies readonly Scenario[]

export const SCENARIO_LABELS_NL: Record<Scenario, string> = {
  pessimistic: 'Voorzichtig',
  expected: 'Verwacht',
  optimistic: 'Optimistisch',
}

/* -------------------------------------------------------------------------- */
/* Data that arrives from outside (Ockto / MPO / Belastingdienst / Kadaster)   */
/* -------------------------------------------------------------------------- */

export type Household = 'single' | 'partner'

/** One data source the user consents to, as shown on the consent screen. */
export type DataSource = {
  id: 'mijnpensioenoverzicht' | 'belastingdienst' | 'uwv' | 'kadaster'
  /** Party name as the user would recognise it. */
  party: string
  /** Exactly what is shared. Specific, not a category. */
  shares: string[]
  /** Why Vive needs it. */
  reason: string
}

/**
 * A second-pillar (employer) pension entitlement, one per employer.
 *
 * Mijnpensioenoverzicht reports these GROSS, so that is what we model. The
 * conversion to net happens once, in the calculation module, using a stated
 * assumption.
 */
export type SecondPillarEntitlement = {
  id: string
  employer: string
  fromYear: number
  /** `null` while still accruing at this employer. */
  toYear: number | null
  /** Projected gross monthly benefit from the retirement date. */
  grossMonthlyAtRetirement: GrossCents
  /** Optional context, e.g. a Wtp accrual change. */
  note?: string
}

export type Mortgage = {
  /** Net monthly payment today (interest + repayment, after tax relief). */
  netMonthlyPayment: NetCents
  /** Calendar year the mortgage is fully repaid. */
  paidOffYear: number
}

/** Current Vive third-pillar position. */
export type ViveAccount = {
  balance: Cents
  monthlyContribution: Cents
}

/**
 * Everything the app needs about one person, in one typed object.
 *
 * This is the boundary the real Ockto integration replaces. Nothing in the UI
 * or the calculation module knows where it came from.
 */
export type FinancialPicture = {
  personaId: string
  displayName: string
  /** One-line description used by the persona switcher. */
  summary: string
  age: number
  household: Household
  /** Net monthly income today. The basis for the target. */
  currentNetMonthlyIncome: NetCents
  secondPillar: SecondPillarEntitlement[]
  vive: ViveAccount
  /** `null` for renters. */
  mortgage: Mortgage | null
  /** Kadaster value, shown for context only; not used in the calculation. */
  homeValue: Cents | null
  /**
   * Mocked annual jaarruimte. Used only to demonstrate the deductibility cap.
   * Not a real jaarruimte computation.
   */
  jaarruimteAnnual: Cents
  sources: DataSource[]
}

/** The adapter the UI depends on. Swap the implementation, keep the screens. */
export type FinancialDataProvider = {
  getFinancialPicture(personaId: string): Promise<FinancialPicture>
}

/* -------------------------------------------------------------------------- */
/* Assumptions — every one of these is user-editable on /aannames             */
/* -------------------------------------------------------------------------- */

export type Assumptions = {
  /** Share of current net income aimed for at retirement. 0.50 – 1.00. */
  targetIncomePct: number
  /** AOW age used as the retirement date. */
  retirementAge: number
  /** Annual net return per scenario. */
  returns: Record<Scenario, number>
  /** Years the capital is paid out over after retirement. */
  payoutYears: number
  /** Annual return assumed during the payout phase. */
  payoutReturnRate: number
  /** Flat rate used for every gross → net conversion after retirement. */
  retireeTaxRate: number
  /** Whether a mortgage repaid before retirement lowers the target. */
  applyMortgageOffset: boolean
}

/** One editable assumption, described for the assumptions screen. */
export type AssumptionField = {
  key: string
  label: string
  /** Short B1-Dutch explanation of what this changes. */
  explanation: string
  min: number
  max: number
  step: number
  /** How the raw value is rendered, e.g. `4%` or `67 jaar`. */
  format: (value: number) => string
}

/* -------------------------------------------------------------------------- */
/* Calculation output                                                         */
/* -------------------------------------------------------------------------- */

export type TargetIncome = {
  /** targetIncomePct × current net income. */
  baseTarget: NetCents
  /** Amount subtracted because the mortgage is repaid before retirement. */
  mortgageOffset: NetCents
  /** What the person needs per month, net. `baseTarget − mortgageOffset`. */
  targetNet: NetCents
  mortgagePaidOffBeforeRetirement: boolean
  retirementYear: number
}

/** One line of the projected-income breakdown, for progressive disclosure. */
export type BreakdownLine = {
  id: string
  label: string
  /** Net monthly contribution to the projection. */
  amountNet: NetCents
  detail?: string
}

export type ScenarioResult = {
  scenario: Scenario
  annualReturn: number
  /** Net monthly income at retirement. The headline number. */
  projectedNet: NetCents
  /** Sums to exactly `projectedNet`. */
  breakdown: {
    aow: NetCents
    secondPillar: BreakdownLine[]
    secondPillarTotal: NetCents
    vive: NetCents
  }
  /** Projected Vive capital at the retirement date. */
  viveCapitalAtRetirement: Cents
  /**
   * `breakdown.vive` split across where it came from. Sums to exactly
   * `breakdown.vive`, so the action screen can show what the extra inleg adds
   * without the parts drifting from the whole.
   */
  viveAttribution: {
    fromBalance: NetCents
    fromCurrentContribution: NetCents
    fromExtraContribution: NetCents
  }
  /** `targetNet − projectedNet`. Negative means ahead of target. */
  gapNet: NetCents
  onTrack: boolean
}

export type RequiredContribution = {
  scenario: Scenario
  /** Extra monthly inleg that closes the gap in this scenario. */
  monthly: Cents
  /** Extra capital needed at the retirement date. */
  extraCapitalNeeded: Cents
  /** Portion of `monthly` that fits inside the mocked jaarruimte. */
  deductibleMonthly: Cents
  /** Portion above the jaarruimte. */
  nonDeductibleMonthly: Cents
  exceedsJaarruimte: boolean
}

export type GapAnalysis = {
  picture: FinancialPicture
  assumptions: Assumptions
  target: TargetIncome
  monthsToRetirement: number
  /** Extra monthly inleg this analysis was run with. */
  extraMonthlyContribution: Cents
  scenarios: Record<Scenario, ScenarioResult>
  required: Record<Scenario, RequiredContribution>
  /** True when even the pessimistic scenario clears the target. */
  onTrackInAllScenarios: boolean
  /** True when no scenario clears the target. */
  gapInAllScenarios: boolean
}

/**
 * Mock workforce for the employer dashboard.
 *
 * The privacy rule is enforced here, not in the UI: this module generates
 * individuals internally and exports ONLY aggregates. There is no exported way
 * to reach a single employee, so an employer view cannot accidentally render one.
 *
 * Any displayed segment smaller than {@link MIN_GROUP_SIZE} is returned with
 * `suppressed: true` and no number attached.
 */

import type { MessageKey } from '@/i18n/translations'
import {
  capitalToGrossMonthlyIncome,
  growMonthlyContributions,
  monthlyRate,
} from './calc'
import { euros, grossToNet, net, type Cents } from './money'
import type { Assumptions, Scenario } from './types'

/** No segment below this size is ever shown. Non-negotiable. */
export const MIN_GROUP_SIZE = 10

export const HEADCOUNT = 120

/* -------------------------------------------------------------------------- */
/* Internal population                                                        */
/* -------------------------------------------------------------------------- */

export type Cohort = 'young' | 'mid' | 'senior'

/** Cohort filter for the distribution chart. */
export type CohortFilter = Cohort | 'all'

type Employee = {
  age: number
  cohort: Cohort
  /** Net monthly gap today, before any employer contribution. */
  gapMonthly: Cents
  ranCheck: boolean
  acted: boolean
}

/** Message keys for the cohort ranges, resolved by the UI. */
export const COHORT_LABEL_KEYS: Record<Cohort, MessageKey> = {
  young: 'cohort.young',
  mid: 'cohort.mid',
  senior: 'cohort.senior',
}

export const COHORT_ORDER: Cohort[] = ['young', 'mid', 'senior']

/**
 * Deterministic generator. `Math.random` is avoided so the dashboard, the tests
 * and any screenshot all show the same workforce.
 */
const createRandom = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

type CohortSpec = {
  cohort: Cohort
  count: number
  minAge: number
  maxAge: number
  /** Share with no gap at all. */
  zeroShare: number
  /** Mean gap of those who do have one. Exponential, so a fat right tail. */
  meanGap: Cents
  ranCheckShare: number
  /** Share of those who ran the check and then acted. */
  actedShare: number
}

/**
 * Older cohorts carry visibly larger gaps. That is the Wtp compensation story:
 * the people whose accrual changed late have the least time to absorb it.
 */
const COHORT_SPECS: CohortSpec[] = [
  {
    cohort: 'young',
    count: 45,
    minAge: 22,
    maxAge: 34,
    zeroShare: 0.31,
    meanGap: euros(130),
    ranCheckShare: 0.5,
    actedShare: 0.34,
  },
  {
    cohort: 'mid',
    count: 45,
    minAge: 35,
    maxAge: 49,
    zeroShare: 0.14,
    meanGap: euros(300),
    ranCheckShare: 0.63,
    actedShare: 0.4,
  },
  {
    cohort: 'senior',
    count: 30,
    minAge: 50,
    maxAge: 64,
    zeroShare: 0.05,
    meanGap: euros(620),
    ranCheckShare: 0.78,
    actedShare: 0.46,
  },
]

/** Keeps the tail fat but not absurd. */
const MAX_GAP = euros(2000)

const buildWorkforce = (): Employee[] => {
  const random = createRandom(20260805)
  const employees: Employee[] = []

  for (const spec of COHORT_SPECS) {
    for (let index = 0; index < spec.count; index += 1) {
      const age =
        spec.minAge +
        Math.floor(random() * (spec.maxAge - spec.minAge + 1))

      let gapMonthly = 0
      if (random() >= spec.zeroShare) {
        // Exponential draw: most gaps small, a long tail of large ones.
        const draw = -Math.log(1 - random())
        gapMonthly = Math.min(MAX_GAP, Math.round(spec.meanGap * draw))
      }

      const ranCheck = random() < spec.ranCheckShare
      const acted = ranCheck && random() < spec.actedShare

      employees.push({ age, cohort: spec.cohort, gapMonthly, ranCheck, acted })
    }
  }

  return employees
}

/** Built once. The population never changes; only the what-if slider does. */
const WORKFORCE = buildWorkforce()

/* -------------------------------------------------------------------------- */
/* Gap buckets                                                                */
/* -------------------------------------------------------------------------- */

export type GapBucketId = 'none' | 'under100' | 'from100' | 'from300' | 'over500'

type BucketSpec = {
  id: GapBucketId
  labelKey: MessageKey
  /** Inclusive lower bound in cents. */
  min: Cents
  /** Exclusive upper bound in cents, or `null` for open-ended. */
  max: Cents | null
}

export const GAP_BUCKETS: BucketSpec[] = [
  { id: 'none', labelKey: 'bucket.none', min: 0, max: 1 },
  { id: 'under100', labelKey: 'bucket.under100', min: 1, max: euros(100) },
  { id: 'from100', labelKey: 'bucket.from100', min: euros(100), max: euros(300) },
  { id: 'from300', labelKey: 'bucket.from300', min: euros(300), max: euros(500) },
  { id: 'over500', labelKey: 'bucket.over500', min: euros(500), max: null },
]

const bucketFor = (gapMonthly: Cents): GapBucketId => {
  if (gapMonthly <= 0) return 'none'
  for (const bucket of GAP_BUCKETS) {
    if (bucket.id === 'none') continue
    if (gapMonthly >= bucket.min && (bucket.max === null || gapMonthly < bucket.max)) {
      return bucket.id
    }
  }
  return 'over500'
}

/* -------------------------------------------------------------------------- */
/* What-if: the effect of an employer contribution                            */
/* -------------------------------------------------------------------------- */

/**
 * Net monthly income an extra contribution buys for someone this age.
 *
 * Same chain the employee side uses — contributions compound to a capital sum,
 * the capital converts to a gross annuity, the annuity converts to net — so the
 * two views cannot disagree.
 */
const extraNetIncomeFor = (
  age: number,
  extraMonthly: Cents,
  assumptions: Assumptions,
  scenario: Scenario,
): Cents => {
  if (extraMonthly <= 0) return 0
  const months = Math.max(0, Math.round((assumptions.retirementAge - age) * 12))
  const capital = growMonthlyContributions(
    extraMonthly,
    months,
    assumptions.returns[scenario],
  )
  return grossToNet(
    capitalToGrossMonthlyIncome(capital, assumptions),
    assumptions.retireeTaxRate,
  )
}

/* -------------------------------------------------------------------------- */
/* Aggregates — the only thing this module exposes                            */
/* -------------------------------------------------------------------------- */

export type Segment = {
  /** Message key for the segment's label. The UI resolves it. */
  labelKey: MessageKey
  count: number
  /** True when the group is below MIN_GROUP_SIZE. No number may be shown. */
  suppressed: boolean
}

export type CohortSegment = Segment & {
  cohortId: Cohort
  /** Average gap of everyone in the cohort. `null` when suppressed. */
  averageGapMonthly: Cents | null
}

export type DistributionSegment = Segment & {
  bucketId: GapBucketId
}

export type WorkforceAggregates = {
  headcount: number
  /** Share of the workforce with any gap at all. */
  withGapShare: number
  /** Average gap among those who have one. `null` when that group is too small. */
  averageGapOfThoseWithGap: Cents | null
  ranCheckShare: number
  actedShare: number
  /**
   * Distribution over the filtered group. Buckets below the minimum size arrive
   * suppressed, which is exactly what narrowing the filter tends to cause.
   */
  distribution: DistributionSegment[]
  /** Always the whole workforce, so the cohort chart stays an overview. */
  cohorts: CohortSegment[]
  /** Which cohort the distribution was narrowed to. */
  filter: CohortFilter
  /** Size of the filtered group. */
  filteredCount: number
  /** True when the filtered group itself is below the minimum size. */
  filterSuppressed: boolean
}

const averageCents = (values: Cents[]): Cents =>
  values.length === 0
    ? 0
    : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)

/**
 * Aggregate the workforce, optionally with an extra employer contribution per
 * employee applied first.
 */
export const aggregateWorkforce = (
  assumptions: Assumptions,
  scenario: Scenario,
  extraMonthlyPerEmployee: Cents = 0,
  filter: CohortFilter = 'all',
): WorkforceAggregates => {
  const adjusted = WORKFORCE.map((employee) => {
    const relief = extraNetIncomeFor(
      employee.age,
      extraMonthlyPerEmployee,
      assumptions,
      scenario,
    )
    return { ...employee, gapMonthly: Math.max(0, employee.gapMonthly - relief) }
  })

  const withGap = adjusted.filter((employee) => employee.gapMonthly > 0)

  const filtered =
    filter === 'all'
      ? adjusted
      : adjusted.filter((employee) => employee.cohort === filter)

  // Narrowing far enough that the group itself is too small hides everything.
  const filterSuppressed = filtered.length > 0 && filtered.length < MIN_GROUP_SIZE

  const distribution: DistributionSegment[] = GAP_BUCKETS.map((bucket) => {
    const count = filtered.filter(
      (employee) => bucketFor(employee.gapMonthly) === bucket.id,
    ).length
    return {
      bucketId: bucket.id,
      labelKey: bucket.labelKey,
      count,
      // A bucket that is non-empty but tiny would narrow people down. Hide it.
      suppressed:
        filterSuppressed || (count > 0 && count < MIN_GROUP_SIZE),
    }
  })

  const cohorts: CohortSegment[] = COHORT_ORDER.map((cohortId) => {
    const members = adjusted.filter((employee) => employee.cohort === cohortId)
    const suppressed = members.length > 0 && members.length < MIN_GROUP_SIZE
    return {
      cohortId,
      labelKey: COHORT_LABEL_KEYS[cohortId],
      count: members.length,
      suppressed,
      averageGapMonthly: suppressed
        ? null
        : averageCents(members.map((employee) => employee.gapMonthly)),
    }
  })

  return {
    headcount: adjusted.length,
    withGapShare: withGap.length / adjusted.length,
    averageGapOfThoseWithGap:
      withGap.length >= MIN_GROUP_SIZE
        ? averageCents(withGap.map((employee) => employee.gapMonthly))
        : null,
    ranCheckShare:
      adjusted.filter((employee) => employee.ranCheck).length / adjusted.length,
    actedShare:
      adjusted.filter((employee) => employee.acted).length / adjusted.length,
    distribution,
    cohorts,
    filter,
    filteredCount: filtered.length,
    filterSuppressed,
  }
}

/**
 * Filter options for the distribution chart. `all` gets its own label; the
 * cohorts reuse their range key, which the UI wraps in "… jaar" / "age …".
 */
export const COHORT_FILTER_OPTIONS: {
  id: CohortFilter
  labelKey: MessageKey
}[] = [
  { id: 'all', labelKey: 'employer.filter.all' },
  ...COHORT_ORDER.map((cohortId) => ({
    id: cohortId as CohortFilter,
    labelKey: COHORT_LABEL_KEYS[cohortId],
  })),
]

/** Bounds for the employer what-if slider, in euros per month per employee. */
export const EMPLOYER_CONTRIBUTION_BOUNDS = {
  min: 25,
  max: 200,
  step: 5,
} as const

/**
 * Re-exported so the dashboard can state the compounding assumption it shares
 * with the employee side rather than restating it in copy.
 */
export { monthlyRate }

/** Net-basis helper kept alongside so the two views format identically. */
export const asNet = net

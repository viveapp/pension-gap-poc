import { describe, expect, it } from 'vitest'

import { DEFAULT_ASSUMPTIONS } from './constants'
import { euros } from './money'
import { SCENARIOS } from './types'
import {
  COHORT_ORDER,
  EMPLOYER_CONTRIBUTION_BOUNDS,
  GAP_BUCKETS,
  HEADCOUNT,
  MIN_GROUP_SIZE,
  aggregateWorkforce,
} from './workforce'

const contributionLevels = [0, 25, 50, 75, 100, 125, 150, 175, 200]

const aggregate = (extraEuros = 0, scenario: 'expected' | 'pessimistic' | 'optimistic' = 'expected') =>
  aggregateWorkforce(DEFAULT_ASSUMPTIONS, scenario, euros(extraEuros))

describe('mock workforce', () => {
  it('is deterministic across calls', () => {
    expect(aggregate()).toEqual(aggregate())
  })

  it('has roughly 120 employees', () => {
    expect(aggregate().headcount).toBe(HEADCOUNT)
    expect(aggregate().headcount).toBe(120)
  })

  it('puts every employee in exactly one gap bucket', () => {
    for (const extra of contributionLevels) {
      const { distribution, headcount } = aggregate(extra)
      expect(distribution).toHaveLength(GAP_BUCKETS.length)
      expect(
        distribution.reduce((sum, segment) => sum + segment.count, 0),
      ).toBe(headcount)
    }
  })

  it('puts every employee in exactly one cohort', () => {
    const { cohorts, headcount } = aggregate()
    expect(cohorts.map((cohort) => cohort.cohortId)).toEqual(COHORT_ORDER)
    expect(cohorts.reduce((sum, cohort) => sum + cohort.count, 0)).toBe(headcount)
  })

  it('is skewed: most gaps small, a fat tail of large ones', () => {
    const { distribution } = aggregate()
    const count = (id: string) =>
      distribution.find((segment) => segment.bucketId === id)?.count ?? 0

    // More people under 300 than over it, but the tail is not empty.
    expect(count('under100') + count('from100')).toBeGreaterThan(
      count('from300') + count('over500'),
    )
    expect(count('over500')).toBeGreaterThan(0)
  })

  it('shows the largest average gap in the 50+ cohort', () => {
    const { cohorts } = aggregate()
    const [young, mid, senior] = cohorts

    // No cohort is suppressed at this size, so all three carry a number.
    expect(young.averageGapMonthly).not.toBeNull()
    expect(mid.averageGapMonthly).not.toBeNull()
    expect(senior.averageGapMonthly).not.toBeNull()

    expect(senior.averageGapMonthly!).toBeGreaterThan(mid.averageGapMonthly!)
    expect(mid.averageGapMonthly!).toBeGreaterThan(young.averageGapMonthly!)
  })

  it('reports plausible engagement rates', () => {
    const { ranCheckShare, actedShare } = aggregate()
    expect(ranCheckShare).toBeGreaterThan(0.4)
    expect(ranCheckShare).toBeLessThan(0.9)
    // You cannot act without having run the check.
    expect(actedShare).toBeLessThan(ranCheckShare)
    expect(actedShare).toBeGreaterThan(0)
  })
})

describe('privacy rule', () => {
  it('never exposes a number for a group below the minimum size', () => {
    for (const scenario of SCENARIOS) {
      for (const extra of contributionLevels) {
        const { distribution, cohorts } = aggregate(extra, scenario)

        for (const segment of [...distribution, ...cohorts]) {
          // The rule: non-empty but smaller than the minimum means suppressed.
          expect(segment.suppressed).toBe(
            segment.count > 0 && segment.count < MIN_GROUP_SIZE,
          )
        }

        for (const cohort of cohorts) {
          if (cohort.suppressed) expect(cohort.averageGapMonthly).toBeNull()
          else expect(cohort.averageGapMonthly).not.toBeNull()
        }
      }
    }
  })

  it('suppresses the average gap when too few people still have one', () => {
    // A large contribution empties the tail; at some point the remaining group
    // with a gap drops below the minimum and the average must disappear.
    const generous = aggregateWorkforce(
      DEFAULT_ASSUMPTIONS,
      'optimistic',
      euros(5000),
    )
    expect(generous.withGapShare * generous.headcount).toBeLessThan(
      MIN_GROUP_SIZE,
    )
    expect(generous.averageGapOfThoseWithGap).toBeNull()
  })

  it('suppresses small buckets once the cohort filter narrows the group', () => {
    const all = aggregateWorkforce(DEFAULT_ASSUMPTIONS, 'expected', 0, 'all')
    const senior = aggregateWorkforce(
      DEFAULT_ASSUMPTIONS,
      'expected',
      0,
      'senior',
    )

    expect(all.filteredCount).toBe(120)
    expect(senior.filteredCount).toBeLessThan(all.filteredCount)
    expect(senior.filter).toBe('senior')

    // Narrowing to one cohort pushes at least one non-empty bucket under the
    // minimum group size, which is precisely what must be hidden.
    const hidden = senior.distribution.filter((segment) => segment.suppressed)
    expect(hidden.length).toBeGreaterThan(0)
    for (const segment of hidden) {
      expect(segment.count).toBeGreaterThan(0)
      expect(segment.count).toBeLessThan(MIN_GROUP_SIZE)
    }

    // The cohort chart stays an overview of the whole workforce regardless.
    expect(senior.cohorts).toEqual(all.cohorts)
  })

  it('actually demonstrates suppression somewhere in the slider range', () => {
    const anySuppressed = contributionLevels.some((extra) =>
      aggregate(extra).distribution.some((segment) => segment.suppressed),
    )
    expect(anySuppressed).toBe(true)
  })

  it('exposes no per-employee data on the aggregate object', () => {
    const aggregates = aggregate()
    const keys = Object.keys(aggregates)
    expect(keys).not.toContain('employees')
    // Nothing exposed is long enough to be a per-person list.
    for (const value of Object.values(aggregates)) {
      if (Array.isArray(value)) {
        expect(value.length).toBeLessThan(MIN_GROUP_SIZE)
      }
    }
  })
})

describe('employer what-if', () => {
  it('shrinks the share with a gap as the contribution rises', () => {
    let previous = Number.POSITIVE_INFINITY
    for (const extra of contributionLevels) {
      const { withGapShare } = aggregate(extra)
      expect(withGapShare).toBeLessThanOrEqual(previous)
      previous = withGapShare
    }
    expect(aggregate(200).withGapShare).toBeLessThan(aggregate(0).withGapShare)
  })

  it('helps more in the optimistic scenario than the pessimistic one', () => {
    const extra = EMPLOYER_CONTRIBUTION_BOUNDS.max
    expect(aggregate(extra, 'optimistic').withGapShare).toBeLessThanOrEqual(
      aggregate(extra, 'pessimistic').withGapShare,
    )
  })

  it('changes nothing at zero contribution', () => {
    expect(aggregate(0, 'pessimistic').withGapShare).toBe(
      aggregate(0, 'optimistic').withGapShare,
    )
  })

  it('closes the youngest cohorts gap most completely, given their horizon', () => {
    const before = aggregate(0).cohorts
    const after = aggregate(EMPLOYER_CONTRIBUTION_BOUNDS.max).cohorts

    // The absolute reduction is capped by the starting gap, and the senior
    // cohort starts far higher — so compare the share of the gap removed.
    const shareClosed = (index: number) =>
      1 - after[index].averageGapMonthly! / before[index].averageGapMonthly!

    expect(shareClosed(0)).toBeGreaterThan(shareClosed(2))
    // The same euro amount over ~35 years wipes the young cohort's gap out.
    expect(after[0].averageGapMonthly!).toBeLessThan(euros(15))
    // The senior cohort still has a substantial gap left.
    expect(after[2].averageGapMonthly!).toBeGreaterThan(euros(300))
  })

  it('keeps the slider bounds inside the documented range', () => {
    expect(EMPLOYER_CONTRIBUTION_BOUNDS.min).toBe(25)
    expect(EMPLOYER_CONTRIBUTION_BOUNDS.max).toBe(200)
  })
})

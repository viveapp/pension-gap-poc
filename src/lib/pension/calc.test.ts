import { describe, expect, it } from 'vitest'

import {
  analyseGap,
  capitalToGrossMonthlyIncome,
  computeRequiredContribution,
  computeScenario,
  computeTargetIncome,
  grossMonthlyIncomeToCapital,
  growLumpSum,
  growMonthlyContributions,
  monthlyRate,
  monthsToRetirement,
  solveMonthlyContribution,
} from './calc'
import { AOW_NET_MONTHLY_2026, DEFAULT_ASSUMPTIONS } from './constants'
import {
  allocateCents,
  euros,
  formatEuros,
  gross,
  grossToNet,
  net,
  netToGross,
} from './money'
import { translate } from '@/i18n/translations'
import { LOCALES } from '@/i18n/types'
import { PERSONAS, findPersona } from './personas'
import { SCENARIOS, type Assumptions, type FinancialPicture } from './types'

const persona = (id: string): FinancialPicture => {
  const found = findPersona(id)
  if (!found) throw new Error(`test persona ${id} missing`)
  return found
}

const emma = persona('emma')
const mark = persona('mark')
const fatima = persona('fatima')
const daan = persona('daan')

const withAssumptions = (overrides: Partial<Assumptions>): Assumptions => ({
  ...DEFAULT_ASSUMPTIONS,
  ...overrides,
})

/* -------------------------------------------------------------------------- */

describe('integer-cent allocation', () => {
  it('always sums to exactly the total', () => {
    const weights = [3331, 1117, 5552]
    for (let total = 0; total < 500; total += 1) {
      const parts = allocateCents(total, weights)
      expect(parts.reduce((sum, part) => sum + part, 0)).toBe(total)
    }
  })

  it('gives the whole remainder to the largest bucket', () => {
    // Exact split, nothing left over.
    expect(allocateCents(100, [1, 2, 1])).toEqual([25, 50, 25])
    // 33.33 each -> floors to 33, 33, 33, leaving 1 cent for the largest.
    expect(allocateCents(100, [1, 1, 1])).toEqual([34, 33, 33])
    // Two cents left over, both to the single largest bucket (index 2).
    expect(allocateCents(100, [1, 1, 4])).toEqual([16, 16, 68])
  })

  it('returns zeros when every weight is zero rather than dividing by zero', () => {
    expect(allocateCents(1234, [0, 0, 0])).toEqual([0, 0, 0])
  })

  it('keeps the invariant for negative totals', () => {
    const parts = allocateCents(-101, [1, 1, 1])
    expect(parts.reduce((sum, part) => sum + part, 0)).toBe(-101)
  })

  it('rejects negative weights', () => {
    expect(() => allocateCents(100, [1, -1])).toThrow(RangeError)
  })

  it('keeps everything on whole cents', () => {
    for (const part of allocateCents(9999, [7, 11, 13])) {
      expect(Number.isInteger(part)).toBe(true)
    }
  })
})

describe('net / gross basis', () => {
  it('round-trips a net amount back to itself through gross', () => {
    const amount = net(euros(1372.91))
    const backAndForth = grossToNet(
      netToGross(amount, DEFAULT_ASSUMPTIONS.retireeTaxRate),
      DEFAULT_ASSUMPTIONS.retireeTaxRate,
    )
    expect(Math.abs(backAndForth - amount)).toBeLessThanOrEqual(1)
  })

  it('never treats a gross entitlement as if it were net', () => {
    const target = computeTargetIncome(fatima, DEFAULT_ASSUMPTIONS)
    const result = computeScenario(
      fatima,
      DEFAULT_ASSUMPTIONS,
      'expected',
      target,
    )

    const grossTotal = fatima.secondPillar.reduce(
      (sum, item) => sum + item.grossMonthlyAtRetirement,
      0,
    )

    // The projection must be strictly below the gross sum, and must equal the
    // gross sum net of the stated retiree tax rate.
    expect(result.breakdown.secondPillarTotal).toBeLessThan(grossTotal)
    expect(result.breakdown.secondPillarTotal).toBe(
      Math.round(grossTotal * (1 - DEFAULT_ASSUMPTIONS.retireeTaxRate)),
    )
  })

  it('quotes AOW net, so a zero-tax assumption does not change it', () => {
    const target = computeTargetIncome(emma, DEFAULT_ASSUMPTIONS)
    const taxed = computeScenario(emma, DEFAULT_ASSUMPTIONS, 'expected', target)
    const untaxed = computeScenario(
      emma,
      withAssumptions({ retireeTaxRate: 0 }),
      'expected',
      target,
    )
    expect(taxed.breakdown.aow).toBe(AOW_NET_MONTHLY_2026.single)
    expect(untaxed.breakdown.aow).toBe(AOW_NET_MONTHLY_2026.single)
  })

  it('lowering the retiree tax rate can only raise the projection', () => {
    const target = computeTargetIncome(mark, DEFAULT_ASSUMPTIONS)
    const high = computeScenario(
      mark,
      withAssumptions({ retireeTaxRate: 0.3 }),
      'expected',
      target,
    )
    const low = computeScenario(
      mark,
      withAssumptions({ retireeTaxRate: 0.1 }),
      'expected',
      target,
    )
    expect(low.projectedNet).toBeGreaterThan(high.projectedNet)
  })
})

describe('target income', () => {
  it('defaults to 70% of current net income', () => {
    const target = computeTargetIncome(daan, DEFAULT_ASSUMPTIONS)
    expect(target.baseTarget).toBe(euros(3800 * 0.7))
    expect(target.mortgageOffset).toBe(0)
    expect(target.targetNet).toBe(target.baseTarget)
  })

  it('follows the target percentage slider', () => {
    const low = computeTargetIncome(daan, withAssumptions({ targetIncomePct: 0.5 }))
    const high = computeTargetIncome(daan, withAssumptions({ targetIncomePct: 1 }))
    expect(low.targetNet).toBe(euros(1900))
    expect(high.targetNet).toBe(euros(3800))
  })

  it('subtracts the mortgage payment when the mortgage ends before retirement', () => {
    const target = computeTargetIncome(mark, DEFAULT_ASSUMPTIONS)
    expect(target.retirementYear).toBe(2048)
    expect(target.mortgagePaidOffBeforeRetirement).toBe(true)
    expect(target.mortgageOffset).toBe(euros(950))
    expect(target.targetNet).toBe(euros(4500 * 0.7) - euros(950))
  })

  it('does not subtract it when the mortgage runs past retirement', () => {
    const target = computeTargetIncome(fatima, DEFAULT_ASSUMPTIONS)
    expect(target.retirementYear).toBe(2038)
    expect(target.mortgagePaidOffBeforeRetirement).toBe(false)
    expect(target.mortgageOffset).toBe(0)
    expect(target.targetNet).toBe(euros(6200 * 0.7))
  })

  it('can have the offset switched off as an assumption', () => {
    const target = computeTargetIncome(
      mark,
      withAssumptions({ applyMortgageOffset: false }),
    )
    // The fact is still reported, it just is not applied.
    expect(target.mortgagePaidOffBeforeRetirement).toBe(true)
    expect(target.mortgageOffset).toBe(0)
    expect(target.targetNet).toBe(target.baseTarget)
  })

  it('reacts to a changed retirement age, which can flip the offset', () => {
    // Retiring at 62 means 2043, before Mark's mortgage ends in 2045.
    const target = computeTargetIncome(mark, withAssumptions({ retirementAge: 62 }))
    expect(target.retirementYear).toBe(2043)
    expect(target.mortgagePaidOffBeforeRetirement).toBe(false)
    expect(target.targetNet).toBe(target.baseTarget)
  })

  it('never returns a negative target', () => {
    const heavyMortgage: FinancialPicture = {
      ...mark,
      currentNetMonthlyIncome: net(euros(1000)),
      mortgage: { netMonthlyPayment: net(euros(5000)), paidOffYear: 2030 },
    }
    expect(computeTargetIncome(heavyMortgage, DEFAULT_ASSUMPTIONS).targetNet).toBe(0)
  })
})

describe('annuity primitives', () => {
  it('compounds monthly rather than dividing the annual rate by twelve', () => {
    const rate = monthlyRate(0.04)
    expect(Math.pow(1 + rate, 12)).toBeCloseTo(1.04, 10)
    expect(rate).toBeLessThan(0.04 / 12)
  })

  it('handles a zero rate without dividing by zero', () => {
    expect(monthlyRate(0)).toBe(0)
    expect(growLumpSum(euros(1000), 120, 0)).toBe(euros(1000))
    expect(growMonthlyContributions(euros(100), 120, 0)).toBe(euros(12000))
  })

  it('grows a lump sum by the annual rate over a year', () => {
    expect(growLumpSum(euros(10000), 12, 0.04)).toBe(euros(10400))
  })

  it('round-trips capital to income and back', () => {
    const capital = euros(97557)
    const income = capitalToGrossMonthlyIncome(capital, DEFAULT_ASSUMPTIONS)
    const backAgain = grossMonthlyIncomeToCapital(income, DEFAULT_ASSUMPTIONS)
    expect(Math.abs(backAgain - capital)).toBeLessThanOrEqual(euros(1))
  })

  it('pays out exactly the capital when the payout return is zero', () => {
    const flat = { payoutYears: 20, payoutReturnRate: 0 }
    expect(capitalToGrossMonthlyIncome(euros(24000), flat)).toBe(euros(100))
  })

  it('returns zero income for zero or negative capital', () => {
    expect(capitalToGrossMonthlyIncome(0, DEFAULT_ASSUMPTIONS)).toBe(0)
    expect(capitalToGrossMonthlyIncome(-500, DEFAULT_ASSUMPTIONS)).toBe(0)
  })

  it('solves a monthly contribution that actually reaches the target capital', () => {
    for (const months of [12, 144, 264, 456]) {
      for (const rate of [0, 0.02, 0.04, 0.06]) {
        const targetCapital = euros(100000)
        const monthly = solveMonthlyContribution(targetCapital, months, rate)
        const reached = growMonthlyContributions(monthly, months, rate)
        expect(reached).toBeGreaterThanOrEqual(targetCapital)
        // Rounding up must not overshoot by more than a single month's inleg.
        expect(reached - targetCapital).toBeLessThan(monthly + euros(1))
      }
    }
  })

  it('needs no contribution when there is no gap to close', () => {
    expect(solveMonthlyContribution(0, 264, 0.04)).toBe(0)
    expect(solveMonthlyContribution(-euros(500), 264, 0.04)).toBe(0)
  })

  it('requires the full amount when there is no time left', () => {
    expect(solveMonthlyContribution(euros(1000), 0, 0.04)).toBe(euros(1000))
  })

  it('needs a smaller contribution the longer the horizon', () => {
    const short = solveMonthlyContribution(euros(100000), 144, 0.04)
    const long = solveMonthlyContribution(euros(100000), 456, 0.04)
    expect(long).toBeLessThan(short)
  })
})

describe('scenario bands', () => {
  it.each(PERSONAS.map((p) => [p.displayName, p] as const))(
    'orders the band pessimistic <= expected <= optimistic for %s',
    (_name, picture) => {
      const analysis = analyseGap(picture, DEFAULT_ASSUMPTIONS)
      const { pessimistic, expected, optimistic } = analysis.scenarios

      expect(pessimistic.projectedNet).toBeLessThanOrEqual(expected.projectedNet)
      expect(expected.projectedNet).toBeLessThanOrEqual(optimistic.projectedNet)

      // A bigger projection means a smaller gap, by construction.
      expect(pessimistic.gapNet).toBeGreaterThanOrEqual(expected.gapNet)
      expect(expected.gapNet).toBeGreaterThanOrEqual(optimistic.gapNet)

      // And a smaller gap costs less to close.
      expect(analysis.required.pessimistic.monthly).toBeGreaterThanOrEqual(
        analysis.required.expected.monthly,
      )
      expect(analysis.required.expected.monthly).toBeGreaterThanOrEqual(
        analysis.required.optimistic.monthly,
      )
    },
  )

  it('uses the three configured rates and nothing else', () => {
    const analysis = analyseGap(mark, DEFAULT_ASSUMPTIONS)
    expect(analysis.scenarios.pessimistic.annualReturn).toBe(0.02)
    expect(analysis.scenarios.expected.annualReturn).toBe(0.04)
    expect(analysis.scenarios.optimistic.annualReturn).toBe(0.06)
  })

  it('follows edited scenario rates', () => {
    const analysis = analyseGap(
      mark,
      withAssumptions({ returns: { pessimistic: 0, expected: 0.01, optimistic: 0.02 } }),
    )
    expect(analysis.scenarios.optimistic.annualReturn).toBe(0.02)
    expect(analysis.scenarios.optimistic.projectedNet).toBeLessThan(
      analyseGap(mark, DEFAULT_ASSUMPTIONS).scenarios.optimistic.projectedNet,
    )
  })
})

describe('breakdown adds up', () => {
  it.each(PERSONAS.map((p) => [p.displayName, p] as const))(
    'sums the breakdown to exactly the headline for %s',
    (_name, picture) => {
      for (const scenario of SCENARIOS) {
        const target = computeTargetIncome(picture, DEFAULT_ASSUMPTIONS)
        const result = computeScenario(
          picture,
          DEFAULT_ASSUMPTIONS,
          scenario,
          target,
          euros(75),
        )
        const { aow, secondPillarTotal, vive, secondPillar } = result.breakdown

        expect(aow + secondPillarTotal + vive).toBe(result.projectedNet)
        expect(
          secondPillar.reduce((sum, line) => sum + line.amountNet, 0),
        ).toBe(secondPillarTotal)

        const attribution = result.viveAttribution
        expect(
          attribution.fromBalance +
            attribution.fromCurrentContribution +
            attribution.fromExtraContribution,
        ).toBe(vive)
      }
    },
  )

  it('attributes nothing to extra inleg when the slider is at zero', () => {
    const target = computeTargetIncome(mark, DEFAULT_ASSUMPTIONS)
    const result = computeScenario(mark, DEFAULT_ASSUMPTIONS, 'expected', target, 0)
    expect(result.viveAttribution.fromExtraContribution).toBe(0)
  })

  it('lists one breakdown line per employer, and none for a ZZPer', () => {
    const target = computeTargetIncome(mark, DEFAULT_ASSUMPTIONS)
    const marks = computeScenario(mark, DEFAULT_ASSUMPTIONS, 'expected', target)
    expect(marks.breakdown.secondPillar).toHaveLength(4)

    const daansTarget = computeTargetIncome(daan, DEFAULT_ASSUMPTIONS)
    const daans = computeScenario(daan, DEFAULT_ASSUMPTIONS, 'expected', daansTarget)
    expect(daans.breakdown.secondPillar).toHaveLength(0)
    expect(daans.breakdown.secondPillarTotal).toBe(0)
  })
})

describe('closing the gap', () => {
  it.each(PERSONAS.map((p) => [p.displayName, p] as const))(
    'the required contribution really does close the gap for %s',
    (_name, picture) => {
      const baseline = analyseGap(picture, DEFAULT_ASSUMPTIONS)

      for (const scenario of SCENARIOS) {
        const { monthly } = baseline.required[scenario]
        if (monthly === 0) {
          expect(baseline.scenarios[scenario].onTrack).toBe(true)
          continue
        }
        const closed = analyseGap(picture, DEFAULT_ASSUMPTIONS, monthly)
        expect(closed.scenarios[scenario].onTrack).toBe(true)
        // Closed, and not wildly overshot by rounding.
        expect(closed.scenarios[scenario].gapNet).toBeLessThanOrEqual(0)
        expect(closed.scenarios[scenario].gapNet).toBeGreaterThan(-euros(2))
      }
    },
  )

  it('keeps the cost-to-close fixed as the slider moves', () => {
    const atZero = analyseGap(mark, DEFAULT_ASSUMPTIONS, 0)
    const atTwoHundred = analyseGap(mark, DEFAULT_ASSUMPTIONS, euros(200))
    expect(atTwoHundred.required.expected.monthly).toBe(
      atZero.required.expected.monthly,
    )
    // But the projection itself does move.
    expect(atTwoHundred.scenarios.expected.projectedNet).toBeGreaterThan(
      atZero.scenarios.expected.projectedNet,
    )
  })

  it('shrinks the gap monotonically as the extra inleg rises', () => {
    let previous = Number.POSITIVE_INFINITY
    for (const extra of [0, 50, 100, 200, 400, 800]) {
      const gap = analyseGap(mark, DEFAULT_ASSUMPTIONS, euros(extra)).scenarios
        .expected.gapNet
      expect(gap).toBeLessThan(previous)
      previous = gap
    }
  })

  it('asks for nothing and celebrates when already ahead of target', () => {
    const wealthy: FinancialPicture = {
      ...emma,
      currentNetMonthlyIncome: net(euros(1600)),
      vive: { balance: euros(200000), monthlyContribution: euros(500) },
    }
    const analysis = analyseGap(wealthy, DEFAULT_ASSUMPTIONS)
    expect(analysis.onTrackInAllScenarios).toBe(true)
    expect(analysis.scenarios.expected.gapNet).toBeLessThan(0)
    expect(analysis.required.expected.monthly).toBe(0)
    expect(analysis.required.expected.exceedsJaarruimte).toBe(false)
  })
})

describe('jaarruimte cap', () => {
  it('splits the contribution at the jaarruimte for Fatima', () => {
    const analysis = analyseGap(fatima, DEFAULT_ASSUMPTIONS)
    const required = analysis.required.expected

    expect(required.exceedsJaarruimte).toBe(true)
    expect(required.monthly * 12).toBeGreaterThan(fatima.jaarruimteAnnual)
    expect(required.deductibleMonthly).toBe(
      Math.floor(fatima.jaarruimteAnnual / 12),
    )
    expect(required.nonDeductibleMonthly).toBeGreaterThan(0)
    expect(required.deductibleMonthly + required.nonDeductibleMonthly).toBe(
      required.monthly,
    )
  })

  it('stays inside the jaarruimte for the other personas', () => {
    for (const picture of [emma, mark, daan]) {
      const required = analyseGap(picture, DEFAULT_ASSUMPTIONS).required.expected
      expect(required.exceedsJaarruimte).toBe(false)
      expect(required.nonDeductibleMonthly).toBe(0)
      expect(required.deductibleMonthly).toBe(required.monthly)
    }
  })

  it('caps at zero when there is no jaarruimte at all', () => {
    const noRoom: FinancialPicture = { ...daan, jaarruimteAnnual: 0 }
    const required = analyseGap(noRoom, DEFAULT_ASSUMPTIONS).required.expected
    expect(required.exceedsJaarruimte).toBe(true)
    expect(required.deductibleMonthly).toBe(0)
    expect(required.nonDeductibleMonthly).toBe(required.monthly)
  })

  it('reports no cap when nothing needs to be contributed', () => {
    const required = computeRequiredContribution(
      fatima,
      DEFAULT_ASSUMPTIONS,
      'expected',
      net(-euros(100)),
    )
    expect(required.monthly).toBe(0)
    expect(required.exceedsJaarruimte).toBe(false)
  })
})

describe('persona sanity', () => {
  it('gives Emma a small gap she can close for about fifty euro a month', () => {
    const analysis = analyseGap(emma, DEFAULT_ASSUMPTIONS)
    expect(analysis.scenarios.expected.gapNet).toBeGreaterThan(euros(150))
    expect(analysis.scenarios.expected.gapNet).toBeLessThan(euros(300))
    expect(analysis.required.expected.monthly).toBeGreaterThan(euros(30))
    expect(analysis.required.expected.monthly).toBeLessThan(euros(65))
  })

  it('gives Mark a gap in the 300-500 euro bucket', () => {
    const gap = analyseGap(mark, DEFAULT_ASSUMPTIONS).scenarios.expected.gapNet
    expect(gap).toBeGreaterThan(euros(300))
    expect(gap).toBeLessThanOrEqual(euros(500))
  })

  it('carries a Wtp note on Marks current accrual, in both languages', () => {
    const current = mark.secondPillar.find((item) => item.toYear === null)
    expect(current?.noteKey).toBeDefined()
    for (const locale of LOCALES) {
      expect(translate(locale, current!.noteKey!)).toMatch(/2027/)
    }
  })

  it('gives Daan the biggest gap relative to his target', () => {
    const share = (picture: FinancialPicture) => {
      const analysis = analyseGap(picture, DEFAULT_ASSUMPTIONS)
      return analysis.scenarios.expected.gapNet / analysis.target.targetNet
    }
    const daansShare = share(daan)
    for (const other of [emma, mark, fatima]) {
      expect(daansShare).toBeGreaterThan(share(other))
    }
  })

  it('has every persona short of target in every scenario', () => {
    for (const picture of PERSONAS) {
      expect(analyseGap(picture, DEFAULT_ASSUMPTIONS).gapInAllScenarios).toBe(true)
    }
  })

  it('counts the months to retirement from the reference year', () => {
    expect(monthsToRetirement(emma, DEFAULT_ASSUMPTIONS)).toBe((67 - 29) * 12)
    expect(monthsToRetirement(fatima, DEFAULT_ASSUMPTIONS)).toBe((67 - 55) * 12)
  })

  it('clamps the horizon at zero for someone already past the retirement age', () => {
    const retired: FinancialPicture = { ...fatima, age: 70 }
    expect(monthsToRetirement(retired, DEFAULT_ASSUMPTIONS)).toBe(0)
    // Still produces a finite, usable analysis.
    const analysis = analyseGap(retired, DEFAULT_ASSUMPTIONS)
    expect(Number.isFinite(analysis.scenarios.expected.projectedNet)).toBe(true)
  })
})

describe('display formatting', () => {
  it('rounds to whole euros for display only', () => {
    expect(formatEuros(euros(1552.15))).toMatch(/1\.552/)
    expect(formatEuros(euros(1552.95))).toMatch(/1\.553/)
  })

  it('keeps every computed amount on integer cents', () => {
    const analysis = analyseGap(fatima, DEFAULT_ASSUMPTIONS, euros(137.5))
    const amounts = [
      analysis.target.targetNet,
      analysis.target.baseTarget,
      analysis.target.mortgageOffset,
      ...SCENARIOS.flatMap((scenario) => [
        analysis.scenarios[scenario].projectedNet,
        analysis.scenarios[scenario].gapNet,
        analysis.scenarios[scenario].viveCapitalAtRetirement,
        analysis.required[scenario].monthly,
        analysis.required[scenario].deductibleMonthly,
        analysis.required[scenario].nonDeductibleMonthly,
      ]),
    ]
    for (const amount of amounts) {
      expect(Number.isInteger(amount)).toBe(true)
    }
  })

  it('brands amounts so a gross entitlement cannot be summed as net', () => {
    // Compile-time guarantee, asserted at runtime for the record: the helpers
    // are the only way across the basis boundary.
    const entitlement = gross(euros(1150))
    const asNet = grossToNet(entitlement, 0.19)
    expect(asNet).toBe(euros(1150 * 0.81))
    expect(netToGross(asNet, 0.19)).toBeCloseTo(entitlement, -1)
  })
})

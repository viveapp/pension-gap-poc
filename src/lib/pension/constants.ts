import { euros, net, type NetCents } from './money'
import type { Assumptions } from './types'

/**
 * The year the prototype treats as "now". Keeping this a constant rather than
 * reading the clock makes every projection and every test deterministic.
 */
export const REFERENCE_YEAR = 2026

/**
 * AOW, net per month, 2026. Indicative figures for the prototype.
 *
 * Quoted net because that is how the Rijksoverheid publishes them and because
 * the whole model runs on a net basis. Single is 70% of the net minimum wage,
 * a partner 50% each — hence the 5/7 ratio between them.
 */
export const AOW_NET_MONTHLY_2026: Record<'single' | 'partner', NetCents> = {
  single: net(euros(1512.86)),
  partner: net(euros(1080.61)),
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  targetIncomePct: 0.7,
  retirementAge: 67,
  returns: {
    pessimistic: 0.02,
    expected: 0.04,
    optimistic: 0.06,
  },
  payoutYears: 20,
  payoutReturnRate: 0.03,
  retireeTaxRate: 0.19,
  applyMortgageOffset: true,
}

/** Bounds for the assumption controls, so UI and tests agree on the range. */
export const ASSUMPTION_BOUNDS = {
  targetIncomePct: { min: 0.5, max: 1.0, step: 0.01 },
  retirementAge: { min: 60, max: 72, step: 1 },
  returnRate: { min: 0, max: 0.1, step: 0.005 },
  payoutYears: { min: 10, max: 30, step: 1 },
  retireeTaxRate: { min: 0, max: 0.5, step: 0.01 },
  extraMonthlyContribution: { min: 0, max: 1000, step: 5 },
} as const

/** Shown next to every projected number. Informeren, niet adviseren. */
export const INDICATION_DISCLAIMER =
  'Indicatie op basis van aannames. Geen advies.'

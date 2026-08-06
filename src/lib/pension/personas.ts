import { euros, gross, net } from './money'
import {
  BELASTINGDIENST,
  KADASTER,
  MIJNPENSIOENOVERZICHT,
  UWV,
} from './sources'
import type { FinancialPicture } from './types'

/**
 * Mock personas. Amounts are indicative but internally consistent: net income,
 * entitlements, Vive balance and jaarruimte all line up with each other and
 * with the 2026 AOW constants.
 *
 * Each persona exercises a different branch of the calculation:
 *   emma    — long horizon, small gap, no mortgage, well inside jaarruimte
 *   mark    — fragmented second pillar, mortgage repaid BEFORE retirement
 *             (so the home-equity offset applies), Wtp accrual change
 *   fatima  — short horizon, mortgage repaid AFTER retirement (no offset),
 *             required contribution EXCEEDS jaarruimte
 *   daan    — no second pillar at all, biggest gap relative to target
 */

/** Which sources actually produced data for this person. */
const RENTER_SOURCES = [MIJNPENSIOENOVERZICHT, BELASTINGDIENST, UWV]
const OWNER_SOURCES = [MIJNPENSIOENOVERZICHT, BELASTINGDIENST, UWV, KADASTER]

const emma: FinancialPicture = {
  personaId: 'emma',
  displayName: 'Emma, 29',
  summaryKey: 'persona.emma.summary',
  age: 29,
  household: 'single',
  currentNetMonthlyIncome: net(euros(2750)),
  secondPillar: [
    {
      id: 'emma-1',
      employer: 'Studio Noord',
      fromYear: 2024,
      toYear: null,
      grossMonthlyAtRetirement: gross(euros(160)),
    },
  ],
  vive: {
    balance: euros(800),
    monthlyContribution: euros(10),
  },
  mortgage: null,
  homeValue: null,
  jaarruimteAnnual: euros(4200),
  sources: RENTER_SOURCES,
}

const mark: FinancialPicture = {
  personaId: 'mark',
  displayName: 'Mark, 45',
  summaryKey: 'persona.mark.summary',
  age: 45,
  household: 'partner',
  currentNetMonthlyIncome: net(euros(4500)),
  secondPillar: [
    {
      id: 'mark-1',
      employer: 'Van Dijk Techniek',
      fromYear: 2004,
      toYear: 2011,
      grossMonthlyAtRetirement: gross(euros(120)),
    },
    {
      id: 'mark-2',
      employer: 'Havenbedrijf Zuid',
      fromYear: 2011,
      toYear: 2016,
      grossMonthlyAtRetirement: gross(euros(95)),
    },
    {
      id: 'mark-3',
      employer: 'Meridiaan Logistiek',
      fromYear: 2016,
      toYear: 2021,
      grossMonthlyAtRetirement: gross(euros(140)),
    },
    {
      id: 'mark-4',
      employer: 'Kernwaarde Groep',
      fromYear: 2021,
      toYear: null,
      grossMonthlyAtRetirement: gross(euros(330)),
      noteKey: 'persona.mark.wtpNote',
    },
  ],
  vive: {
    balance: euros(9500),
    monthlyContribution: euros(60),
  },
  mortgage: {
    netMonthlyPayment: net(euros(950)),
    // Age 64, i.e. before the retirement date — the offset applies.
    paidOffYear: 2045,
  },
  homeValue: euros(465000),
  jaarruimteAnnual: euros(6500),
  sources: OWNER_SOURCES,
}

const fatima: FinancialPicture = {
  personaId: 'fatima',
  displayName: 'Fatima, 55',
  summaryKey: 'persona.fatima.summary',
  age: 55,
  household: 'partner',
  currentNetMonthlyIncome: net(euros(6200)),
  secondPillar: [
    {
      id: 'fatima-1',
      employer: 'Rijkswaterstaat',
      fromYear: 1994,
      toYear: 2012,
      grossMonthlyAtRetirement: gross(euros(640)),
    },
    {
      id: 'fatima-2',
      employer: 'Deltaplan Consultancy',
      fromYear: 2012,
      toYear: null,
      grossMonthlyAtRetirement: gross(euros(1150)),
    },
  ],
  vive: {
    balance: euros(38000),
    monthlyContribution: euros(200),
  },
  mortgage: {
    netMonthlyPayment: net(euros(1400)),
    // Age 70, i.e. AFTER the retirement date — no offset.
    paidOffYear: 2041,
  },
  homeValue: euros(720000),
  jaarruimteAnnual: euros(14500),
  sources: OWNER_SOURCES,
}

const daan: FinancialPicture = {
  personaId: 'daan',
  displayName: 'Daan, 38',
  summaryKey: 'persona.daan.summary',
  age: 38,
  household: 'single',
  currentNetMonthlyIncome: net(euros(3800)),
  secondPillar: [],
  vive: {
    balance: euros(4500),
    monthlyContribution: euros(40),
  },
  mortgage: null,
  homeValue: null,
  jaarruimteAnnual: euros(9800),
  sources: RENTER_SOURCES,
}

export const PERSONAS: FinancialPicture[] = [emma, mark, fatima, daan]

export const DEFAULT_PERSONA_ID = 'mark'

export const findPersona = (personaId: string): FinancialPicture | undefined =>
  PERSONAS.find((persona) => persona.personaId === personaId)

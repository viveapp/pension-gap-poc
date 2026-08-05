import { findPersona } from './personas'
import type { FinancialDataProvider, FinancialPicture } from './types'

/**
 * Mock data provider standing in for Ockto.
 *
 * This is the whole integration surface. The real adapter implements the same
 * `FinancialDataProvider` interface — one call, one typed object back — so it
 * can replace this file without touching a single screen.
 */

export class UnknownPersonaError extends Error {
  constructor(personaId: string) {
    super(`Onbekende persona: ${personaId}`)
    this.name = 'UnknownPersonaError'
  }
}

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

export type MockProviderOptions = {
  /** Simulated round-trip time, so the consent flow feels real. */
  latencyMs?: number
}

export const createMockOcktoProvider = (
  options: MockProviderOptions = {},
): FinancialDataProvider => {
  const { latencyMs = 0 } = options

  return {
    async getFinancialPicture(personaId: string): Promise<FinancialPicture> {
      const picture = findPersona(personaId)
      if (!picture) throw new UnknownPersonaError(personaId)
      if (latencyMs > 0) await delay(latencyMs)
      return picture
    },
  }
}

/** One stage of the mocked Ockto / DigiD handoff. */
export type HandoffStage = {
  id: string
  /** Shown while this stage runs. */
  label: string
  /** Which party is being contacted, for the progress list. */
  party: string
  durationMs: number
}

/**
 * The fake handoff, staged so the consent screen can show real progress per
 * source instead of one anonymous spinner.
 */
export const MOCK_HANDOFF_STAGES: HandoffStage[] = [
  {
    id: 'digid',
    label: 'Inloggen met DigiD',
    party: 'DigiD',
    durationMs: 900,
  },
  {
    id: 'mijnpensioenoverzicht',
    label: 'Pensioenaanspraken ophalen',
    party: 'Mijnpensioenoverzicht',
    durationMs: 1300,
  },
  {
    id: 'belastingdienst',
    label: 'Inkomensgegevens ophalen',
    party: 'Belastingdienst en UWV',
    durationMs: 1000,
  },
  {
    id: 'kadaster',
    label: 'Woninggegevens ophalen',
    party: 'Kadaster',
    durationMs: 800,
  },
]

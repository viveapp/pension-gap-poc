import type { DataSource } from './types'

/**
 * Exactly what the consent screen asks for, and why.
 *
 * Kept as data rather than copy inside a component so the consent screen and the
 * results screen cannot drift apart on what was actually shared. The consent
 * screen asks for all four; a persona's `sources` records the ones that actually
 * applied (a renter has no Kadaster data).
 *
 * Wording lives in `src/i18n/messages/data.ts`; this file holds only the
 * structure and the message keys. Party names are Dutch institutions and are
 * referenced by key so English can gloss them where useful.
 */

export const MIJNPENSIOENOVERZICHT: DataSource = {
  id: 'mijnpensioenoverzicht',
  partyKey: 'stage.party.mijnpensioenoverzicht',
  shareKeys: ['source.mpo.share.1', 'source.mpo.share.2', 'source.mpo.share.3'],
  reasonKey: 'source.mpo.reason',
}

export const BELASTINGDIENST: DataSource = {
  id: 'belastingdienst',
  partyKey: 'source.party.belastingdienst',
  shareKeys: ['source.tax.share.1', 'source.tax.share.2'],
  reasonKey: 'source.tax.reason',
}

export const UWV: DataSource = {
  id: 'uwv',
  partyKey: 'source.party.uwv',
  shareKeys: ['source.uwv.share.1', 'source.uwv.share.2'],
  reasonKey: 'source.uwv.reason',
}

export const KADASTER: DataSource = {
  id: 'kadaster',
  partyKey: 'stage.party.kadaster',
  shareKeys: ['source.kadaster.share.1', 'source.kadaster.share.2'],
  reasonKey: 'source.kadaster.reason',
}

/** Everything the mocked Ockto flow asks permission for, in order. */
export const CONSENT_SOURCES: DataSource[] = [
  MIJNPENSIOENOVERZICHT,
  BELASTINGDIENST,
  UWV,
  KADASTER,
]

/** What we never ask for. Stating this explicitly is part of the design. */
export const NOT_SHARED_KEYS = [
  'notShared.1',
  'notShared.2',
  'notShared.3',
] as const

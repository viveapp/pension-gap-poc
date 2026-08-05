import type { DataSource } from './types'

/**
 * Exactly what the consent screen asks for, and why.
 *
 * Kept as data rather than copy inside a component so the consent screen and
 * the results screen cannot drift apart on what was actually shared. The
 * consent screen asks for all four; a persona's `sources` records the ones that
 * actually applied (a renter has no Kadaster data).
 */

export const MIJNPENSIOENOVERZICHT: DataSource = {
  id: 'mijnpensioenoverzicht',
  party: 'Mijnpensioenoverzicht',
  shares: [
    'Je AOW-leeftijd en je verwachte AOW-bedrag',
    'Je pensioen per werkgever waar je hebt gewerkt',
    'De jaren waarin je dat pensioen opbouwde',
  ],
  reason: 'Hiermee rekenen we uit wat je na je pensioen al krijgt.',
}

export const BELASTINGDIENST: DataSource = {
  id: 'belastingdienst',
  party: 'Belastingdienst',
  shares: ['Je inkomen van vorig jaar', 'Of je een fiscale partner hebt'],
  reason: 'Hiermee bepalen we je jaarruimte en of je AOW voor alleenstaanden geldt.',
}

export const UWV: DataSource = {
  id: 'uwv',
  party: 'UWV',
  shares: ['Je salaris per maand', 'Bij welke werkgever je nu werkt'],
  reason: 'Hiermee weten we wat je nu netto per maand overhoudt.',
}

export const KADASTER: DataSource = {
  id: 'kadaster',
  party: 'Kadaster',
  shares: ['Of je een koopwoning hebt', 'De waarde van je woning'],
  reason:
    'Is je hypotheek voor je pensioen afgelost? Dan heb je later minder geld nodig.',
}

/** Everything the mocked Ockto flow asks permission for, in order. */
export const CONSENT_SOURCES: DataSource[] = [
  MIJNPENSIOENOVERZICHT,
  BELASTINGDIENST,
  UWV,
  KADASTER,
]

/** What we never ask for. Stating this explicitly is part of the design. */
export const NOT_SHARED: string[] = [
  'Je banktransacties',
  'Je medische gegevens',
  'Je BSN wordt niet opgeslagen',
]

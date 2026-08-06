/**
 * Copy that belongs to the mock data: consent source descriptions, gap buckets,
 * age cohorts. Kept here rather than in the data modules so those stay free of
 * presentation concerns, with the exception of persona summaries and the Wtp
 * note, which live next to the persona as `LocalizedText`.
 */
export const data = {
  nl: {
    // Consent sources. Party names are Dutch institutions; English glosses them.
    'source.party.belastingdienst': 'Belastingdienst',
    'source.party.uwv': 'UWV',

    'source.mpo.share.1': 'Je AOW-leeftijd en je verwachte AOW-bedrag',
    'source.mpo.share.2': 'Je pensioen per werkgever waar je hebt gewerkt',
    'source.mpo.share.3': 'De jaren waarin je dat pensioen opbouwde',
    'source.mpo.reason': 'Hiermee rekenen we uit wat je na je pensioen al krijgt.',

    'source.tax.share.1': 'Je inkomen van vorig jaar',
    'source.tax.share.2': 'Of je een fiscale partner hebt',
    'source.tax.reason':
      'Hiermee bepalen we je jaarruimte en of je AOW voor alleenstaanden geldt.',

    'source.uwv.share.1': 'Je salaris per maand',
    'source.uwv.share.2': 'Bij welke werkgever je nu werkt',
    'source.uwv.reason': 'Hiermee weten we wat je nu netto per maand overhoudt.',

    'source.kadaster.share.1': 'Of je een koopwoning hebt',
    'source.kadaster.share.2': 'De waarde van je woning',
    'source.kadaster.reason':
      'Is je hypotheek voor je pensioen afgelost? Dan heb je later minder geld nodig.',

    'notShared.1': 'Je banktransacties',
    'notShared.2': 'Je medische gegevens',
    'notShared.3': 'Je BSN wordt niet opgeslagen',

    // Employer-side gap buckets.
    'bucket.none': 'Geen gat',
    'bucket.under100': '< € 100',
    'bucket.from100': '€ 100–300',
    'bucket.from300': '€ 300–500',
    'bucket.over500': '> € 500',

    'cohort.young': '20–34',
    'cohort.mid': '35–49',
    'cohort.senior': '50+',
    'cohort.withYears': '{range} jaar',
  },
  en: {
    'source.party.belastingdienst': 'Belastingdienst (tax office)',
    'source.party.uwv': 'UWV (benefits agency)',

    'source.mpo.share.1': 'Your state pension age and expected state pension',
    'source.mpo.share.2': 'Your pension per employer you have worked for',
    'source.mpo.share.3': 'The years in which you built up that pension',
    'source.mpo.reason':
      'We use this to work out what you will already receive after you retire.',

    'source.tax.share.1': 'Your income from last year',
    'source.tax.share.2': 'Whether you have a tax partner',
    'source.tax.reason':
      'We use this to determine your annual allowance and whether the single-person state pension applies.',

    'source.uwv.share.1': 'Your monthly salary',
    'source.uwv.share.2': 'Which employer you work for now',
    'source.uwv.reason':
      'We use this to know what you take home net per month right now.',

    'source.kadaster.share.1': 'Whether you own your home',
    'source.kadaster.share.2': 'The value of your home',
    'source.kadaster.reason':
      'Will your mortgage be paid off before you retire? Then you need less money later.',

    'notShared.1': 'Your bank transactions',
    'notShared.2': 'Your medical data',
    'notShared.3': 'Your citizen service number is not stored',

    'bucket.none': 'No gap',
    'bucket.under100': '< €100',
    'bucket.from100': '€100–300',
    'bucket.from300': '€300–500',
    'bucket.over500': '> €500',

    'cohort.young': '20–34',
    'cohort.mid': '35–49',
    'cohort.senior': '50+',
    'cohort.withYears': 'age {range}',
  },
} as const

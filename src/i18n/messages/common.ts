/**
 * Shared copy: compliance lines, scenario names, generic controls.
 *
 * Keys are flat and dotted. Placeholders are `{name}`. Every key must exist in
 * both locales with the same placeholders — `translations.test.ts` enforces it.
 */
export const common = {
  nl: {
    'app.name': 'Vive',
    'nav.back': 'Terug',
    'nav.assumptions': 'Aannames',
    'nav.close': 'Sluiten',

    'locale.switch': 'Taal kiezen',

    // Compliance. Informeren, niet adviseren.
    'disclaimer.indication': 'Indicatie op basis van aannames. Geen advies.',
    'disclaimer.viewAssumptions': 'Bekijk de aannames',
    'disclaimer.notAdvice':
      'We vertellen je niet wat je moet doen en welk product bij je past. Je ziet hier wat een inleg zou betekenen. Jij kiest zelf of je iets doet.',

    'scenario.pessimistic': 'Voorzichtig',
    'scenario.expected': 'Verwacht',
    'scenario.optimistic': 'Optimistisch',

    'perMonth': 'per maand',
    'perMonthShort': 'p/m',
    'net': 'netto',
    'years': '{count} jaar',

    'chart.showTable': 'Toon als tabel',
    'chart.needed': 'Nodig',
    'chart.tooSmall': 'Te klein',

    'prototype.title': 'Prototype',
  },
  en: {
    'app.name': 'Vive',
    'nav.back': 'Back',
    'nav.assumptions': 'Assumptions',
    'nav.close': 'Close',

    'locale.switch': 'Choose language',

    'disclaimer.indication':
      'An estimate based on assumptions. Not financial advice.',
    'disclaimer.viewAssumptions': 'View the assumptions',
    'disclaimer.notAdvice':
      'We do not tell you what to do or which product suits you. This shows what a contribution would mean. You decide whether to act.',

    'scenario.pessimistic': 'Cautious',
    'scenario.expected': 'Expected',
    'scenario.optimistic': 'Optimistic',

    'perMonth': 'per month',
    'perMonthShort': '/mo',
    'net': 'net',
    'years': '{count} years',

    'chart.showTable': 'Show as table',
    'chart.needed': 'Needed',
    'chart.tooSmall': 'Too small',

    'prototype.title': 'Prototype',
  },
} as const

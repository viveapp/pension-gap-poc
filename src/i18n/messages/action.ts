export const action = {
  nl: {
    'action.title': 'Wat kun je doen?',
    'action.costLabel': 'Om dit gat te dichten',
    'action.costDetail': 'per maand extra inleggen, bij een rendement van {rate}%',
    'action.scenarioNote':
      'Wat je nodig hebt, hangt af van het rendement. Daarom laten we drie mogelijkheden zien.',

    'action.slider.label': 'Extra inleg per maand',
    'action.slider.idle':
      'Schuif om te zien wat een extra inleg met je verwachte inkomen zou doen.',
    'action.conditional':
      'Als je {amount} per maand extra zou inleggen, dan wordt je verwachte inkomen {income} netto per maand.',
    'action.gapClosed.badge': 'Gat gedicht',
    'action.gapClosed.body': 'In het verwachte scenario is er dan geen gat meer.',
    'action.gapRemains': 'Dan blijft er een gat van',

    'action.jaarruimte.title': 'Let op de aftrek',
    'action.jaarruimte.body':
      'Je jaarruimte is ongeveer {annual} per jaar, dus {monthly} per maand. Leg je meer in? Dan is dat deel niet aftrekbaar van de belasting.',
    'action.jaarruimte.deductible': 'Wel aftrekbaar',
    'action.jaarruimte.nonDeductible': 'Niet aftrekbaar',
    'action.jaarruimte.footnote':
      'Dit is een indicatie op basis van een voorbeeldbedrag. Je echte jaarruimte berekenen we pas als je verder gaat.',

    'action.stub.body':
      'Hier zou de inleg-flow starten met {amount} per maand. In dit prototype gebeurt er niets: er is geen koppeling en er wordt niets opgeslagen.',
    'action.cta.pickAmount': 'Kies eerst een bedrag',
    'action.cta.commit': 'Ik wil {amount} per maand inleggen',
    'action.cta.assumptions': 'Pas de aannames aan',
  },
  en: {
    'action.title': 'What can you do?',
    'action.costLabel': 'To close this gap',
    'action.costDetail': 'extra per month, at a return of {rate}%',
    'action.scenarioNote':
      'What you need depends on the investment return. That is why we show three possibilities.',

    'action.slider.label': 'Extra contribution per month',
    'action.slider.idle':
      'Drag to see what an extra contribution would do to your expected income.',
    'action.conditional':
      'If you were to contribute {amount} extra per month, your expected income would become {income} net per month.',
    'action.gapClosed.badge': 'Gap closed',
    'action.gapClosed.body': 'In the expected scenario there is then no gap left.',
    'action.gapRemains': 'A gap would then remain of',

    'action.jaarruimte.title': 'Mind the tax relief',
    'action.jaarruimte.body':
      'Your annual tax-free allowance is about {annual} per year, so {monthly} per month. Contribute more than that? Then that part is not tax deductible.',
    'action.jaarruimte.deductible': 'Tax deductible',
    'action.jaarruimte.nonDeductible': 'Not deductible',
    'action.jaarruimte.footnote':
      'This is an estimate based on an example amount. We calculate your real allowance only once you continue.',

    'action.stub.body':
      'This is where the contribution flow would start with {amount} per month. Nothing happens in this prototype: there is no integration and nothing is stored.',
    'action.cta.pickAmount': 'Choose an amount first',
    'action.cta.commit': 'I want to contribute {amount} per month',
    'action.cta.assumptions': 'Adjust the assumptions',
  },
} as const

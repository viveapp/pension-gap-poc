export const assumptions = {
  nl: {
    'assumptions.title': 'Aannames',
    'assumptions.reset.short': 'Standaard',
    'assumptions.lead':
      'Een pensioenberekening is altijd een schatting. Hieronder staat elke aanname die we gebruiken. Pas ze aan en je ziet meteen wat er verandert.',
    'assumptions.noData':
      'Je hebt nog geen gegevens opgehaald. Je kunt de aannames wel al aanpassen.',

    'assumptions.summary.label': 'Resultaat met deze aannames',
    'assumptions.summary.need': 'Je hebt nodig',
    'assumptions.summary.get': 'Je krijgt (verwacht)',
    'assumptions.summary.gap': 'Je gat per maand',
    'assumptions.summary.onTrack': 'Je bent op koers',

    'assumptions.need.heading': 'Wat je later nodig hebt',
    'assumptions.targetPct.label': 'Deel van je inkomen dat je later nodig hebt',
    'assumptions.targetPct.hint':
      'Na je pensioen heb je meestal minder geld nodig. Standaard rekenen we met 70% van je inkomen nu.',
    'assumptions.mortgage.label': 'Hypotheek afgelost? Dan minder nodig',
    'assumptions.mortgage.hintApplies':
      'Je hypotheek is afgelost in {year}, dus vóór je pensioen. Je maandlast van {amount} stopt dan. Zet dit uit als je verwacht te verhuizen of opnieuw te lenen.',
    'assumptions.mortgage.hintDoesNotApply':
      'Je hypotheek loopt tot {year} en dus door na je pensioen in {retirementYear}. Daarom halen we nu niets van je doelbedrag af.',
    'assumptions.mortgage.hintNoHome':
      'Geldt alleen als je een koopwoning hebt.',

    'assumptions.retire.heading': 'Wanneer je stopt',
    'assumptions.retireAge.label': 'Leeftijd waarop je stopt met werken',
    'assumptions.retireAge.hint':
      'Dat is het jaar {year}, over {years} jaar.',
    'assumptions.retireAge.hintNoData': 'De AOW-leeftijd is nu 67 jaar.',
    'assumptions.retireAge.aowCaveat':
      'In dit prototype begint de AOW op de leeftijd die je hier kiest. In het echt begint de AOW pas op je AOW-leeftijd.',

    'assumptions.returns.heading': 'Rendement voor je pensioen',
    'assumptions.returns.lead':
      'Niemand weet wat beleggen opbrengt. Daarom rekenen we altijd met drie mogelijkheden. Je ziet nooit één bedrag, maar een reeks.',
    'assumptions.returns.label': '{scenario} rendement per jaar',
    'assumptions.returns.note':
      'We rekenen met maandelijkse groei. Een rendement van 4% per jaar is dus niet 0,33% per maand, maar iets minder.',

    'assumptions.payout.heading': 'Uitkeren na je pensioen',
    'assumptions.payoutYears.label': 'Aantal jaren dat je pot wordt uitgekeerd',
    'assumptions.payoutYears.hint':
      'We verdelen je pot in gelijke bedragen over {years} jaar. Dus van je {fromAge}e tot je {toAge}e. We rekenen niet met een levenslange uitkering en niet met indexatie.',
    'assumptions.payoutReturn.label': 'Rendement tijdens uitkeren',
    'assumptions.payoutReturn.hint':
      'Wat er nog in je pot zit, blijft groeien terwijl je uitkeert.',

    'assumptions.tax.heading': 'Belasting',
    'assumptions.tax.label': 'Belasting die je na je pensioen betaalt',
    'assumptions.tax.hint':
      'We rekenen met één vast percentage over je werkgeverspensioen en je Vive-pot. In het echt gaat dat per belastingschijf. Alle bedragen in de app zijn netto: dat wat je echt overhoudt.',

    'assumptions.fixed.heading': 'Vaste bedragen die we gebruiken',
    'assumptions.fixed.aowSingle': 'AOW alleenstaand (2026)',
    'assumptions.fixed.aowSingleDetail': 'Netto per maand',
    'assumptions.fixed.aowPartner': 'AOW met partner (2026)',
    'assumptions.fixed.aowPartnerDetail': 'Netto per maand, per persoon',
    'assumptions.fixed.year': 'Rekenjaar',
    'assumptions.fixed.yearDetail': 'Vanaf dit jaar rekenen we vooruit',
    'assumptions.fixed.jaarruimte': 'Jaarruimte',
    'assumptions.fixed.jaarruimteDetail':
      'Voorbeeldbedrag in dit prototype, geen echte berekening',
    'assumptions.fixed.note':
      'De AOW-bedragen zijn indicatief. Je pensioen via werkgevers komt van Mijnpensioenoverzicht en is daar bruto. Wij rekenen het om naar netto met het percentage hierboven.',

    'assumptions.closing':
      'Alles op deze pagina is een aanname. Verandert de wet, de rente of je eigen situatie? Dan verandert de uitkomst. Wij geven informatie, geen advies.',
    'assumptions.reset.long': 'Zet alles terug op standaard',
    'assumptions.backToResult': 'Terug naar je resultaat',
    'assumptions.startCheck': 'Start de check',
  },
  en: {
    'assumptions.title': 'Assumptions',
    'assumptions.reset.short': 'Defaults',
    'assumptions.lead':
      'A pension calculation is always an estimate. Below is every assumption we use. Change them and you immediately see what happens.',
    'assumptions.noData':
      'You have not collected any data yet. You can still adjust the assumptions.',

    'assumptions.summary.label': 'Result with these assumptions',
    'assumptions.summary.need': 'You need',
    'assumptions.summary.get': 'You will get (expected)',
    'assumptions.summary.gap': 'Your monthly gap',
    'assumptions.summary.onTrack': 'You are on track',

    'assumptions.need.heading': 'What you need later',
    'assumptions.targetPct.label': 'Share of your income you need later',
    'assumptions.targetPct.hint':
      'After you retire you usually need less money. By default we use 70% of your income now.',
    'assumptions.mortgage.label': 'Mortgage paid off? Then you need less',
    'assumptions.mortgage.hintApplies':
      'Your mortgage is paid off in {year}, so before you retire. Your monthly payment of {amount} stops then. Switch this off if you expect to move or borrow again.',
    'assumptions.mortgage.hintDoesNotApply':
      'Your mortgage runs until {year} and therefore continues after you retire in {retirementYear}. So we subtract nothing from your target for now.',
    'assumptions.mortgage.hintNoHome': 'Only applies if you own your home.',

    'assumptions.retire.heading': 'When you stop',
    'assumptions.retireAge.label': 'Age at which you stop working',
    'assumptions.retireAge.hint': 'That is the year {year}, in {years} years.',
    'assumptions.retireAge.hintNoData': 'The state pension age is now 67.',
    'assumptions.retireAge.aowCaveat':
      'In this prototype the state pension starts at the age you choose here. In reality it only starts at your official state pension age.',

    'assumptions.returns.heading': 'Return before you retire',
    'assumptions.returns.lead':
      'Nobody knows what investing will return. That is why we always use three possibilities. You never see one amount, but a range.',
    'assumptions.returns.label': '{scenario} return per year',
    'assumptions.returns.note':
      'We compound monthly. So a return of 4% per year is not 0.33% per month, but slightly less.',

    'assumptions.payout.heading': 'Paying out after you retire',
    'assumptions.payoutYears.label':
      'Number of years your pot is paid out over',
    'assumptions.payoutYears.hint':
      'We split your pot into equal amounts over {years} years. So from age {fromAge} to age {toAge}. We do not model a lifelong payout and we do not model indexation.',
    'assumptions.payoutReturn.label': 'Return while paying out',
    'assumptions.payoutReturn.hint':
      'Whatever is still in your pot keeps growing while it pays out.',

    'assumptions.tax.heading': 'Tax',
    'assumptions.tax.label': 'Tax you pay after you retire',
    'assumptions.tax.hint':
      'We use one flat percentage on your employer pension and your Vive pot. In reality this works per tax bracket. All amounts in the app are net: what you actually keep.',

    'assumptions.fixed.heading': 'Fixed amounts we use',
    'assumptions.fixed.aowSingle': 'State pension, single (2026)',
    'assumptions.fixed.aowSingleDetail': 'Net per month',
    'assumptions.fixed.aowPartner': 'State pension, with partner (2026)',
    'assumptions.fixed.aowPartnerDetail': 'Net per month, per person',
    'assumptions.fixed.year': 'Base year',
    'assumptions.fixed.yearDetail': 'We project forward from this year',
    'assumptions.fixed.jaarruimte': 'Annual tax-free allowance',
    'assumptions.fixed.jaarruimteDetail':
      'Example amount in this prototype, not a real calculation',
    'assumptions.fixed.note':
      'The state pension amounts are indicative. Your employer pension comes from Mijnpensioenoverzicht and is gross there. We convert it to net using the percentage above.',

    'assumptions.closing':
      'Everything on this page is an assumption. If the law, the interest rate or your own situation changes, so does the outcome. We give information, not advice.',
    'assumptions.reset.long': 'Reset everything to defaults',
    'assumptions.backToResult': 'Back to your result',
    'assumptions.startCheck': 'Start the check',
  },
} as const

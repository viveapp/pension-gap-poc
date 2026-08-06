export const consent = {
  nl: {
    'consent.title': 'Toestemming',
    'consent.heading': 'Dit delen we, en waarom',
    'consent.lead':
      'Je geeft per bron toestemming. We halen alleen op wat we nodig hebben om je pensioen te berekenen.',
    'consent.notShared.title': 'Dit delen we niet',
    'consent.retention':
      'Je gegevens blijven van jou. Je kunt je toestemming later intrekken. In dit prototype slaan we niets op: sluit je het tabblad, dan is alles weg.',
    'consent.checkbox':
      'Ik geef toestemming om deze gegevens eenmalig op te halen.',
    'consent.cta': 'Verder met inloggen',

    'login.title': 'Inloggen',
    'login.demoNoticeStrong': 'Demo.',
    'login.demoNotice':
      'Dit is geen echte DigiD. In het prototype hoef je niets in te vullen.',
    'login.step': 'Stap 1 van 2',
    'login.heading': 'Log in met DigiD',
    'login.lead':
      'Je gaat naar de inlogomgeving van de overheid. Daarna kom je automatisch terug in de Vive-app.',
    'login.username': 'Gebruikersnaam',
    'login.password': 'Wachtwoord',
    'login.afterwards':
      'Na het inloggen bevestig je in de DigiD-app dat je de gegevens wilt delen.',
    'login.cta': 'Inloggen (demo)',
    'login.footnote': 'Je deelt alleen de gegevens die je net hebt gezien.',

    'fetching.title': 'Gegevens ophalen',
    'fetching.heading': 'We halen je gegevens op',
    'fetching.lead': 'Dit duurt een paar seconden. Blijf even in de app.',

    'stage.digid': 'Inloggen met DigiD',
    'stage.mijnpensioenoverzicht': 'Pensioenaanspraken ophalen',
    'stage.belastingdienst': 'Inkomensgegevens ophalen',
    'stage.kadaster': 'Woninggegevens ophalen',

    // Party names are Dutch institutions; only the combined one needs wording.
    'stage.party.digid': 'DigiD',
    'stage.party.mijnpensioenoverzicht': 'Mijnpensioenoverzicht',
    'stage.party.belastingdienst': 'Belastingdienst en UWV',
    'stage.party.kadaster': 'Kadaster',
  },
  en: {
    'consent.title': 'Permission',
    'consent.heading': 'What we share, and why',
    'consent.lead':
      'You give permission per source. We only collect what we need to calculate your pension.',
    'consent.notShared.title': 'What we do not share',
    'consent.retention':
      'Your data stays yours. You can withdraw your permission later. This prototype stores nothing: close the tab and it is all gone.',
    'consent.checkbox': 'I give permission to collect this data once.',
    'consent.cta': 'Continue to log in',

    'login.title': 'Log in',
    'login.demoNoticeStrong': 'Demo.',
    'login.demoNotice':
      'This is not the real DigiD. You do not need to fill anything in for this prototype.',
    'login.step': 'Step 1 of 2',
    'login.heading': 'Log in with DigiD',
    'login.lead':
      'You will go to the government login environment. After that you return to the Vive app automatically.',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.afterwards':
      'After logging in you confirm in the DigiD app that you want to share the data.',
    'login.cta': 'Log in (demo)',
    'login.footnote': 'You only share the data you have just seen.',

    'fetching.title': 'Collecting data',
    'fetching.heading': 'We are collecting your data',
    'fetching.lead': 'This takes a few seconds. Please stay in the app.',

    'stage.digid': 'Logging in with DigiD',
    'stage.mijnpensioenoverzicht': 'Collecting pension entitlements',
    'stage.belastingdienst': 'Collecting income data',
    'stage.kadaster': 'Collecting property data',

    'stage.party.digid': 'DigiD',
    'stage.party.mijnpensioenoverzicht': 'Mijnpensioenoverzicht',
    'stage.party.belastingdienst': 'Tax office and UWV',
    'stage.party.kadaster': 'Land registry (Kadaster)',
  },
} as const

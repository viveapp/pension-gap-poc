# Pensioengat — prototype

Prototype of the pension-gap feature for Vive. An employee connects their
financial data once and sees their full pension picture, the gap versus what
they will need, and what closing that gap would cost per month.

**All external data is mocked. There is no auth, no backend and no persistence.**
The calculation logic, however, is real and tested — that part is meant to be
reused.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # 95 unit tests on the calculation, aggregation and i18n modules
npm run build
```

The UI is bilingual: **Nederlands** (default) and **English**, switchable with the
NL/EN toggle in every app bar. See [Bilingual](#bilingual) below.

## Screens

| Route        | What it is                                                     |
| ------------ | -------------------------------------------------------------- |
| `/`          | Intro — "Ben je op koers voor later?"                          |
| `/consent`   | Mocked Ockto/DigiD handoff: consent → login → fetch per source |
| `/resultaat` | The gap analysis: headline, gap, breakdown behind disclosure   |
| `/actie`     | What a monthly contribution would do, with a live slider       |
| `/aannames`  | Every assumption, editable, results recompute live             |
| `/werkgever` | Employer dashboard — aggregates only, separate context         |

A dev-only persona switcher sits in the bottom corner of the employee screens
(purple chip, labelled `DEV`). Before consent it picks who you will be; after
consent it swaps the loaded data in place.

## The parts that outlive the prototype

```
src/lib/pension/
  money.ts           Integer-cent math. GrossCents / NetCents are branded types.
  types.ts           Every shape, including the provider interface.
  constants.ts       AOW 2026, default assumptions, control bounds.
  calc.ts            Pure calculation. No React, no I/O, no clock.
  calc.test.ts       61 tests.
  workforce.ts       Employer-side aggregation. Exposes aggregates only.
  workforce.test.ts  17 tests, including the privacy rule.
  ockto.ts           Mock data provider behind FinancialDataProvider.
  personas.ts        Four mock personas.
  sources.ts         What the consent screen asks for, as data.

src/i18n/
  types.ts           Locale union, locale tags, LocalizedText.
  translations.ts    Dictionary assembly, interpolation, MessageKey.
  translations.test.ts  17 tests: key parity, placeholder parity, formatting.
  LocaleProvider.tsx    Context exposing t / tAround / formatEuros / formatPercent.
  messages/          One file per screen, nl + en side by side.
```

### Net basis, enforced by the type system

The single biggest risk in this calculation is comparing a net projection with a
gross target. `GrossCents` and `NetCents` are branded, so that mix-up is a
compile error rather than a plausible-looking wrong number. Crossing the
boundary requires `grossToNet` / `netToGross`, which take an explicit rate.

Mijnpensioenoverzicht reports gross, so entitlements are modelled gross and
converted once, using a stated assumption. AOW is quoted net, as published.

### The model

- **Target** = `targetIncomePct` (default 70%) of current net income, minus the
  net monthly mortgage payment if the mortgage is repaid on or before the
  retirement date.
- **Projection** = AOW + second-pillar entitlements (net) + the income the Vive
  pot can buy, where the pot is the future value of the balance plus
  contributions.
- **Gap** = target − projection, in net €/month. Negative means on track.
- **Cost to close** runs the same chain backwards: net income → gross income →
  capital needed → monthly contribution (future-value annuity solve).
- **Three scenarios always** — 2% / 4% / 6%, shown as a band. Never one number.
- All money in integer cents; a split's last-cent remainder goes to the largest
  bucket (`allocateCents`), so a displayed breakdown always sums to its headline.

Every assumption is editable on `/aannames`, including the payout horizon, the
payout return and the flat retiree tax rate.

### Swapping the mock for real Ockto

Implement `FinancialDataProvider` (one method, `getFinancialPicture(personaId)
→ Promise<FinancialPicture>`) and replace `createMockOcktoProvider` in
`src/state/PensionProvider.tsx`. No screen touches the data source.

### Employer-side privacy rule

`workforce.ts` builds 120 individuals internally and exports only aggregates —
there is no exported path to a single employee. Any displayed segment below
`MIN_GROUP_SIZE` (10) is returned with `suppressed: true` and no number
attached. Narrow the cohort filter on `/werkgever` to `50+` to see it fire.

## Bilingual

Dutch is the product language and the default: the app targets Dutch consumers
and Dutch pension institutions, and the copy is written at B1 level. English is
there for international employees and for stakeholders who do not read Dutch.

- **All copy lives in `src/i18n/messages/`**, one file per screen with `nl` and
  `en` next to each other. No screen contains a hardcoded string.
- **`MessageKey` is derived from the Dutch dictionary**, and the English one is
  typed `Record<MessageKey, string>` — so a missing English key is a *compile*
  error, and an unknown `t('…')` key is too. `translations.test.ts` covers what
  types cannot: extra keys, empty values, and mismatched `{placeholders}`.
- **Sentences that wrap a live number** use `tAround(key, 'amount')`, which
  splits the message at its placeholder. Dutch "Je komt {amount} per maand
  tekort." and English "You will be {amount} per month short." both render
  correctly without hardcoding word order.
- **Numbers follow the locale.** Dutch formats as `€ 1.552`, English as
  `€1,552` (en-IE — an English locale whose currency is the euro). `money.ts`
  takes a BCP 47 tag and defaults to `nl-NL`, so the pure calculation module
  never imports the i18n layer.
- **Dutch is the fallback.** A missing English string shows Dutch, never a key.
- Institution names (Mijnpensioenoverzicht, Belastingdienst, UWV, Kadaster,
  DigiD) stay Dutch, glossed in English where it helps. Route paths stay Dutch.

State is in memory, so the language resets to Dutch on reload, like everything
else in the prototype.

## Compliance framing

Informeren, not adviseren. Concretely: no "je moet" and no "wij adviseren";
projections are phrased conditionally ("als je € X per maand zou inleggen,
dan…" / "if you were to contribute € X per month, then…"); every projected
number carries "indicatie op basis van aannames" with a link to the assumptions;
no product or risk-profile recommendations; the user initiates the contribution.
Dutch copy is at B1 level, and the English follows the same register.

## Known prototype limits

- Jaarruimte is a per-persona mock figure used only to demonstrate the
  deductibility cap. It is not a real jaarruimte computation.
- The retiree tax rate is one flat percentage, not real box-1 brackets.
- The payout phase is a level annuity over a fixed number of years — no
  indexation, no mortality table, no guarantees.
- AOW amounts for 2026 are indicative.
- `REFERENCE_YEAR` is a constant (2026) rather than the system clock, so every
  projection and test is deterministic.
- Lowering the retirement age below 67 still pays the state pension from that
  age, which real AOW would not. The horizon and returns adjust correctly; only
  the AOW start date is unmodelled. The assumptions screen says so.
- The DigiD step is deliberately a labelled demo with no government branding.
- The design system is ported from `react-native-vive-app` (`DESIGN.md` +
  `themeTokens.ts`) into Tailwind tokens in `src/app/globals.css`. TT Norms Pro
  is licensed, so Plus Jakarta Sans stands in for it.

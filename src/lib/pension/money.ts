/**
 * Integer-cent money math.
 *
 * Two rules this module exists to enforce:
 *
 * 1. NET vs GROSS is tracked in the type system. `GrossCents` and `NetCents`
 *    are branded, so comparing a net projection to a gross target is a compile
 *    error rather than a plausible-looking wrong number. Crossing the boundary
 *    requires `grossToNet` / `netToGross`, which take an explicit tax rate.
 * 2. All amounts are integer cents. Nothing rounds to euros until display.
 */

declare const BASIS: unique symbol

/** An amount in whole cents. Always an integer. */
export type Cents = number

/** Cents before tax. Mijnpensioenoverzicht reports in this basis. */
export type GrossCents = Cents & { readonly [BASIS]: 'gross' }

/** Cents after tax. Everything the user is shown is in this basis. */
export type NetCents = Cents & { readonly [BASIS]: 'net' }

/** Brand an integer cent amount as gross. */
export const gross = (cents: Cents): GrossCents =>
  Math.round(cents) as GrossCents

/** Brand an integer cent amount as net. */
export const net = (cents: Cents): NetCents => Math.round(cents) as NetCents

/** Euros (possibly fractional) to integer cents. `euros(1552.15) === 155215`. */
export const euros = (amount: number): Cents => Math.round(amount * 100)

/** Strip the basis brand. Use only when the basis genuinely does not matter. */
export const raw = (cents: GrossCents | NetCents | Cents): Cents =>
  cents as Cents

export const sumNet = (...amounts: NetCents[]): NetCents =>
  net(amounts.reduce((total, amount) => total + amount, 0))

export const sumGross = (...amounts: GrossCents[]): GrossCents =>
  gross(amounts.reduce((total, amount) => total + amount, 0))

/** Multiply an amount by a dimensionless factor, staying on integer cents. */
export const scale = (cents: Cents, factor: number): Cents =>
  Math.round(cents * factor)

/**
 * Convert a gross amount to net using a single flat rate.
 *
 * This is deliberately crude: the prototype states the rate as an editable
 * assumption rather than modelling real box-1 brackets and heffingskortingen.
 */
export const grossToNet = (amount: GrossCents, taxRate: number): NetCents =>
  net(scale(amount, 1 - taxRate))

/** Inverse of {@link grossToNet}. Rounds to the nearest cent. */
export const netToGross = (amount: NetCents, taxRate: number): GrossCents => {
  if (taxRate >= 1) throw new RangeError('taxRate must be below 1')
  return gross(scale(amount, 1 / (1 - taxRate)))
}

/**
 * Split `total` cents across `weights` so the parts sum to exactly `total`.
 *
 * Each part is floored, then the whole remainder (at most `weights.length - 1`
 * cents) is added to the largest bucket. Keeps a displayed breakdown adding up
 * to its displayed headline, with no visible rounding drift.
 */
export const allocateCents = (total: Cents, weights: number[]): Cents[] => {
  if (weights.length === 0) return []
  if (weights.some((weight) => weight < 0)) {
    throw new RangeError('weights must not be negative')
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  if (totalWeight === 0) return weights.map(() => 0)

  const exact = weights.map((weight) => (total * weight) / totalWeight)
  // Math.floor, not trunc: keeps the invariant for negative totals too.
  const parts = exact.map((value) => Math.floor(value))
  const remainder = total - parts.reduce((sum, part) => sum + part, 0)

  if (remainder !== 0) {
    let largest = 0
    for (let index = 1; index < exact.length; index += 1) {
      if (exact[index] > exact[largest]) largest = index
    }
    parts[largest] += remainder
  }

  return parts
}

/**
 * Formatters are cached per locale tag. This module stays app-agnostic: it takes
 * a BCP 47 tag, not the app's `Locale` union, so the calculation layer never
 * imports anything from the i18n layer.
 */
const formatterCache = new Map<string, Intl.NumberFormat>()

const formatter = (localeTag: string, fractionDigits: 0 | 2) => {
  const cacheKey = `${localeTag}:${fractionDigits}`
  const cached = formatterCache.get(cacheKey)
  if (cached) return cached

  const created = new Intl.NumberFormat(localeTag, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
  formatterCache.set(cacheKey, created)
  return created
}

/**
 * Display helper. "€ 1.552" in nl-NL, "€1,552" in en-IE. Rounds for display
 * only — the underlying amount stays on integer cents.
 */
export const formatEuros = (cents: Cents, localeTag = 'nl-NL'): string =>
  formatter(localeTag, 0).format(Math.round(cents) / 100)

/** Display helper with cents: "€ 1.552,15" / "€1,552.15". */
export const formatEurosWithCents = (
  cents: Cents,
  localeTag = 'nl-NL',
): string => formatter(localeTag, 2).format(Math.round(cents) / 100)

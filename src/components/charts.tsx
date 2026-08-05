'use client'

import type { ReactNode } from 'react'

import { formatEuros, type Cents } from '@/lib/pension/money'

/**
 * Chart marks for the prototype.
 *
 * Every chart here is a SINGLE series, so identity never rests on colour: the
 * axis label names each mark and every mark is directly labelled with its value.
 * That also covers the brand teal's sub-3:1 contrast against the light surface —
 * relief is the visible label.
 *
 * No dual axes, no cycled hues, no rainbow ramps. Bars are anchored to the
 * baseline with 4px rounded data-ends, and stacked segments are separated by a
 * 2px surface gap.
 */

const clampPct = (value: number) => Math.max(0, Math.min(100, value))

/* -------------------------------------------------------------------------- */
/* Band bar — a projected range against a target reference line               */
/* -------------------------------------------------------------------------- */

/**
 * The employee headline chart. Reads as "at least X, possibly up to Y, and you
 * need Z":
 *
 *   [======solid======][~~~band~~~]        ┆
 *   0            pessimistic   optimistic  target
 *
 * Solid fill is what every scenario clears; the lighter band is the spread
 * between the pessimistic and optimistic scenarios. A single false-precision
 * number is never shown.
 */
export const BandBar = ({
  low,
  high,
  expected,
  target,
  lowLabel = 'Voorzichtig',
  highLabel = 'Optimistisch',
  targetLabel = 'Nodig',
}: {
  low: Cents
  high: Cents
  expected: Cents
  target: Cents
  lowLabel?: string
  highLabel?: string
  targetLabel?: string
}) => {
  const scaleMax = Math.max(high, target) * 1.08 || 1
  const pct = (value: Cents) => clampPct((value / scaleMax) * 100)

  const lowPct = pct(low)
  const highPct = pct(high)
  const expectedPct = pct(expected)
  const targetPct = pct(target)

  return (
    <figure className="m-0">
      <div className="relative h-11">
        {/* Track */}
        <div className="absolute inset-x-0 top-2 h-7 rounded-[4px] bg-ui-secondary" />

        {/* Everything every scenario reaches. */}
        <div
          className="absolute top-2 left-0 h-7 rounded-l-[4px] bg-highlight-brand"
          style={{ width: `${lowPct}%` }}
        />

        {/* The spread between pessimistic and optimistic, 2px gap from the solid. */}
        <div
          className="absolute top-2 h-7 rounded-r-[4px] bg-highlight-brand/35"
          style={{
            left: `calc(${lowPct}% + 2px)`,
            width: `max(0px, calc(${highPct - lowPct}% - 2px))`,
          }}
        />

        {/* Expected scenario marker inside the band. */}
        <div
          className="absolute top-2 h-7 w-[3px] -translate-x-1/2 rounded-full bg-highlight-turquoise"
          style={{ left: `${expectedPct}%` }}
          aria-hidden="true"
        />

        {/* Target reference line. */}
        <div
          className="absolute inset-y-0 w-0 border-l-2 border-dashed border-text-primary"
          style={{ left: `${targetPct}%` }}
          aria-hidden="true"
        />
      </div>

      <figcaption className="mt-1 flex justify-between gap-2 text-label uppercase text-text-tertiary">
        <span>
          {lowLabel} {formatEuros(low)}
        </span>
        <span>
          {highLabel} {formatEuros(high)}
        </span>
      </figcaption>
      <p className="mt-1 text-sub text-text-secondary">
        <span
          aria-hidden="true"
          className="mr-2 inline-block h-0 w-4 border-t-2 border-dashed border-text-primary align-middle"
        />
        {targetLabel}: {formatEuros(target)} per maand
      </p>
    </figure>
  )
}

/* -------------------------------------------------------------------------- */
/* Vertical bar chart — one series, ordered categories                        */
/* -------------------------------------------------------------------------- */

export type Bar = {
  /** Axis label. Carries identity, so colour never has to. */
  label: string
  value: number
  /** Rendered above the bar. */
  valueLabel: string
  /** Shown in the tooltip and the table view. */
  detail?: string
  /** Set when a group is too small to show. Renders suppressed. */
  suppressed?: boolean
}

/**
 * Single-series column chart. All bars share one hue because they measure one
 * thing; the axis distinguishes them.
 */
export const BarChart = ({
  bars,
  height = 132,
  suppressedNote = 'Groep te klein om te tonen',
}: {
  bars: Bar[]
  height?: number
  suppressedNote?: string
}) => {
  const max = Math.max(...bars.map((bar) => (bar.suppressed ? 0 : bar.value)), 1)

  return (
    <figure className="m-0">
      <div className="flex items-end gap-2" style={{ height }}>
        {bars.map((bar) => {
          if (bar.suppressed) {
            // Keep the axis label: the category still exists, only its number
            // is withheld. The dashed mark says "hidden", not "zero".
            return (
              <div
                key={bar.label}
                className="flex h-full flex-1 flex-col justify-end"
                title={suppressedNote}
              >
                <p className="mb-1 text-center text-label uppercase text-text-tertiary">
                  Te klein
                </p>
                <div
                  className="rounded-t-[4px] border-2 border-dashed border-ui-primary"
                  style={{ height: 24 }}
                />
              </div>
            )
          }
          const barHeight = Math.max(3, (bar.value / max) * (height - 22))
          return (
            <div
              key={bar.label}
              className="flex h-full flex-1 flex-col justify-end"
              title={bar.detail ?? `${bar.label}: ${bar.valueLabel}`}
            >
              <p className="mb-1 text-center text-label uppercase tabular-nums text-text-secondary">
                {bar.valueLabel}
              </p>
              <div
                className="rounded-t-[4px] bg-highlight-brand transition-[height] duration-500 ease-out"
                style={{ height: barHeight }}
              />
            </div>
          )
        })}
      </div>

      <div className="mt-2 flex gap-2 border-t border-ui-secondary pt-2">
        {bars.map((bar) => (
          <p
            key={bar.label}
            className="flex-1 text-center text-label uppercase leading-tight text-text-tertiary"
          >
            {bar.label}
          </p>
        ))}
      </div>
    </figure>
  )
}

/* -------------------------------------------------------------------------- */
/* Stat tile                                                                  */
/* -------------------------------------------------------------------------- */

export const StatTile = ({
  label,
  value,
  detail,
  suppressed = false,
  suppressedNote = 'Groep te klein om te tonen',
}: {
  label: string
  value: ReactNode
  detail?: string
  suppressed?: boolean
  suppressedNote?: string
}) => (
  <div className="rounded-card bg-canvas-primary p-4 card-elevation-sm">
    <p className="text-label uppercase text-text-tertiary">{label}</p>
    {suppressed ? (
      <p className="text-sub mt-2 text-text-tertiary">{suppressedNote}</p>
    ) : (
      <>
        <p className="text-headline-md mt-1 tabular-nums text-text-primary">
          {value}
        </p>
        {detail ? (
          <p className="text-sub text-text-tertiary">{detail}</p>
        ) : null}
      </>
    )}
  </div>
)

/* -------------------------------------------------------------------------- */
/* Progress bar with a baseline reference marker                              */
/* -------------------------------------------------------------------------- */

/**
 * A single percentage with a dashed marker where it started. Used by the
 * employer what-if module so the effect of a contribution is visible as
 * movement away from the current situation, and by the band when a range
 * applies.
 */
export const ReferenceBar = ({
  value,
  baseline,
  low,
  high,
  valueLabel,
  baselineLabel,
}: {
  value: number
  baseline: number
  /** Optional scenario band around `value`, in the same percentage units. */
  low?: number
  high?: number
  valueLabel: string
  baselineLabel: string
}) => (
  <figure className="m-0">
    <div className="relative h-9">
      <div className="absolute inset-x-0 top-1 h-7 rounded-[4px] bg-ui-secondary" />

      {low !== undefined && high !== undefined ? (
        <div
          className="absolute top-1 h-7 rounded-[4px] bg-highlight-brand/30"
          style={{
            left: `${clampPct(low)}%`,
            width: `${clampPct(high) - clampPct(low)}%`,
          }}
        />
      ) : null}

      <div
        className="absolute top-1 left-0 h-7 rounded-l-[4px] bg-highlight-brand transition-[width] duration-300 ease-out"
        style={{ width: `${clampPct(low ?? value)}%` }}
      />

      <div
        className="absolute inset-y-0 w-0 border-l-2 border-dashed border-text-primary"
        style={{ left: `${clampPct(baseline)}%` }}
        aria-hidden="true"
      />
    </div>

    <figcaption className="mt-1 flex flex-wrap justify-between gap-x-3 text-sub text-text-secondary">
      <span className="tabular-nums">{valueLabel}</span>
      <span className="text-text-tertiary">
        <span
          aria-hidden="true"
          className="mr-2 inline-block h-0 w-4 border-t-2 border-dashed border-text-primary align-middle"
        />
        {baselineLabel}
      </span>
    </figcaption>
  </figure>
)

/* -------------------------------------------------------------------------- */
/* Table view — identity and values without relying on the chart at all       */
/* -------------------------------------------------------------------------- */

export const DataTable = ({
  caption,
  columns,
  rows,
}: {
  caption: string
  columns: [string, string]
  rows: { label: string; value: string }[]
}) => (
  <details className="mt-3">
    <summary className="cursor-pointer text-sub text-highlight-turquoise underline underline-offset-2">
      Toon als tabel
    </summary>
    <table className="mt-2 w-full border-collapse text-sub">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-ui-secondary text-left text-text-tertiary">
          <th scope="col" className="py-1 font-medium">
            {columns[0]}
          </th>
          <th scope="col" className="py-1 text-right font-medium">
            {columns[1]}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-ui-secondary last:border-0">
            <td className="py-1 text-text-secondary">{row.label}</td>
            <td className="py-1 text-right tabular-nums text-text-primary">
              {row.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </details>
)

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'

import { useI18n } from '@/i18n/LocaleProvider'
import type { Cents } from '@/lib/pension/money'
import { LocaleSwitch } from './LocaleSwitch'

/**
 * Small UI kit following DESIGN.md: 12px radius, 48px primary buttons, soft
 * shadows in light mode and borders in dark, one teal action per screen.
 */

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

type Tone = 'primary' | 'warm'

/**
 * Mobile-first column. Warm canvas is reserved for onboarding, consent and
 * other trust-building surfaces, per DESIGN.md's surface-tone table.
 */
export const Screen = ({
  children,
  tone = 'primary',
}: {
  children: ReactNode
  tone?: Tone
}) => (
  <div
    className={`mx-auto flex min-h-dvh w-full max-w-[420px] flex-col ${
      tone === 'warm' ? 'bg-canvas-warm' : 'bg-canvas-primary'
    }`}
  >
    {children}
  </div>
)

/** Page gutters: 16px on content screens, 24px on onboarding, per DESIGN.md. */
export const Gutter = ({
  children,
  wide = false,
  className = '',
}: {
  children: ReactNode
  wide?: boolean
  className?: string
}) => (
  <div className={`${wide ? 'px-6' : 'px-4'} ${className}`}>{children}</div>
)

export const AppBar = ({
  title,
  backHref,
  action,
  showLocale = true,
}: {
  title?: string
  /** Omit to use browser history. */
  backHref?: string
  action?: ReactNode
  showLocale?: boolean
}) => {
  const router = useRouter()
  const { t } = useI18n()

  return (
    <header className="flex min-h-14 items-center gap-2 px-4 py-2">
      {backHref !== undefined ? (
        <Link
          href={backHref}
          aria-label={t('nav.back')}
          className="-ml-2 flex size-11 items-center justify-center rounded-full text-text-primary"
        >
          <BackArrow />
        </Link>
      ) : (
        <button
          type="button"
          aria-label={t('nav.back')}
          onClick={() => router.back()}
          className="-ml-2 flex size-11 items-center justify-center rounded-full text-text-primary"
        >
          <BackArrow />
        </button>
      )}
      {title ? (
        <h1 className="text-headline-sm truncate text-text-primary">{title}</h1>
      ) : null}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {action}
        {showLocale ? <LocaleSwitch /> : null}
      </div>
    </header>
  )
}

const BackArrow = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M12.5 16 6.5 10l6-6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const Card = ({
  children,
  className = '',
  elevated = false,
  dashboard = false,
}: {
  children: ReactNode
  className?: string
  elevated?: boolean
  /** 24px radius for dashboard/statement cards, 12px otherwise. */
  dashboard?: boolean
}) => (
  <section
    className={`bg-canvas-primary ${
      dashboard ? 'rounded-dashboard p-6' : 'rounded-card p-4'
    } ${elevated ? 'card-elevation-md' : 'card-elevation-sm'} ${className}`}
  >
    {children}
  </section>
)

/** Uppercase micro-label. 10px, per the typography scale. */
export const MicroLabel = ({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) => (
  <p
    className={`text-label uppercase text-text-tertiary ${className}`}
  >
    {children}
  </p>
)

/* -------------------------------------------------------------------------- */
/* Buttons                                                                    */
/* -------------------------------------------------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'link'

const buttonClasses = (variant: ButtonVariant, size: 'lg' | 'md') => {
  const base =
    'inline-flex w-full items-center justify-center rounded-card text-body font-medium transition-opacity disabled:opacity-40'
  const height = size === 'lg' ? 'h-12' : 'h-10'
  const tone = {
    primary: 'bg-highlight-brand text-white active:opacity-80',
    secondary:
      'border-[1.5px] border-ui-primary bg-transparent text-text-primary active:opacity-70',
    link: 'h-auto w-auto text-highlight-turquoise underline underline-offset-4',
  }[variant]
  return `${base} ${variant === 'link' ? '' : height} ${tone}`
}

export const Button = ({
  variant = 'primary',
  size = 'lg',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: 'lg' | 'md'
}) => (
  <button
    type="button"
    className={`${buttonClasses(variant, size)} ${className}`}
    {...rest}
  />
)

export const ButtonLink = ({
  href,
  variant = 'primary',
  size = 'lg',
  className = '',
  children,
}: {
  href: string
  variant?: ButtonVariant
  size?: 'lg' | 'md'
  className?: string
  children: ReactNode
}) => (
  <Link href={href} className={`${buttonClasses(variant, size)} ${className}`}>
    {children}
  </Link>
)

/* -------------------------------------------------------------------------- */
/* Badges                                                                     */
/* -------------------------------------------------------------------------- */

export type BadgeTone = 'brand' | 'green' | 'orange' | 'red' | 'neutral'

const badgeTones: Record<BadgeTone, string> = {
  brand: 'bg-highlight-brand/15 text-highlight-turquoise',
  green: 'bg-highlight-green/15 text-highlight-turquoise',
  orange: 'bg-highlight-orange/15 text-highlight-orange',
  red: 'bg-highlight-red/12 text-highlight-red',
  neutral: 'bg-ui-secondary text-text-secondary',
}

export const Badge = ({
  tone = 'neutral',
  children,
}: {
  tone?: BadgeTone
  children: ReactNode
}) => (
  <span
    className={`inline-flex items-center gap-1 rounded-pill px-2 py-1 text-label uppercase ${badgeTones[tone]}`}
  >
    {children}
  </span>
)

/* -------------------------------------------------------------------------- */
/* Animated amount                                                            */
/* -------------------------------------------------------------------------- */

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * Counts up to an amount. Used for the headline reveal on the results screen
 * and for live updates as the action slider moves.
 *
 * Honours prefers-reduced-motion by jumping straight to the value.
 */
export const AnimatedEuros = ({
  cents,
  durationMs = 900,
  revealFromZero = false,
  className = '',
}: {
  cents: Cents
  durationMs?: number
  /** Start the very first animation at zero, for the reveal moment. */
  revealFromZero?: boolean
  className?: string
}) => {
  const { formatEuros } = useI18n()
  const [displayed, setDisplayed] = useState<Cents>(
    revealFromZero ? 0 : cents,
  )
  const fromRef = useRef<Cents>(revealFromZero ? 0 : cents)
  // Mirrors `displayed` so cleanup can read it without depending on it.
  const displayedRef = useRef<Cents>(revealFromZero ? 0 : cents)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    if (from === cents) return

    // Reduced motion still runs through a frame callback rather than setting
    // state synchronously here; it just lands on the final value immediately.
    const skip = prefersReducedMotion() || durationMs <= 0
    const start = performance.now()

    const step = (now: number) => {
      const progress = skip ? 1 : Math.min(1, (now - start) / durationMs)
      const value = Math.round(from + (cents - from) * easeOutCubic(progress))
      displayedRef.current = value
      setDisplayed(value)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = cents
      }
    }
    frameRef.current = requestAnimationFrame(step)

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      // Wherever the animation stopped is the new starting point.
      fromRef.current = displayedRef.current
    }
  }, [cents, durationMs])

  return (
    <span className={className} aria-live="polite">
      {formatEuros(displayed)}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Slider                                                                     */
/* -------------------------------------------------------------------------- */

export const Slider = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  valueLabel,
  minLabel,
  maxLabel,
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  valueLabel: string
  minLabel?: string
  maxLabel?: string
  hint?: string
}) => (
  <div>
    <div className="flex items-baseline justify-between gap-3">
      <label className="text-sub text-text-secondary">{label}</label>
      <output className="text-headline-sm text-text-primary">
        {valueLabel}
      </output>
    </div>
    <input
      type="range"
      className="vive-slider mt-2"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      onChange={(event) => onChange(Number(event.target.value))}
    />
    {minLabel || maxLabel ? (
      <div className="flex justify-between">
        <MicroLabel>{minLabel}</MicroLabel>
        <MicroLabel>{maxLabel}</MicroLabel>
      </div>
    ) : null}
    {hint ? (
      <p className="mt-2 text-sub text-text-tertiary">{hint}</p>
    ) : null}
  </div>
)

/* -------------------------------------------------------------------------- */
/* Progressive disclosure                                                     */
/* -------------------------------------------------------------------------- */

export const Disclosure = ({
  summary,
  amount,
  children,
  defaultOpen = false,
}: {
  summary: ReactNode
  amount?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}) => (
  <details
    className="group border-b border-ui-secondary last:border-b-0"
    open={defaultOpen}
  >
    <summary className="flex cursor-pointer list-none items-center gap-3 py-4 [&::-webkit-details-marker]:hidden">
      <div className="min-w-0 flex-1">{summary}</div>
      {amount ? (
        <div className="text-headline-sm shrink-0 text-text-primary">
          {amount}
        </div>
      ) : null}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="shrink-0 text-text-tertiary transition-transform group-open:rotate-180"
      >
        <path
          d="m4 6 4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </summary>
    <div className="pb-4">{children}</div>
  </details>
)

/* -------------------------------------------------------------------------- */
/* Compliance affordances                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Sits next to every projected number. The Wft line between informeren and
 * adviseren runs right here: describe, label the assumptions, link to them,
 * never recommend.
 */
export const IndicationNote = ({
  className = '',
}: {
  className?: string
}) => {
  const { t } = useI18n()
  return (
    <p className={`text-sub text-text-tertiary ${className}`}>
      {t('disclaimer.indication')}{' '}
      <Link
        href="/aannames"
        className="text-highlight-turquoise underline underline-offset-2"
      >
        {t('disclaimer.viewAssumptions')}
      </Link>
    </p>
  )
}

export const InfoBanner = ({
  tone = 'neutral',
  title,
  children,
}: {
  tone?: 'neutral' | 'warning'
  title?: string
  children: ReactNode
}) => (
  <aside
    className={`rounded-card p-4 ${
      tone === 'warning'
        ? 'bg-highlight-orange/12 text-text-primary'
        : 'bg-ui-tertiary text-text-secondary'
    }`}
  >
    {title ? (
      <p className="text-headline-sm mb-1 text-text-primary">{title}</p>
    ) : null}
    <div className="text-sub">{children}</div>
  </aside>
)

/**
 * Sticky footer for the single primary action on a screen.
 *
 * The generous bottom padding is a safe area: it keeps the footer's own helper
 * text clear of the fixed dev persona chip in the bottom corner, and reads like
 * the iOS home-indicator inset on a real device.
 */
export const StickyFooter = ({ children }: { children: ReactNode }) => (
  <div className="sticky bottom-0 mt-auto border-t border-ui-secondary bg-canvas-primary/95 px-4 pt-4 pb-16 backdrop-blur">
    {children}
  </div>
)

export const Row = ({
  label,
  detail,
  amount,
  tone = 'default',
}: {
  label: ReactNode
  detail?: ReactNode
  amount: ReactNode
  tone?: 'default' | 'muted'
}) => (
  <div className="flex items-center gap-3 py-2">
    <div className="min-w-0 flex-1">
      <p
        className={`text-body ${
          tone === 'muted' ? 'text-text-secondary' : 'text-text-primary'
        }`}
      >
        {label}
      </p>
      {detail ? (
        <p className="text-sub text-text-tertiary">{detail}</p>
      ) : null}
    </div>
    <p className="text-body shrink-0 tabular-nums text-text-primary">{amount}</p>
  </div>
)

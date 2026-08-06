import { action } from './messages/action'
import { assumptions } from './messages/assumptions'
import { common } from './messages/common'
import { consent } from './messages/consent'
import { data } from './messages/data'
import { dev } from './messages/dev'
import { employer } from './messages/employer'
import { intro } from './messages/intro'
import { result } from './messages/result'
import { DEFAULT_LOCALE, type Locale, type Vars } from './types'

/**
 * Dutch is the source of truth for the key set: `MessageKey` is derived from it,
 * and the English dictionary is annotated with `Record<MessageKey, string>` so a
 * missing English key is a compile error, not a runtime surprise.
 *
 * `translations.test.ts` covers what types cannot: extra keys, empty values and
 * mismatched `{placeholders}` between the two languages.
 */
const nl = {
  ...common.nl,
  ...intro.nl,
  ...consent.nl,
  ...result.nl,
  ...action.nl,
  ...assumptions.nl,
  ...employer.nl,
  ...data.nl,
  ...dev.nl,
}

export type MessageKey = keyof typeof nl

const en: Record<MessageKey, string> = {
  ...common.en,
  ...intro.en,
  ...consent.en,
  ...result.en,
  ...action.en,
  ...assumptions.en,
  ...employer.en,
  ...data.en,
  ...dev.en,
}

export const translations: Record<Locale, Record<string, string>> = { nl, en }

/** Replaces `{name}` with `vars.name`. Unknown placeholders are left intact. */
export const interpolate = (template: string, vars?: Vars): string => {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

const lookup = (locale: Locale, key: string): string | undefined =>
  translations[locale][key] ?? translations[DEFAULT_LOCALE][key]

/** Translate a key, falling back to Dutch and then to the key itself. */
export const translate = (
  locale: Locale,
  key: MessageKey,
  vars?: Vars,
): string => {
  const template = lookup(locale, key)
  if (template === undefined) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[i18n] missing message key: ${key}`)
    }
    return key
  }
  return interpolate(template, vars)
}

/**
 * Split a message around one placeholder, so a React node can sit inside a
 * translated sentence without hardcoding word order.
 *
 * Dutch "Je komt {amount} per maand tekort." and English "You will be {amount}
 * per month short." both render correctly from the same call.
 */
export const translateAround = (
  locale: Locale,
  key: MessageKey,
  placeholder: string,
  vars?: Vars,
): { before: string; after: string } => {
  const template = lookup(locale, key) ?? key
  const token = `{${placeholder}}`
  const index = template.indexOf(token)
  if (index === -1) {
    return { before: interpolate(template, vars), after: '' }
  }
  return {
    before: interpolate(template.slice(0, index), vars),
    after: interpolate(template.slice(index + token.length), vars),
  }
}

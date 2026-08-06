'use client'

import { useState } from 'react'

import { useI18n } from '@/i18n/LocaleProvider'
import { PERSONAS } from '@/lib/pension/personas'
import { usePension } from '@/state/PensionProvider'

/**
 * Dev-only persona switcher. Deliberately styled as scaffolding rather than
 * product UI — purple brand colour, "Dev" label — so nobody mistakes it for a
 * feature in a demo.
 *
 * Switching persona loads the mock data directly and marks consent as given, so
 * you can hop between cases without replaying the DigiD flow every time.
 */
export const PersonaSwitcher = () => {
  const { personaId, selectPersona, loadPersona, hasConsented } = usePension()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const selected = PERSONAS.find((persona) => persona.personaId === personaId)

  // Before consent, picking a persona only decides who you will be. After it,
  // picking one swaps the loaded data so you can compare cases in place.
  const choose = (nextPersonaId: string) => {
    if (hasConsented) void loadPersona(nextPersonaId)
    else selectPersona(nextPersonaId)
    setOpen(false)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[420px] flex-col items-end p-3">
      {open ? (
        <div className="pointer-events-auto mb-2 w-full rounded-card border border-brand-purple/40 bg-canvas-primary p-2 shadow-soft-md">
          <p className="px-2 py-1 text-label uppercase text-brand-purple">
            {t('dev.label')}
          </p>
          <ul>
            {PERSONAS.map((persona) => {
              const active = persona.personaId === personaId
              return (
                <li key={persona.personaId}>
                  <button
                    type="button"
                    onClick={() => choose(persona.personaId)}
                    className={`w-full rounded-[8px] px-2 py-2 text-left ${
                      active ? 'bg-brand-purple/12' : ''
                    }`}
                  >
                    <span className="text-body text-text-primary">
                      {persona.displayName}
                    </span>
                    <span className="block text-sub text-text-tertiary">
                      {t(persona.summaryKey)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="pointer-events-auto rounded-pill bg-brand-purple px-3 py-2 text-label uppercase text-white shadow-soft-md"
      >
        {selected
          ? t('dev.chip', { name: selected.displayName })
          : t('dev.chipEmpty')}
      </button>
    </div>
  )
}

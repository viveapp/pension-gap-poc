'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { analyseGap } from '@/lib/pension/calc'
import { DEFAULT_ASSUMPTIONS } from '@/lib/pension/constants'
import type { Cents } from '@/lib/pension/money'
import { createMockOcktoProvider } from '@/lib/pension/ockto'
import { DEFAULT_PERSONA_ID } from '@/lib/pension/personas'
import type {
  Assumptions,
  FinancialPicture,
  GapAnalysis,
} from '@/lib/pension/types'

/**
 * All prototype state lives here, in memory only. A refresh resets the flow on
 * purpose: nothing is persisted, so no financial data outlives the tab.
 */

const provider = createMockOcktoProvider()

type PensionState = {
  /** Persona currently selected in the dev switcher. */
  personaId: string
  /** `null` until the consent flow has returned data. */
  picture: FinancialPicture | null
  /** True once the mocked Ockto handoff completed. Guards the result screens. */
  hasConsented: boolean
  assumptions: Assumptions
  /** Extra monthly inleg from the action-screen slider. */
  extraMonthly: Cents
  /** Recomputed on every change. `null` while no data is loaded. */
  analysis: GapAnalysis | null
  /** Choose who to run the flow as, without fetching anything yet. */
  selectPersona: (personaId: string) => void
  loadPersona: (personaId: string) => Promise<void>
  setAssumptions: (next: Assumptions) => void
  updateAssumption: <Key extends keyof Assumptions>(
    key: Key,
    value: Assumptions[Key],
  ) => void
  resetAssumptions: () => void
  setExtraMonthly: (cents: Cents) => void
  reset: () => void
}

const PensionContext = createContext<PensionState | null>(null)

export const PensionProvider = ({ children }: { children: ReactNode }) => {
  const [personaId, setPersonaId] = useState(DEFAULT_PERSONA_ID)
  const [picture, setPicture] = useState<FinancialPicture | null>(null)
  const [hasConsented, setHasConsented] = useState(false)
  const [assumptions, setAssumptions] =
    useState<Assumptions>(DEFAULT_ASSUMPTIONS)
  const [extraMonthly, setExtraMonthly] = useState<Cents>(0)

  const selectPersona = useCallback((nextPersonaId: string) => {
    setPersonaId(nextPersonaId)
    setPicture(null)
    setHasConsented(false)
    setExtraMonthly(0)
  }, [])

  const loadPersona = useCallback(async (nextPersonaId: string) => {
    const next = await provider.getFinancialPicture(nextPersonaId)
    setPersonaId(nextPersonaId)
    setPicture(next)
    setHasConsented(true)
    // A different person means a different suggested inleg; start from zero.
    setExtraMonthly(0)
  }, [])

  const updateAssumption = useCallback(
    <Key extends keyof Assumptions>(key: Key, value: Assumptions[Key]) => {
      setAssumptions((current) => ({ ...current, [key]: value }))
    },
    [],
  )

  const resetAssumptions = useCallback(() => {
    setAssumptions(DEFAULT_ASSUMPTIONS)
  }, [])

  const reset = useCallback(() => {
    setPicture(null)
    setHasConsented(false)
    setExtraMonthly(0)
    setAssumptions(DEFAULT_ASSUMPTIONS)
  }, [])

  const analysis = useMemo(
    () => (picture ? analyseGap(picture, assumptions, extraMonthly) : null),
    [picture, assumptions, extraMonthly],
  )

  const value = useMemo<PensionState>(
    () => ({
      personaId,
      picture,
      hasConsented,
      assumptions,
      extraMonthly,
      analysis,
      selectPersona,
      loadPersona,
      setAssumptions,
      updateAssumption,
      resetAssumptions,
      setExtraMonthly,
      reset,
    }),
    [
      personaId,
      picture,
      hasConsented,
      assumptions,
      extraMonthly,
      analysis,
      selectPersona,
      loadPersona,
      updateAssumption,
      resetAssumptions,
      reset,
    ],
  )

  return (
    <PensionContext.Provider value={value}>{children}</PensionContext.Provider>
  )
}

export const usePension = (): PensionState => {
  const context = useContext(PensionContext)
  if (!context) {
    throw new Error('usePension must be used inside a PensionProvider')
  }
  return context
}

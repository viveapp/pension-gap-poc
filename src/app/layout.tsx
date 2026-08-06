import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'

import { LocaleProvider } from '@/i18n/LocaleProvider'
import { PensionProvider } from '@/state/PensionProvider'
import './globals.css'

/**
 * Stand-in for TT Norms Pro, which is licensed and not available here. Same
 * geometric-humanist character and the same four weights the design system uses.
 */
const viveSans = Plus_Jakarta_Sans({
  variable: '--font-vive-sans',
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Vive · Pensioengat / Pension gap',
  description:
    'Prototype: zie je volledige pensioenplaatje, je pensioengat en wat het kost om dat te dichten. Bilingual: Nederlands en English.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // lang starts at the default and is kept in sync by LocaleProvider.
    <html lang="nl" className={`${viveSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <LocaleProvider>
          <PensionProvider>{children}</PensionProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}

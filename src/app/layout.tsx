import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'

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
  title: 'Vive · Pensioengat',
  description:
    'Prototype: zie je volledige pensioenplaatje, je pensioengat en wat het kost om dat te dichten.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="nl" className={`${viveSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <PensionProvider>{children}</PensionProvider>
      </body>
    </html>
  )
}

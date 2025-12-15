import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'silbenkling',
  description: 'Lokale Intranet-KI für Teams',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}

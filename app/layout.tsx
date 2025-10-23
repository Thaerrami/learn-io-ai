import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Learn.io - AI Education Demo',
  description: 'Personalized MCQs and Chapter Summaries for University & Certification Students',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}


import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'Google Ads Campaign Builder',
  description: 'AI-powered Google Ads campaign builder with keyword grouping and ad copy generation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EMFRONTIER LAB - 관리자',
  description: '정책자금 관리 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}

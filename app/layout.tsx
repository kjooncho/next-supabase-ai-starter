import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, Noto_Serif_JP } from 'next/font/google'
import './globals.css'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
})

const notoSerifJP = Noto_Serif_JP({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-noto-serif-jp',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'My Niche (毎日)',
  description: '일본 거주 한국인을 위한 일본어 생활 학습 앱',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a1f3d',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="ko"
      className={`${notoSansKR.variable} ${notoSerifJP.variable} h-full`}
    >
      <body className="h-full bg-[var(--color-bg)]">
        <div className="mx-auto max-w-[390px] h-full relative">
          {children}
        </div>
      </body>
    </html>
  )
}

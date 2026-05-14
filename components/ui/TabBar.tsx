'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: '채팅', icon: '💬', kanji: false },
  { href: '/map', label: '지도', icon: '🗺️', kanji: false },
  { href: '/life', label: '생활', icon: '🏠', kanji: false },
  { href: '/deck', label: '내 카드', icon: '📚', kanji: false },
  { href: '/kanji', label: '漢字', icon: '漢', kanji: true },
] as const

export default function TabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] h-[80px] bg-[var(--color-surface)] border-t border-[var(--color-hairline)] flex items-center pb-[34px]"
      style={{ zIndex: 50 }}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center gap-0.5"
          >
            <span
              className={tab.kanji ? 'font-jp text-[18px] font-bold leading-none' : 'text-xl leading-none'}
              style={tab.kanji ? { color: isActive ? 'var(--color-accent)' : 'var(--text-tertiary)' } : undefined}
            >
              {tab.icon}
            </span>
            <span
              className="text-caption"
              style={{ color: isActive ? 'var(--color-accent)' : 'var(--text-tertiary)' }}
            >
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

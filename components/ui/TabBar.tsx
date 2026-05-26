'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle, MapPin, Home, BookOpen } from 'lucide-react'

const tabs = [
  { href: '/', label: '채팅', Icon: MessageCircle, kanji: false },
  { href: '/map', label: '지도', Icon: MapPin, kanji: false },
  { href: '/life', label: '생활', Icon: Home, kanji: false },
  { href: '/deck', label: '내 카드', Icon: BookOpen, kanji: false },
  { href: '/kanji', label: '漢字', Icon: null, kanji: true },
] as const

export default function TabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 h-[80px] bg-[var(--color-surface)] border-t border-[var(--color-hairline)] flex items-center pt-2 pb-[34px]"
      style={{ zIndex: 50 }}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        const color = isActive ? 'var(--color-accent)' : 'var(--text-tertiary)'
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center gap-0.5"
          >
            {tab.kanji ? (
              <span className="font-jp text-[18px] font-bold leading-none" style={{ color }}>漢</span>
            ) : (
              tab.Icon && (
                <span className={isActive ? 'tab-icon-active' : ''} style={{ color }}>
                  <tab.Icon size={22} strokeWidth={isActive ? 0 : 1.8} />
                </span>
              )
            )}
            <span className="text-caption" style={{ color }}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle, Map, House, Library } from 'lucide-react'

const tabs = [
  { href: '/', label: '채팅', Icon: MessageCircle, kanji: false },
  { href: '/map', label: '지도', Icon: Map, kanji: false },
  { href: '/life', label: '생활', Icon: House, kanji: false },
  { href: '/deck', label: '내 카드', Icon: Library, kanji: false },
  { href: '/kanji', label: '漢字', Icon: null, kanji: true },
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
              tab.Icon && <tab.Icon size={22} color={color} strokeWidth={isActive ? 2.2 : 1.8} />
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

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: '채팅', icon: '💬' },
  { href: '/calendar', label: '캘린더', icon: '📅', disabled: true },
  { href: '/life', label: '생활', icon: '🏠', disabled: true },
  { href: '/deck', label: '내 카드', icon: '📚' },
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
        const isDisabled = 'disabled' in tab && tab.disabled

        if (isDisabled) {
          return (
            <div
              key={tab.href}
              className="flex-1 flex flex-col items-center gap-0.5 opacity-30 cursor-not-allowed"
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="text-caption text-[var(--text-tertiary)]">{tab.label}</span>
            </div>
          )
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center gap-0.5"
          >
            <span className="text-xl leading-none">{tab.icon}</span>
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

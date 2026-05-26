import { ReactNode } from 'react'
import { ChatRole } from '@/types'
import DarumaAvatar from '@/components/ui/DarumaAvatar'

interface ChatBubbleProps {
  role: ChatRole
  children: ReactNode
}

const GrandmaAvatar = () => (
  <div
    className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
    style={{ backgroundColor: 'var(--bubble-grandma)' }}
    aria-label="할머니"
  >
    👵
  </div>
)

export default function ChatBubble({ role, children }: ChatBubbleProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-sm text-body text-white"
          style={{ backgroundColor: 'var(--bubble-user)' }}
        >
          {children}
        </div>
      </div>
    )
  }

  if (role === 'grandma') {
    return (
      <div className="flex items-end gap-2">
        <GrandmaAvatar />
        <div
          className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-bl-sm text-body"
          style={{
            backgroundColor: 'var(--bubble-grandma)',
            color: 'var(--text-primary)',
          }}
        >
          {children}
        </div>
      </div>
    )
  }

  // ai-nichi
  return (
    <div className="flex items-end gap-2">
      <DarumaAvatar size={36} className="flex-shrink-0" />
      <div
        className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-bl-sm text-body"
        style={{
          backgroundColor: 'var(--bubble-ai)',
          color: 'var(--text-primary)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

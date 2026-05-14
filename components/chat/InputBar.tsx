'use client'

import { FormEvent, useRef, useState } from 'react'
import { ImageIcon, ArrowUp } from 'lucide-react'

interface InputBarProps {
  onSubmit: (text: string) => void
  onImageSelect?: (file: File) => void
  disabled?: boolean
  placeholder?: string
  maxLength?: number
}

export default function InputBar({
  onSubmit,
  onImageSelect,
  disabled = false,
  placeholder = '일본어로 하고 싶은 말을 한국어로 적어보세요',
  maxLength = 500,
}: InputBarProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onImageSelect) return
    if (file.size > 4 * 1024 * 1024) {
      alert('이미지 크기는 4MB 이하만 지원합니다')
      return
    }
    onImageSelect(file)
    e.target.value = ''
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > maxLength) return
    setValue(e.target.value)
    // 자동 높이 조절
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  const remaining = maxLength - value.length
  const isNearLimit = remaining <= 50

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 px-4 py-3 border-t border-[var(--color-hairline)] bg-[var(--color-surface)]"
    >
      {onImageSelect && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-30 active:opacity-60"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}
            aria-label="이미지 번역"
          >
            <ImageIcon size={18} color="var(--text-tertiary)" />
          </button>
        </>
      )}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="w-full resize-none rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-bg)] px-4 py-2.5 text-body text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors max-h-32 overflow-y-auto"
          style={{ lineHeight: '1.5' }}
        />
        {isNearLimit && (
          <span
            className="absolute bottom-2 right-3 text-[11px]"
            style={{ color: remaining <= 10 ? 'var(--color-error)' : 'var(--text-tertiary)' }}
          >
            {remaining}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-30"
        style={{ backgroundColor: 'var(--color-accent)' }}
        aria-label="전송"
      >
        <ArrowUp size={18} color="white" strokeWidth={2.5} />
      </button>
    </form>
  )
}

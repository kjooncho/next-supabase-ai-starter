import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Card, ChatRole, CorrectionItem } from '@/types'
import type { TranslationResultData } from '@/components/chat/TranslationResult'

// ===== Type Definitions =====

export type Message =
  | { id: string; kind: 'bubble'; role: ChatRole; text: string }
  | { id: string; kind: 'correction'; items: CorrectionItem[] }
  | { id: string; kind: 'loading'; mode?: 'image' }
  | { id: string; kind: 'image-upload'; dataUrl: string }
  | { id: string; kind: 'translation-result'; data: TranslationResultData }

export type { TranslationResultData }

// ===== Auth Store =====

interface AuthStoreState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, isLoading: false }),
}))

// ===== Chat Store =====

interface ChatStoreState {
  messages: Message[]
  isLoading: boolean
  currentStep: number
  pendingCorrection: { needs_correction: boolean; correction_items: CorrectionItem[] } | null
  resultModal: TranslationResultData | null

  // Actions
  addMessage: (message: Message) => void
  removeMessage: (id: string) => void
  replaceMessage: (id: string, message: Message) => void
  updateMessages: (messages: Message[]) => void
  setCorrectionData: (data: { needs_correction: boolean; correction_items: CorrectionItem[] }) => void
  setCurrentStep: (step: number) => void
  setLoading: (loading: boolean) => void
  setResultModal: (data: TranslationResultData | null) => void
  clearMessages: () => void
  reset: () => void
}

const GREETING_MESSAGE: Message = {
  id: 'greeting',
  kind: 'bubble',
  role: 'ai-nichi',
  text: '안녕하세요! 일본어로 하고 싶은 말을 한국어로 적어보세요. 문화적으로 자연스러운 표현으로 도와드릴게요 😊',
}

export const useChatStore = create<ChatStoreState>((set) => ({
  messages: [GREETING_MESSAGE],
  isLoading: false,
  currentStep: -1,
  pendingCorrection: null,
  resultModal: null,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    })),

  replaceMessage: (id, message) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? message : m)),
    })),

  updateMessages: (messages) =>
    set({
      messages,
    }),

  setCorrectionData: (data) =>
    set((state) => {
      if (!data.needs_correction || data.correction_items.length === 0) {
        return { pendingCorrection: data }
      }

      const withoutLoading = state.messages.filter((m) => m.id !== '__loading__')
      return {
        pendingCorrection: data,
        messages: [
          ...withoutLoading,
          { id: crypto.randomUUID(), kind: 'correction', items: data.correction_items } as const,
          { id: '__loading__', kind: 'loading' } as const,
        ],
      }
    }),

  setCurrentStep: (step) => set({ currentStep: step }),

  setLoading: (isLoading) => set({ isLoading }),

  setResultModal: (data) => set({ resultModal: data }),

  clearMessages: () =>
    set({
      messages: [GREETING_MESSAGE],
      isLoading: false,
      currentStep: -1,
      pendingCorrection: null,
    }),

  reset: () =>
    set({
      messages: [GREETING_MESSAGE],
      isLoading: false,
      currentStep: -1,
      pendingCorrection: null,
      resultModal: null,
    }),
}))

// ===== Card Store =====

interface CardStoreState {
  cards: Card[]
  selectedCard: Card | null
  isLoading: boolean
  filterStatus: 'all' | 'learning' | 'mastered'

  // Actions
  setCards: (cards: Card[]) => void
  addCard: (card: Card) => void
  updateCard: (id: string, card: Card) => void
  removeCard: (id: string) => void
  setSelectedCard: (card: Card | null) => void
  setLoading: (loading: boolean) => void
  setFilterStatus: (status: 'all' | 'learning' | 'mastered') => void
  reset: () => void
}

export const useCardStore = create<CardStoreState>((set) => ({
  cards: [],
  selectedCard: null,
  isLoading: false,
  filterStatus: 'all',

  setCards: (cards) =>
    set({
      cards,
    }),

  addCard: (card) =>
    set((state) => ({
      cards: [card, ...state.cards],
    })),

  updateCard: (id, card) =>
    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? card : c)),
      selectedCard: state.selectedCard?.id === id ? card : state.selectedCard,
    })),

  removeCard: (id) =>
    set((state) => ({
      cards: state.cards.filter((c) => c.id !== id),
      selectedCard: state.selectedCard?.id === id ? null : state.selectedCard,
    })),

  setSelectedCard: (card) =>
    set({
      selectedCard: card,
    }),

  setLoading: (isLoading) =>
    set({
      isLoading,
    }),

  setFilterStatus: (status) =>
    set({
      filterStatus: status,
    }),

  reset: () =>
    set({
      cards: [],
      selectedCard: null,
      isLoading: false,
      filterStatus: 'all',
    }),
}))

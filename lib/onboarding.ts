export type OnboardingStep = 'name' | 'level' | 'situations' | 'goal' | 'complete'

export interface OnboardingData {
  displayName: string
  level: 'beginner' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  lifeSituations: string[]
  learningGoal: string
}

export const SITUATIONS = [
  { id: 'work', label: '직장' },
  { id: 'parenting', label: '육아' },
  { id: 'daily', label: '일상' },
  { id: 'social', label: '소셜' },
  { id: 'govt', label: '관공서' },
]

export const LEVELS = [
  { id: 'beginner', label: '완전 초급 (히라가나/가타카나도 배우는 중)' },
  { id: 'N5', label: 'N5 (가장 기본)' },
  { id: 'N4', label: 'N4' },
  { id: 'N3', label: 'N3' },
  { id: 'N2', label: 'N2' },
  { id: 'N1', label: 'N1' },
]

export const GOALS = [
  '외출할 때 필요한 정보 읽기',
  '일상 회화로 소통하기',
  '일 관련 이메일/문서 읽기',
  '취미 콘텐츠 즐기기 (드라마, 책)',
]

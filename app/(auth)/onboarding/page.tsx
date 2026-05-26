'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'
import Step1Name from '@/components/onboarding/Step1Name'
import Step2Level from '@/components/onboarding/Step2Level'
import Step3Situations from '@/components/onboarding/Step3Situations'
import Step4Goal from '@/components/onboarding/Step4Goal'
import Step5Complete from '@/components/onboarding/Step5Complete'
import Button from '@/components/ui/Button'
import { OnboardingStep, OnboardingData } from '@/lib/onboarding'

const STEPS: OnboardingStep[] = ['name', 'level', 'situations', 'goal', 'complete']

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createBrowserSupabase()
  const [step, setStep] = useState<OnboardingStep>('name')
  const [data, setData] = useState<OnboardingData>({
    displayName: '',
    level: 'beginner',
    lifeSituations: [],
    learningGoal: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isStepValid = (): boolean => {
    switch (step) {
      case 'name':
        return data.displayName.trim().length > 0
      case 'level':
        return !!data.level
      case 'situations':
        return data.lifeSituations.length > 0
      case 'goal':
        return data.learningGoal.length > 0
      case 'complete':
        return true
      default:
        return false
    }
  }

  const handleNext = async () => {
    if (!isStepValid()) {
      setError('모든 항목을 입력해주세요.')
      return
    }

    if (step === 'complete') {
      setLoading(true)
      setError(null)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError('사용자 정보를 찾을 수 없습니다.')
          return
        }

        const { error: updateError } = await supabase
          .from('users')
          .update({
            display_name: data.displayName,
            level: data.level,
            life_situations: data.lifeSituations,
          })
          .eq('id', user.id)

        if (updateError) {
          setError('저장 중 오류가 발생했습니다.')
          console.error('Onboarding save error:', updateError)
          return
        }

        router.push('/(tabs)')
      } catch (err) {
        setError('저장 중 오류가 발생했습니다.')
        console.error('Onboarding save error:', err)
      } finally {
        setLoading(false)
      }
    } else {
      const currentIndex = STEPS.indexOf(step)
      if (currentIndex < STEPS.length - 1) {
        setStep(STEPS[currentIndex + 1])
        setError(null)
      }
    }
  }

  const handlePrev = () => {
    const currentIndex = STEPS.indexOf(step)
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1])
      setError(null)
    }
  }

  const stepComponents: Record<OnboardingStep, React.ReactNode> = {
    name: <Step1Name value={data.displayName} onChange={(v) => setData({ ...data, displayName: v })} />,
    level: <Step2Level value={data.level} onChange={(v) => setData({ ...data, level: v })} />,
    situations: <Step3Situations value={data.lifeSituations} onChange={(v) => setData({ ...data, lifeSituations: v })} />,
    goal: <Step4Goal value={data.learningGoal} onChange={(v) => setData({ ...data, learningGoal: v })} />,
    complete: <Step5Complete data={data} />,
  }

  const progressPercent = ((STEPS.indexOf(step) + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <div className="bg-[var(--color-surface)]/50 h-1">
        <div
          className="h-full bg-[var(--color-accent)] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-8">
          {stepComponents[step]}
          {error && <p className="text-body text-[var(--color-error)] text-center">{error}</p>}
        </div>
      </div>

      <div className="px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex gap-2 bg-[var(--color-surface)]/50">
        {step !== 'name' && (
          <Button onClick={handlePrev} variant="secondary" size="lg" className="flex-1">
            뒤로
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={loading || !isStepValid()}
          variant="primary"
          size="lg"
          className="flex-1"
        >
          {loading ? '저장 중...' : step === 'complete' ? '시작하기' : '다음'}
        </Button>
      </div>
    </div>
  )
}

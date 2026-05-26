import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentUserProfile } from '@/lib/auth'

export default async function RootPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getCurrentUserProfile()

  if (
    !profile ||
    !profile.level ||
    !profile.life_situations ||
    (Array.isArray(profile.life_situations) && profile.life_situations.length === 0)
  ) {
    redirect('/(auth)/onboarding')
  }

  redirect('/(tabs)')
}

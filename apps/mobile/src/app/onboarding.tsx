import { useRouter } from 'expo-router';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';

export default function Onboarding() {
  const router = useRouter();

  return <OnboardingScreen onFinish={() => router.replace('/login')} />;
}
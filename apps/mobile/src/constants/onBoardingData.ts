import { Ionicons } from '@expo/vector-icons';

export type OnboardingItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const ONBOARDING_DATA: OnboardingItem[] = [
  {
    id: '1',
    title: 'Your School\nIn Your Pocket',
    subtitle: 'Classes, study materials, notices,\nexams, routine and more.',
    icon: 'school',
  },
  {
    id: '2',
    title: 'Track Your\nAttendance',
    subtitle: 'Easily track your daily attendance,\nholidays, and leave requests.',
    icon: 'calendar',
  },
  {
    id: '3',
    title: 'Never Miss\nAn Assignment',
    subtitle: 'Submit your homework on time\nand get instant grades.',
    icon: 'book',
  },
//   {
//     id: '4',
//     title: 'Live Online\nClasses',
//     subtitle: 'Join live interactive classes from\nanywhere in the world.',
//     icon: 'laptop',
//   },
];
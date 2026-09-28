import { Ionicons } from '@expo/vector-icons';
import { useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/context/ThemeContext';
import { OnboardingItem } from '@/constants/onBoardingData';

export function OnboardingSlide({ item }: { item: OnboardingItem }) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();

  return (
    <View className="items-center justify-center px-10" style={{ width }}>
      <View className="mb-10 h-[260px] w-[260px] items-center justify-center rounded-full bg-muted">
        <Ionicons name={item.icon} size={120} color={colors.primary} />

        <View className="absolute left-5 top-[30px]">
          <Ionicons name="documents" size={30} color={colors.warning} />
        </View>
        <View className="absolute right-5 top-[50px]">
          <Ionicons name="chatbubbles" size={30} color={colors.success} />
        </View>
        <View className="absolute bottom-[30px] right-10">
          <Ionicons name="play-circle" size={30} color={colors.destructive} />
        </View>
      </View>

      <Text className="mb-4 text-center text-[32px] font-bold leading-10 text-foreground">
        {item.title}
      </Text>
      <Text className="text-center text-base leading-6 text-muted-foreground">
        {item.subtitle}
      </Text>
    </View>
  );
}
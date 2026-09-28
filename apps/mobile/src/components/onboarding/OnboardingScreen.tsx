import { useRef, useState } from 'react';
import { FlatList, useWindowDimensions, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/ui/Screen';
import { OnboardingSlide } from './OnboardingSlide';
import { PaginationDots } from './PaginationDots';
import { ONBOARDING_DATA, OnboardingItem } from '@/constants/onBoardingData';

type Props = {
  onFinish: () => void;
};

export function OnboardingScreen({ onFinish }: Props) {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList<OnboardingItem>>(null);

  const isLast = currentIndex === ONBOARDING_DATA.length - 1;

  const handleNext = () => {
    if (isLast) {
      onFinish();
    } else {
      listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  return (
    <Screen>
      <View className="items-end px-6 pb-2 pt-4">
        {/* <Button title="Skip" variant="ghost" onPress={onFinish} /> */}
       <Button variant="ghost" onPress={onFinish}>
         <Text className="text-base font-semibold text-muted-foreground">Skip</Text>
       </Button>

      </View>

      <FlatList
        ref={listRef}
        data={ONBOARDING_DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OnboardingSlide item={item} />}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={(e) =>
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
      />

      <View className="items-center p-8">
        <PaginationDots total={ONBOARDING_DATA.length} activeIndex={currentIndex} />
         <Button onPress={handleNext} className="h-14 w-full rounded-2xl">
         <Text className="text-base font-bold">{isLast ? 'Get Started' : 'Next'}</Text>
       </Button>
      </View>
    </Screen>
  );
}
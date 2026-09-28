import { View } from 'react-native';

type Props = {
  total: number;
  activeIndex: number;
};

export function PaginationDots({ total, activeIndex }: Props) {
  return (
    <View className="mb-8 flex-row items-center justify-center">
      {Array.from({ length: total }).map((_, idx) => (
        <View
          key={idx}
          className={`mx-1.5 h-2 rounded-full ${
            idx === activeIndex ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
          }`}
        />
      ))}
    </View>
  );
}
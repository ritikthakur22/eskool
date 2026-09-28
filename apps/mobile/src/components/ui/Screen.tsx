import { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  className?: string;
};

export function Screen({ children, className = '' }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`flex-1 bg-background ${className}`}
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {children}
    </View>
  );
}
import { Pressable, PressableProps, Text } from 'react-native';

type Props = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: 'primary' | 'ghost';
  className?: string;
};

const containers = {
  primary: 'w-full items-center rounded-2xl bg-primary py-[18px] shadow-lg shadow-primary/20',
  ghost: 'items-center',
};

const labels = {
  primary: 'text-base font-bold text-white',
  ghost: 'text-base font-semibold text-subText',
};

export function Button({ title, variant = 'primary', className = '', ...rest }: Props) {
  return (
    <Pressable className={`active:opacity-80 ${containers[variant]} ${className}`} {...rest}>
      <Text className={labels[variant]}>{title}</Text>
    </Pressable>
  );
}
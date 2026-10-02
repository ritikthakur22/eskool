import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../../core/theme/ThemeContext';

const { width } = Dimensions.get('window');

const ONBOARDING_DATA = [
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
  {
    id: '4',
    title: 'Live Online\nClasses',
    subtitle: 'Join live interactive classes from\nanywhere in the world.',
    icon: 'laptop',
  },
];

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function OnboardingScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    await SecureStore.setItemAsync('onboarding_complete', 'true');
    navigation.replace('Login');
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.slide}>
        <View style={[styles.imagePlaceholder, { backgroundColor: colors.mutedSurface }]}>
          <Ionicons name={item.icon} size={120} color={colors.primary} />
          <View style={styles.floatingIcons}>
            <Ionicons name="documents" size={30} color="#F59E0B" style={styles.icon1} />
            <Ionicons name="chatbubbles" size={30} color="#10B981" style={styles.icon2} />
            <Ionicons name="play-circle" size={30} color="#EF4444" style={styles.icon3} />
          </View>
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.subtitle, { color: colors.subText }]}>{item.subtitle}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={completeOnboarding}>
          <Text style={[styles.skipText, { color: colors.subText }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      <View style={styles.bottomSection}>
        <View style={styles.pagination}>
          {ONBOARDING_DATA.map((_, idx) => (
            <View 
              key={idx} 
              style={[
                styles.dot, 
                currentIndex === idx && [styles.activeDot, { backgroundColor: colors.primary }]
              ]} 
            />
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {currentIndex === ONBOARDING_DATA.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { alignItems: 'flex-end', padding: 24, paddingTop: 40 },
  skipText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  
  slide: { width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  
  imagePlaceholder: { width: 260, height: 260, backgroundColor: '#EBF3FE', borderRadius: 130, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  floatingIcons: { position: 'absolute', width: '100%', height: '100%' },
  icon1: { position: 'absolute', top: 30, left: 20 },
  icon2: { position: 'absolute', top: 50, right: 20 },
  icon3: { position: 'absolute', bottom: 30, right: 40 },
  
  title: { fontSize: 32, fontWeight: '700', color: '#1F2937', textAlign: 'center', marginBottom: 16, lineHeight: 40 },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24 },
  
  bottomSection: { padding: 32, alignItems: 'center' },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB', marginHorizontal: 6 },
  activeDot: { width: 24, backgroundColor: '#2F80ED' },
  
  button: { backgroundColor: '#2F80ED', width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#2F80ED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});

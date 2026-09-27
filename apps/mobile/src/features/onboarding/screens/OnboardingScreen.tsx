import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.imagePlaceholder}>
          <Ionicons name="school" size={100} color="#3182CE" />
          <View style={styles.floatingIcons}>
            <Ionicons name="book" size={30} color="#DD6B20" style={styles.icon1} />
            <Ionicons name="chatbubbles" size={30} color="#38A169" style={styles.icon2} />
            <Ionicons name="desktop" size={30} color="#E53E3E" style={styles.icon3} />
          </View>
        </View>
        
        <Text style={styles.title}>Your School{'\n'}In Your Pocket</Text>
        <Text style={styles.subtitle}>
          Attend classes, check notices,{'\n'}submit homework and much more.
        </Text>

        <View style={styles.pagination}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { alignItems: 'flex-end', padding: 20, paddingTop: 40 },
  skipText: { fontSize: 16, color: '#4A5568', fontWeight: 'bold' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  imagePlaceholder: { width: 250, height: 250, backgroundColor: '#EBF8FF', borderRadius: 125, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  floatingIcons: { position: 'absolute', width: '100%', height: '100%' },
  icon1: { position: 'absolute', top: 20, left: 20 },
  icon2: { position: 'absolute', top: 40, right: 20 },
  icon3: { position: 'absolute', bottom: 20, right: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A202C', textAlign: 'center', marginBottom: 15 },
  subtitle: { fontSize: 16, color: '#718096', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0', marginHorizontal: 4 },
  activeDot: { width: 24, backgroundColor: '#3182CE' },
  footer: { padding: 30 },
  button: { backgroundColor: '#3182CE', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});

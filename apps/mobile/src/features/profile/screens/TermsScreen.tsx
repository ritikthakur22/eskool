import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';

export default function TermsScreen({ navigation }: any) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Terms & Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content}>
        <Text style={[styles.paragraph, { color: colors.text }]}>By using eSkool, you agree to these terms. All educational data is strictly confidential and managed according to regional privacy laws.</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>Information collected is only used for academic purposes within the school premises.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  content: { padding: 24 },
  paragraph: { fontSize: 15, color: '#4B5563', lineHeight: 24, marginBottom: 16 },
});

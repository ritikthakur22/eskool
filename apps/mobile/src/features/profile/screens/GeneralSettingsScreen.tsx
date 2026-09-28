import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function GeneralSettingsScreen({ navigation }: any) {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>General Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        
        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance (Dark Mode)</Text>
          <View style={styles.themeSelector}>
            <TouchableOpacity 
              style={[styles.themeBtn, themeMode === 'light' && styles.themeBtnActive]} 
              onPress={() => setThemeMode('light')}
            >
              <Text style={[styles.themeBtnText, themeMode === 'light' && styles.themeBtnTextActive]}>Light</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.themeBtn, themeMode === 'dark' && styles.themeBtnActive]} 
              onPress={() => setThemeMode('dark')}
            >
              <Text style={[styles.themeBtnText, themeMode === 'dark' && styles.themeBtnTextActive]}>Dark</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.themeBtn, themeMode === 'system' && styles.themeBtnActive]} 
              onPress={() => setThemeMode('system')}
            >
              <Text style={[styles.themeBtnText, themeMode === 'system' && styles.themeBtnTextActive]}>System</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingText}>Biometric Login</Text>
            <Switch value={biometricEnabled} onValueChange={setBiometricEnabled} trackColor={{ false: '#D1D5DB', true: '#2F80ED' }} />
          </View>

          <TouchableOpacity style={styles.settingButton} onPress={() => Alert.alert('Change Password', 'Password change flow coming soon.')}>
            <Text style={styles.settingButtonText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Advanced */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>
          <TouchableOpacity style={styles.settingButton} onPress={() => Alert.alert('Device Logs', 'No crash logs found on this device.')}>
            <Text style={styles.settingButtonText}>Device Logs</Text>
            <Ionicons name="document-text-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  content: { flex: 1 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase' },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 8 },
  settingText: { fontSize: 16, color: '#1F2937' },
  settingButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 8 },
  settingButtonText: { fontSize: 16, color: '#1F2937' },
  themeSelector: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4 },
  themeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  themeBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  themeBtnText: { fontSize: 15, fontWeight: '500', color: '#6B7280' },
  themeBtnTextActive: { color: '#1F2937', fontWeight: '600' }
});

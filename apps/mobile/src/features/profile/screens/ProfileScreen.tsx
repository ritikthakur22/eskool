import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }: any) {
  
  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('user_data');
    navigation.replace('Login');
  };

  const settingsItems = [
    { label: 'Profile', subtext: 'View and edit your profile', icon: 'person', color: '#3182CE' },
    { label: 'General Settings', subtext: 'Change password, biometric, dark mode', icon: 'settings', color: '#E53E3E' },
    { label: 'Follow Us', subtext: 'Social media links', icon: 'logo-twitter', color: '#38A169' },
    { label: 'Notifications', subtext: 'Manage notification preferences', icon: 'notifications', color: '#805AD5' },
    { label: 'Terms & Privacy Policy', subtext: 'Read our terms and privacy policy', icon: 'document-text', color: '#3182CE' },
    { label: 'Send Feedback', subtext: 'Let us know your suggestions', icon: 'chatbox-ellipses', color: '#3182CE' },
    { label: 'Rate Our App', subtext: 'If you love our app, rate it.', icon: 'star', color: '#3182CE' },
    { label: 'App Info', subtext: 'Version 1.0.0 • Check for updates', icon: 'information-circle', color: '#38A169' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>More / Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.menuContainer}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem}>
              <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSubtext}>{item.subtext}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40, backgroundColor: '#FFFFFF' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A202C' },
  content: { padding: 20 },
  
  menuContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 25 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuTextContainer: { flex: 1 },
  menuLabel: { fontSize: 16, color: '#1A202C', fontWeight: '600' },
  menuSubtext: { fontSize: 12, color: '#718096', marginTop: 2 },
  
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', paddingVertical: 15, borderRadius: 25, borderWidth: 1, borderColor: '#E53E3E' },
  logoutText: { color: '#E53E3E', fontSize: 16, fontWeight: 'bold' }
});

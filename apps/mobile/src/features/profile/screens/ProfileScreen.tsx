import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function ProfileScreen({ navigation }: any) {
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '228295306473-t6cv4gac9pn81pbcgk6av05roi9j2662.apps.googleusercontent.com',
    });
  }, []);
  
  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('user_data');
    if (auth().currentUser) {
      await auth().signOut();
    }
    navigation.replace('Login');
  };

  const handleLinkGoogle = async () => {
    try {
      setIsLinking(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { idToken } = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Sign in or link using Firebase Auth
      await auth().signInWithCredential(googleCredential);
      
      Alert.alert('Success', 'Google Account successfully linked via Firebase!');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to link Google account.');
    } finally {
      setIsLinking(false);
    }
  };

  const settingsItems = [
    { label: 'Link Google Account', subtext: 'Connect Firebase Google Sign-In', icon: 'logo-google', color: '#2F80ED', onPress: handleLinkGoogle },
    { label: 'Profile', subtext: 'View and edit your profile', icon: 'person', color: '#2F80ED' },
    { label: 'General Settings', subtext: 'Change password, biometric, dark mode', icon: 'settings', color: '#EF4444' },
    { label: 'Notifications', subtext: 'Manage notification preferences', icon: 'notifications', color: '#8B5CF6' },
    { label: 'App Info', subtext: 'Version 1.0.0 • Check for updates', icon: 'information-circle', color: '#10B981' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.menuContainer}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
              <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSubtext}>{isLinking && item.icon === 'logo-google' ? 'Linking...' : item.subtext}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40, backgroundColor: '#FFFFFF' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  content: { padding: 20 },
  
  menuContainer: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, marginBottom: 25, borderWidth: 1, borderColor: '#F3F4F6' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuTextContainer: { flex: 1 },
  menuLabel: { fontSize: 16, color: '#1F2937', fontWeight: '600' },
  menuSubtext: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5' },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '600' }
});

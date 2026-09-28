import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import auth, { GoogleAuthProvider, signInWithCredential, signOut } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function ProfileScreen({ navigation }: any) {
  const [isLinking, setIsLinking] = useState(false);


  
  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('user_data');
      if (auth().currentUser) {
        await signOut(auth());
      }
    } catch (e) {
      console.log('Firebase signout error, but clearing local session anyway.', e);
    } finally {
      navigation.replace('Login');
    }
  };

  const handleLinkGoogle = async () => {
    try {
      setIsLinking(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response: any = await GoogleSignin.signIn();
      
      const idToken = response?.data?.idToken || response?.idToken;
      if (!idToken) {
        throw new Error('Google Sign-In failed to return an ID token.');
      }

      const googleCredential = GoogleAuthProvider.credential(idToken);
      
      // Sign in or link using Firebase Auth
      await signInWithCredential(auth(), googleCredential);
      
      Alert.alert('Success', 'Google Account successfully linked via Firebase!');
    } catch (error: any) {
      console.error(error);
      const errorMsg = error instanceof Error ? `${error.name}: ${error.message}` : JSON.stringify(error);
      Alert.alert('Developer Error Details', errorMsg);
    } finally {
      setIsLinking(false);
    }
  };

  const showComingSoon = (title: string) => {
    Alert.alert(title, 'This page is coming soon!');
  };

  const settingsItems = [
    { label: 'Link Google Account', subtext: 'Connect Firebase Google Sign-In', icon: 'logo-google', color: '#2F80ED', onPress: handleLinkGoogle },
    { label: 'General Settings', subtext: 'Password, biometric, theme', icon: 'settings', color: '#2F80ED', onPress: () => showComingSoon('General Settings') },
    { label: 'Terms & Privacy Policy', subtext: 'Read our terms', icon: 'document-text', color: '#8B5CF6', onPress: () => showComingSoon('Terms & Privacy Policy') },
    { label: 'Send Feedback', subtext: 'Let us know your suggestions', icon: 'paper-plane', color: '#2F80ED', onPress: () => showComingSoon('Send Feedback') },
    { label: 'Rate Our App', subtext: 'If you love our app, rate it.', icon: 'star', color: '#2F80ED', onPress: () => showComingSoon('Rate Our App') },
    { label: 'App Info', subtext: 'Version 1.2.1 • Check for updates', icon: 'information-circle', color: '#10B981', onPress: () => showComingSoon('App Info') },
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

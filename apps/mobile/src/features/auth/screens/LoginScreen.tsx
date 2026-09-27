import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../../../core/networking/api';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  const roles = ['Student', 'Parent', 'Teacher', 'Admin'];

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
    })();
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/auth/login', { email, password });

      if (response.data?.access_token) {
        await SecureStore.setItemAsync('access_token', response.data.access_token);
        await SecureStore.setItemAsync('user_data', JSON.stringify(response.data.user));
        navigation.replace('Dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    const savedToken = await SecureStore.getItemAsync('access_token');
    if (!savedToken) {
      return Alert.alert('Not Linked', 'Please login with email and password first to enable biometric login.');
    }

    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate with Biometrics',
      fallbackLabel: 'Use Passcode',
    });

    if (auth.success) {
      navigation.replace('Dashboard');
    } else {
      Alert.alert('Authentication Failed', 'Biometric authentication was not successful.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.header}>
          <Text style={styles.logoText}>eSkool</Text>
          <Text style={styles.welcomeText}>Login to your account 👋</Text>
          <Text style={styles.subText}>Welcome back! Please enter your details.</Text>
        </View>

        <View style={styles.roleContainer}>
          {roles.map((r) => (
            <TouchableOpacity key={r} style={[styles.roleButton, role === r && styles.roleButtonActive]} onPress={() => setRole(r)}>
              <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Student ID / Email"
            placeholderTextColor="#6B7280"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#6B7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            <Text style={styles.loginButtonText}>{loading ? 'Logging in...' : 'Login'}</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialButtonsRow}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            
            {isBiometricSupported && (
              <TouchableOpacity style={styles.socialButton} onPress={handleBiometricAuth}>
                <Ionicons name="finger-print" size={20} color="#2F80ED" />
                <Text style={styles.socialButtonText}>Biometric</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account? <Text style={styles.footerLink}>Contact school</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
  header: { alignItems: 'flex-start', marginBottom: 30 },
  logoText: { fontSize: 32, fontWeight: 'bold', color: '#2F80ED', marginBottom: 8 },
  welcomeText: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  subText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  roleButton: { paddingVertical: 12, paddingHorizontal: 4 },
  roleButtonActive: { borderBottomWidth: 2, borderBottomColor: '#2F80ED' },
  roleText: { color: '#6B7280', fontSize: 14, fontWeight: '500' },
  roleTextActive: { color: '#2F80ED', fontWeight: '700' },
  formContainer: { width: '100%' },
  input: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937', fontSize: 16 },
  forgotPassword: { color: '#2F80ED', textAlign: 'right', marginBottom: 24, fontWeight: '600', fontSize: 14 },
  loginButton: { backgroundColor: '#2F80ED', borderRadius: 12, padding: 16, alignItems: 'center' },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  errorText: { color: '#EF4444', marginBottom: 16, textAlign: 'center', fontWeight: '500' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  divider: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 12, color: '#6B7280', fontSize: 12, fontWeight: '500' },
  socialButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  socialButton: { flex: 1, flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  socialButtonText: { color: '#1F2937', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { color: '#6B7280', fontSize: 14 },
  footerLink: { color: '#2F80ED', fontWeight: '600' },
});

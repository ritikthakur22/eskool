import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, Alert, Image } from 'react-native';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response: any = await GoogleSignin.signIn();
      
      const idToken = response?.data?.idToken || response?.idToken;
      if (!idToken) throw new Error('No ID token from Google');

      const apiResponse = await api.post('/auth/google', { idToken });

      if (apiResponse.data?.access_token) {
        await SecureStore.setItemAsync('access_token', apiResponse.data.access_token);
        await SecureStore.setItemAsync('user_data', JSON.stringify(apiResponse.data.user));
        navigation.replace('Dashboard');
      }
    } catch (err: any) {
      console.log('Google login error:', err);
      setError(err.response?.data?.message || err.message || 'Google Login failed.');
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
          <View style={styles.logoIcon}>
            <Ionicons name="school" size={40} color="#2F80ED" />
          </View>
          <Text style={styles.logoText}>eSchooling</Text>
          <Text style={styles.subText}>Login to continue</Text>
        </View>

        <View style={styles.formContainer}>
          
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIconLeft} />
            <TextInput
              style={styles.input}
              placeholder="Student ID / Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIconLeft} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.inputIconRight}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            <Text style={styles.loginButtonText}>{loading ? 'Logging in...' : 'Login'}</Text>
          </TouchableOpacity>

          <Text style={styles.orText}>or</Text>

          <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin} disabled={loading}>
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>
          
          {isBiometricSupported && (
            <TouchableOpacity style={styles.socialButton} onPress={handleBiometricAuth}>
              <Ionicons name="finger-print" size={20} color="#2F80ED" />
              <Text style={styles.socialButtonText}>Use Biometric</Text>
            </TouchableOpacity>
          )}
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
  keyboardView: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  
  header: { alignItems: 'center', marginBottom: 40 },
  logoIcon: { marginBottom: 12 },
  logoText: { fontSize: 28, fontWeight: '700', color: '#2F80ED', marginBottom: 8 },
  subText: { fontSize: 16, color: '#4B5563', fontWeight: '500' },
  
  formContainer: { width: '100%' },
  
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIconLeft: { marginRight: 12 },
  inputIconRight: { marginLeft: 12 },
  input: { flex: 1, fontSize: 16, color: '#1F2937' },
  
  forgotPassword: { color: '#2F80ED', textAlign: 'left', marginBottom: 32, fontWeight: '600', fontSize: 14 },
  
  loginButton: { backgroundColor: '#2F80ED', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#2F80ED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  
  errorText: { color: '#EF4444', marginBottom: 16, textAlign: 'center', fontWeight: '500' },
  
  orText: { textAlign: 'center', color: '#6B7280', fontSize: 14, fontWeight: '500', marginBottom: 24 },
  
  socialButton: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  socialButtonText: { color: '#1F2937', fontSize: 15, fontWeight: '600', marginLeft: 12 },
  
  footer: { marginTop: 32, alignItems: 'center' },
  footerText: { color: '#6B7280', fontSize: 14 },
  footerLink: { color: '#2F80ED', fontWeight: '600' },
});

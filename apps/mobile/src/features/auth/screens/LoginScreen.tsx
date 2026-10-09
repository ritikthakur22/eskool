import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL, api } from '../../../core/networking/api';
import { getGoogleSignInError } from '../../../core/auth/google';
import { setInMemoryAccessToken, setInMemoryRefreshToken } from '../../../core/networking/session';
import { useTheme } from '../../../core/theme/ThemeContext';

type Props = { navigation: NativeStackNavigationProp<any> };

const getLoginErrorMessage = (err: any, fallback: string) => {
  const serverMessage = err.response?.data?.message;
  if (serverMessage) return Array.isArray(serverMessage) ? serverMessage.join('\n') : serverMessage;
  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
    return 'Could not reach the server. Please check your internet connection or try again later.';
  }
  if (err.request) {
    return 'Network error. Please check your connection and try again.';
  }
  return fallback;
};

export default function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const [hardware, enrolled, enabled, keep] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        SecureStore.getItemAsync('biometric_enabled'),
        SecureStore.getItemAsync('keep_signed_in'),
      ]);
      setBiometricAvailable(hardware && enrolled);
      setBiometricEnabled(enabled === 'true');
      setKeepSignedIn(keep === 'true');
    })();
  }, []);

  const saveSession = async (data: any) => {
    setInMemoryAccessToken(data.access_token);
    const persistSession = keepSignedIn || biometricEnabled;
    const persistenceTasks = [
      SecureStore.setItemAsync('keep_signed_in', keepSignedIn ? 'true' : 'false'),
      SecureStore.setItemAsync('user_data', JSON.stringify(data.user)),
      persistSession && data.refresh_token
        ? SecureStore.setItemAsync('refresh_token', data.refresh_token)
        : SecureStore.deleteItemAsync('refresh_token'),
      persistSession && data.access_token
        ? SecureStore.setItemAsync('access_token', data.access_token)
        : SecureStore.deleteItemAsync('access_token'),
    ];
    await Promise.all(persistenceTasks);
    setInMemoryRefreshToken(data.refresh_token || null);
    
    navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    });
  };

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Enter your credentials to continue.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { identifier: normalizedEmail, password });
      await saveSession(response.data);
    } catch (err: any) {
      setError(getLoginErrorMessage(err, 'Login failed. Check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response: any = await GoogleSignin.signIn();
      const idToken = response?.data?.idToken || response?.idToken;
      if (!idToken) throw new Error('Google did not return a valid ID token.');
      const apiResponse = await api.post('/auth/google', { idToken });
      await saveSession(apiResponse.data);
    } catch (err: any) {
      if (err.code || (err.message && err.message !== 'Google did not return a valid ID token.' && err.message !== 'Network Error')) {
        setError(getGoogleSignInError(err));
      } else {
        setError(getLoginErrorMessage(err, 'An error occurred during Google sign-in. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricAvailable) {
      Alert.alert('Biometrics unavailable', 'This device has no enrolled fingerprint or face unlock. Sign in with your password.');
      return;
    }
    if (!biometricEnabled) {
      Alert.alert('Biometric login is off', 'Sign in with your password, then enable biometric login in Settings.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock eSkool', fallbackLabel: 'Use device passcode' });
      if (!result.success) return;
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) {
        setError('Biometric session is unavailable. Sign in with your password.');
        return;
      }
      const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
      await saveSession(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        await Promise.all([
          SecureStore.deleteItemAsync('access_token'),
          SecureStore.deleteItemAsync('refresh_token'),
          SecureStore.deleteItemAsync('user_data'),
        ]);
        setInMemoryAccessToken(null);
        setInMemoryRefreshToken(null);
        setError('Your secure sign-in expired. Please log in with your password.');
      } else {
        setError(getLoginErrorMessage(err, 'Biometric sign-in failed. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboard}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.brandBlock}>
            <View style={styles.logo}><Ionicons name="school" size={34} color={colors.primary} /></View>
            <Text style={styles.brand}>eSkool</Text>
            <Text style={styles.subtitle}>Your school, all in one place</Text>
          </View>
          <View style={styles.form}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.helper}>Sign in with your school ID, email, a linked Google account, or biometrics.</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={20} color={colors.subText} />
              <TextInput style={styles.input} placeholder="School ID or Email" placeholderTextColor={colors.subText} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" editable={!loading} returnKeyType="next" />
            </View>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.subText} />
              <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.subText} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} editable={!loading} returnKeyType="done" onSubmitEditing={handleLogin} />
              <TouchableOpacity accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword(value => !value)}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.subText} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.biometricOption} onPress={() => setKeepSignedIn(value => !value)} disabled={loading} accessibilityRole="checkbox" accessibilityState={{ checked: keepSignedIn }}>
              <View style={[styles.checkbox, keepSignedIn && styles.checkboxActive]}>{keepSignedIn && <Ionicons name="checkmark" size={14} color="#fff" />}</View>
              <Text style={styles.optionText}>Keep me signed in on this device</Text>
            </TouchableOpacity>
            {!!error && <Text style={styles.error}>{error}</Text>}
            <TouchableOpacity style={[styles.primaryButton, loading && styles.disabled]} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Log in</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.forgot} onPress={() => Alert.alert('Reset password', 'Please contact your school administrator to reset your password.')}>
              <Text style={styles.link}>Forgot password?</Text>
            </TouchableOpacity>
            <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>or</Text><View style={styles.line} /></View>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleGoogleLogin} disabled={loading}>
              <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png' }} style={{ width: 20, height: 20 }} />
              <Text style={styles.secondaryText}>Continue with Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleBiometricLogin} disabled={loading}>
              <Ionicons name="finger-print-outline" size={22} color={colors.primary} /><Text style={styles.secondaryText}>Use biometric login</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footer}>Need an account? Contact your school administrator.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, 
  keyboard: { flex: 1 }, 
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  brandBlock: { alignItems: 'center', marginBottom: 30 }, 
  logo: { width: 66, height: 66, borderRadius: 22, backgroundColor: colors.mutedSurface, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }, 
  brand: { fontSize: 28, fontWeight: '800', color: colors.primary }, 
  subtitle: { fontSize: 14, color: colors.subText, marginTop: 5 },
  form: { backgroundColor: colors.card, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: colors.border }, 
  title: { fontSize: 24, fontWeight: '800', color: colors.text }, 
  helper: { color: colors.subText, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 20 },
  inputBox: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, marginBottom: 12 }, 
  input: { flex: 1, color: colors.text, fontSize: 15 },
  biometricOption: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 }, 
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, marginRight: 9, alignItems: 'center', justifyContent: 'center' }, 
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary }, 
  optionText: { color: colors.subText, fontSize: 13, flex: 1 }, 
  error: { color: colors.danger, fontSize: 13, marginTop: 10, lineHeight: 19 },
  primaryButton: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginTop: 16 }, 
  disabled: { opacity: 0.65 }, 
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' }, 
  forgot: { alignSelf: 'flex-end', marginTop: 14 }, 
  link: { color: colors.primary, fontWeight: '700', fontSize: 13 }, 
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 }, 
  line: { flex: 1, height: 1, backgroundColor: colors.border }, 
  or: { color: colors.subText, fontSize: 12 },
  secondaryButton: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginBottom: 10 }, 
  secondaryText: { color: colors.text, fontSize: 14, fontWeight: '700' }, 
  footer: { textAlign: 'center', color: colors.subText, fontSize: 12, marginTop: 20 },
});

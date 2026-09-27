import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../../core/networking/api';
import * as SecureStore from 'expo-secure-store';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = ['Student', 'Parent', 'Teacher', 'Admin'];

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      if (response.data?.access_token) {
        await SecureStore.setItemAsync('access_token', response.data.access_token);
        // Also save user info if needed
        await SecureStore.setItemAsync('user_data', JSON.stringify(response.data.user));
        
        navigation.replace('Dashboard');
      }
    } catch (err: any) {
      console.log('Login error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to login. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Text style={styles.logoText}>eSchooling</Text>
          <Text style={styles.welcomeText}>Welcome Back 👋</Text>
          <Text style={styles.subText}>Login to continue</Text>
        </View>

        <View style={styles.roleContainer}>
          {roles.map((r) => (
            <TouchableOpacity 
              key={r} 
              style={[styles.roleButton, role === r && styles.roleButtonActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Student ID / Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
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

          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialButtonText}>Use Biometric</Text>
          </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0056D2',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  subText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 5,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  roleButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#0056D2',
  },
  roleText: {
    color: '#666666',
    fontSize: 14,
  },
  roleTextActive: {
    color: '#0056D2',
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  forgotPassword: {
    color: '#0056D2',
    textAlign: 'left',
    marginBottom: 20,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#0056D2',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#E53E3E',
    marginBottom: 10,
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666666',
    fontSize: 12,
  },
  socialButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  socialButtonText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  footerText: {
    color: '#666666',
  },
  footerLink: {
    color: '#0056D2',
    fontWeight: 'bold',
  },
});

import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, Image, Linking, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getCachedUserData } from '../../../core/networking/session';

import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { API_BASE_URL, api } from '../../../core/networking/api';
import { getInMemoryAccessToken, getInMemoryRefreshToken, setInMemoryAccessToken, setInMemoryRefreshToken, setCachedUserData } from '../../../core/networking/session';
import { useTheme } from '../../../core/theme/ThemeContext';

const privacyUrl = 'https://docs.google.com/document/d/1iqrr4JFwtllNiR9k_MGEGN8LICOE_i6nnhTFRSw4_vc/edit?usp=sharing';
const termsUrl = 'https://docs.google.com/document/d/1NiUBosO1J9QRiS7d1KpwD-U4Jn9SzRWTOk6-VuiOnxo/edit?usp=sharing';
type Summary = { firstName?: string; lastName?: string; email?: string; role?: string; schoolName?: string; studentId?: string; rollNo?: string; profilePictureUrl?: string };

export default function ProfileScreen({ navigation }: any) {
  const { colors, themeMode, setThemeMode } = useTheme();
  const s = makeStyles(colors);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleDialog, setGoogleDialog] = useState<{ title: string; message: string; confirm?: () => Promise<void>; destructive?: boolean } | null>(null);
  const [passwordModal, setPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [photoVersion, setPhotoVersion] = useState(0);

  const loadSummary = useCallback(async () => {
    try { const { data } = await api.get('/users/me'); setSummary(data); setPhotoVersion(Date.now()); }
    catch { setSummary(null); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { loadSummary(); }, [loadSummary]));
  useEffect(() => {
    api.get('/auth/google/status').then(({ data }) => { setGoogleLinked(Boolean(data.linked)); setGoogleEmail(data.email || ''); }).catch(() => undefined);
    Promise.all([SecureStore.getItemAsync('biometric_enabled'), LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()]).then(([enabled, hardware, enrolled]) => {
      setBiometricEnabled(enabled === 'true'); setBiometricReady(hardware && enrolled);
    }).catch(() => undefined);
  }, [loadSummary]);

  const linkGoogle = async () => {
    setGoogleBusy(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response: any = await GoogleSignin.signIn();
      const idToken = response?.data?.idToken || response?.idToken;
      if (!idToken) throw new Error('Google did not return a valid ID token.');
      const { data } = await api.post('/auth/google/link', { idToken });
      setGoogleLinked(Boolean(data.linked)); setGoogleEmail(data.email || '');
      setGoogleDialog({ title: 'Google account linked', message: `${data.email || 'This Google account'} can now sign in to this school account.` });
    } catch (e: any) {
      setGoogleDialog({ title: 'Could not link Google', message: e.response?.data?.message || e.message || 'Please try again.' });
    } finally { setGoogleBusy(false); }
  };
  const unlinkGoogle = () => setGoogleDialog({
    title: 'Unlink Google account?',
    message: 'Google sign-in will stop working for this account. Your school email and password will still work.',
    destructive: true,
    confirm: async () => {
      setGoogleBusy(true);
      try { await api.delete('/auth/google/link'); setGoogleLinked(false); setGoogleEmail(''); setGoogleDialog({ title: 'Google account unlinked', message: 'You can still sign in with your school email and password.' }); }
      catch (e: any) { setGoogleDialog({ title: 'Could not unlink Google', message: e.response?.data?.message || 'Please try again.' }); }
      finally { setGoogleBusy(false); }
    },
  });

  const handleLogout = async () => {
    setInMemoryAccessToken(null);
    setInMemoryRefreshToken(null);
    const biometricIsEnabled = (await SecureStore.getItemAsync('biometric_enabled')) === 'true';
    try {
      await SecureStore.deleteItemAsync('access_token');
      // Keep the refresh token so the user can authenticate with biometrics
      // after signing out. Disable biometric login first for a full sign-out.
      if (!biometricIsEnabled) await SecureStore.deleteItemAsync('refresh_token');
      await setCachedUserData(null);
      await GoogleSignin.signOut();
    }
    catch (e) { console.log('Google signout error; clearing local session anyway.', e); }
    finally { navigation.replace('Login'); }
  };
  const toggleBiometric = async (enabled: boolean) => {
    if (enabled) {
      if (!biometricReady) { Alert.alert('Biometrics unavailable', 'Set up fingerprint or face unlock in your device settings first.'); return; }
      const [savedToken, savedRefreshToken, keepSignedIn] = await Promise.all([SecureStore.getItemAsync('access_token'), SecureStore.getItemAsync('refresh_token'), SecureStore.getItemAsync('keep_signed_in')]);
      const accessToken = getInMemoryAccessToken() || savedToken;
      const refreshToken = getInMemoryRefreshToken() || savedRefreshToken;
      if (!accessToken || !refreshToken) { Alert.alert('Sign in required', 'Please sign in again before setting up biometric login.'); return; }
      let result: LocalAuthentication.LocalAuthenticationResult;
      try { result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirm biometric login setup', cancelLabel: 'Cancel', disableDeviceFallback: true }); }
      catch { Alert.alert('Biometric setup failed', 'Try again after checking biometric access in your device settings.'); return; }
      if (!result.success) return;
      await SecureStore.setItemAsync('access_token', accessToken);
      await SecureStore.setItemAsync('refresh_token', refreshToken);
      if (keepSignedIn !== 'true') await SecureStore.setItemAsync('keep_signed_in', 'false');
    } else {
      const keepSignedIn = await SecureStore.getItemAsync('keep_signed_in');
      if (keepSignedIn !== 'true') {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
      }
    }
    setBiometricEnabled(enabled);
    await SecureStore.setItemAsync('biometric_enabled', enabled ? 'true' : 'false');
  };
  const changePassword = async () => {
    if (!currentPassword || newPassword.length < 8) { Alert.alert('Check your password', 'Enter your current password and a new password with at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Passwords don’t match', 'Re-enter the same new password in both fields.'); return; }
    setSavingPassword(true);
    try {
      await api.patch('/users/me/password', { currentPassword, newPassword });
      setPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      Alert.alert('Password updated', 'Your account password has been changed.');
    } catch (e: any) { Alert.alert('Could not change password', e.response?.data?.message || 'Please check your current password and try again.'); }
    finally { setSavingPassword(false); }
  };
  const openExternal = async (url: string) => {
    try { await Linking.openURL(url); } catch { Alert.alert('Could not open link', 'Please check that your device has a browser installed.'); }
  };
  const displayName = [summary?.firstName, summary?.lastName].filter(Boolean).join(' ') || summary?.email?.split('@')[0] || 'Your profile';
  const rows = [
    { label: 'Send feedback', note: 'Email the eSkool team', icon: 'chatbubble-ellipses-outline', action: () => navigation.navigate('Feedback') },
    { label: 'Privacy policy', note: 'How account information is used', icon: 'shield-checkmark-outline', action: () => openExternal(privacyUrl) },
    { label: 'Terms & conditions', note: 'Read the app terms', icon: 'document-text-outline', action: () => openExternal(termsUrl) },
    { label: 'App info & FAQ', note: 'Version, package and help', icon: 'information-circle-outline', action: () => navigation.navigate('App Info') },
  ];

  return <SafeAreaView style={s.screen}>
    <View style={s.header}><TouchableOpacity style={s.back} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24} color={colors.text} /></TouchableOpacity><View style={{ flex: 1 }}><Text style={s.eyebrow}>PERSONALIZE YOUR ACCOUNT</Text><Text style={s.headerTitle}>Settings</Text></View><View style={{ width: 37 }} /></View>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.sectionEyebrow}>PROFILE</Text>
      <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('ProfileDetails')} style={s.profileCard}>
        {summary?.profilePictureUrl ? <Image source={{ uri: `${API_BASE_URL}${summary.profilePictureUrl}?v=${photoVersion}`, headers: { Authorization: `Bearer ${getInMemoryAccessToken() || ''}` } }} style={s.avatar} /> : <View style={s.avatar}><Ionicons name="person" size={25} color={colors.primary} /></View>}
        <View style={{ flex: 1 }}><Text style={s.name} numberOfLines={1}>{loading ? 'Loading profile…' : displayName}</Text><Text style={s.meta} numberOfLines={1}>{summary?.studentId || summary?.rollNo ? `Student ID · ${summary.studentId || summary.rollNo}` : (summary?.role || 'View account details').replace('_', ' ')}</Text><View style={s.viewMore}><Text style={s.viewMoreText}>View more</Text><Ionicons name="arrow-forward" size={13} color={colors.primary} /></View></View>
        <Ionicons name="chevron-forward" size={19} color={colors.subText} />
      </TouchableOpacity>

      <Text style={s.sectionEyebrow}>SECURITY</Text>
      <View style={s.group}>
        <TouchableOpacity style={s.row} onPress={() => setPasswordModal(true)}><View style={[s.rowIcon, { backgroundColor: colors.primary + '15' }]}><Ionicons name="key-outline" size={18} color={colors.primary} /></View><View style={s.rowCopy}><Text style={s.rowTitle}>Change app password</Text><Text style={s.rowNote}>Update your sign-in password</Text></View><Ionicons name="chevron-forward" size={18} color={colors.subText} /></TouchableOpacity>
        <View style={[s.row, s.lastRow]}><View style={[s.rowIcon, { backgroundColor: '#8B5CF618' }]}><Ionicons name="finger-print-outline" size={19} color="#8B5CF6" /></View><View style={s.rowCopy}><Text style={s.rowTitle}>Biometric login</Text><Text style={s.rowNote}>{biometricReady ? 'Use face or fingerprint next time' : 'Set up biometrics on this device first'}</Text></View><Switch value={biometricEnabled} onValueChange={toggleBiometric} disabled={!biometricReady} trackColor={{ false: colors.border, true: colors.primary }} />
        </View>
        <View style={[s.row, s.lastRow]}><View style={[s.rowIcon, { backgroundColor: '#EA433515' }]}><Ionicons name="logo-google" size={17} color="#EA4335" /></View><View style={s.rowCopy}><Text style={s.rowTitle}>Google account</Text><Text style={s.rowNote}>{googleLinked ? `Linked · ${googleEmail}` : 'Link Google to enable Google sign-in'}</Text></View><TouchableOpacity disabled={googleBusy} onPress={googleLinked ? unlinkGoogle : linkGoogle} style={[s.googleAction, googleLinked && s.googleActionLinked]}>{googleBusy ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[s.googleActionText, googleLinked && { color: colors.danger }]}>{googleLinked ? 'Unlink' : 'Link'}</Text>}</TouchableOpacity></View>
      </View>

      <Text style={s.sectionEyebrow}>APPEARANCE</Text>
      <View style={s.group}>
        <View style={s.appearanceTitle}><View style={[s.rowIcon, { backgroundColor: colors.warning + '20' }]}><Ionicons name="color-palette-outline" size={18} color={colors.warning} /></View><View><Text style={s.rowTitle}>App theme</Text><Text style={s.rowNote}>Choose how eSkool looks</Text></View></View>
        <View style={s.themeOptions}>{(['light', 'dark', 'system'] as const).map((mode, index) => <TouchableOpacity key={mode} onPress={() => setThemeMode(mode)} style={[s.themeOption, themeMode === mode && s.themeSelected]}><Ionicons name={index === 0 ? 'sunny-outline' : index === 1 ? 'moon-outline' : 'phone-portrait-outline'} size={16} color={themeMode === mode ? colors.primary : colors.subText} /><Text style={[s.themeText, themeMode === mode && { color: colors.primary }]}>{index === 2 ? 'System default' : mode[0].toUpperCase() + mode.slice(1)}</Text></TouchableOpacity>)}</View>
      </View>

      <Text style={s.sectionEyebrow}>SUPPORT & INFORMATION</Text>
      <View style={s.group}>{rows.map((row, index) => <TouchableOpacity key={row.label} onPress={row.action} style={[s.row, index === rows.length - 1 && s.lastRow]}><View style={[s.rowIcon, { backgroundColor: colors.primary + '12' }]}><Ionicons name={row.icon as any} size={18} color={colors.primary} /></View><View style={s.rowCopy}><Text style={s.rowTitle}>{row.label}</Text><Text style={s.rowNote}>{row.note}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.subText} /></TouchableOpacity>)}</View>
      <TouchableOpacity style={s.logoutButton} onPress={handleLogout}><Ionicons name="log-out-outline" size={18} color={colors.danger} /><Text style={s.logoutText}>Log out</Text></TouchableOpacity>
      <Text style={s.footer}>eSkool · School learning, connected</Text>
    </ScrollView>

    <Modal visible={passwordModal} transparent animationType="slide" onRequestClose={() => setPasswordModal(false)}><View style={s.modalOverlay}><View style={s.modalCard}><View style={s.modalTop}><Text style={s.modalTitle}>Change password</Text><TouchableOpacity onPress={() => setPasswordModal(false)}><Ionicons name="close-circle" size={25} color={colors.subText} /></TouchableOpacity></View><Text style={s.modalHint}>Choose a password with at least 8 characters.</Text><TextInput style={s.modalInput} placeholder="Current password" placeholderTextColor={colors.subText} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} autoCapitalize="none" /><TextInput style={s.modalInput} placeholder="New password" placeholderTextColor={colors.subText} secureTextEntry value={newPassword} onChangeText={setNewPassword} autoCapitalize="none" /><TextInput style={s.modalInput} placeholder="Confirm new password" placeholderTextColor={colors.subText} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} autoCapitalize="none" /><TouchableOpacity disabled={savingPassword} onPress={changePassword} style={s.saveButton}>{savingPassword ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>Update password</Text>}</TouchableOpacity></View></View></Modal>
    <Modal visible={!!googleDialog} transparent animationType="fade" onRequestClose={() => setGoogleDialog(null)}><View style={s.dialogOverlay}><View style={s.dialogCard}><View style={[s.dialogIcon, { backgroundColor: googleDialog?.destructive ? colors.danger + '15' : colors.primary + '15' }]}><Ionicons name={googleDialog?.destructive ? 'unlink-outline' : 'logo-google'} size={23} color={googleDialog?.destructive ? colors.danger : colors.primary} /></View><Text style={s.dialogTitle}>{googleDialog?.title}</Text><Text style={s.dialogMessage}>{googleDialog?.message}</Text><View style={s.dialogActions}><TouchableOpacity style={s.dialogCancel} onPress={() => setGoogleDialog(null)}><Text style={s.dialogCancelText}>{googleDialog?.confirm ? 'Cancel' : 'Close'}</Text></TouchableOpacity>{googleDialog?.confirm && <TouchableOpacity style={[s.dialogConfirm, { backgroundColor: colors.danger }]} onPress={async () => { const action = googleDialog.confirm; setGoogleDialog(null); if (action) await action(); }}><Text style={s.dialogConfirmText}>Unlink</Text></TouchableOpacity>}</View></View></View></Modal>
  </SafeAreaView>;
}

const makeStyles = (c: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border }, back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginRight: 8 }, eyebrow: { fontSize: 9, color: c.primary, letterSpacing: 1.25, fontWeight: '900' }, headerTitle: { fontSize: 21, fontWeight: '900', color: c.text, marginTop: 2 }, content: { padding: 17, paddingBottom: 35 }, sectionEyebrow: { fontSize: 10, color: c.subText, fontWeight: '900', letterSpacing: 1.2, marginTop: 21, marginBottom: 9, marginLeft: 3 }, profileCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 18, padding: 14 }, avatar: { width: 52, height: 52, borderRadius: 17, backgroundColor: c.primary + '18', alignItems: 'center', justifyContent: 'center' }, name: { color: c.text, fontSize: 16, fontWeight: '800' }, meta: { color: c.subText, fontSize: 11, marginTop: 4, textTransform: 'capitalize' }, viewMore: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 }, viewMoreText: { color: c.primary, fontSize: 11, fontWeight: '800' }, group: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 17, paddingHorizontal: 13, overflow: 'hidden' }, row: { flexDirection: 'row', alignItems: 'center', minHeight: 68, borderBottomWidth: 1, borderBottomColor: c.border, gap: 11 }, lastRow: { borderBottomWidth: 0 }, rowIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, rowCopy: { flex: 1 }, rowTitle: { color: c.text, fontSize: 13, fontWeight: '800' }, rowNote: { color: c.subText, fontSize: 10, marginTop: 4 }, googleAction: { minWidth: 60, height: 34, paddingHorizontal: 11, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '12' }, googleActionLinked: { backgroundColor: c.danger + '12' }, googleActionText: { color: c.primary, fontSize: 11, fontWeight: '900' }, appearanceTitle: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingTop: 13 }, themeOptions: { flexDirection: 'row', gap: 7, marginTop: 12, marginBottom: 13 }, themeOption: { flex: 1, minHeight: 46, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 11, borderWidth: 1, borderColor: c.border }, themeSelected: { borderColor: c.primary, backgroundColor: c.primary + '10' }, themeText: { color: c.subText, fontSize: 9, fontWeight: '700' }, logoutButton: { marginTop: 22, height: 48, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: c.danger + '10' }, logoutText: { color: c.danger, fontSize: 13, fontWeight: '800' }, footer: { color: c.subText, textAlign: 'center', fontSize: 10, marginTop: 17 }, modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000075' }, modalCard: { backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 21, paddingBottom: 30 }, modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, modalTitle: { color: c.text, fontSize: 20, fontWeight: '900' }, modalHint: { color: c.subText, fontSize: 12, marginTop: 7, marginBottom: 15 }, modalInput: { height: 49, backgroundColor: c.background, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 13, color: c.text, marginBottom: 10 }, saveButton: { height: 49, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: c.primary, marginTop: 5 }, saveText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  dialogOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#00000070' }, dialogCard: { width: '100%', backgroundColor: c.card, borderRadius: 22, padding: 22, alignItems: 'center' }, dialogIcon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, dialogTitle: { color: c.text, fontSize: 19, fontWeight: '900', textAlign: 'center' }, dialogMessage: { color: c.subText, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 }, dialogActions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 20 }, dialogCancel: { flex: 1, minHeight: 45, borderRadius: 12, backgroundColor: c.mutedSurface, alignItems: 'center', justifyContent: 'center' }, dialogCancelText: { color: c.text, fontSize: 13, fontWeight: '800' }, dialogConfirm: { flex: 1, minHeight: 45, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, dialogConfirmText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});

import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NepaliDate from 'nepali-date-converter';
import { API_BASE_URL, api } from '../../../core/networking/api';
import { getInMemoryAccessToken } from '../../../core/networking/session';
import { useTheme } from '../../../core/theme/ThemeContext';

type Profile = { id: string; email: string; role: string; schoolName?: string; firstName?: string; lastName?: string; grade?: string | null; section?: string | null; studentId?: string | null; dob?: string | null; phone?: string | null; gender?: string | null; address?: string | null; profilePictureUrl?: string | null; parentName?: string | null; parentPhone?: string | null; department?: string | null; subjects?: string[] };
const formatBsDate = (ad: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ad) || Number.isNaN(Date.parse(ad))) return '';
  try { return new NepaliDate(new Date(`${ad}T00:00:00`)).format('YYYY-MM-DD'); } catch { return ''; }
};

export default function ProfileDetailsScreen({ navigation }: any) {
  const { colors } = useTheme(); const s = makeStyles(colors);
  const [profile, setProfile] = useState<Profile | null>(null); const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [uploadingPhoto, setUploadingPhoto] = useState(false); const [error, setError] = useState('');
  const [photoVersion, setPhotoVersion] = useState(0);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/users/me'); setProfile(data);
      setValues({ firstName: data.firstName || '', lastName: data.lastName || '', email: data.email || '', studentId: data.studentId || data.rollNo || '', phone: data.phone || '', gender: data.gender || '', dob: data.dob ? new Date(data.dob).toISOString().slice(0, 10) : '', address: data.address || '', profilePictureUrl: data.profilePictureUrl || '', parentName: data.parentName || '', parentPhone: data.parentPhone || '' });
    } catch (e: any) { setError(e.response?.status === 401 ? 'Your session expired. Please sign in again.' : 'We couldn’t load your profile. Check your connection and try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const set = (key: string, value: string) => setValues(current => ({ ...current, [key]: value }));
  const save = async () => {
    if (profile?.firstName && (!values.firstName.trim() || !values.lastName.trim())) { Alert.alert('Name required', 'Please enter your first and last name.'); return; }
    const payload: Record<string, string | null> = { email: values.email.trim() };
    if (profile?.firstName) {
      payload.firstName = values.firstName.trim(); payload.lastName = values.lastName.trim();
    }
    if (profile?.role === 'STUDENT') for (const key of ['studentId', 'phone', 'gender', 'address', 'parentName', 'parentPhone']) payload[key] = values[key]?.trim() || '';
    if (profile?.role === 'STUDENT') payload.dob = values.dob?.trim() || null;
    if (values.dob && !/^\d{4}-\d{2}-\d{2}$/.test(values.dob)) { Alert.alert('Check date of birth', 'Enter the AD date in YYYY-MM-DD format.'); return; }
    setSaving(true);
    try {
      const { data } = await api.patch('/users/me', payload); setProfile(data);
      setValues(current => ({ ...current, email: data.email || current.email, studentId: data.studentId || '', dob: data.dob ? new Date(data.dob).toISOString().slice(0, 10) : '' }));
      Alert.alert('Profile updated', 'Your profile details have been saved.');
    } catch (e: any) { const message = Array.isArray(e.response?.data?.message) ? e.response.data.message.join('\n') : e.response?.data?.message; Alert.alert('Could not save', message || 'Please check your details and try again.'); }
    finally { setSaving(false); }
  };
  const choosePhoto = async () => {
    let result;
    try {
      const DocumentPicker = await import('expo-document-picker');
      result = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'image/webp'], copyToCacheDirectory: true, multiple: false });
    } catch {
      Alert.alert('Update the app build', 'This installed app does not include the document picker. Install a fresh development build, then try again.');
      return;
    }
    if (result.canceled || !result.assets[0]) return;
    const photo = result.assets[0];
    if (photo.size && photo.size > 5 * 1024 * 1024) { Alert.alert('Photo is too large', 'Choose an image smaller than 5 MB.'); return; }
    const mimeType = photo.mimeType || 'image/jpeg';
    const form = new FormData();
    form.append('file', { uri: photo.uri, name: photo.name || 'profile-photo.jpg', type: mimeType } as any);
    setUploadingPhoto(true);
    try { await api.post('/users/me/photo', form); setPhotoVersion(Date.now()); await load(); }
    catch (e: any) { Alert.alert('Photo upload failed', e.response?.data?.message || 'Choose another photo and try again.'); }
    finally { setUploadingPhoto(false); }
  };
  const update = (key: string, label: string, placeholder: string, opts: any = {}) => <View style={s.inputGroup} key={key}><Text style={s.label}>{label}</Text><TextInput value={values[key] || ''} onChangeText={value => set(key, value)} placeholder={placeholder} placeholderTextColor={colors.subText} style={s.input} {...opts} /></View>;
  const readonly = (label: string, value?: string | null) => <View style={s.readonlyRow} key={label}><Text style={s.readonlyLabel}>{label}</Text><Text style={s.readonlyValue}>{value || 'Not provided'}</Text></View>;
  const dobBs = values.dob ? formatBsDate(values.dob) : '';
  return <SafeAreaView style={s.screen}>
    <View style={s.header}><TouchableOpacity onPress={() => navigation.goBack()} style={s.back}><Ionicons name="chevron-back" size={24} color={colors.text} /></TouchableOpacity><Text style={s.title}>Profile details</Text><View style={{ width: 36 }} /></View>
    {loading ? <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={s.helper}>Loading your details…</Text></View> : error ? <View style={s.center}><Ionicons name="cloud-offline-outline" size={40} color={colors.subText} /><Text style={s.sectionTitle}>Profile unavailable</Text><Text style={s.helper}>{error}</Text><TouchableOpacity onPress={load} style={s.retry}><Text style={s.saveText}>Try again</Text></TouchableOpacity></View> : profile ? <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.hero}>{profile.profilePictureUrl ? <Image source={{ uri: `${API_BASE_URL}${profile.profilePictureUrl}?v=${photoVersion}`, headers: { Authorization: `Bearer ${getInMemoryAccessToken() || ''}` } }} style={s.avatar} /> : <View style={s.avatar}><Ionicons name="person" size={29} color={colors.primary} /></View>}{profile.role !== 'STUDENT' ? <TouchableOpacity disabled={uploadingPhoto} onPress={choosePhoto} style={s.photoButton}>{uploadingPhoto ? <ActivityIndicator size="small" color={colors.primary} /> : <><Ionicons name="camera-outline" size={14} color={colors.primary} /><Text style={s.photoButtonText}>Change photo</Text></>}</TouchableOpacity><Text style={s.heroName}>{[profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email.split('@')[0]}</Text><Text style={s.heroMeta}>{profile.role.replace('_', ' ').toLowerCase()} · {profile.schoolName || 'School account'}</Text></View>
            {profile.role !== 'STUDENT' ? (
        <>
          <View style={s.sectionHeader}><Text style={s.sectionTitle}>Personal information</Text><Text style={s.editable}>EDITABLE</Text></View>
          <View style={s.card}>
            {profile.firstName ? <>{update('firstName', 'First name', 'First name', { autoCapitalize: 'words', maxLength: 80 })}{update('lastName', 'Last name', 'Last name', { autoCapitalize: 'words', maxLength: 80 })}</> : <Text style={s.helper}>Your school has not added a personal name to this account.</Text>}
            {update('email', 'Email address', 'name@example.com', { autoCapitalize: 'none', keyboardType: 'email-address' })}
            <Text style={s.helper}>Your school manages class placement and other academic records. Email changes affect the address used to sign in.</Text>
          </View>
          <View style={s.sectionHeader}><Text style={s.sectionTitle}>School details</Text><Text style={s.managed}>MANAGED BY SCHOOL</Text></View>
          <View style={s.card}>
            {readonly('School', profile.schoolName)}
            {readonly('Role', profile.role.replace('_', ' '))}
            {profile.role === 'TEACHER' ? readonly('Subjects', profile.subjects?.join(', ')) : null}
            {profile.department ? readonly('Department', profile.department) : null}
          </View>
          <TouchableOpacity disabled={saving} onPress={save} style={[s.saveButton, saving && { opacity: 0.7 }]}>
            {saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="save-outline" size={18} color="#fff" /><Text style={s.saveText}>Save profile</Text></>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={s.sectionHeader}><Text style={s.sectionTitle}>Student Profile</Text><Text style={s.managed}>MANAGED BY SCHOOL</Text></View>
          <View style={s.card}>
            {readonly('Full Name', [profile.firstName, profile.lastName].filter(Boolean).join(' '))}
            {readonly('Email', profile.email)}
            {readonly('Phone', profile.phone)}
            {readonly('Gender', profile.gender)}
            {readonly('Blood Group', profile.bloodGroup)}
            {readonly('Date of Birth AD', profile.dob ? new Date(profile.dob).toISOString().slice(0,10) : null)}
            {readonly('Date of Birth BS', profile.dobBs)}
            {readonly('Permanent Address', profile.address)}
            {readonly('Temporary Address', profile.temporaryAddress)}
          </View>
          <View style={s.sectionHeader}><Text style={s.sectionTitle}>Academic details</Text></View>
          <View style={s.card}>
            {readonly('School', profile.schoolName)}
            {readonly('Admission No / Student ID', profile.studentId)}
            {readonly('EMIS ID / EMIS No.', profile.emisId)}
            {readonly('Admission Date', profile.admissionDate ? new Date(profile.admissionDate).toISOString().slice(0,10) : null)}
            {readonly('Class', profile.grade)}
            {readonly('Section', profile.section)}
            {readonly('Roll Number', profile.rollNo)}
          </View>
          <View style={s.sectionHeader}><Text style={s.sectionTitle}>Guardian details</Text></View>
          <View style={s.card}>
            {readonly('Father Name', profile.fatherName)}
            {readonly('Father Number', profile.fatherPhone)}
            {readonly('Mother Name', profile.motherName)}
            {readonly('Mother Number', profile.motherPhone)}
          </View>
        </>
      )}
    </ScrollView> : null}
  </SafeAreaView>;
}

const makeStyles = (c: any) => StyleSheet.create({ screen: { flex: 1, backgroundColor: c.background }, header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border }, back: { width: 37, height: 38, alignItems: 'center', justifyContent: 'center' }, title: { color: c.text, fontWeight: '900', fontSize: 19 }, content: { padding: 17, paddingBottom: 34 }, hero: { alignItems: 'center', paddingTop: 13, paddingBottom: 24 }, avatar: { width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '18', marginBottom: 11 }, photoButton: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -3, marginBottom: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: c.primary + '12' }, photoButtonText: { color: c.primary, fontSize: 10, fontWeight: '800' }, heroName: { color: c.text, fontSize: 20, fontWeight: '900' }, heroMeta: { color: c.subText, fontSize: 11, marginTop: 5, textTransform: 'capitalize' }, sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 }, sectionTitle: { color: c.text, fontSize: 16, fontWeight: '900' }, editable: { color: c.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }, managed: { color: c.subText, fontSize: 8, fontWeight: '900', letterSpacing: 0.6 }, card: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 17, padding: 14, marginBottom: 19 }, inputGroup: { marginBottom: 12 }, label: { color: c.subText, fontSize: 10, fontWeight: '800', marginBottom: 6 }, input: { height: 45, borderRadius: 11, paddingHorizontal: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.background, color: c.text, fontSize: 13 }, bsField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }, bsValue: { color: c.subText, fontSize: 13 }, helper: { color: c.subText, fontSize: 11, lineHeight: 17, marginTop: 3 }, readonlyRow: { paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: c.border }, readonlyLabel: { color: c.subText, fontSize: 10, fontWeight: '700' }, readonlyValue: { color: c.text, fontSize: 13, fontWeight: '600', marginTop: 4, textTransform: 'capitalize' }, saveButton: { height: 51, borderRadius: 14, backgroundColor: c.primary, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }, saveText: { color: '#fff', fontSize: 14, fontWeight: '900' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 26 }, retry: { backgroundColor: c.primary, paddingHorizontal: 19, paddingVertical: 11, borderRadius: 12, marginTop: 15 } });

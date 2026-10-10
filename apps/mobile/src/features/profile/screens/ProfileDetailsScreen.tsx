import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NepaliDate from 'nepali-date-converter';
import { API_BASE_URL, api } from '../../../core/networking/api';
import { getInMemoryAccessToken, getCachedUserData } from '../../../core/networking/session';
import { useTheme } from '../../../core/theme/ThemeContext';

type Profile = { id: string; email: string; role: string; schoolName?: string; firstName?: string; lastName?: string; grade?: string | null; section?: string | null; studentId?: string | null; dob?: string | null; dobBs?: string | null; phone?: string | null; gender?: string | null; bloodGroup?: string | null; address?: string | null; temporaryAddress?: string | null; profilePictureUrl?: string | null; fatherName?: string | null; fatherPhone?: string | null; motherName?: string | null; motherPhone?: string | null; parentName?: string | null; parentPhone?: string | null; department?: string | null; subjects?: string[]; emisId?: string | null; admissionDate?: string | null; rollNo?: string | null; };
const formatBsDate = (ad: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ad) || Number.isNaN(Date.parse(ad))) return '';
  try { return new NepaliDate(new Date(`${ad}T00:00:00`)).format('YYYY-MM-DD'); } catch { return ''; }
};

export default function ProfileDetailsScreen({ navigation }: any) {
  const { colors } = useTheme(); const s = makeStyles(colors);
  const [profile, setProfile] = useState<Profile | null>(null); const [values, setValues] = useState<Record<string, string>>({});
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [uploadingPhoto, setUploadingPhoto] = useState(false); const [error, setError] = useState('');
  const [photoVersion, setPhotoVersion] = useState(0);
  const load = useCallback(async () => {
    setError('');
    let cachedRole = '';
    try {
      const raw = await getCachedUserData();
      if (raw) {
        const data = JSON.parse(raw);
        cachedRole = data.role || '';
        setProfile(data);
        setValues({ firstName: data.firstName || '', lastName: data.lastName || '', email: data.email || '', studentId: data.studentId || data.rollNo || '', phone: data.phone || '', gender: data.gender || '', dob: data.dob ? new Date(data.dob).toISOString().slice(0, 10) : '', address: data.address || '', profilePictureUrl: data.profilePictureUrl || '', parentName: data.parentName || '', parentPhone: data.parentPhone || '' });
        setLoading(false);
      }
    } catch (e) {}

    try {
      const [profileResult, summaryResult] = await Promise.allSettled([
        api.get('/users/me'),
        cachedRole === 'TEACHER' ? api.get('/dashboard/summary') : Promise.resolve(null),
      ]);
      if (profileResult.status === 'rejected') throw profileResult.reason;
      const { data } = profileResult.value; setProfile(data);
      setValues({ firstName: data.firstName || '', lastName: data.lastName || '', email: data.email || '', studentId: data.studentId || data.rollNo || '', phone: data.phone || '', gender: data.gender || '', dob: data.dob ? new Date(data.dob).toISOString().slice(0, 10) : '', address: data.address || '', profilePictureUrl: data.profilePictureUrl || '', parentName: data.parentName || '', parentPhone: data.parentPhone || '' });
      if (data.role === 'TEACHER') {
        const summary = summaryResult.status === 'fulfilled' ? summaryResult.value : null;
        const teacherSummary = summary || (await api.get('/dashboard/summary').catch(() => null));
        setTeacherAssignments(Array.isArray(teacherSummary?.data?.assignments) ? teacherSummary.data.assignments : []);
      } else setTeacherAssignments([]);
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
    if (photo.size && photo.size > 1 * 1024 * 1024) { Alert.alert('Photo is too large', 'Choose an image smaller than 1 MB.'); return; }
    const mimeType = photo.mimeType || 'image/jpeg';
    setUploadingPhoto(true);
    try {
      const { uploadFile } = await import('../../../core/networking/api');
      await uploadFile(photo.uri, mimeType, '/users/me/photo');
      setPhotoVersion(Date.now());
      await load();
    }
    catch (e: any) { Alert.alert('Photo upload failed', e.message || 'Choose another photo and try again.'); }
    finally { setUploadingPhoto(false); }
  };
  const update = (key: string, label: string, placeholder: string, opts: any = {}) => <View style={s.inputGroup} key={key}><Text style={s.label}>{label}</Text><TextInput value={values[key] || ''} onChangeText={value => set(key, value)} placeholder={placeholder} placeholderTextColor={colors.subText} style={s.input} {...opts} /></View>;
  const readonly = (label: string, value?: string | null) => <View style={s.readonlyRow} key={label}><Text style={s.readonlyLabel}>{label}</Text><Text style={s.readonlyValue}>{value || 'Not provided'}</Text></View>;
  const studentSection = (title: string, icon: any, hint: string, children: React.ReactNode) => <><View style={s.sectionHeader}><View style={s.sectionTitleRow}><View style={s.sectionIcon}><Ionicons name={icon} size={17} color={colors.primary} /></View><View><Text style={s.sectionTitle}>{title}</Text><Text style={s.sectionHint}>{hint}</Text></View></View><Text style={s.managed}>SCHOOL RECORD</Text></View><View style={s.card}>{children}</View></>;
  const staffSection = (title: string, icon: any, hint: string, children: React.ReactNode) => <><View style={s.sectionHeader}><View style={s.sectionTitleRow}><View style={s.sectionIcon}><Ionicons name={icon} size={17} color={colors.primary} /></View><View><Text style={s.sectionTitle}>{title}</Text><Text style={s.sectionHint}>{hint}</Text></View></View></View><View style={s.card}>{children}</View></>;
  const dobBs = values.dob ? formatBsDate(values.dob) : '';
  const studentName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || profile?.email?.split('@')[0] || 'Student';
  const completionFields = [profile?.phone, profile?.gender, profile?.bloodGroup, profile?.dob, profile?.address, profile?.fatherName || profile?.parentName, profile?.fatherPhone || profile?.parentPhone].filter(Boolean).length;
  const completion = Math.round((completionFields / 7) * 100);
  return <SafeAreaView style={s.screen}>
    <View style={s.header}><TouchableOpacity onPress={() => navigation.goBack()} style={s.back}><Ionicons name="chevron-back" size={24} color={colors.text} /></TouchableOpacity><Text style={s.title}>Profile details</Text><View style={{ width: 36 }} /></View>
    {loading ? <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={s.helper}>Loading your details…</Text></View> : error ? <View style={s.center}><Ionicons name="cloud-offline-outline" size={40} color={colors.subText} /><Text style={s.sectionTitle}>Profile unavailable</Text><Text style={s.helper}>{error}</Text><TouchableOpacity onPress={load} style={s.retry}><Text style={s.saveText}>Try again</Text></TouchableOpacity></View> : profile ? <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.hero}>{profile.profilePictureUrl ? <Image source={{ uri: `${API_BASE_URL}${profile.profilePictureUrl}?v=${photoVersion}`, headers: { Authorization: `Bearer ${getInMemoryAccessToken() || ''}` } }} style={s.avatar} /> : <View style={s.avatar}><Ionicons name="person" size={29} color={colors.primary} /></View>}{profile.role !== 'STUDENT' && <TouchableOpacity disabled={uploadingPhoto} onPress={choosePhoto} style={s.photoButton}>{uploadingPhoto ? <ActivityIndicator size="small" color={colors.primary} /> : <><Ionicons name="camera-outline" size={14} color={colors.primary} /><Text style={s.photoButtonText}>Change photo</Text></>}</TouchableOpacity>}<Text style={s.heroName}>{profile.role === 'STUDENT' ? studentName : ([profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email.split('@')[0])}</Text><Text style={s.heroMeta}>{profile.role === 'STUDENT' ? `Class ${profile.grade || '—'}${profile.section ? ` · Section ${profile.section}` : ''}` : `${profile.role.replace('_', ' ').toLowerCase()} · ${profile.schoolName || 'School account'}`}</Text>{profile.role === 'STUDENT' && <View style={s.verifiedBadge}><Ionicons name="shield-checkmark-outline" size={13} color={colors.success} /><Text style={s.verifiedText}>Verified school profile</Text></View>}</View>
            {profile.role !== 'STUDENT' ? (
        <>
          <View style={s.staffSummary}><View style={s.staffSummaryIcon}><Ionicons name={profile.role === 'TEACHER' ? 'school-outline' : profile.role === 'SUPER_ADMIN' ? 'shield-checkmark-outline' : 'business-outline'} size={21} color={colors.primary} /></View><View style={s.staffSummaryCopy}><Text style={s.staffSummaryTitle}>{profile.role === 'TEACHER' ? 'Teaching account' : profile.role === 'SUPER_ADMIN' ? 'Platform administrator' : 'School administrator'}</Text><Text style={s.staffSummaryText}>{profile.role === 'TEACHER' ? `${teacherAssignments.length} current class assignment${teacherAssignments.length === 1 ? '' : 's'}` : profile.role === 'SUPER_ADMIN' ? 'Elevated access across the platform' : 'Administrative access for this school'}</Text></View><View style={s.activePill}><View style={s.activeDot} /><Text style={s.activeText}>Active</Text></View></View>
          {staffSection('Personal information', 'person-outline', 'Your name and sign-in address', <>
            {profile.firstName ? <>{update('firstName', 'First name', 'First name', { autoCapitalize: 'words', maxLength: 80 })}{update('lastName', 'Last name', 'Last name', { autoCapitalize: 'words', maxLength: 80 })}</> : <Text style={s.helper}>Your school has not added a personal name to this account.</Text>}
            {update('email', 'Work email', 'name@example.com', { autoCapitalize: 'none', keyboardType: 'email-address' })}
            <View style={s.inlineHint}><Ionicons name="information-circle-outline" size={15} color={colors.primary} /><Text style={s.inlineHintText}>Changing your email also changes the address used to sign in.</Text></View>
          </>)}
          {profile.role === 'TEACHER' ? staffSection('Teaching profile', 'book-outline', 'Subjects and assigned classes', <>
            {profile.subjects?.length ? <View style={s.subjectChips}>{profile.subjects.map((subject, index) => <View key={`${subject}-${index}`} style={s.subjectChip}><Ionicons name="bookmark-outline" size={12} color={colors.primary} /><Text style={s.subjectChipText}>{subject}</Text></View>)}</View> : <Text style={s.helper}>No subjects are listed on your teacher profile.</Text>}
            <View style={s.subsectionDivider} /><Text style={s.assignmentHeading}>CURRENT ASSIGNMENTS</Text>
            {teacherAssignments.length ? teacherAssignments.map((assignment, index) => <View key={assignment.id || `${assignment.sectionId}-${assignment.subjectId}-${index}`} style={[s.assignmentRow, index === teacherAssignments.length - 1 && { borderBottomWidth: 0 }]}><View style={s.assignmentIcon}><Ionicons name="easel-outline" size={16} color={colors.success} /></View><View style={s.assignmentCopy}><Text style={s.assignmentTitle}>{assignment.subject?.name || 'Subject'}</Text><Text style={s.assignmentMeta}>{assignment.section?.class?.name || 'Class'} · Section {assignment.section?.name || '—'}</Text>{assignment.academicYear?.name && <Text style={s.assignmentYear}>{assignment.academicYear.name}</Text>}</View></View>) : <Text style={s.helper}>No current class assignments were returned for this account.</Text>}
          </>) : staffSection(profile.role === 'SUPER_ADMIN' ? 'Platform access' : 'School role', profile.role === 'SUPER_ADMIN' ? 'shield-outline' : 'business-outline', profile.role === 'SUPER_ADMIN' ? 'Account scope and identity' : 'Your administrative identity', <>
            {profile.role === 'SUPER_ADMIN' ? readonly('Access level', 'Super administrator') : readonly('Department', profile.department)}
            {readonly('School context', profile.schoolName)}
            {profile.role === 'ADMIN' && readonly('Role', 'School administrator')}
            {profile.role === 'SUPER_ADMIN' && readonly('Role', 'Platform administrator')}
            <View style={s.inlineHint}><Ionicons name="lock-closed-outline" size={14} color={colors.subText} /><Text style={s.inlineHintText}>Access permissions are assigned by the platform and school configuration.</Text></View>
          </>)}
          <TouchableOpacity disabled={saving} onPress={save} style={[s.saveButton, saving && { opacity: 0.7 }]}>
            {saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="save-outline" size={18} color="#fff" /><Text style={s.saveText}>Save profile</Text></>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={s.completionCard}><View style={s.completionIcon}><Ionicons name="person-circle-outline" size={25} color={colors.primary} /></View><View style={s.completionCopy}><View style={s.completionTop}><Text style={s.completionTitle}>Profile completeness</Text><Text style={s.completionValue}>{completion}%</Text></View><View style={s.progressTrack}><View style={[s.progressFill, { width: `${Math.max(8, completion)}%` }]} /></View><Text style={s.completionHint}>{completion >= 80 ? 'Your key details are up to date.' : 'Ask the school office to complete missing details.'}</Text></View></View>
          {studentSection('Personal details', 'person-outline', 'Identity and contact information', <>
            {readonly('Full Name', [profile.firstName, profile.lastName].filter(Boolean).join(' '))}
            {readonly('Email', profile.email)}
            {readonly('Phone', profile.phone)}
            {readonly('Gender', profile.gender)}
            {readonly('Blood Group', profile.bloodGroup)}
            {readonly('Date of Birth AD', profile.dob ? new Date(profile.dob).toISOString().slice(0,10) : null)}
            {readonly('Date of Birth BS', profile.dobBs)}
            {readonly('Permanent Address', profile.address)}
            {readonly('Temporary Address', profile.temporaryAddress)}
          </>)}
          {studentSection('Academic details', 'school-outline', 'Enrollment and class placement', <>
            {readonly('School', profile.schoolName)}
            {readonly('Admission No / Student ID', profile.studentId)}
            {readonly('EMIS ID / EMIS No.', profile.emisId)}
            {readonly('Admission Date', profile.admissionDate ? new Date(profile.admissionDate).toISOString().slice(0,10) : null)}
            {readonly('Class', profile.grade)}
            {readonly('Section', profile.section)}
            {readonly('Roll Number', profile.rollNo)}
          </>)}
          {studentSection('Guardian details', 'people-outline', 'Parent and emergency contact records', <>
            {readonly('Father Name', profile.fatherName)}
            {readonly('Father Number', profile.fatherPhone)}
            {readonly('Mother Name', profile.motherName)}
            {readonly('Mother Number', profile.motherPhone)}
          </>)}
          <View style={s.readOnlyNotice}><Ionicons name="information-circle-outline" size={18} color={colors.primary} /><Text style={s.readOnlyNoticeText}>These student records are maintained by your school. Contact the administration if anything needs correction.</Text></View>
        </>
      )}
    </ScrollView> : null}
  </SafeAreaView>;
}

const makeStyles = (c: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background }, header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border }, back: { width: 37, height: 38, alignItems: 'center', justifyContent: 'center' }, title: { color: c.text, fontWeight: '900', fontSize: 19 }, content: { padding: 17, paddingBottom: 34 }, hero: { alignItems: 'center', paddingTop: 13, paddingBottom: 24 }, avatar: { width: 82, height: 82, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '18', marginBottom: 11, borderWidth: 3, borderColor: c.card }, photoButton: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -3, marginBottom: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: c.primary + '12' }, photoButtonText: { color: c.primary, fontSize: 10, fontWeight: '800' }, heroName: { color: c.text, fontSize: 21, fontWeight: '900' }, heroMeta: { color: c.subText, fontSize: 11, marginTop: 5, textTransform: 'capitalize' }, verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: c.success + '12' }, verifiedText: { color: c.success, fontSize: 10, fontWeight: '800' },
  staffSummary: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, marginBottom: 19, borderRadius: 16, backgroundColor: c.primary + '10', borderWidth: 1, borderColor: c.primary + '24' }, staffSummaryIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card }, staffSummaryCopy: { flex: 1 }, staffSummaryTitle: { color: c.text, fontSize: 13, fontWeight: '900' }, staffSummaryText: { color: c.subText, fontSize: 10, lineHeight: 15, marginTop: 3 }, activePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, backgroundColor: c.success + '14' }, activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.success }, activeText: { color: c.success, fontSize: 9, fontWeight: '800' }, inlineHint: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, padding: 10, marginTop: 3, borderRadius: 11, backgroundColor: c.primary + '0C' }, inlineHintText: { flex: 1, color: c.subText, fontSize: 10, lineHeight: 15 }, subjectChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 3 }, subjectChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, backgroundColor: c.primary + '12' }, subjectChipText: { color: c.text, fontSize: 11, fontWeight: '700' }, subsectionDivider: { height: 1, backgroundColor: c.border, marginVertical: 13 }, assignmentHeading: { color: c.subText, fontSize: 9, fontWeight: '900', letterSpacing: 0.8, marginBottom: 5 }, assignmentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border }, assignmentIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: c.success + '12' }, assignmentCopy: { flex: 1 }, assignmentTitle: { color: c.text, fontSize: 12, fontWeight: '800' }, assignmentMeta: { color: c.subText, fontSize: 10, marginTop: 3 }, assignmentYear: { color: c.primary, fontSize: 9, fontWeight: '700', marginTop: 3 },
  completionCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, marginBottom: 20, borderRadius: 16, backgroundColor: c.primary + '10', borderWidth: 1, borderColor: c.primary + '24' }, completionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card }, completionCopy: { flex: 1 }, completionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, completionTitle: { color: c.text, fontSize: 12, fontWeight: '900' }, completionValue: { color: c.primary, fontSize: 13, fontWeight: '900' }, progressTrack: { height: 6, borderRadius: 4, backgroundColor: c.card, marginTop: 8, overflow: 'hidden' }, progressFill: { height: 6, borderRadius: 4, backgroundColor: c.primary }, completionHint: { color: c.subText, fontSize: 9, marginTop: 6 }, sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 }, sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 }, sectionIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '14' }, sectionTitle: { color: c.text, fontSize: 15, fontWeight: '900' }, sectionHint: { color: c.subText, fontSize: 9, marginTop: 2 }, editable: { color: c.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }, managed: { color: c.subText, fontSize: 8, fontWeight: '900', letterSpacing: 0.6 }, card: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 17, padding: 14, marginBottom: 19 }, inputGroup: { marginBottom: 12 }, label: { color: c.subText, fontSize: 10, fontWeight: '800', marginBottom: 6 }, input: { height: 45, borderRadius: 11, paddingHorizontal: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.background, color: c.text, fontSize: 13 }, bsField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }, bsValue: { color: c.subText, fontSize: 13 }, helper: { color: c.subText, fontSize: 11, lineHeight: 17, marginTop: 3 }, readonlyRow: { paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: c.border }, readonlyLabel: { color: c.subText, fontSize: 10, fontWeight: '700' }, readonlyValue: { color: c.text, fontSize: 13, fontWeight: '600', marginTop: 4, textTransform: 'capitalize' }, readOnlyNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, marginTop: -4, marginBottom: 17, borderRadius: 13, backgroundColor: c.primary + '10' }, readOnlyNoticeText: { flex: 1, color: c.subText, fontSize: 10, lineHeight: 15 }, saveButton: { height: 51, borderRadius: 14, backgroundColor: c.primary, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }, saveText: { color: '#fff', fontSize: 14, fontWeight: '900' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 26 }, retry: { backgroundColor: c.primary, paddingHorizontal: 19, paddingVertical: 11, borderRadius: 12, marginTop: 15 }
});

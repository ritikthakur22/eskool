import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, api } from '../../../core/networking/api';
import { getInMemoryAccessToken } from '../../../core/networking/session';
import { useTheme } from '../../../core/theme/ThemeContext';
import NepaliDate from 'nepali-date-converter';

type ManagedUser = { id: string; email: string; role: string; status: string; studentProfile?: any; teacherProfile?: any; adminProfile?: any; parentProfile?: any; userId?: string | null; emisId?: string | null; profilePictureUrl?: string | null };
type PickedPhoto = { uri: string; name: string; mimeType: string; size?: number };
const localDateString = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const localTimeString = (date = new Date()) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const freshForm = () => ({ email: '', password: '', firstName: '', lastName: '', role: 'STUDENT', grade: '', section: '', rollNo: '', department: '', emisId: '', userId: '', dob: '', dobBs: '', phone: '', gender: '', bloodGroup: '', address: '', temporaryAddress: '', admissionDate: localDateString(), admissionTime: localTimeString(), fatherName: '', fatherPhone: '', motherName: '', motherPhone: '', relationship: '', subjects: '' });
const roleLabels: Record<string, string> = { ADMIN: 'Admin', TEACHER: 'Teacher', STUDENT: 'Student', PARENT: 'Parent' };
const MONTHS_AD = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_BS = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];
const dateParts = (value: string, mode: 'AD' | 'BS') => {
  const match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
  if (mode === 'BS') { const now = new NepaliDate(); return { year: now.getYear(), month: now.getMonth(), day: now.getDate() }; }
  const now = new Date(); return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
};

const displayName = (user: ManagedUser) => {
  const profile = user.studentProfile || user.teacherProfile || user.adminProfile || user.parentProfile;
  return [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || user.email;
};

export default function StaffManagementScreen({ navigation }: any) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [role, setRole] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [academicClasses, setAcademicClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [form, setForm] = useState(freshForm);
  const requestVersion = useRef(0);

  const load = useCallback(async (refresh = false, offset = 0) => {
    const version = ++requestVersion.current;
    if (refresh) setRefreshing(true);
    else if (offset === 0) setLoading(true);
    if (offset > 0) setLoadingMore(true);
    setError('');
    try {
      const { data } = await api.get('/users/admin/users', { params: { role: filter === 'ALL' ? undefined : filter, q: debouncedQuery.trim() || undefined, limit: 30, offset } });
      const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      if (version !== requestVersion.current) return;
      setUsers(current => offset ? [...current, ...items] : items);
      setHasMore(Boolean(data?.hasMore));
    } catch (e: any) { if (version === requestVersion.current) { setError(e.response?.data?.message || 'Could not load the user directory.'); if (offset === 0) setUsers([]); } }
    finally { if (version === requestVersion.current) { setLoading(false); setRefreshing(false); setLoadingMore(false); } }
  }, [filter, debouncedQuery]);

  useEffect(() => { SecureStore.getItemAsync('user_data').then(raw => setRole(raw ? JSON.parse(raw).role || '' : '')).catch(() => undefined); }, []);
  useEffect(() => { if (role === 'ADMIN' || role === 'SUPER_ADMIN') load(); }, [role, load]);
  useEffect(() => { const timer = setTimeout(() => setDebouncedQuery(query), 350); return () => clearTimeout(timer); }, [query]);

  const allowedRoles = useMemo(() => role === 'SUPER_ADMIN' ? ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] : ['TEACHER', 'STUDENT', 'PARENT'], [role]);
  const setField = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));
  const updateBirthDate = (mode: 'AD' | 'BS', value: string) => {
    setField(mode === 'AD' ? 'dob' : 'dobBs', value);
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) return;
    try {
      if (mode === 'AD') {
        const date = new Date(`${value}T00:00:00`);
        if (localDateString(date) === value) setField('dobBs', new NepaliDate(date).format('YYYY-MM-DD'));
      } else {
        const date = new NepaliDate(value).toJsDate();
        const parsed = new NepaliDate(value).getBS();
        const entered = value.split('-').map(Number);
        if (parsed.year === entered[0] && parsed.month + 1 === entered[1] && parsed.date === entered[2]) setField('dob', localDateString(date));
      }
    } catch { /* Keep the typed value so validation can explain it on save. */ }
  };
  const fieldLabel = (title: string, required = false) => <Text style={s.fieldLabel}>{title}{required && <Text style={{ color: colors.danger }}> *</Text>}</Text>;
  const selectedClass = academicClasses.find(item => String(item.name).trim().toLocaleLowerCase() === form.grade.trim().toLocaleLowerCase());
  const availableSections = selectedClass?.sections || [];
  const loadAcademicClasses = async () => {
    if (academicClasses.length || loadingClasses) return;
    setLoadingClasses(true);
    try { const { data } = await api.get('/academics/structure'); setAcademicClasses(Array.isArray(data?.classes) ? data.classes : []); }
    catch { Alert.alert('Classes unavailable', 'Class and section options could not be loaded. Try again when the school connection is available.'); }
    finally { setLoadingClasses(false); }
  };
  const openCreate = () => { setEditingUser(null); setPhoto(null); const next = { ...freshForm(), role: allowedRoles.includes('STUDENT') ? 'STUDENT' : allowedRoles[0] }; setForm(next); setModal(true); if (next.role === 'STUDENT') void loadAcademicClasses(); };
  const openEdit = async (user: ManagedUser) => {
    setEditingUser(user); setPhoto(null); setLoadingAccount(true); setModal(true);
    try {
      const { data } = await api.get(`/users/admin/users/${user.id}`);
      const profile = data.studentProfile || data.teacherProfile || data.adminProfile || data.parentProfile || {};
      setEditingUser({ ...user, ...data });
      const admissionDate = profile.admissionDate ? new Date(profile.admissionDate) : new Date();
      setForm({ ...freshForm(), email: data.email, firstName: profile.firstName || '', lastName: profile.lastName || '', role: data.role, grade: profile.grade || '', section: profile.section || '', rollNo: profile.rollNo || '', department: profile.department || '', emisId: data.emisId || '', userId: data.userId || '', dob: profile.dob ? localDateString(new Date(profile.dob)) : '', dobBs: profile.dobBs || '', phone: profile.phone || '', gender: profile.gender || '', bloodGroup: profile.bloodGroup || '', address: profile.address || '', temporaryAddress: profile.temporaryAddress || '', admissionDate: localDateString(admissionDate), admissionTime: localTimeString(admissionDate), fatherName: profile.fatherName || '', fatherPhone: profile.fatherPhone || '', motherName: profile.motherName || '', motherPhone: profile.motherPhone || '', relationship: profile.relationship || '', subjects: Array.isArray(profile.subjects) ? profile.subjects.join(', ') : '' });
      if (data.role === 'STUDENT') void loadAcademicClasses();
    } catch (e: any) {
      setModal(false); setEditingUser(null); Alert.alert('Could not load account', e.response?.data?.message || 'Please try again.');
    } finally { setLoadingAccount(false); }
  };
  const choosePhoto = async () => {
    try {
      const picker = await import('expo-document-picker');
      const result = await picker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'image/webp'], copyToCacheDirectory: true, multiple: false });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      if (asset.size && asset.size > 5 * 1024 * 1024) { Alert.alert('Image too large', 'Choose a profile photo smaller than 5 MB.'); return; }
      setPhoto({ uri: asset.uri, name: asset.name || 'profile.jpg', mimeType: asset.mimeType || 'image/jpeg', size: asset.size });
    } catch { Alert.alert('Photo picker unavailable', 'Update the app build to include the image picker, then try again.'); }
  };
  const uploadPhoto = async (userId: string) => {
    if (!photo) return;
    const body = new FormData();
    body.append('file', { uri: photo.uri, name: photo.name, type: photo.mimeType } as any);
    await api.post(`/users/admin/users/${userId}/photo`, body);
  };
  const create = async () => {
    if (!form.email.trim() || (!editingUser && form.password.length < 8) || !form.firstName.trim() || !form.lastName.trim()) { Alert.alert('Required details missing', 'Email and full name are required. New accounts also need a password of at least 8 characters.'); return; }
    if (form.role === 'STUDENT' && !form.emisId.trim()) { Alert.alert('EMIS ID required', 'Every student must have a unique EMIS ID.'); return; }
    if (form.role === 'STUDENT') {
      const fatherName = form.fatherName.trim(); const fatherPhone = form.fatherPhone.trim();
      const motherName = form.motherName.trim(); const motherPhone = form.motherPhone.trim();
      if ((Boolean(fatherName) !== Boolean(fatherPhone)) || (Boolean(motherName) !== Boolean(motherPhone)) || !((fatherName && fatherPhone) || (motherName && motherPhone))) {
        Alert.alert('Parent / guardian required', 'Enter both the name and phone number for at least one parent or guardian.'); return;
      }
    }
    if (form.dob && !/^\d{4}-\d{2}-\d{2}$/.test(form.dob)) { Alert.alert('Check date of birth', 'Enter AD date in YYYY-MM-DD format.'); return; }
    if (form.dob && localDateString(new Date(`${form.dob}T00:00:00`)) !== form.dob) { Alert.alert('Check date of birth', 'Enter a real AD date in YYYY-MM-DD format.'); return; }
    if (form.dobBs && !/^\d{4}-\d{1,2}-\d{1,2}$/.test(form.dobBs)) { Alert.alert('Check BS date of birth', 'Enter a BS date in YYYY-MM-DD format.'); return; }
    if (form.dobBs) {
      try { const parsed = new NepaliDate(form.dobBs); const parts = parsed.getBS(); const entered = form.dobBs.split('-').map(Number); if (parts.year !== entered[0] || parts.month + 1 !== entered[1] || parts.date !== entered[2]) throw new Error(); }
      catch { Alert.alert('Check BS date of birth', 'Enter a real BS date in YYYY-MM-DD format.'); return; }
    }
    if (form.admissionDate && (!/^\d{4}-\d{2}-\d{2}$/.test(form.admissionDate) || localDateString(new Date(`${form.admissionDate}T00:00:00`)) !== form.admissionDate || !/^([01]\d|2[0-3]):[0-5]\d$/.test(form.admissionTime))) { Alert.alert('Check admission date and time', 'Enter a valid date and time.'); return; }
    setSaving(true);
    try {
      const payload: Record<string, any> = { email: form.email.trim().toLowerCase(), firstName: form.firstName.trim(), lastName: form.lastName.trim() };
      if (!editingUser) { payload.role = form.role; payload.password = form.password; }
      if (form.role === 'STUDENT') Object.assign(payload, { emisId: form.emisId.trim(), userId: form.userId.trim() || undefined, grade: form.grade.trim() || undefined, section: form.section.trim() || undefined, rollNo: form.rollNo.trim() || undefined, dob: form.dob || undefined, dobBs: form.dobBs.trim() || undefined, phone: form.phone.trim() || undefined, gender: form.gender || undefined, bloodGroup: form.bloodGroup.trim() || undefined, address: form.address.trim() || undefined, temporaryAddress: form.temporaryAddress.trim() || undefined, admissionDate: form.admissionDate ? new Date(`${form.admissionDate}T${form.admissionTime}:00`).toISOString() : undefined, fatherName: form.fatherName.trim() || undefined, fatherPhone: form.fatherPhone.trim() || undefined, motherName: form.motherName.trim() || undefined, motherPhone: form.motherPhone.trim() || undefined });
      if (form.role === 'TEACHER') payload.subjects = form.subjects.split(',').map(value => value.trim()).filter(Boolean).slice(0, 20);
      if (form.role === 'PARENT') Object.assign(payload, { phone: form.phone.trim() || undefined, address: form.address.trim() || undefined, relationship: form.relationship.trim() || undefined });
      if (form.role === 'ADMIN') payload.department = form.department.trim() || undefined;
      const response = editingUser ? await api.patch(`/users/admin/users/${editingUser.id}`, payload) : await api.post('/users/admin/create-user', payload);
      const savedUserId = editingUser?.id || response.data?.id;
      if (photo && savedUserId) {
        try { await uploadPhoto(savedUserId); }
        catch (uploadError: any) { setModal(false); await load(true); Alert.alert('Account saved; photo not uploaded', uploadError.response?.data?.message || 'The account was saved, but its photo upload failed. Edit the account and try the photo again.'); return; }
      }
      setModal(false); setEditingUser(null); setPhoto(null); setForm({ ...freshForm(), role: allowedRoles.includes('STUDENT') ? 'STUDENT' : allowedRoles[0] }); await load(true);
    }
    catch (e: any) { Alert.alert(editingUser ? 'Could not update account' : 'Could not create account', Array.isArray(e.response?.data?.message) ? e.response.data.message.join('\n') : e.response?.data?.message || 'Check the details and try again.'); }
    finally { setSaving(false); }
  };
  const changeStatus = (user: ManagedUser) => Alert.alert(user.status === 'ACTIVE' ? 'Disable account?' : 'Restore account?', `${displayName(user)} will ${user.status === 'ACTIVE' ? 'no longer be able to sign in' : 'be able to sign in again'}.`, [{ text: 'Cancel', style: 'cancel' }, { text: user.status === 'ACTIVE' ? 'Disable' : 'Restore', style: user.status === 'ACTIVE' ? 'destructive' : 'default', onPress: async () => { try { await api.post(`/users/admin/users/${user.id}/${user.status === 'ACTIVE' ? 'disable' : 'restore'}`); await load(true); } catch (e: any) { Alert.alert('Action failed', e.response?.data?.message || 'Please try again.'); } } }]);

  if (role && role !== 'ADMIN' && role !== 'SUPER_ADMIN') return <SafeAreaView style={s.screen}><View style={s.center}><Ionicons name="lock-closed-outline" size={38} color={colors.subText} /><Text style={s.emptyTitle}>Management access is restricted</Text><Text style={s.emptyText}>Only school administrators can manage accounts.</Text><TouchableOpacity onPress={() => navigation.goBack()} style={s.primaryButton}><Text style={s.primaryText}>Go back</Text></TouchableOpacity></View></SafeAreaView>;
  return <SafeAreaView style={s.screen}>
    <View style={s.header}><TouchableOpacity onPress={() => navigation.goBack()} style={s.iconButton}><Ionicons name="chevron-back" size={23} color={colors.text} /></TouchableOpacity><View style={s.headerCopy}><Text style={s.eyebrow}>SCHOOL ADMINISTRATION</Text><Text style={s.title}>People</Text></View><TouchableOpacity accessibilityLabel="Create user" onPress={openCreate} style={s.addButton}><Ionicons name="add" size={21} color="#fff" /></TouchableOpacity></View>
    <View style={s.toolbar}><View style={s.search}><Ionicons name="search-outline" size={18} color={colors.subText} /><TextInput value={query} onChangeText={setQuery} placeholder="Search name, email, student ID or EMIS" placeholderTextColor={colors.subText} style={s.searchInput} /></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{['ALL', ...allowedRoles].map(item => <TouchableOpacity key={item} onPress={() => setFilter(item)} style={[s.filter, filter === item && s.filterActive]}><Text style={[s.filterText, filter === item && s.filterTextActive]}>{item === 'ALL' ? 'All' : roleLabels[item]}</Text></TouchableOpacity>)}</ScrollView></View>
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}>
      {loading ? <View style={s.center}><ActivityIndicator color={colors.primary} /><Text style={s.emptyText}>Loading people…</Text></View> : error ? <View style={s.center}><Ionicons name="cloud-offline-outline" size={32} color={colors.subText} /><Text style={s.emptyText}>{error}</Text><TouchableOpacity onPress={() => load()}><Text style={s.link}>Try again</Text></TouchableOpacity></View> : users.length === 0 ? <View style={s.center}><Ionicons name="people-outline" size={36} color={colors.subText} /><Text style={s.emptyTitle}>No users found</Text><Text style={s.emptyText}>Try another filter or create a new account.</Text></View> : <>{users.map(user => <TouchableOpacity activeOpacity={0.85} onPress={() => openEdit(user)} key={user.id} style={s.userCard}>{user.profilePictureUrl ? <Image source={{ uri: `${API_BASE_URL}/users/admin/users/${user.id}/photo`, headers: { Authorization: `Bearer ${getInMemoryAccessToken() || ''}` } }} style={s.avatar} /> : <View style={[s.avatar, { backgroundColor: user.status === 'ACTIVE' ? colors.primary + '18' : colors.danger + '18' }]}><Text style={[s.avatarText, { color: user.status === 'ACTIVE' ? colors.primary : colors.danger }]}>{displayName(user).slice(0, 1).toUpperCase()}</Text></View>}<View style={s.userCopy}><Text numberOfLines={1} style={s.userName}>{displayName(user)}</Text><Text numberOfLines={1} style={s.userEmail}>{user.email}</Text><View style={s.metaRow}><Text style={s.rolePill}>{roleLabels[user.role] || user.role}</Text>{user.emisId && <Text numberOfLines={1} style={s.userMeta}>EMIS {user.emisId}</Text>}<Text style={[s.status, { color: user.status === 'ACTIVE' ? colors.success : colors.danger }]}>{user.status === 'ACTIVE' ? 'Active' : 'Disabled'}</Text></View></View><TouchableOpacity accessibilityLabel={`${user.status === 'ACTIVE' ? 'Disable' : 'Restore'} ${displayName(user)}`} onPress={() => changeStatus(user)} style={s.moreButton}><Ionicons name={user.status === 'ACTIVE' ? 'pause-circle-outline' : 'play-circle-outline'} size={22} color={user.status === 'ACTIVE' ? colors.danger : colors.success} /></TouchableOpacity></TouchableOpacity>)}{hasMore && <TouchableOpacity disabled={loadingMore} onPress={() => load(false, users.length)} style={s.loadMore}>{loadingMore ? <ActivityIndicator color={colors.primary} /> : <Text style={s.link}>Load next 30 accounts</Text>}</TouchableOpacity>}</>}
    </ScrollView>
    <Modal visible={modal} transparent animationType="slide" onRequestClose={() => { setModal(false); setEditingUser(null); setPhoto(null); }}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}><View style={s.modal}><View style={s.modalHead}><View><Text style={s.modalEyebrow}>{editingUser ? 'MANAGE ACCOUNT' : 'NEW SCHOOL ACCOUNT'}</Text><Text style={s.modalTitle}>{editingUser ? 'Edit account' : 'Create account'}</Text></View><TouchableOpacity onPress={() => { setModal(false); setEditingUser(null); setPhoto(null); }}><Ionicons name="close-circle" size={25} color={colors.subText} /></TouchableOpacity></View>{loadingAccount ? <View style={s.center}><ActivityIndicator color={colors.primary} /><Text style={s.emptyText}>Loading account details…</Text></View> : <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={s.modalHint}>{editingUser ? 'Update identity and profile details.' : 'Fields marked * are required. Student EMIS ID must be unique.'}</Text>
      {!editingUser && <View style={s.roleRow}>{allowedRoles.map(item => <TouchableOpacity key={item} onPress={() => setField('role', item)} style={[s.roleOption, form.role === item && s.roleSelected]}><Text style={[s.roleText, form.role === item && s.roleTextSelected]}>{roleLabels[item]}</Text></TouchableOpacity>)}</View>}
      <TouchableOpacity onPress={choosePhoto} style={s.photoPicker}>{photo ? <Image source={{ uri: photo.uri }} style={s.photoPreview} /> : editingUser?.profilePictureUrl ? <Image source={{ uri: `${API_BASE_URL}/users/admin/users/${editingUser.id}/photo`, headers: { Authorization: `Bearer ${getInMemoryAccessToken() || ''}` } }} style={s.photoPreview} /> : <View style={s.photoPlaceholder}><Ionicons name="camera-outline" size={24} color={colors.primary} /></View>}<View style={s.photoCopy}><Text style={s.photoTitle}>{photo ? 'Change selected photo' : editingUser?.profilePictureUrl ? 'Update profile photo' : 'Add profile photo'}</Text><Text style={s.photoHint}>JPG, PNG or WEBP · max 5 MB</Text></View><Ionicons name="chevron-forward" size={18} color={colors.subText} /></TouchableOpacity>
      <Text style={s.groupTitle}>ACCOUNT ACCESS</Text>
      {fieldLabel('Email address', true)}<TextInput value={form.email} onChangeText={value => setField('email', value)} placeholder="name@example.com" placeholderTextColor={colors.subText} keyboardType="email-address" autoCapitalize="none" style={s.input} />
      {!editingUser && <>{fieldLabel('Temporary password', true)}<TextInput value={form.password} onChangeText={value => setField('password', value)} placeholder="At least 8 characters" placeholderTextColor={colors.subText} secureTextEntry autoCapitalize="none" style={s.input} /> </>}
      <Text style={s.groupTitle}>PERSONAL DETAILS</Text>
      {fieldLabel('First name', true)}<TextInput value={form.firstName} onChangeText={value => setField('firstName', value)} placeholder="First name" placeholderTextColor={colors.subText} autoCapitalize="words" style={s.input} />
      {fieldLabel('Last name', true)}<TextInput value={form.lastName} onChangeText={value => setField('lastName', value)} placeholder="Last name" placeholderTextColor={colors.subText} autoCapitalize="words" style={s.input} />
      {form.role === 'STUDENT' && <><Text style={s.groupTitle}>STUDENT & ACADEMIC DETAILS</Text>
        {fieldLabel('Unique EMIS ID', true)}<TextInput value={form.emisId} onChangeText={value => setField('emisId', value)} placeholder="Enter school EMIS ID" placeholderTextColor={colors.subText} autoCapitalize="characters" style={s.input} />
        {fieldLabel('Student / admission ID')}<TextInput value={form.userId} onChangeText={value => setField('userId', value)} placeholder="Optional school ID" placeholderTextColor={colors.subText} style={s.input} />
        {fieldLabel('Class')}<Text style={s.helper}>{loadingClasses ? 'Loading school classes…' : academicClasses.length ? 'Choose an existing class.' : 'No classes available. Add one in Operations → Academic Structure.'}</Text><View style={s.choiceWrap}>{academicClasses.map(item => <TouchableOpacity key={item.id} onPress={() => setForm(current => ({ ...current, grade: item.name, section: '' }))} style={[s.choiceChip, selectedClass?.id === item.id && s.choiceChipSelected]}><Text style={[s.choiceText, selectedClass?.id === item.id && s.choiceTextSelected]}>{item.name}</Text></TouchableOpacity>)}</View>
        {fieldLabel('Section')}<Text style={s.helper}>{selectedClass ? 'Choose a section in the selected class.' : 'Select a class first.'}</Text><View style={s.choiceWrap}>{availableSections.map((item: any) => <TouchableOpacity key={item.id} onPress={() => setField('section', item.name)} style={[s.choiceChip, form.section === item.name && s.choiceChipSelected]}><Text style={[s.choiceText, form.section === item.name && s.choiceTextSelected]}>{item.name}</Text></TouchableOpacity>)}</View>
        <View style={s.fieldRow}><View style={s.halfInput}>{fieldLabel('Roll number')}<TextInput value={form.rollNo} onChangeText={value => setField('rollNo', value)} placeholder="Optional" placeholderTextColor={colors.subText} style={s.input} /></View><View style={s.halfInput}>{fieldLabel('Admission date & time')}<View style={s.fieldRow}><TextInput value={form.admissionDate} onChangeText={value => setField('admissionDate', value)} placeholder="YYYY-MM-DD" placeholderTextColor={colors.subText} style={[s.input, { flex: 1, minWidth: 0 }]} /><TextInput value={form.admissionTime} onChangeText={value => setField('admissionTime', value)} placeholder="HH:mm" placeholderTextColor={colors.subText} keyboardType="numbers-and-punctuation" style={[s.input, { width: 67, paddingHorizontal: 5 }]} /></View></View></View>
        <View style={s.fieldRow}><View style={s.halfInput}><DateSelector label="Date of birth (AD)" mode="AD" value={form.dob} onChange={value => updateBirthDate('AD', value)} colors={colors} /></View><View style={s.halfInput}><DateSelector label="Date of birth (BS)" mode="BS" value={form.dobBs} onChange={value => updateBirthDate('BS', value)} colors={colors} /></View></View>
        <View style={s.fieldRow}><View style={s.halfInput}>{fieldLabel('Phone')}<TextInput value={form.phone} onChangeText={value => setField('phone', value)} placeholder="Phone number" placeholderTextColor={colors.subText} keyboardType="phone-pad" style={s.input} /></View><View style={s.halfInput}>{fieldLabel('Gender')}<View style={s.choiceWrap}>{['Female', 'Male', 'Other'].map(value => <TouchableOpacity key={value} onPress={() => setField('gender', value)} style={[s.choiceChip, form.gender === value && s.choiceChipSelected]}><View style={[s.radioOuter, form.gender === value && s.radioOuterSelected]}>{form.gender === value && <View style={s.radioInner} />}</View><Text style={[s.choiceText, form.gender === value && s.choiceTextSelected]}>{value}</Text></TouchableOpacity>)}</View></View></View>
        {fieldLabel('Blood group')}<View style={s.choiceWrap}>{BLOOD_GROUPS.map(value => <TouchableOpacity key={value} onPress={() => setField('bloodGroup', value.replace('−', '-'))} style={[s.choiceChip, form.bloodGroup === value.replace('−', '-') && s.choiceChipSelected]}><Text style={[s.choiceText, form.bloodGroup === value.replace('−', '-') && s.choiceTextSelected]}>{value}</Text></TouchableOpacity>)}</View>
        <TextInput value={form.address} onChangeText={value => setField('address', value)} placeholder="Permanent address" placeholderTextColor={colors.subText} style={s.input} />
        <TextInput value={form.temporaryAddress} onChangeText={value => setField('temporaryAddress', value)} placeholder="Temporary address" placeholderTextColor={colors.subText} style={s.input} />
        <Text style={s.groupTitle}>PARENT / GUARDIAN</Text>{fieldLabel('At least one parent/guardian name and phone are required', true)}<Text style={s.helper}>Complete either the father or mother/guardian name and phone pair.</Text>
        <View style={s.fieldRow}><View style={s.halfInput}>{fieldLabel('Father / guardian name')}<TextInput value={form.fatherName} onChangeText={value => setField('fatherName', value)} placeholder="Name" placeholderTextColor={colors.subText} style={s.input} /></View><View style={s.halfInput}>{fieldLabel('Phone')}<TextInput value={form.fatherPhone} onChangeText={value => setField('fatherPhone', value)} placeholder="Phone" placeholderTextColor={colors.subText} keyboardType="phone-pad" style={s.input} /></View></View>
        <View style={s.fieldRow}><View style={s.halfInput}>{fieldLabel('Mother / guardian name')}<TextInput value={form.motherName} onChangeText={value => setField('motherName', value)} placeholder="Name" placeholderTextColor={colors.subText} style={s.input} /></View><View style={s.halfInput}>{fieldLabel('Phone')}<TextInput value={form.motherPhone} onChangeText={value => setField('motherPhone', value)} placeholder="Phone" placeholderTextColor={colors.subText} keyboardType="phone-pad" style={s.input} /></View></View>
      </>}
      {form.role === 'TEACHER' && <><Text style={s.groupTitle}>TEACHING DETAILS</Text><TextInput value={form.subjects} onChangeText={value => setField('subjects', value)} placeholder="Subjects (comma separated)" placeholderTextColor={colors.subText} style={s.input} /><Text style={s.helper}>Class assignments can be managed later in Operations → Academic Structure.</Text></>}
      {form.role === 'PARENT' && <><Text style={s.groupTitle}>PARENT CONTACT</Text><TextInput value={form.relationship} onChangeText={value => setField('relationship', value)} placeholder="Relationship to student (e.g. Mother)" placeholderTextColor={colors.subText} style={s.input} /><TextInput value={form.phone} onChangeText={value => setField('phone', value)} placeholder="Phone number" placeholderTextColor={colors.subText} keyboardType="phone-pad" style={s.input} /><TextInput value={form.address} onChangeText={value => setField('address', value)} placeholder="Address" placeholderTextColor={colors.subText} style={s.input} /></>}
      {form.role === 'ADMIN' && <><Text style={s.groupTitle}>ADMINISTRATIVE DETAILS</Text><TextInput value={form.department} onChangeText={value => setField('department', value)} placeholder="Department" placeholderTextColor={colors.subText} style={s.input} /></>}
    </ScrollView>}<TouchableOpacity disabled={saving || loadingAccount} onPress={create} style={[s.primaryButton, loadingAccount && { opacity: 0.5 }]}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>{editingUser ? 'Save changes' : 'Create account'}</Text>}</TouchableOpacity></View></KeyboardAvoidingView></Modal>
  </SafeAreaView>;
}

function DateSelector({ label, mode, value, onChange, colors }: { label: string; mode: 'AD' | 'BS'; value: string; onChange: (value: string) => void; colors: any }) {
  const [expanded, setExpanded] = useState(false);
  const [cursor, setCursor] = useState(() => dateParts(value, mode));
  useEffect(() => { if (!expanded) setCursor(dateParts(value, mode)); }, [value, mode, expanded]);
  const styles = dateStyles(colors);
  const months = mode === 'BS' ? MONTHS_BS : MONTHS_AD;
  const daysInMonth = mode === 'AD'
    ? new Date(cursor.year, cursor.month + 1, 0).getDate()
    : (() => { for (let day = 32; day >= 1; day--) { try { const parts = new NepaliDate(cursor.year, cursor.month, day).getBS(); if (parts.year === cursor.year && parts.month === cursor.month && parts.date === day) return day; } catch { /* invalid day for this BS month */ } } return 30; })();
  let leadingDays = 0;
  if (mode === 'AD') leadingDays = new Date(cursor.year, cursor.month, 1).getDay();
  else { try { leadingDays = new NepaliDate(cursor.year, cursor.month, 1).getDay(); } catch { leadingDays = 0; } }
  const chooseDay = (day: number) => {
    const formatted = `${String(cursor.year).padStart(4, '0')}-${String(cursor.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(formatted); setExpanded(false);
  };
  const shiftMonth = (delta: number) => {
    const date = new Date(cursor.year, cursor.month + delta, 1);
    setCursor(current => ({ ...current, year: date.getFullYear(), month: date.getMonth() }));
  };
  const shiftYear = (delta: number) => setCursor(current => ({ ...current, year: Math.max(mode === 'BS' ? 1970 : 1900, Math.min(mode === 'BS' ? 2100 : new Date().getFullYear(), current.year + delta)) }));
  return <View style={styles.wrap}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputRow}><TextInput value={value} onChangeText={onChange} placeholder={mode === 'AD' ? 'YYYY-MM-DD' : 'YYYY-MM-DD (BS)'} placeholderTextColor={colors.subText} style={styles.input} keyboardType="numbers-and-punctuation" maxLength={10} /><TouchableOpacity accessibilityLabel={`Choose ${label}`} onPress={() => setExpanded(current => !current)} style={styles.calendarButton}><Ionicons name="calendar-outline" size={18} color={colors.primary} /></TouchableOpacity></View>
    {expanded && <View style={styles.panel}>
      <View style={styles.navigation}><TouchableOpacity onPress={() => shiftYear(-1)} style={styles.navButton}><Ionicons name="play-back" size={15} color={colors.primary} /></TouchableOpacity><Text style={styles.year}>{cursor.year}</Text><TouchableOpacity onPress={() => shiftYear(1)} style={styles.navButton}><Ionicons name="play-forward" size={15} color={colors.primary} /></TouchableOpacity><View style={{ width: 8 }} /><TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.navButton}><Ionicons name="chevron-back" size={17} color={colors.text} /></TouchableOpacity><Text style={styles.month}>{months[cursor.month]}</Text><TouchableOpacity onPress={() => shiftMonth(1)} style={styles.navButton}><Ionicons name="chevron-forward" size={17} color={colors.text} /></TouchableOpacity></View>
      <View style={styles.weekdays}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <Text key={`${day}${index}`} style={styles.weekday}>{day}</Text>)}</View>
      <View style={styles.days}>{Array.from({ length: leadingDays }, (_, index) => <View key={`blank-${index}`} style={styles.day} />)}{Array.from({ length: daysInMonth }, (_, index) => { const day = index + 1; const selected = value === `${String(cursor.year).padStart(4, '0')}-${String(cursor.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; return <TouchableOpacity key={day} onPress={() => chooseDay(day)} style={[styles.day, selected && styles.daySelected]}><Text style={[styles.dayText, selected && styles.dayTextSelected]}>{day}</Text></TouchableOpacity>; })}</View>
    </View>}
  </View>;
}

const dateStyles = (c: any) => StyleSheet.create({ wrap: { marginBottom: 7 }, label: { color: c.subText, fontSize: 9, fontWeight: '800', marginBottom: 5 }, inputRow: { flexDirection: 'row', gap: 4 }, input: { flex: 1, minWidth: 0, height: 42, color: c.text, backgroundColor: c.background, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 8, fontSize: 10 }, calendarButton: { width: 39, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '12', borderRadius: 10 }, panel: { padding: 8, marginTop: 5, borderRadius: 11, backgroundColor: c.background, borderWidth: 1, borderColor: c.border }, navigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 7 }, navButton: { width: 27, height: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: c.card }, year: { color: c.primary, fontSize: 11, fontWeight: '900', minWidth: 36, textAlign: 'center' }, month: { color: c.text, fontSize: 10, fontWeight: '800', minWidth: 47, textAlign: 'center' }, weekdays: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 3 }, weekday: { width: '13%', color: c.subText, fontSize: 8, fontWeight: '800', textAlign: 'center' }, days: { flexDirection: 'row', flexWrap: 'wrap' }, day: { width: '14.28%', height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }, daySelected: { backgroundColor: c.primary }, dayText: { color: c.text, fontSize: 9, fontWeight: '700' }, dayTextSelected: { color: '#fff', fontWeight: '900' } });

const makeStyles = (c: any) => StyleSheet.create({ screen: { flex: 1, backgroundColor: c.background }, header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border }, iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, marginLeft: 8 }, eyebrow: { color: c.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, title: { color: c.text, fontSize: 22, fontWeight: '900', marginTop: 2 }, addButton: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary }, toolbar: { paddingTop: 10, backgroundColor: c.background }, search: { minHeight: 43, marginHorizontal: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 12 }, searchInput: { flex: 1, color: c.text, fontSize: 12 }, filters: { paddingHorizontal: 12, paddingVertical: 9, gap: 6 }, filter: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 15, borderWidth: 1, borderColor: c.border, backgroundColor: c.card }, filterActive: { backgroundColor: c.text, borderColor: c.text }, filterText: { color: c.subText, fontSize: 10, fontWeight: '800' }, filterTextActive: { color: c.background }, content: { padding: 12, paddingBottom: 26 }, userCard: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 9, marginBottom: 6, borderRadius: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, avatar: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontSize: 16, fontWeight: '900' }, userCopy: { flex: 1, minWidth: 0 }, userName: { color: c.text, fontSize: 12, fontWeight: '900' }, userEmail: { color: c.subText, fontSize: 9, marginTop: 2 }, metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 5 }, rolePill: { color: c.primary, backgroundColor: c.primary + '14', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontSize: 8, fontWeight: '900' }, userMeta: { flexShrink: 1, color: c.subText, fontSize: 8 }, status: { fontSize: 8, fontWeight: '800' }, moreButton: { padding: 6 }, loadMore: { minHeight: 40, alignItems: 'center', justifyContent: 'center', marginTop: 5, borderRadius: 11, backgroundColor: c.primary + '10' }, center: { alignItems: 'center', justifyContent: 'center', padding: 30, minHeight: 180, gap: 9 }, emptyTitle: { color: c.text, fontSize: 16, fontWeight: '900', textAlign: 'center' }, emptyText: { color: c.subText, fontSize: 12, lineHeight: 18, textAlign: 'center' }, link: { color: c.primary, fontSize: 12, fontWeight: '900' }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000070' }, modal: { maxHeight: '94%', backgroundColor: c.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 18 }, modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }, modalEyebrow: { color: c.primary, fontSize: 8, fontWeight: '900', letterSpacing: 1 }, modalTitle: { color: c.text, fontSize: 19, fontWeight: '900', marginTop: 2 }, modalHint: { color: c.subText, fontSize: 10, marginBottom: 10, lineHeight: 15 }, groupTitle: { color: c.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.8, marginTop: 10, marginBottom: 7 }, fieldLabel: { color: c.text, fontSize: 10, fontWeight: '800', marginBottom: 5 }, photoPicker: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, marginBottom: 5, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.background }, photoPlaceholder: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '14' }, photoPreview: { width: 42, height: 42, borderRadius: 12 }, photoCopy: { flex: 1 }, photoTitle: { color: c.text, fontSize: 10, fontWeight: '900' }, photoHint: { color: c.subText, fontSize: 9, marginTop: 3 }, fieldRow: { flexDirection: 'row', gap: 8 }, halfInput: { flex: 1, minWidth: 0 }, halfSpacer: { flex: 1 }, helper: { color: c.subText, fontSize: 9, lineHeight: 14, marginBottom: 8 }, choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }, choiceChip: { minHeight: 31, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.background }, choiceChipSelected: { backgroundColor: c.primary + '14', borderColor: c.primary }, choiceText: { color: c.subText, fontSize: 9, fontWeight: '800' }, choiceTextSelected: { color: c.primary }, radioOuter: { width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: c.subText }, radioOuterSelected: { borderColor: c.primary }, radioInner: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.primary }, roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 7 }, roleOption: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, borderWidth: 1, borderColor: c.border }, roleSelected: { backgroundColor: c.primary + '14', borderColor: c.primary }, roleText: { color: c.subText, fontSize: 10, fontWeight: '800' }, roleTextSelected: { color: c.primary }, input: { minHeight: 42, color: c.text, backgroundColor: c.background, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 10, marginBottom: 7, fontSize: 11 }, primaryButton: { minHeight: 45, paddingHorizontal: 18, borderRadius: 11, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginTop: 8 }, primaryText: { color: '#fff', fontSize: 12, fontWeight: '900' } });

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import NepaliDate from 'nepali-date-converter';
import * as DocumentPicker from 'expo-document-picker';
import { API_BASE_URL, api } from '../../../core/networking/api';
import { getInMemoryAccessToken } from '../../../core/networking/session';
import { useTheme } from '../../../core/theme/ThemeContext';

type ManagedUser = { id: string; email: string; role: string; status: string; profilePictureUrl?: string | null; studentProfile?: any; teacherProfile?: any; adminProfile?: any };
type PersonForm = { email: string; password: string; confirmPassword: string; firstName: string; lastName: string; role: string; grade: string; section: string; rollNo: string; department: string; emisId: string; userId: string; dob: string; dobBs: string; admissionDateTime: string; gender: string; bloodGroup: string; phone: string; address: string; temporaryAddress: string; fatherName: string; fatherPhone: string; motherName: string; motherPhone: string };
const localAdmissionDateTime = (date = new Date()) => {
  const hour = date.getHours(); const suffix = hour >= 12 ? 'pm' : 'am';
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${hour % 12 || 12}:${String(date.getMinutes()).padStart(2, '0')}${suffix}`;
};
const localDateOnly = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseAdmissionDateTime = (value: string) => {
  const match = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) return null;
  const hour12 = Number(match[4]); const minute = Number(match[5]);
  if (hour12 < 1 || hour12 > 12 || minute > 59) return null;
  let hour = hour12 % 12; if (match[6].toLowerCase() === 'pm') hour += 12;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), hour, minute);
  if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3]) || date.getHours() !== hour || date.getMinutes() !== minute) return null;
  return date.toISOString();
};
const emptyForm = (role = 'STUDENT'): PersonForm => ({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', role, grade: '', section: '', rollNo: '', department: '', emisId: '', userId: '', dob: '', dobBs: '', admissionDateTime: localAdmissionDateTime(), gender: '', bloodGroup: '', phone: '', address: '', temporaryAddress: '', fatherName: '', fatherPhone: '', motherName: '', motherPhone: '' });
const BS_MONTHS = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
const AD_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const classSortValue = (name: string) => {
  const key = name.trim().toLowerCase().replace(/^(class|grade|standard)\s*/i, '').replace(/\s+/g, ' ');
  const preschool: Record<string, number> = { playgroup: -3, 'play group': -3, 'pre-nursery': -2, 'pre nursery': -2, nursery: -1, lkg: 0, 'lower kg': 0, 'lower kindergarten': 0, ukg: 0.5, 'upper kg': 0.5, 'upper kindergarten': 0.5, kindergarten: 0.5, kg: 0.5 };
  if (key in preschool) return preschool[key];
  const match = key.match(/\d+/); return match ? Number(match[0]) : 1000;
};
const orderClasses = (items: any[]) => [...items].sort((a, b) => classSortValue(String(a.name || '') ) - classSortValue(String(b.name || '')) || String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' }));
const roleLabels: Record<string, string> = { ADMIN: 'Admin', TEACHER: 'Teacher', STUDENT: 'Student', PARENT: 'Parent' };

const displayName = (user: ManagedUser) => {
  const profile = user.studentProfile || user.teacherProfile || user.adminProfile;
  return [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || user.email;
};

export default function StaffManagementScreen({ navigation }: any) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [role, setRole] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PersonForm>(() => emptyForm());
  const [classes, setClasses] = useState<any[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [dropdown, setDropdown] = useState<{ key: keyof PersonForm; title: string; options: string[] } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<any>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true); setError('');
    try {
      const { data } = await api.get('/users/admin/users', { params: { role: filter === 'ALL' ? undefined : filter, q: query.trim() || undefined } });
      setUsers(Array.isArray(data) ? data : []);
    } catch (e: any) { setError(e.response?.data?.message || 'Could not load the user directory.'); setUsers([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter, query]);

  useEffect(() => { SecureStore.getItemAsync('user_data').then(raw => setRole(raw ? JSON.parse(raw).role || '' : '')).catch(() => undefined); }, []);
  useEffect(() => { if (role === 'ADMIN' || role === 'SUPER_ADMIN') load(); }, [role, load]);

  const allowedRoles = useMemo(() => role === 'SUPER_ADMIN' ? ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] : ['TEACHER', 'STUDENT', 'PARENT'], [role]);
  const setField = (key: keyof PersonForm, value: string) => setForm(current => ({ ...current, [key]: value }));
  const updateBirthDate = (mode: 'AD' | 'BS', value: string) => {
    setField(mode === 'AD' ? 'dob' : 'dobBs', value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    try {
      if (mode === 'AD') {
        const ad = new Date(`${value}T00:00:00`);
        if (localDateOnly(ad) === value) setField('dobBs', new NepaliDate(ad).format('YYYY-MM-DD'));
      } else {
        const nepali = new NepaliDate(value); const parts = nepali.getBS();
        if (parts.year === Number(value.slice(0, 4)) && parts.month + 1 === Number(value.slice(5, 7)) && parts.date === Number(value.slice(8, 10))) setField('dob', localDateOnly(nepali.toJsDate()));
      }
    } catch { /* Keep invalid typed input for save-time validation. */ }
  };
  const selectedClass = classes.find(item => String(item.name).trim().toLowerCase() === form.grade.trim().toLowerCase());
  const sectionOptions = (selectedClass?.sections || []).map((section: any) => String(section.name));
  const loadClasses = async () => {
    setClassesLoading(true);
    try {
      const response = await api.get('/academics/structure');
      const structure = response.data?.data || response.data?.structure || response.data;
      const fetched = Array.isArray(structure?.classes) ? structure.classes : [];
      const flatSections = Array.isArray(structure?.sections) ? structure.sections : [];
      const normalized = fetched.map((item: any) => ({ ...item, sections: Array.isArray(item.sections) ? item.sections : flatSections.filter((section: any) => section.classId === item.id) }));
      const ordered = orderClasses(normalized); setClasses(ordered); return ordered;
    } catch { setClasses([]); return []; }
    finally { setClassesLoading(false); }
  };
  const openDropdown = async (key: keyof PersonForm, title: string, staticOptions: string[]) => {
    let options = staticOptions;
    if (key === 'grade' || key === 'section') {
      let available = classes;
      if (!available.length) available = await loadClasses();
      if (key === 'grade') options = available.map(item => String(item.name)).filter(Boolean);
      else {
        let parent = available.find(item => String(item.name).trim().toLowerCase() === form.grade.trim().toLowerCase());
        if (form.grade && !(parent?.sections || []).length) {
          available = await loadClasses();
          parent = available.find(item => String(item.name).trim().toLowerCase() === form.grade.trim().toLowerCase());
        }
        options = (parent?.sections || []).map((section: any) => String(section.name)).filter(Boolean);
      }
    }
    setDropdown({ key, title, options });
  };
  const dropdownField = (key: keyof PersonForm, title: string, options: string[], placeholder: string, required = false) => <View style={s.fieldGroup} key={key}><Text style={s.fieldLabel}>{title}{required && <Text style={s.required}> *</Text>}</Text><TouchableOpacity onPress={() => void openDropdown(key, title, options)} style={s.dropdownField}><Text numberOfLines={1} style={[s.dropdownValue, !form[key] && s.dropdownPlaceholder]}>{key === 'grade' && classesLoading ? 'Loading classes…' : form[key] || placeholder}</Text><Ionicons name="chevron-down" size={18} color={colors.subText} /></TouchableOpacity></View>;
  const openCreate = () => { setEditingUser(null); setProfilePhoto(null); setForm(emptyForm(allowedRoles.includes('STUDENT') ? 'STUDENT' : allowedRoles[0])); setShowPassword(false); setShowConfirmPassword(false); setModal(true); void loadClasses(); };
  const openEdit = async (user: ManagedUser) => {
    setEditingUser(user); setProfilePhoto(null); setShowPassword(false); setShowConfirmPassword(false); setModal(true);
    try {
      const { data } = await api.get(`/users/admin/users/${user.id}`);
      setEditingUser({ ...user, ...data });
      const profile = data.studentProfile || data.teacherProfile || data.adminProfile || {};
      const date = profile.admissionDate ? new Date(profile.admissionDate) : new Date();
      setForm({ ...emptyForm(data.role), email: data.email || user.email, firstName: profile.firstName || '', lastName: profile.lastName || '', grade: profile.grade || '', section: profile.section || '', rollNo: profile.rollNo || '', department: profile.department || '', emisId: data.emisId || '', userId: data.userId || '', dob: profile.dob ? new Date(profile.dob).toISOString().slice(0, 10) : '', dobBs: profile.dobBs || '', admissionDateTime: localAdmissionDateTime(date), gender: profile.gender || '', bloodGroup: profile.bloodGroup || '', phone: profile.phone || '', address: profile.address || '', temporaryAddress: profile.temporaryAddress || '', fatherName: profile.fatherName || '', fatherPhone: profile.fatherPhone || '', motherName: profile.motherName || '', motherPhone: profile.motherPhone || '' });
      if (data.role === 'STUDENT') void loadClasses();
    } catch (e: any) { setModal(false); setEditingUser(null); Alert.alert('Could not load account', e.response?.data?.message || 'Please try again.'); }
  };
  const chooseProfilePhoto = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'image/webp'], copyToCacheDirectory: true });
    if (!picked.canceled && picked.assets?.[0]) {
      const file = picked.assets[0];
      if ((file.size || 0) > 1 * 1024 * 1024) return Alert.alert('Photo too large', 'Choose an image smaller than 1 MB.');
      setProfilePhoto(file);
    }
  };
  const uploadProfilePhoto = async (userId: string) => {
    if (!profilePhoto) return;
    const { uploadFile } = await import('../../../core/networking/api');
    await uploadFile(profilePhoto.uri, profilePhoto.mimeType || 'image/jpeg', `/users/admin/users/${userId}/photo`);
  };
  const create = async () => {
    if (!form.email.trim() || !form.firstName.trim() || !form.lastName.trim() || (!editingUser && form.password.length < 8)) { Alert.alert('Complete the form', 'Email and full name are required. New accounts need a password of at least 8 characters.'); return; }
    if (editingUser && form.password && form.password.length < 8) { Alert.alert('Password too short', 'The new password must be at least 8 characters.'); return; }
    if ((!editingUser || form.password) && form.password !== form.confirmPassword) { Alert.alert('Passwords do not match', 'Re-enter the same password in both password fields.'); return; }
    if (form.role === 'STUDENT' && !form.emisId.trim()) { Alert.alert('EMIS ID required', 'Every student needs a unique EMIS ID.'); return; }
    if (form.role === 'STUDENT') {
      const fatherName = form.fatherName.trim(); const fatherPhone = form.fatherPhone.trim(); const motherName = form.motherName.trim(); const motherPhone = form.motherPhone.trim();
      if (Boolean(fatherName) !== Boolean(fatherPhone) || Boolean(motherName) !== Boolean(motherPhone) || !((fatherName && fatherPhone) || (motherName && motherPhone))) { Alert.alert('Parent / guardian required', 'Enter both the name and phone number for at least one parent or guardian.'); return; }
      if (!parseAdmissionDateTime(form.admissionDateTime)) { Alert.alert('Admission date and time', 'Use the format YYYY-M-D h:mmam/pm, for example 2026-1-9 10:56pm.'); return; }
    }
    if (form.dob && !/^\d{4}-\d{2}-\d{2}$/.test(form.dob)) { Alert.alert('Date of birth', 'Enter the AD date as YYYY-MM-DD.'); return; }
    if (form.phone) { const match = form.phone.match(/^(\+\d{1,4})?(.*)$/); const number = match ? match[2] : form.phone; if (number.length > 0 && number.length < 10) { Alert.alert('Invalid phone', 'Phone number must be exactly 10 digits.'); return; } }
    setSaving(true);
    try {
      const studentData = form.role === 'STUDENT' ? { emisId: form.emisId.trim(), userId: form.userId.trim() || undefined, grade: form.grade || undefined, section: form.section || undefined, rollNo: form.rollNo.trim() || undefined, dob: form.dob || undefined, dobBs: form.dobBs.trim() || undefined, admissionDate: parseAdmissionDateTime(form.admissionDateTime) || undefined, gender: form.gender || undefined, bloodGroup: form.bloodGroup || undefined, address: form.address.trim() || undefined, temporaryAddress: form.temporaryAddress.trim() || undefined, fatherName: form.fatherName.trim() || undefined, fatherPhone: form.fatherPhone.trim() || undefined, motherName: form.motherName.trim() || undefined, motherPhone: form.motherPhone.trim() || undefined } : {};
      const common = { email: form.email.trim().toLowerCase(), firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone.trim() || undefined, ...studentData };
      let savedUser: any = editingUser;
      if (editingUser) await api.patch(`/users/admin/users/${editingUser.id}`, { ...common, section: form.section || undefined, department: form.department.trim() || undefined, password: form.password || undefined });
      else { const response = await api.post('/users/admin/create-user', { role: form.role, password: form.password, ...common, department: form.department.trim() || undefined }); savedUser = response.data; }
      if (profilePhoto && savedUser?.id) {
        try { await uploadProfilePhoto(savedUser.id); }
        catch (photoError: any) { Alert.alert('Account saved; photo upload failed', photoError.response?.data?.message || photoError.message || 'Edit this account and try uploading its photo again.'); }
      }
      setModal(false); setEditingUser(null); setForm(emptyForm(allowedRoles.includes('STUDENT') ? 'STUDENT' : allowedRoles[0])); await load(true);
    }
    catch (e: any) { Alert.alert(editingUser ? 'Could not update user' : 'Could not create user', Array.isArray(e.response?.data?.message) ? e.response.data.message.join('\n') : e.response?.data?.message || 'Check the details and try again.'); }
    finally { setSaving(false); }
  };
  const changeStatus = (user: ManagedUser) => Alert.alert(user.status === 'ACTIVE' ? 'Disable account?' : 'Restore account?', `${displayName(user)} will ${user.status === 'ACTIVE' ? 'no longer be able to sign in' : 'be able to sign in again'}.`, [{ text: 'Cancel', style: 'cancel' }, { text: user.status === 'ACTIVE' ? 'Disable' : 'Restore', style: user.status === 'ACTIVE' ? 'destructive' : 'default', onPress: async () => { try { await api.post(`/users/admin/users/${user.id}/${user.status === 'ACTIVE' ? 'disable' : 'restore'}`); await load(true); } catch (e: any) { Alert.alert('Action failed', e.response?.data?.message || 'Please try again.'); } } }]);

  if (role && role !== 'ADMIN' && role !== 'SUPER_ADMIN') return <SafeAreaView style={s.screen}><View style={s.center}><Ionicons name="lock-closed-outline" size={38} color={colors.subText} /><Text style={s.emptyTitle}>Management access is restricted</Text><Text style={s.emptyText}>Only school administrators can manage accounts.</Text><TouchableOpacity onPress={() => navigation.goBack()} style={s.primaryButton}><Text style={s.primaryText}>Go back</Text></TouchableOpacity></View></SafeAreaView>;
  return <SafeAreaView style={s.screen}>
    <View style={s.header}><TouchableOpacity onPress={() => navigation.goBack()} style={s.iconButton}><Ionicons name="chevron-back" size={23} color={colors.text} /></TouchableOpacity><View style={s.headerCopy}><Text style={s.eyebrow}>SCHOOL ADMINISTRATION</Text><Text style={s.title}>People</Text></View><TouchableOpacity accessibilityLabel="Create user" onPress={openCreate} style={s.addButton}><Ionicons name="add" size={21} color="#fff" /></TouchableOpacity></View>
    <View style={s.toolbar}><View style={s.search}><Ionicons name="search-outline" size={18} color={colors.subText} /><TextInput value={query} onChangeText={setQuery} onSubmitEditing={() => load()} placeholder="Search email" placeholderTextColor={colors.subText} style={s.searchInput} /></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{['ALL', ...allowedRoles].map(item => <TouchableOpacity key={item} onPress={() => setFilter(item)} style={[s.filter, filter === item && s.filterActive]}><Text style={[s.filterText, filter === item && s.filterTextActive]}>{item === 'ALL' ? 'All' : roleLabels[item]}</Text></TouchableOpacity>)}</ScrollView></View>
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}>
      {loading ? <View style={s.center}><ActivityIndicator color={colors.primary} /><Text style={s.emptyText}>Loading people…</Text></View> : error ? <View style={s.center}><Ionicons name="cloud-offline-outline" size={32} color={colors.subText} /><Text style={s.emptyText}>{error}</Text><TouchableOpacity onPress={() => load()}><Text style={s.link}>Try again</Text></TouchableOpacity></View> : users.length === 0 ? <View style={s.center}><Ionicons name="people-outline" size={36} color={colors.subText} /><Text style={s.emptyTitle}>No users found</Text><Text style={s.emptyText}>Try another filter or create a new account.</Text></View> : users.map(user => <TouchableOpacity activeOpacity={0.85} onPress={() => openEdit(user)} key={user.id} style={s.userCard}><View style={[s.avatar, { backgroundColor: user.status === 'ACTIVE' ? colors.primary + '18' : colors.danger + '18' }]}><Text style={[s.avatarText, { color: user.status === 'ACTIVE' ? colors.primary : colors.danger }]}>{displayName(user).slice(0, 1).toUpperCase()}</Text></View><View style={s.userCopy}><Text numberOfLines={1} style={s.userName}>{displayName(user)}</Text><Text numberOfLines={1} style={s.userEmail}>{user.email}</Text><View style={s.metaRow}><Text style={s.rolePill}>{roleLabels[user.role] || user.role}</Text><Text style={[s.status, { color: user.status === 'ACTIVE' ? colors.success : colors.danger }]}>{user.status === 'ACTIVE' ? 'Active' : 'Disabled'}</Text></View></View><TouchableOpacity accessibilityLabel={`${user.status === 'ACTIVE' ? 'Disable' : 'Restore'} ${displayName(user)}`} onPress={() => changeStatus(user)} style={s.moreButton}><Ionicons name={user.status === 'ACTIVE' ? 'pause-circle-outline' : 'play-circle-outline'} size={22} color={user.status === 'ACTIVE' ? colors.danger : colors.success} /></TouchableOpacity></TouchableOpacity>)}
    </ScrollView>
    <Modal visible={modal} transparent animationType="slide" onRequestClose={() => { setModal(false); setEditingUser(null); }}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}><View style={s.modal}><View style={s.modalHead}><View><Text style={s.eyebrow}>SCHOOL ACCOUNT</Text><Text style={s.modalTitle}>{editingUser ? 'Edit account' : 'Create account'}</Text></View><TouchableOpacity onPress={() => { setModal(false); setEditingUser(null); }}><Ionicons name="close-circle" size={25} color={colors.subText} /></TouchableOpacity></View><ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={s.modalHint}>{editingUser ? 'Update identity and student details.' : 'Fields marked * are required.'}</Text>
      {editingUser?.profilePictureUrl && <Image source={{ uri: `${API_BASE_URL}${editingUser.profilePictureUrl}?v=${Date.now()}`, headers: { Authorization: `Bearer ${getInMemoryAccessToken() || ''}` } }} style={{ width: 64, height: 64, borderRadius: 20, marginBottom: 10, backgroundColor: colors.border }} />}
      <TouchableOpacity onPress={chooseProfilePhoto} style={{ minHeight: 60, padding: 12, marginBottom: 12, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, flexDirection: 'row', alignItems: 'center', gap: 11 }}><Ionicons name="camera-outline" size={22} color={colors.primary} /><View style={{ flex: 1 }}><Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>{profilePhoto ? profilePhoto.name : 'Add profile photo'}</Text><Text style={s.helper}>JPG, PNG or WEBP · up to 5 MB</Text></View><Text style={{ color: colors.primary, fontSize: 11, fontWeight: '900' }}>{profilePhoto ? 'Change' : 'Choose'}</Text></TouchableOpacity>
      {!editingUser && <View style={s.roleRow}>{allowedRoles.map(item => <TouchableOpacity key={item} onPress={() => setField('role', item)} style={[s.roleOption, form.role === item && s.roleSelected]}><Text style={[s.roleText, form.role === item && s.roleTextSelected]}>{roleLabels[item]}</Text></TouchableOpacity>)}</View>}
      <Text style={s.groupTitle}>ACCOUNT</Text><Text style={s.fieldLabel}>Email address<Text style={s.required}> *</Text></Text><TextInput value={form.email} onChangeText={value => setField('email', value)} placeholder="name@example.com" placeholderTextColor={colors.subText} keyboardType="email-address" autoCapitalize="none" style={s.input} />
      <Text style={s.fieldLabel}>{editingUser ? 'New password (leave blank to keep current)' : 'Temporary password'}<Text style={s.required}>{!editingUser && ' *'}</Text></Text><View style={s.passwordRow}><TextInput value={form.password} onChangeText={value => setField('password', value)} placeholder="At least 8 characters" placeholderTextColor={colors.subText} secureTextEntry={!showPassword} autoCapitalize="none" style={[s.input, s.passwordInput]} /><TouchableOpacity accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword(value => !value)} style={s.eyeButton}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color={colors.subText} /></TouchableOpacity></View>
      <Text style={s.fieldLabel}>Confirm password<Text style={s.required}>{!editingUser && ' *'}</Text></Text><View style={s.passwordRow}><TextInput value={form.confirmPassword} onChangeText={value => setField('confirmPassword', value)} placeholder="Re-enter password" placeholderTextColor={colors.subText} secureTextEntry={!showConfirmPassword} autoCapitalize="none" style={[s.input, s.passwordInput]} /><TouchableOpacity accessibilityLabel={showConfirmPassword ? 'Hide confirmation' : 'Show confirmation'} onPress={() => setShowConfirmPassword(value => !value)} style={s.eyeButton}><Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color={colors.subText} /></TouchableOpacity></View>
      <Text style={s.groupTitle}>PERSONAL DETAILS</Text>{[['firstName', 'First name'], ['lastName', 'Last name']].map(([key, label]) => <View key={key} style={s.fieldGroup}><Text style={s.fieldLabel}>{label}<Text style={s.required}> *</Text></Text><TextInput value={form[key as keyof PersonForm]} onChangeText={value => setField(key as keyof PersonForm, value)} placeholder={label} placeholderTextColor={colors.subText} autoCapitalize="words" style={s.input} /></View>)}
      <View style={s.fieldGroup}><Text style={s.fieldLabel}>Phone</Text><PhoneInputField value={form.phone} onChange={value => setField('phone', value)} colors={colors} /></View>
      {form.role === 'STUDENT' && <><Text style={s.groupTitle}>STUDENT DETAILS</Text>
        <View style={s.fieldGroup}><Text style={s.fieldLabel}>EMIS ID<Text style={s.required}> *</Text></Text><TextInput value={form.emisId} onChangeText={value => setField('emisId', value)} placeholder="Unique student EMIS ID" placeholderTextColor={colors.subText} autoCapitalize="characters" style={s.input} /></View>
        <View style={s.fieldGroup}><Text style={s.fieldLabel}>Student / admission ID</Text><TextInput value={form.userId} onChangeText={value => setField('userId', value)} placeholder="Optional school ID" placeholderTextColor={colors.subText} autoCapitalize="characters" style={s.input} /></View>
        {dropdownField('grade', 'Class', classes.map(item => String(item.name)), 'Choose existing class')}
        {dropdownField('section', 'Section', sectionOptions, selectedClass ? 'Choose section' : 'Select a class first')}
        <View style={s.fieldGroup}><Text style={s.fieldLabel}>Roll number</Text><TextInput value={form.rollNo} onChangeText={value => setField('rollNo', value)} placeholder="Optional" placeholderTextColor={colors.subText} style={s.input} /></View>
        <DateWheelField label="Date of birth (AD)" mode="AD" value={form.dob} onChange={value => updateBirthDate('AD', value)} colors={colors} />
        <DateWheelField label="Date of birth (BS)" mode="BS" value={form.dobBs} onChange={value => updateBirthDate('BS', value)} colors={colors} />
        <View style={s.fieldGroup}><Text style={s.fieldLabel}>Admission date and time</Text><TextInput value={form.admissionDateTime} onChangeText={value => setField('admissionDateTime', value)} placeholder="2026-1-9 10:56pm" placeholderTextColor={colors.subText} autoCapitalize="none" style={s.input} /><Text style={s.helper}>Defaults to now. Format: YYYY-M-D h:mmam/pm.</Text></View>
        {dropdownField('gender', 'Gender', ['Female', 'Male', 'Other', 'Prefer not to say'], 'Choose gender')}
        {dropdownField('bloodGroup', 'Blood group', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], 'Choose blood group')}
        <View style={s.fieldGroup}><Text style={s.fieldLabel}>Permanent address</Text><TextInput value={form.address} onChangeText={value => setField('address', value)} placeholder="Permanent address" placeholderTextColor={colors.subText} style={s.input} /></View>
        <View style={s.addressHeader}><Text style={s.fieldLabel}>Temporary address</Text><TouchableOpacity disabled={!form.address.trim()} onPress={() => setField('temporaryAddress', form.address)} style={[s.copyButton, !form.address.trim() && { opacity: 0.45 }]}><Ionicons name="copy-outline" size={14} color={colors.primary} /><Text style={s.copyText}>Same as permanent</Text></TouchableOpacity></View><TextInput value={form.temporaryAddress} onChangeText={value => setField('temporaryAddress', value)} placeholder="Temporary address" placeholderTextColor={colors.subText} style={s.input} />
        <Text style={s.groupTitle}>PARENT / GUARDIAN<Text style={s.required}> *</Text></Text><Text style={s.helper}>At least one parent/guardian name and phone number are required.</Text>
        <View style={s.fieldRow}><View style={s.fieldHalf}><Text style={s.fieldLabel}>Father / guardian name</Text><TextInput value={form.fatherName} onChangeText={value => setField('fatherName', value)} placeholder="Name" placeholderTextColor={colors.subText} style={s.input} /></View><View style={s.fieldHalf}><Text style={s.fieldLabel}>Phone</Text><TextInput value={form.fatherPhone} onChangeText={value => setField('fatherPhone', value)} placeholder="Phone" placeholderTextColor={colors.subText} keyboardType="phone-pad" style={s.input} /></View></View>
        <View style={s.fieldRow}><View style={s.fieldHalf}><Text style={s.fieldLabel}>Mother / guardian name</Text><TextInput value={form.motherName} onChangeText={value => setField('motherName', value)} placeholder="Name" placeholderTextColor={colors.subText} style={s.input} /></View><View style={s.fieldHalf}><Text style={s.fieldLabel}>Phone</Text><TextInput value={form.motherPhone} onChangeText={value => setField('motherPhone', value)} placeholder="Phone" placeholderTextColor={colors.subText} keyboardType="phone-pad" style={s.input} /></View></View>
      </>}
      {(form.role === 'ADMIN' || form.role === 'SUPER_ADMIN') && <View style={s.fieldGroup}><Text style={s.fieldLabel}>Department</Text><TextInput value={form.department} onChangeText={value => setField('department', value)} placeholder="Department" placeholderTextColor={colors.subText} style={s.input} /></View>}
      <TouchableOpacity disabled={saving} onPress={create} style={s.primaryButton}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>{editingUser ? 'Save changes' : 'Create account'}</Text>}</TouchableOpacity>
    </ScrollView></View></KeyboardAvoidingView></Modal>
    <Modal visible={!!dropdown} transparent animationType="fade" onRequestClose={() => setDropdown(null)}><View style={s.dropdownOverlay}><View style={s.dropdownSheet}><View style={s.modalHead}><Text style={s.modalTitle}>{dropdown?.title}</Text><TouchableOpacity onPress={() => setDropdown(null)}><Ionicons name="close-circle" size={24} color={colors.subText} /></TouchableOpacity></View><ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: '70%' }}>{dropdown?.options.map(option => <TouchableOpacity key={option} onPress={() => { if (dropdown.key === 'grade') setForm(current => ({ ...current, grade: option, section: '' })); else setField(dropdown.key, option); setDropdown(null); }} style={s.dropdownOption}><Text style={s.dropdownOptionText}>{option}</Text>{form[dropdown.key] === option && <Ionicons name="checkmark-circle" size={19} color={colors.primary} />}</TouchableOpacity>)}{!dropdown?.options.length && <Text style={s.emptyText}>{dropdown?.key === 'section' ? `No sections were returned for ${form.grade || 'this class'}. Refresh Academic Structure or check that this class has sections assigned.` : 'No options are available. Add them in Academic Structure.'}</Text>}</ScrollView></View></View></Modal>
  </SafeAreaView>;
}

const COUNTRY_CODES = [
  { code: '+977', name: 'Nepal' },
  { code: '+91', name: 'India' },
  { code: '+1', name: 'USA/Canada' },
  { code: '+44', name: 'UK' },
  { code: '+61', name: 'Australia' },
  { code: '+81', name: 'Japan' },
  { code: '+86', name: 'China' },
  { code: '+971', name: 'UAE' },
];

function PhoneInputField({ value, onChange, colors }: { value: string; onChange: (v: string) => void; colors: any }) {
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  
  const matchedCode = COUNTRY_CODES.find(c => value.startsWith(c.code))?.code || '+977';
  const countryCode = matchedCode;
  const number = value.startsWith(matchedCode) ? value.substring(matchedCode.length) : value;

  const filtered = COUNTRY_CODES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search));
  
  const s = StyleSheet.create({
    container: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    pickerBtn: { height: 47, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 11, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 },
    pickerText: { color: colors.text, fontSize: 13, fontWeight: '700' },
    input: { flex: 1, height: 47, color: colors.text, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 11, paddingHorizontal: 12, fontSize: 13 },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000070' },
    modalContent: { maxHeight: '70%', padding: 20, backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
    searchInput: { height: 44, color: colors.text, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 11, paddingHorizontal: 12, marginBottom: 15 },
    option: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' },
    optionText: { color: colors.text, fontSize: 14 },
    optionCode: { color: colors.subText, fontSize: 14, fontWeight: 'bold' }
  });

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.pickerBtn} onPress={() => { setSearch(''); setModal(true); }}>
        <Text style={s.pickerText}>{countryCode}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.subText} />
      </TouchableOpacity>
      <TextInput 
        value={number} 
        onChangeText={n => {
          const num = n.replace(/[^0-9]/g, '');
          if (num.length <= 10) onChange(countryCode + num);
        }} 
        placeholder="10-digit number" 
        placeholderTextColor={colors.subText} 
        keyboardType="phone-pad" 
        style={s.input} 
      />
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Country Code</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Ionicons name="close-circle" size={24} color={colors.subText} />
              </TouchableOpacity>
            </View>
            <TextInput value={search} onChangeText={setSearch} placeholder="Search country or code..." placeholderTextColor={colors.subText} style={s.searchInput} />
            <ScrollView keyboardShouldPersistTaps="handled">
              {filtered.map(c => (
                <TouchableOpacity key={c.code} style={s.option} onPress={() => { onChange(c.code + number); setModal(false); }}>
                  <Text style={s.optionText}>{c.name}</Text>
                  <Text style={s.optionCode}>{c.code}</Text>
                </TouchableOpacity>
              ))}
              {!filtered.length && <Text style={{color: colors.subText, textAlign: 'center', marginTop: 10}}>No results found</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DateWheelField({ label, mode, value, onChange, colors }: { label: string; mode: 'AD' | 'BS'; value: string; onChange: (value: string) => void; colors: any }) {
  const [expanded, setExpanded] = useState(false);
  const now = mode === 'BS' ? new NepaliDate() : new Date();
  const parts = (input: string) => {
    const found = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (found) {
      const year = Number(found[1]); const month = Number(found[2]) - 1; const day = Number(found[3]);
      if (month >= 0 && month < 12 && day >= 1 && (mode === 'AD' ? new Date(year, month + 1, 0).getDate() >= day : (() => { try { const d = new NepaliDate(year, month, day).getBS(); return d.year === year && d.month === month && d.date === day; } catch { return false; } })())) return { year, month, day };
    }
    return mode === 'BS' ? { year: (now as NepaliDate).getYear(), month: (now as NepaliDate).getMonth(), day: (now as NepaliDate).getDate() } : { year: (now as Date).getFullYear(), month: (now as Date).getMonth(), day: (now as Date).getDate() };
  };
  const [selected, setSelected] = useState(() => parts(value));
  const [yearText, setYearText] = useState(() => String(parts(value).year));
  useEffect(() => { if (!expanded) { const next = parts(value); setSelected(next); setYearText(String(next.year)); } }, [value, expanded]);
  const months = mode === 'BS' ? BS_MONTHS : AD_MONTHS;
  const monthLength = (year: number, month: number) => {
    if (mode === 'AD') return new Date(year, month + 1, 0).getDate();
    for (let day = 32; day >= 1; day--) {
      try { const date = new NepaliDate(year, month, day).getBS(); if (date.year === year && date.month === month && date.date === day) return day; }
      catch { /* Out-of-range BS date */ }
    }
    return 30;
  };
  const commit = (year: number, month: number, day: number) => {
    const dayValue = Math.min(day, monthLength(year, month));
    setSelected({ year, month, day: dayValue });
    setYearText(String(year));
    onChange(`${String(year).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}-${String(dayValue).padStart(2, '0')}`);
  };
  const moveYear = (delta: number) => {
    const maxYear = mode === 'BS' ? new NepaliDate().getYear() : new Date().getFullYear();
    commit(Math.max(mode === 'BS' ? 1970 : 1900, Math.min(maxYear, selected.year + delta)), selected.month, selected.day);
  };
  const styles = dateWheelStyles(colors);
  return <View style={styles.group}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.entryRow}><TextInput value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" placeholderTextColor={colors.subText} style={styles.input} keyboardType="numbers-and-punctuation" maxLength={10} /><TouchableOpacity accessibilityLabel={`Open ${label} calendar`} onPress={() => setExpanded(current => !current)} style={styles.calendarButton}><Ionicons name={expanded ? 'close' : 'calendar-outline'} size={18} color={colors.primary} /></TouchableOpacity></View>
    {expanded && <View style={styles.picker}>
      <View style={styles.yearRow}><Text style={styles.pickerCaption}>YEAR</Text><View style={styles.yearControls}><TouchableOpacity onPress={() => moveYear(-1)} style={styles.arrow}><Ionicons name="chevron-back" size={18} color={colors.primary} /></TouchableOpacity><TextInput value={yearText} onChangeText={text => { setYearText(text); if (/^\d{4}$/.test(text)) { const maxYear = mode === 'BS' ? new NepaliDate().getYear() : new Date().getFullYear(); const year = Number(text); if (year >= (mode === 'BS' ? 1970 : 1900) && year <= maxYear) commit(year, selected.month, selected.day); } }} keyboardType="number-pad" maxLength={4} style={styles.yearInput} /><TouchableOpacity onPress={() => moveYear(1)} style={styles.arrow}><Ionicons name="chevron-forward" size={18} color={colors.primary} /></TouchableOpacity></View></View>
      <Text style={styles.pickerCaption}>MONTH · SLIDE TO CHOOSE</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slider}>{months.map((month, index) => <TouchableOpacity key={month} onPress={() => commit(selected.year, index, selected.day)} style={[styles.option, selected.month === index && styles.optionActive]}><Text style={[styles.optionText, selected.month === index && styles.optionTextActive]}>{month}</Text></TouchableOpacity>)}</ScrollView>
      <Text style={styles.pickerCaption}>DAY · SLIDE TO CHOOSE</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slider}>{Array.from({ length: monthLength(selected.year, selected.month) }, (_, index) => index + 1).map(day => <TouchableOpacity key={day} onPress={() => commit(selected.year, selected.month, day)} style={[styles.dayOption, selected.day === day && styles.optionActive]}><Text style={[styles.optionText, selected.day === day && styles.optionTextActive]}>{day}</Text></TouchableOpacity>)}</ScrollView>
    </View>}
  </View>;
}

const dateWheelStyles = (c: any) => StyleSheet.create({ group: { marginBottom: 10 }, label: { color: c.text, fontSize: 11, fontWeight: '800', marginBottom: 5 }, entryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, input: { flex: 1, height: 47, color: c.text, backgroundColor: c.background, borderWidth: 1, borderColor: c.border, borderRadius: 11, paddingHorizontal: 12, fontSize: 13 }, calendarButton: { width: 44, height: 47, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: c.primary + '12' }, picker: { padding: 10, marginTop: 7, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.background }, yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, pickerCaption: { color: c.subText, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginBottom: 6 }, yearControls: { flexDirection: 'row', alignItems: 'center', gap: 9 }, arrow: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card }, yearInput: { minWidth: 64, height: 32, borderRadius: 8, borderWidth: 1, borderColor: c.border, color: c.text, textAlign: 'center', fontSize: 13, fontWeight: '900' }, slider: { gap: 6, paddingBottom: 10 }, option: { minHeight: 32, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, dayOption: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, optionActive: { backgroundColor: c.primary, borderColor: c.primary }, optionText: { color: c.text, fontSize: 10, fontWeight: '800' }, optionTextActive: { color: '#fff' } });

const makeStyles = (c: any) => StyleSheet.create({ screen: { flex: 1, backgroundColor: c.background }, header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border }, iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, marginLeft: 8 }, eyebrow: { color: c.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, title: { color: c.text, fontSize: 22, fontWeight: '900', marginTop: 2 }, addButton: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary }, toolbar: { paddingTop: 12, backgroundColor: c.background }, search: { height: 46, marginHorizontal: 15, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 13 }, searchInput: { flex: 1, color: c.text, fontSize: 13 }, filters: { paddingHorizontal: 15, paddingVertical: 11, gap: 7 }, filter: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 17, borderWidth: 1, borderColor: c.border, backgroundColor: c.card }, filterActive: { backgroundColor: c.text, borderColor: c.text }, filterText: { color: c.subText, fontSize: 11, fontWeight: '800' }, filterTextActive: { color: c.background }, content: { padding: 15, paddingBottom: 30 }, userCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, marginBottom: 8, borderRadius: 15, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, avatar: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontSize: 18, fontWeight: '900' }, userCopy: { flex: 1, minWidth: 0 }, userName: { color: c.text, fontSize: 13, fontWeight: '900' }, userEmail: { color: c.subText, fontSize: 10, marginTop: 3 }, metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 }, rolePill: { color: c.primary, backgroundColor: c.primary + '14', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, fontSize: 9, fontWeight: '900' }, status: { fontSize: 9, fontWeight: '800' }, moreButton: { padding: 7 }, center: { alignItems: 'center', justifyContent: 'center', padding: 30, minHeight: 180, gap: 9 }, emptyTitle: { color: c.text, fontSize: 16, fontWeight: '900', textAlign: 'center' }, emptyText: { color: c.subText, fontSize: 12, lineHeight: 18, textAlign: 'center' }, link: { color: c.primary, fontSize: 12, fontWeight: '900' }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000070' }, modal: { maxHeight: '90%', backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }, modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }, modalTitle: { color: c.text, fontSize: 20, fontWeight: '900' }, modalHint: { color: c.subText, fontSize: 11, marginBottom: 14 }, groupTitle: { color: c.primary, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginTop: 12, marginBottom: 7 }, fieldGroup: { marginBottom: 3 }, fieldLabel: { color: c.text, fontSize: 11, fontWeight: '800', marginBottom: 5 }, required: { color: c.danger, fontWeight: '900' }, helper: { color: c.subText, fontSize: 10, marginTop: -4, marginBottom: 8 }, roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 }, roleOption: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: c.border }, roleSelected: { backgroundColor: c.primary + '14', borderColor: c.primary }, roleText: { color: c.subText, fontSize: 11, fontWeight: '800' }, roleTextSelected: { color: c.primary }, input: { height: 47, color: c.text, backgroundColor: c.background, borderWidth: 1, borderColor: c.border, borderRadius: 11, paddingHorizontal: 12, marginBottom: 10, fontSize: 13 }, passwordRow: { flexDirection: 'row', alignItems: 'center' }, passwordInput: { flex: 1, paddingRight: 48 }, eyeButton: { position: 'absolute', right: 3, top: 0, width: 43, height: 47, alignItems: 'center', justifyContent: 'center' }, dropdownField: { minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 10, borderRadius: 11, backgroundColor: c.background, borderWidth: 1, borderColor: c.border }, dropdownValue: { flex: 1, color: c.text, fontSize: 13 }, dropdownPlaceholder: { color: c.subText }, dropdownOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000070' }, dropdownSheet: { maxHeight: '70%', padding: 20, backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }, dropdownOption: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: c.border }, dropdownOptionText: { color: c.text, fontSize: 14, fontWeight: '700' }, fieldRow: { flexDirection: 'row', gap: 9 }, fieldHalf: { flex: 1, minWidth: 0 }, addressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, copyButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 6, marginBottom: 5, borderRadius: 10, backgroundColor: c.primary + '12' }, copyText: { color: c.primary, fontSize: 10, fontWeight: '800' }, primaryButton: { minHeight: 47, paddingHorizontal: 18, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginTop: 6 }, primaryText: { color: '#fff', fontSize: 13, fontWeight: '900' } });

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, RefreshControl } from 'react-native';
import { KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, api } from '../../../core/networking/api';
import { KeyboardAvoidingView, Platform, useTheme } from '../../../core/theme/ThemeContext';

export default function EnrollmentScreen({ navigation }: any) {
  const { colors } = useTheme(); const s = makeStyles(colors);
  const [students, setStudents] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [structure, setStructure] = useState<any>({ academicYears: [], classes: [] });
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'Enrollments' | 'Parent Links'>('Enrollments');
  const [modal, setModal] = useState<'enroll' | 'link' | null>(null);

  // Form states
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedParent, setSelectedParent] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [rollNo, setRollNo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        api.get('/users/admin/users').catch(() => ({ data: [] })),
        api.get('/academics/structure').catch(() => ({ data: {} }))
      ]);
      const allUsers = Array.isArray(uRes.data) ? uRes.data : uRes.data.users || [];
      setStudents(allUsers.filter((u: any) => u.role === 'STUDENT'));
      setParents(allUsers.filter((u: any) => u.role === 'PARENT'));
      setStructure({ academicYears: sRes.data.academicYears || [], classes: sRes.data.classes || [] });
    } catch (e) {
      Alert.alert('Error', 'Failed to load enrollment data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sections = useMemo(() => structure.classes.find((c: any) => c.id === selectedClass)?.sections || [], [structure.classes, selectedClass]);

  const openEnroll = () => {
    setSelectedStudent(students[0]?.id || '');
    setSelectedYear(structure.academicYears.find((y: any) => y.isCurrent)?.id || structure.academicYears[0]?.id || '');
    setSelectedClass(structure.classes[0]?.id || '');
    setSelectedSection(structure.classes[0]?.sections?.[0]?.id || '');
    setRollNo('');
    setModal('enroll');
  };

  const openLink = () => {
    setSelectedParent(parents[0]?.id || '');
    setSelectedStudent(students[0]?.id || '');
    setModal('link');
  };

  const submitEnroll = async () => {
    if (!selectedStudent || !selectedYear || !selectedClass || !selectedSection) return Alert.alert('Error', 'Please fill all fields');
    setSaving(true);
    try {
      await api.post('/academics/enrollments', { studentId: selectedStudent, academicYearId: selectedYear, classId: selectedClass, sectionId: selectedSection, rollNumber: rollNo || undefined });
      setModal(null);
      Alert.alert('Success', 'Student enrolled successfully');
      load();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Enrollment failed'); } finally { setSaving(false); }
  };

  const submitLink = async () => {
    if (!selectedParent || !selectedStudent) return Alert.alert('Error', 'Select parent and student');
    setSaving(true);
    try {
      await api.post('/academics/parent-links', { parentId: selectedParent, studentId: selectedStudent, relationship: 'Parent' });
      setModal(null);
      Alert.alert('Success', 'Parent linked to student');
    } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Linking failed'); } finally { setSaving(false); }
  };

  return <SafeAreaView style={s.screen}>
    <View style={s.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}><Ionicons name="chevron-back" size={23} color={colors.text} /></TouchableOpacity>
      <View style={s.headerCopy}><Text style={s.eyebrow}>ADMINISTRATION</Text><Text style={s.title}>Enrollment & Links</Text></View>
      <TouchableOpacity onPress={load} style={s.refresh}><Ionicons name="refresh-outline" size={20} color={colors.primary} /></TouchableOpacity>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
      {['Enrollments', 'Parent Links'].map(item => <TouchableOpacity key={item} onPress={() => setTab(item as any)} style={[s.tab, tab === item && s.tabActive]}><Text style={[s.tabText, tab === item && s.tabTextActive]}>{item}</Text></TouchableOpacity>)}
    </ScrollView>
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}>
      {tab === 'Enrollments' ? <>
        <TouchableOpacity style={s.primaryButton} onPress={openEnroll}><Text style={s.primaryText}>+ Enroll Student</Text></TouchableOpacity>
        {students.map(item => <View key={item.id} style={s.card}><View style={s.cardCopy}><Text style={s.cardTitle}>{item.studentProfile?.firstName} {item.studentProfile?.lastName}</Text><Text style={s.cardHint}>{item.email}</Text></View></View>)}
      </> : <>
        <TouchableOpacity style={s.primaryButton} onPress={openLink}><Text style={s.primaryText}>+ Link Parent to Student</Text></TouchableOpacity>
        {parents.map(item => <View key={item.id} style={s.card}><View style={s.cardCopy}><Text style={s.cardTitle}>{item.adminProfile?.firstName || item.email} (Parent)</Text><Text style={s.cardHint}>{item.email}</Text></View></View>)}
      </>}
    </ScrollView>

    <Modal visible={!!modal} transparent animationType="slide" onRequestClose={() => setModal(null)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
        <View style={s.modal}>
          <View style={s.modalHead}><Text style={s.modalTitle}>{modal === 'enroll' ? 'Enroll Student' : 'Link Parent'}</Text><TouchableOpacity onPress={() => setModal(null)}><Ionicons name="close-circle" size={25} color={colors.subText} /></TouchableOpacity></View>
          
          {modal === 'enroll' && <>
            <Text style={s.modalHint}>Student</Text>
            <ScrollView horizontal contentContainerStyle={s.choiceRow}>{students.map(item => <TouchableOpacity key={item.id} onPress={() => setSelectedStudent(item.id)} style={[s.choice, selectedStudent === item.id && s.choiceActive]}><Text style={[s.choiceText, selectedStudent === item.id && s.choiceTextActive]}>{item.studentProfile?.firstName || item.email}</Text></TouchableOpacity>)}</ScrollView>
            <Text style={s.modalHint}>Academic Year</Text>
            <ScrollView horizontal contentContainerStyle={s.choiceRow}>{structure.academicYears.map((item: any) => <TouchableOpacity key={item.id} onPress={() => setSelectedYear(item.id)} style={[s.choice, selectedYear === item.id && s.choiceActive]}><Text style={[s.choiceText, selectedYear === item.id && s.choiceTextActive]}>{item.name}</Text></TouchableOpacity>)}</ScrollView>
            <Text style={s.modalHint}>Class</Text>
            <ScrollView horizontal contentContainerStyle={s.choiceRow}>{structure.classes.map((item: any) => <TouchableOpacity key={item.id} onPress={() => setSelectedClass(item.id)} style={[s.choice, selectedClass === item.id && s.choiceActive]}><Text style={[s.choiceText, selectedClass === item.id && s.choiceTextActive]}>{item.name}</Text></TouchableOpacity>)}</ScrollView>
            <Text style={s.modalHint}>Section</Text>
            <ScrollView horizontal contentContainerStyle={s.choiceRow}>{sections.map((item: any) => <TouchableOpacity key={item.id} onPress={() => setSelectedSection(item.id)} style={[s.choice, selectedSection === item.id && s.choiceActive]}><Text style={[s.choiceText, selectedSection === item.id && s.choiceTextActive]}>{item.name}</Text></TouchableOpacity>)}</ScrollView>
            <TextInput value={rollNo} onChangeText={setRollNo} placeholder="Roll Number (Optional)" placeholderTextColor={colors.subText} style={s.input} />
            <TouchableOpacity disabled={saving} onPress={submitEnroll} style={s.primaryButton}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Enroll</Text>}</TouchableOpacity>
          </>}

          {modal === 'link' && <>
            <Text style={s.modalHint}>Parent</Text>
            <ScrollView horizontal contentContainerStyle={s.choiceRow}>{parents.map(item => <TouchableOpacity key={item.id} onPress={() => setSelectedParent(item.id)} style={[s.choice, selectedParent === item.id && s.choiceActive]}><Text style={[s.choiceText, selectedParent === item.id && s.choiceTextActive]}>{item.email}</Text></TouchableOpacity>)}</ScrollView>
            <Text style={s.modalHint}>Student</Text>
            <ScrollView horizontal contentContainerStyle={s.choiceRow}>{students.map(item => <TouchableOpacity key={item.id} onPress={() => setSelectedStudent(item.id)} style={[s.choice, selectedStudent === item.id && s.choiceActive]}><Text style={[s.choiceText, selectedStudent === item.id && s.choiceTextActive]}>{item.studentProfile?.firstName || item.email}</Text></TouchableOpacity>)}</ScrollView>
            <TouchableOpacity disabled={saving} onPress={submitLink} style={s.primaryButton}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Link Parent</Text>}</TouchableOpacity>
          </>}
        </View>
      </KeyboardAvoidingView>
      </Modal>
  </SafeAreaView>;
}

const makeStyles = (c: any) => StyleSheet.create({ screen: { flex: 1, backgroundColor: c.background }, header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border }, back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, marginLeft: 8 }, eyebrow: { color: c.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 }, title: { color: c.text, fontSize: 20, fontWeight: '900', marginTop: 2 }, refresh: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, tabs: { paddingHorizontal: 15, gap: 8, paddingBottom: 10, paddingTop: 10 }, tab: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 17, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, tabActive: { backgroundColor: c.text, borderColor: c.text }, tabText: { color: c.subText, fontSize: 11, fontWeight: '800' }, tabTextActive: { color: c.background }, content: { padding: 15, paddingBottom: 30 }, center: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 9 }, card: { flexDirection: 'row', gap: 11, padding: 14, marginBottom: 9, borderRadius: 15, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, cardCopy: { flex: 1 }, cardTitle: { color: c.text, fontSize: 13, fontWeight: '900' }, cardHint: { color: c.subText, fontSize: 10, marginTop: 4 }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000070' }, modal: { maxHeight: '90%', backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }, modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }, modalTitle: { color: c.text, fontSize: 19, fontWeight: '900' }, modalHint: { color: c.subText, fontSize: 11, marginBottom: 9 }, choiceRow: { gap: 7, paddingBottom: 10 }, choice: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: c.border }, choiceActive: { borderColor: c.primary, backgroundColor: c.primary + '14' }, choiceText: { color: c.subText, fontSize: 11, fontWeight: '800' }, choiceTextActive: { color: c.primary }, input: { height: 47, color: c.text, backgroundColor: c.background, borderWidth: 1, borderColor: c.border, borderRadius: 11, paddingHorizontal: 12, marginBottom: 10 }, primaryButton: { minHeight: 47, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 15 }, primaryText: { color: '#fff', fontSize: 13, fontWeight: '900' } });

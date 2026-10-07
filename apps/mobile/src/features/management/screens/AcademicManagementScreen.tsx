import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../core/networking/api';
import { useTheme } from '../../../core/theme/ThemeContext';

type Structure = { academicYears: any[]; classes: any[]; subjects: any[]; assignments: any[] };
type FormKind = 'class' | 'section' | 'subject' | 'year' | 'assignment';

export default function AcademicManagementScreen({ navigation }: any) {
  const { colors } = useTheme(); const s = makeStyles(colors);
  const [structure, setStructure] = useState<Structure>({ academicYears: [], classes: [], subjects: [], assignments: [] });
  const [teachers, setTeachers] = useState<any[]>([]);
  const [tab, setTab] = useState('Classes'); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const [modal, setModal] = useState<FormKind | null>(null); const [value, setValue] = useState(''); const [secondary, setSecondary] = useState(''); 
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');

  const load = useCallback(async () => { 
    setLoading(true); setError(''); 
    try { 
      const [res, tRes] = await Promise.all([
        api.get('/academics/structure').catch(() => ({ data: {} })),
        api.get('/users/admin/users?role=TEACHER').catch(() => ({ data: [] }))
      ]);
      setStructure({ academicYears: res.data.academicYears || [], classes: res.data.classes || [], subjects: res.data.subjects || [], assignments: res.data.assignments || [] }); 
      setTeachers(tRes.data || []);
    } catch (e: any) { setError(e.response?.data?.message || 'Could not load academic structure.'); } finally { setLoading(false); } 
  }, []);
  
  useEffect(() => { load(); }, [load]);
  
  const sections = useMemo(() => structure.classes.flatMap(item => (item.sections || []).map((section: any) => ({ ...section, className: item.name }))), [structure.classes]);

  const open = (kind: FormKind, classId = '') => { 
    setModal(kind); setValue(''); setSecondary(''); 
    setSelectedClass(classId || structure.classes[0]?.id || '');
    if (kind === 'assignment') {
      setSelectedSection(sections[0]?.id || '');
      setSelectedSubject(structure.subjects[0]?.id || '');
      setSelectedTeacher(teachers[0]?.id || '');
    }
  };
  
  const submit = async () => {
    if (modal === 'assignment') {
      if (!selectedTeacher || !selectedSection || !selectedSubject) { Alert.alert('Complete the form', 'Select all required fields.'); return; }
    } else {
      if (!value.trim() || (modal === 'section' && !selectedClass)) { Alert.alert('Complete the form', 'Enter the required details first.'); return; }
    }
    setSaving(true);
    try {
      if (modal === 'class') await api.post('/academics/classes', { name: value.trim() });
      if (modal === 'section') await api.post('/academics/sections', { classId: selectedClass, name: value.trim() });
      if (modal === 'subject') await api.post('/academics/subjects', { name: value.trim(), code: secondary.trim() || undefined });
      if (modal === 'year') await api.post('/academics/academic-years', { name: value.trim(), startDate: `${secondary || new Date().getFullYear()}-01-01`, endDate: `${Number(secondary || new Date().getFullYear()) + 1}-12-31`, isCurrent: true });
      if (modal === 'assignment') await api.post('/academics/teacher-assignments', { teacherId: selectedTeacher, sectionId: selectedSection, subjectId: selectedSubject });
      setModal(null); await load();
    } catch (e: any) { Alert.alert('Could not save', Array.isArray(e.response?.data?.message) ? e.response.data.message.join('\n') : e.response?.data?.message || 'Please try again.'); } finally { setSaving(false); }
  };
  
  const currentYear = structure.academicYears.find(item => item.isCurrent);
  
  return <SafeAreaView style={s.screen}><View style={s.header}><TouchableOpacity onPress={() => navigation.goBack()} style={s.back}><Ionicons name="chevron-back" size={23} color={colors.text} /></TouchableOpacity><View style={s.headerCopy}><Text style={s.eyebrow}>SCHOOL SETUP</Text><Text style={s.title}>Academic structure</Text></View><TouchableOpacity onPress={load} style={s.refresh}><Ionicons name="refresh-outline" size={20} color={colors.primary} /></TouchableOpacity></View>
    <View style={s.summary}><View><Text style={s.summaryTitle}>{currentYear?.name || 'Academic year not set'}</Text><Text style={s.summaryHint}>{structure.classes.length} classes · {sections.length} sections · {structure.subjects.length} subjects</Text></View><Ionicons name="school-outline" size={27} color={colors.primary} /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>{['Classes', 'Subjects', 'Assignments'].map(item => <TouchableOpacity key={item} onPress={() => setTab(item)} style={[s.tab, tab === item && s.tabActive]}><Text style={[s.tabText, tab === item && s.tabTextActive]}>{item}</Text></TouchableOpacity>)}</ScrollView>
    <ScrollView contentContainerStyle={s.content} refreshControl={undefined}>{loading ? <View style={s.center}><ActivityIndicator color={colors.primary} /><Text style={s.muted}>Loading structure…</Text></View> : error ? <View style={s.center}><Text style={s.muted}>{error}</Text><TouchableOpacity onPress={load}><Text style={s.link}>Try again</Text></TouchableOpacity></View> : tab === 'Classes' ? <><Action label="Add class" icon="add-circle-outline" onPress={() => open('class')} />{structure.classes.map(item => <View key={item.id} style={s.card}><View style={s.cardIcon}><Ionicons name="school-outline" size={20} color={colors.primary} /></View><View style={s.cardCopy}><Text style={s.cardTitle}>{item.name}</Text><Text style={s.cardHint}>{(item.sections || []).length} section{(item.sections || []).length === 1 ? '' : 's'}</Text>{(item.sections || []).map((section: any) => <View key={section.id} style={s.subRow}><Text style={s.subText}>Section {section.name}</Text><Text style={s.subAction} onPress={() => open('section', item.id)}>+ add</Text></View>)}</View></View>)}{!structure.classes.length && <Empty text="No classes created yet." />}</> : tab === 'Subjects' ? <><Action label="Add subject" icon="add-circle-outline" onPress={() => open('subject')} />{structure.subjects.map(item => <View key={item.id} style={s.simpleCard}><Ionicons name="book-outline" size={19} color={colors.primary} /><View style={s.cardCopy}><Text style={s.cardTitle}>{item.name}</Text><Text style={s.cardHint}>{item.code || 'No subject code'}</Text></View></View>)}{!structure.subjects.length && <Empty text="No subjects created yet." />}</> : <><Action label="Add assignment" icon="add-circle-outline" onPress={() => open('assignment')} />{structure.assignments.map(item => <View key={item.id} style={s.simpleCard}><Ionicons name="person-outline" size={19} color={colors.primary} /><View style={s.cardCopy}><Text style={s.cardTitle}>{[item.teacher?.teacherProfile?.firstName, item.teacher?.teacherProfile?.lastName].filter(Boolean).join(' ') || item.teacher?.email || 'Teacher'}</Text><Text style={s.cardHint}>{item.section?.class?.name} · Section {item.section?.name} · {item.subject?.name}</Text></View></View>)}{!structure.assignments.length && <Empty text="No teacher assignments available." />}</>}</ScrollView>
    <Modal visible={!!modal} transparent animationType="slide" onRequestClose={() => setModal(null)}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}><View style={s.modal}><View style={s.modalHead}><Text style={s.modalTitle}>{modal === 'class' ? 'Add class' : modal === 'section' ? 'Add section' : modal === 'subject' ? 'Add subject' : modal === 'assignment' ? 'Assign teacher' : 'Add academic year'}</Text><TouchableOpacity onPress={() => setModal(null)}><Ionicons name="close-circle" size={25} color={colors.subText} /></TouchableOpacity></View>
    {modal === 'section' && <Text style={s.modalHint}>Class: {structure.classes.find(item => item.id === selectedClass)?.name || 'Select a class'}</Text>}
    {modal === 'section' && <ScrollView horizontal contentContainerStyle={s.choiceRow}>{structure.classes.map(item => <TouchableOpacity key={item.id} onPress={() => setSelectedClass(item.id)} style={[s.choice, selectedClass === item.id && s.choiceActive]}><Text style={[s.choiceText, selectedClass === item.id && s.choiceTextActive]}>{item.name}</Text></TouchableOpacity>)}</ScrollView>}
    
    {modal === 'assignment' && <><Text style={s.modalHint}>Teacher: {teachers.find(item => item.id === selectedTeacher)?.teacherProfile?.firstName || teachers.find(item => item.id === selectedTeacher)?.email || 'Select'}</Text>
    <ScrollView horizontal contentContainerStyle={s.choiceRow}>{teachers.map(item => <TouchableOpacity key={item.id} onPress={() => setSelectedTeacher(item.id)} style={[s.choice, selectedTeacher === item.id && s.choiceActive]}><Text style={[s.choiceText, selectedTeacher === item.id && s.choiceTextActive]}>{item.teacherProfile?.firstName || item.email}</Text></TouchableOpacity>)}</ScrollView>
    <Text style={s.modalHint}>Section: {sections.find(item => item.id === selectedSection)?.className} - {sections.find(item => item.id === selectedSection)?.name}</Text>
    <ScrollView horizontal contentContainerStyle={s.choiceRow}>{sections.map(item => <TouchableOpacity key={item.id} onPress={() => setSelectedSection(item.id)} style={[s.choice, selectedSection === item.id && s.choiceActive]}><Text style={[s.choiceText, selectedSection === item.id && s.choiceTextActive]}>{item.className} - {item.name}</Text></TouchableOpacity>)}</ScrollView>
    <Text style={s.modalHint}>Subject: {structure.subjects.find(item => item.id === selectedSubject)?.name}</Text>
    <ScrollView horizontal contentContainerStyle={s.choiceRow}>{structure.subjects.map(item => <TouchableOpacity key={item.id} onPress={() => setSelectedSubject(item.id)} style={[s.choice, selectedSubject === item.id && s.choiceActive]}><Text style={[s.choiceText, selectedSubject === item.id && s.choiceTextActive]}>{item.name}</Text></TouchableOpacity>)}</ScrollView></>}

    {(modal === 'class' || modal === 'section' || modal === 'subject' || modal === 'year') && <TextInput value={value} onChangeText={setValue} placeholder={modal === 'subject' ? 'Subject name' : modal === 'year' ? 'Academic year name' : modal === 'section' ? 'Section name' : 'Class name'} placeholderTextColor={colors.subText} style={s.input} />}
    {modal === 'subject' && <TextInput value={secondary} onChangeText={setSecondary} placeholder="Subject code (optional)" placeholderTextColor={colors.subText} style={s.input} />}
    {modal === 'year' && <TextInput value={secondary} onChangeText={setSecondary} placeholder="Start year, e.g. 2026" keyboardType="number-pad" placeholderTextColor={colors.subText} style={s.input} />}
    
    <TouchableOpacity disabled={saving} onPress={submit} style={s.primaryButton}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Save</Text>}</TouchableOpacity></View></KeyboardAvoidingView></Modal>
  </SafeAreaView>;
}
function Action({ label, icon, onPress }: any) { return <TouchableOpacity onPress={onPress} style={{ minHeight: 46, borderRadius: 12, backgroundColor: '#2F80ED', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 12 }}><Ionicons name={icon} size={18} color="#fff" /><Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>{label}</Text></TouchableOpacity>; }
function Empty({ text }: { text: string }) { return <View style={{ alignItems: 'center', padding: 30 }}><Text style={{ color: '#6B7280', fontSize: 12 }}>{text}</Text></View>; }
const makeStyles = (c: any) => StyleSheet.create({ screen: { flex: 1, backgroundColor: c.background }, header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border }, back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, marginLeft: 8 }, eyebrow: { color: c.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 }, title: { color: c.text, fontSize: 20, fontWeight: '900', marginTop: 2 }, refresh: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, summary: { margin: 15, padding: 15, borderRadius: 16, backgroundColor: c.primary + '12', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, summaryTitle: { color: c.text, fontSize: 15, fontWeight: '900' }, summaryHint: { color: c.subText, fontSize: 11, marginTop: 4 }, tabs: { paddingHorizontal: 15, gap: 8, paddingBottom: 10 }, tab: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 17, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, tabActive: { backgroundColor: c.text, borderColor: c.text }, tabText: { color: c.subText, fontSize: 11, fontWeight: '800' }, tabTextActive: { color: c.background }, content: { padding: 15, paddingBottom: 30 }, center: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 9 }, muted: { color: c.subText, fontSize: 12, textAlign: 'center' }, link: { color: c.primary, fontSize: 12, fontWeight: '900' }, card: { flexDirection: 'row', gap: 11, padding: 14, marginBottom: 9, borderRadius: 15, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, cardIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '14' }, cardCopy: { flex: 1 }, cardTitle: { color: c.text, fontSize: 13, fontWeight: '900' }, cardHint: { color: c.subText, fontSize: 10, marginTop: 4 }, subRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 9, marginTop: 7, borderTopWidth: 1, borderColor: c.border }, subText: { color: c.text, fontSize: 11 }, subAction: { color: c.primary, fontSize: 10, fontWeight: '900' }, simpleCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, marginBottom: 9, borderRadius: 15, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000070' }, modal: { maxHeight: '90%', backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }, modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }, modalTitle: { color: c.text, fontSize: 19, fontWeight: '900' }, modalHint: { color: c.subText, fontSize: 11, marginBottom: 9 }, choiceRow: { gap: 7, paddingBottom: 10 }, choice: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: c.border }, choiceActive: { borderColor: c.primary, backgroundColor: c.primary + '14' }, choiceText: { color: c.subText, fontSize: 11, fontWeight: '800' }, choiceTextActive: { color: c.primary }, input: { height: 47, color: c.text, backgroundColor: c.background, borderWidth: 1, borderColor: c.border, borderRadius: 11, paddingHorizontal: 12, marginBottom: 10 }, primaryButton: { minHeight: 47, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: '#fff', fontSize: 13, fontWeight: '900' } });

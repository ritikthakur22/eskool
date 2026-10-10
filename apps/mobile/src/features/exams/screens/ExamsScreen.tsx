import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useMemo } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import { useTheme } from '../../../core/theme/ThemeContext';
import { api } from '../../../core/networking/api';
import { getSelectedChildId } from '../../../core/utils/childSelection';
import { orderAcademicClasses } from '../../../core/utils/classOrdering';

export default function ExamsScreen({ route, navigation }: any) {
  const { colors } = useTheme(); const styles = makeStyles(colors);
  const requestedTab = route?.params?.tab || 'Weekly MCQ';
  const initialTab = requestedTab === 'Online Exam' ? 'Weekly MCQ' : requestedTab === 'Upcoming' ? 'Exam routine' : requestedTab === 'Result' ? 'Results' : requestedTab;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const [childName, setChildName] = useState('');
  const [routineDocuments, setRoutineDocuments] = useState<any[]>([]);
  
  // Management state
  const [structure, setStructure] = useState<any>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editExam, setEditExam] = useState<any>(null);
  const [form, setForm] = useState({ title: '', subjectId: '', sectionId: '', date: '', type: 'MCQ', assessmentCategory: 'WEEKLY', startTime: '', endTime: '', venue: '', durationMinutes: '20' });
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [routineSectionId, setRoutineSectionId] = useState('');
  const [routineFile, setRoutineFile] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const tabs = useMemo(() => {
    return ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(role) ? ['Manage', 'Results'] : ['Weekly MCQ', 'Exam routine', 'Results'];
  }, [role]);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.includes(activeTab)) setActiveTab(tabs[0]);
  }, [tabs, activeTab]);

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const raw = await SecureStore.getItemAsync('user_data');
      if (!raw) { setLoading(false); return; }
      const nextRole = JSON.parse(raw).role || '';
      setRole(nextRole);

      if (['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(nextRole)) {
        const [examRes, structRes] = await Promise.all([
          api.get('/exams/manage'),
          api.get('/academics/structure').catch(() => ({ data: {} }))
        ]);
        setExams(Array.isArray(examRes.data) ? examRes.data : []);
        setStructure(structRes.data);
        const sectionIds = (structRes.data?.classes || []).flatMap((item: any) => item.sections || []).map((item: any) => item.id);
        setRoutineSectionId((current: string) => current || sectionIds[0] || '');
      } else {
        let resolvedChildId = '';
        if (nextRole === 'PARENT') {
          resolvedChildId = (await getSelectedChildId()) || '';
          if (!resolvedChildId) throw new Error('Select a child from the home screen first.');
          const childRes = await api.get('/academics/children').catch(() => ({ data: [] }));
          const data = Array.isArray(childRes.data) ? childRes.data : [];
          const child = data.find((item: any) => item.student?.id === resolvedChildId) || data[0];
          const profile = child?.student?.studentProfile;
          setChildName([profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || child?.student?.email || '');
        }
        const endpoint = nextRole === 'PARENT' ? `/exams/child/${resolvedChildId}` : '/exams/me';
        const res = await api.get(endpoint);
        const examRows = Array.isArray(res.data) ? res.data : [];
        setExams(examRows);
        const docs = nextRole === 'PARENT'
          ? await api.get(`/exams/routine/child/${resolvedChildId}`).catch(() => ({ data: [] }))
          : await api.get('/exams/routine/me').catch(() => ({ data: [] }));
        setRoutineDocuments(Array.isArray(docs.data) ? docs.data : []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Could not load exams.');
    } finally {
      setLoading(false);
    }
  };

  // Exam tabs are client-side views over the same result set.
  useEffect(() => { loadData(); }, []);

  const now = Date.now();
  const visibleExams = exams.filter(exam => {
    if (activeTab === 'Weekly MCQ') return exam.type === 'MCQ' && exam.assessmentCategory === 'WEEKLY';
    if (activeTab === 'Exam routine') return new Date(exam.date).getTime() >= now && !(exam.type === 'MCQ' && exam.assessmentCategory === 'WEEKLY');
    return true;
  });
  const isManagement = ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(role);
  const canCreateSubject = ['ADMIN', 'SUPER_ADMIN'].includes(role);

  const openEditor = (e: any = null) => {
    setEditExam(e);
    setForm(e ? { title: e.title, subjectId: e.subjectId, sectionId: e.sectionId, date: e.date.split('T')[0], type: e.type || 'MCQ', assessmentCategory: e.assessmentCategory || 'OTHER', startTime: e.startTime || '', endTime: e.endTime || '', venue: e.venue || '', durationMinutes: String(e.durationMinutes || 20) } : { title: '', subjectId: '', sectionId: '', date: new Date().toISOString().split('T')[0], type: 'MCQ', assessmentCategory: 'WEEKLY', startTime: '', endTime: '', venue: '', durationMinutes: '20' });
    setEditorVisible(true);
  };

  const saveExam = async () => {
    let finalSubjectId = form.subjectId;
    if (customSubjectName.trim()) {
      try {
        const res = await api.post('/academics/subjects', { name: customSubjectName.trim() });
        finalSubjectId = res.data.id;
      } catch (err) {
        Alert.alert('Error', 'Failed to create custom subject');
        return;
      }
    }
    if (!form.title || !finalSubjectId || !form.sectionId || !form.date) return Alert.alert('Error', 'Fill all fields.');
    if (form.type === 'MCQ' && (!Number.isInteger(Number(form.durationMinutes)) || Number(form.durationMinutes) < 1 || Number(form.durationMinutes) > 240)) return Alert.alert('Invalid time limit', 'Set the MCQ time limit between 1 and 240 minutes.');
    setSaving(true);
    try {
      if (editExam) await api.patch(`/exams/${editExam.id}`, { title: form.title, date: new Date(form.date).toISOString(), type: form.type, assessmentCategory: form.assessmentCategory, startTime: form.startTime, endTime: form.endTime, venue: form.venue, durationMinutes: form.type === 'MCQ' ? Number(form.durationMinutes) : undefined });
      else await api.post('/exams', { ...form, durationMinutes: form.type === 'MCQ' ? Number(form.durationMinutes) : undefined, date: new Date(form.date).toISOString() });
      setEditorVisible(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save exam.');
    } finally { setSaving(false); }
  };

  const uploadRoutine = async () => {
    if (!routineSectionId) return Alert.alert('Choose a class section', 'Create or select a section before uploading an exam routine.');
    const picked = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    setRoutineFile(picked.assets[0]);
    try {
      const data = new FormData();
      data.append('file', { uri: picked.assets[0].uri, name: picked.assets[0].name, type: picked.assets[0].mimeType || 'application/octet-stream' } as any);
      data.append('title', 'Exam routine');
      await api.post(`/exams/routine/section/${routineSectionId}`, data, { headers: { 'Content-Type': 'multipart/form-data' }, transformRequest: (d) => d });
      setRoutineFile(null);
      await loadData();
      Alert.alert('Uploaded', 'Exam routine is now available to this class.');
    } catch (error: any) {
      Alert.alert('Upload failed', error.response?.data?.message || 'Could not upload this routine.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCopy}><Text style={styles.headerTitle}>Exams</Text>{role === 'PARENT' && <Text style={styles.headerSubtitle}>{childName ? `For ${childName}` : 'Select a child from Home'}</Text>}</View>
        <TouchableOpacity style={styles.backButton} onPress={loadData}><Ionicons name="refresh" size={20} color={colors.primary} /></TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab, { borderColor: activeTab === tab ? colors.primary : colors.border }]} onPress={() => { if (tab === 'Results') navigation.navigate('Result'); else setActiveTab(tab); }}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText, { color: activeTab === tab ? colors.primary : colors.subText }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!isManagement && activeTab === 'Results' ? <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.cardTitle, { color: colors.text }]}>Results & progress reports</Text><Text style={[styles.cardSubtitle, { color: colors.subText, marginTop: 7 }]}>Review past weekly MCQs, monthly and terminal marksheets, and your current progress.</Text><TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary, marginTop: 12 }]} onPress={() => navigation.navigate('Result')}><Text style={[styles.actionButtonText, { color: '#fff' }]}>Open results</Text></TouchableOpacity></View> : null}
        {isManagement && activeTab === 'Manage' && (
          <>
            <TouchableOpacity style={styles.addButton} onPress={() => openEditor()}><Text style={styles.addButtonText}>+ Add exam to routine</Text></TouchableOpacity>
            <Text style={[styles.inputLabel, { color: colors.subText }]}>Upload a routine photo or PDF for this section</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {orderAcademicClasses(structure?.classes || []).flatMap((c: any) => (c.sections || []).map((sec: any) => ({ ...sec, className: c.name }))).map((sec: any) => (
                <TouchableOpacity key={sec.id} onPress={() => setRoutineSectionId(sec.id)} style={[styles.chip, { borderColor: routineSectionId === sec.id ? colors.primary : colors.border, backgroundColor: routineSectionId === sec.id ? colors.primary + '18' : colors.card }]}><Text style={{ color: routineSectionId === sec.id ? colors.primary : colors.subText }}>Class {sec.className} · {sec.name}</Text></TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary + '18', marginBottom: 14 }]} onPress={uploadRoutine}><Text style={[styles.actionButtonText, { color: colors.primary }]}>{routineFile ? `Uploading ${routineFile.name}…` : 'Upload exam routine (PDF / photo)'}</Text></TouchableOpacity>
          </>
        )}
        
        {!isManagement && activeTab === 'Results' ? null : loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.subText, marginTop: 10 }}>Loading exams...</Text></View>
        ) : error ? (
          <View style={styles.center}><Text style={{ color: colors.danger }}>{error}</Text></View>
        ) : visibleExams.length === 0 && routineDocuments.length === 0 ? (
          <View style={styles.center}><Text style={{ color: colors.subText }}>No exams found.</Text></View>
        ) : (
          <>
          {!isManagement && visibleExams.length > 0 && <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 0, overflow: 'hidden' }]}>
            <View style={[styles.scheduleHeader, { backgroundColor: colors.primary + '12', borderBottomColor: colors.border }]}><Text style={[styles.scheduleHeading, { color: colors.text, flex: 1.1 }]}>Subject</Text><Text style={[styles.scheduleHeading, { color: colors.text, flex: 1 }]}>Date / time</Text><Text style={[styles.scheduleHeading, { color: colors.text, flex: 1 }]}>Exam</Text></View>
            {visibleExams.map((exam, index) => <View key={exam.id} style={[styles.scheduleRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1.1 }}><Text style={[styles.scheduleSubject, { color: colors.text }]}>{exam.subject?.name || exam.title}</Text><Text style={[styles.scheduleMeta, { color: colors.subText }]}>{exam.assessmentCategory?.replaceAll('_', ' ') || 'ASSESSMENT'}</Text></View>
              <View style={{ flex: 1 }}><Text style={[styles.scheduleMeta, { color: colors.text }]}>{new Date(exam.date).toLocaleDateString()}</Text><Text style={[styles.scheduleMeta, { color: colors.subText }]}>{exam.startTime || 'Time TBA'}{exam.endTime ? ` – ${exam.endTime}` : ''}</Text></View>
              <View style={{ flex: 1 }}><Text style={[styles.scheduleMeta, { color: colors.text }]}>{exam.venue || 'Venue TBA'}</Text>{exam.type === 'MCQ' && <TouchableOpacity onPress={() => navigation.navigate('ExamTaking', { exam })} style={{ marginTop: 5 }}><Text style={{ color: colors.primary, fontWeight: '800', fontSize: 11 }}>Take MCQ</Text></TouchableOpacity>}</View>
            </View>)}
          </View>}
          {!isManagement && activeTab === 'Exam routine' && routineDocuments.map(document => <TouchableOpacity key={document.id} onPress={() => Linking.openURL(document.url)} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.cardHeader}><Ionicons name={document.mimeType === 'application/pdf' ? 'document-text-outline' : 'image-outline'} size={22} color={colors.primary} /><Text style={[styles.cardTitle, { color: colors.text, marginLeft: 10, flex: 1 }]}>{document.title || 'Uploaded exam routine'}</Text><Ionicons name="open-outline" size={18} color={colors.primary} /></View><Text style={[styles.cardSubtitle, { color: colors.subText, marginTop: 6 }]}>Open uploaded {document.mimeType === 'application/pdf' ? 'PDF' : 'image'} routine</Text></TouchableOpacity>)}
          {isManagement && visibleExams.map((exam) => (
            <TouchableOpacity key={exam.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => isManagement && openEditor(exam)}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '18' }]}><Ionicons name="document-text" size={20} color={colors.primary} /></View>
                <View style={styles.cardHeaderCopy}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{exam.title}</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.subText }]}>{exam.subject?.name} · {new Date(exam.date).toLocaleDateString()}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.subText} />
              </View>
              {isManagement && <Text style={{ color: colors.subText, fontSize: 11, marginTop: 8 }}>Class {exam.section?.class?.name} · Section {exam.section?.name}</Text>}
              {exam.type === 'MCQ' && (
                <View style={{ marginTop: 12 }}>
                  {isManagement ? (
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary + '18' }]} onPress={() => navigation.navigate('ExamQuestions', { exam })}>
                      <Text style={[styles.actionButtonText, { color: colors.primary }]}>Manage Questions</Text>
                    </TouchableOpacity>
                  ) : (
                    exam.score !== undefined ? (
                      <View style={[styles.scoreBadge, { backgroundColor: colors.success + '18' }]}>
                        <Text style={[styles.scoreText, { color: colors.success }]}>Score: {exam.score}</Text>
                      </View>
                    ) : (
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('ExamTaking', { exam })}>
                        <Text style={[styles.actionButtonText, { color: '#fff' }]}>Take Quiz</Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
          </>
        )}
      </ScrollView>

      <Modal visible={editorVisible} animationType="slide" transparent onRequestClose={() => setEditorVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{editExam ? 'Edit Exam' : 'Create Exam'}</Text>
              <TouchableOpacity onPress={() => setEditorVisible(false)}><Ionicons name="close" size={24} color={colors.subText} /></TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={[styles.inputLabel, { color: colors.subText }]}>Title</Text>
              <TextInput value={form.title} onChangeText={t => setForm({...form, title: t})} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} placeholder="Midterm Exam" placeholderTextColor={colors.subText} />
              <Text style={[styles.inputLabel, { color: colors.subText }]}>Date (YYYY-MM-DD)</Text>
              <TextInput value={form.date} onChangeText={t => setForm({...form, date: t})} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} placeholder="2026-12-01" placeholderTextColor={colors.subText} />
              <Text style={[styles.inputLabel, { color: colors.subText }]}>Assessment period</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {['WEEKLY', 'MONTHLY', 'TERMINAL_1', 'TERMINAL_2', 'TERMINAL_3', 'FINAL', 'OTHER'].map(category => <TouchableOpacity key={category} onPress={() => setForm({ ...form, assessmentCategory: category })} style={[styles.chip, { borderColor: form.assessmentCategory === category ? colors.primary : colors.border, backgroundColor: form.assessmentCategory === category ? colors.primary + '18' : colors.card }]}><Text style={{ color: form.assessmentCategory === category ? colors.primary : colors.subText }}>{category.replaceAll('_', ' ')}</Text></TouchableOpacity>)}
              </ScrollView>
              <Text style={[styles.inputLabel, { color: colors.subText }]}>Exam mode</Text>
              <View style={{ flexDirection: 'row', marginBottom: 14 }}>
                {(['STANDARD', 'MCQ'] as const).map(type => <TouchableOpacity key={type} onPress={() => setForm({ ...form, type })} style={[styles.chip, { borderColor: form.type === type ? colors.primary : colors.border, backgroundColor: form.type === type ? colors.primary + '18' : colors.card }]}><Text style={{ color: form.type === type ? colors.primary : colors.subText }}>{type === 'MCQ' ? 'Online MCQ' : 'Marks only'}</Text></TouchableOpacity>)}
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}><Text style={[styles.inputLabel, { color: colors.subText }]}>Start time</Text><TextInput value={form.startTime} onChangeText={t => setForm({ ...form, startTime: t })} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} placeholder="9:00 AM" placeholderTextColor={colors.subText} /></View>
                <View style={{ flex: 1 }}><Text style={[styles.inputLabel, { color: colors.subText }]}>End time</Text><TextInput value={form.endTime} onChangeText={t => setForm({ ...form, endTime: t })} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} placeholder="12:00 PM" placeholderTextColor={colors.subText} /></View>
              </View>
              <TextInput value={form.venue} onChangeText={t => setForm({ ...form, venue: t })} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} placeholder="Room / venue (optional)" placeholderTextColor={colors.subText} />
              {form.type === 'MCQ' && <><Text style={[styles.inputLabel, { color: colors.subText }]}>Time limit (minutes)</Text><TextInput value={form.durationMinutes} onChangeText={t => setForm({ ...form, durationMinutes: t.replace(/[^0-9]/g, '') })} keyboardType="number-pad" style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} placeholder="20" placeholderTextColor={colors.subText} /></>}
              
              {!editExam && structure && (
                <>
                  <Text style={[styles.inputLabel, { color: colors.subText }]}>Subject</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                    {structure.subjects?.map((s: any) => (
                      <TouchableOpacity key={s.id} onPress={() => setForm({...form, subjectId: s.id})} style={[styles.chip, { borderColor: colors.border, backgroundColor: form.subjectId === s.id ? colors.primary + '18' : colors.card }]}>
                        <Text style={{ color: form.subjectId === s.id ? colors.primary : colors.subText }}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {canCreateSubject && <TextInput value={customSubjectName} onChangeText={t => { setCustomSubjectName(t); if(t) setForm({...form, subjectId: ''}); }} placeholder="Or add a new subject..." placeholderTextColor={colors.subText} style={[styles.input, { marginBottom: 15 }]} />}
                  <Text style={[styles.inputLabel, { color: colors.subText }]}>Section</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                    {structure.classes?.flatMap((c: any) => c.sections?.map((sec: any) => (
                      <TouchableOpacity key={sec.id} onPress={() => setForm({...form, sectionId: sec.id})} style={[styles.chip, { borderColor: colors.border, backgroundColor: form.sectionId === sec.id ? colors.primary + '18' : colors.card }]}>
                        <Text style={{ color: form.sectionId === sec.id ? colors.primary : colors.subText }}>Class {c.name} {sec.name}</Text>
                      </TouchableOpacity>
                    )))}
                  </ScrollView>
                </>
              )}
              
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={saveExam} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Exam</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  backButton: { padding: 4 },
  headerCopy: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: c.text },
  headerSubtitle: { fontSize: 12, color: c.subText, marginTop: 2 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  activeTab: { backgroundColor: c.primary + '18' },
  tabText: { fontSize: 13, fontWeight: '700' },
  activeTabText: { color: c.primary },
  content: { padding: 16, paddingBottom: 40 },
  center: { padding: 40, alignItems: 'center' },
  addButton: { paddingVertical: 14, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center', marginBottom: 16 },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  scheduleHeader: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 1 }, scheduleHeading: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }, scheduleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, gap: 8 }, scheduleSubject: { fontSize: 12, fontWeight: '800' }, scheduleMeta: { fontSize: 10, lineHeight: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardHeaderCopy: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  cardSubtitle: { fontSize: 12, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  saveButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  actionButton: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { fontSize: 14, fontWeight: '700' },
  scoreBadge: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  scoreText: { fontSize: 14, fontWeight: '800' }
});

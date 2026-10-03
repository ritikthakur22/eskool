import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';
import { api } from '../../../core/networking/api';
import { getSelectedChildId } from '../../../core/utils/childSelection';

export default function ExamsScreen({ navigation }: any) {
  const { colors } = useTheme(); const styles = makeStyles(colors);
  const [activeTab, setActiveTab] = useState('Online Exam');
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const [childId, setChildId] = useState('');
  const [childName, setChildName] = useState('');
  
  // Management state
  const [structure, setStructure] = useState<any>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editExam, setEditExam] = useState<any>(null);
  const [form, setForm] = useState({ title: '', subjectId: '', sectionId: '', date: '' });
  const [saving, setSaving] = useState(false);

  const tabs = useMemo(() => {
    return ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(role) ? ['Manage', 'Results'] : ['Online Exam', 'Upcoming', 'Result'];
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
        setExams(examRes.data);
        setStructure(structRes.data);
      } else {
        if (nextRole === 'PARENT') {
          const selectedId = (await getSelectedChildId()) || '';
          setChildId(selectedId);
          if (!selectedId) throw new Error('Select a child from the home screen first.');
          const childRes = await api.get('/academics/children').catch(() => ({ data: [] }));
          const data = Array.isArray(childRes.data) ? childRes.data : [];
          const child = data.find((item: any) => item.student?.id === selectedId) || data[0];
          const profile = child?.student?.studentProfile;
          setChildName([profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || child?.student?.email || 'Selected child');
        }
        const endpoint = nextRole === 'PARENT' ? `/exams/child/${childId}` : '/exams/me';
        const res = await api.get(endpoint);
        setExams(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Could not load exams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [activeTab]);

  const now = Date.now();
  const visibleExams = exams.filter(exam => activeTab !== 'Upcoming' || new Date(exam.date).getTime() >= now);
  const isManagement = ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(role);

  const openEditor = (e: any = null) => {
    setEditExam(e);
    setForm(e ? { title: e.title, subjectId: e.subjectId, sectionId: e.sectionId, date: e.date.split('T')[0], type: e.type || 'MCQ' } : { title: '', subjectId: '', sectionId: '', date: new Date().toISOString().split('T')[0], type: 'MCQ' });
    setEditorVisible(true);
  };

  const saveExam = async () => {
    if (!form.title || !form.subjectId || !form.sectionId || !form.date) return Alert.alert('Error', 'Fill all fields.');
    setSaving(true);
    try {
      if (editExam) await api.patch(`/exams/${editExam.id}`, { title: form.title, date: new Date(form.date).toISOString(), type: form.type });
      else await api.post('/exams', { ...form, date: new Date(form.date).toISOString() });
      setEditorVisible(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save exam.');
    } finally { setSaving(false); }
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
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab, { borderColor: activeTab === tab ? colors.primary : colors.border }]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText, { color: activeTab === tab ? colors.primary : colors.subText }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isManagement && activeTab === 'Manage' && (
          <TouchableOpacity style={styles.addButton} onPress={() => openEditor()}>
            <Text style={styles.addButtonText}>+ Create New Exam</Text>
          </TouchableOpacity>
        )}
        
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.subText, marginTop: 10 }}>Loading exams...</Text></View>
        ) : error ? (
          <View style={styles.center}><Text style={{ color: colors.danger }}>{error}</Text></View>
        ) : visibleExams.length === 0 ? (
          <View style={styles.center}><Text style={{ color: colors.subText }}>No exams found.</Text></View>
        ) : (
          visibleExams.map((exam) => (
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
          ))
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

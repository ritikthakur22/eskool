import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';
import { api } from '../../../core/networking/api';
import { getSelectedChildId } from '../../../core/utils/childSelection';

export default function ResultScreen({ navigation }: any) {
  const { colors } = useTheme(); const styles = makeStyles(colors);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const [childId, setChildId] = useState('');
  const [childName, setChildName] = useState('');
  
  // Management state for teachers
  const [exams, setExams] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [editorVisible, setEditorVisible] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [form, setForm] = useState({ studentId: '', marksObtained: '', totalMarks: '100', grade: '' });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const raw = await SecureStore.getItemAsync('user_data');
      if (!raw) { setLoading(false); return; }
      const nextRole = JSON.parse(raw).role || '';
      setRole(nextRole);

      if (['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(nextRole)) {
        const [examRes, studentRes] = await Promise.all([
          api.get('/exams/manage'),
          api.get('/users/admin/users?role=STUDENT')
        ]);
        setExams(examRes.data);
        setStudents(studentRes.data);
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
        const endpoint = nextRole === 'PARENT' ? `/exams/student/${childId}` : '/exams/me/results';
        const res = await api.get(endpoint);
        setResults(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Could not load results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const isManagement = ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(role);
  const allRows = results.flatMap(group => group.results || []);
  const totalMarks = allRows.reduce((sum, row) => sum + Number(row.marksObtained || 0), 0);
  const maximumMarks = allRows.reduce((sum, row) => sum + Number(row.totalMarks || 0), 0);
  const overallPercentage = maximumMarks ? Math.round((totalMarks / maximumMarks) * 100) : 0;

  const openEditor = (exam: any) => {
    setSelectedExam(exam);
    setForm({ studentId: '', marksObtained: '', totalMarks: '100', grade: '' });
    setEditorVisible(true);
  };

  const submitResult = async () => {
    if (!form.studentId || !form.marksObtained || !form.totalMarks) return Alert.alert('Error', 'Fill all required fields.');
    setSaving(true);
    try {
      await api.post('/exams/result', {
        examId: selectedExam.id,
        studentId: form.studentId,
        marksObtained: Number(form.marksObtained),
        totalMarks: Number(form.totalMarks),
        grade: form.grade || undefined
      });
      setEditorVisible(false);
      Alert.alert('Success', 'Result added successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add result.');
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24} color={colors.text} /></TouchableOpacity>
        <View style={styles.headerCopy}><Text style={styles.headerTitle}>Results</Text>{role === 'PARENT' && <Text style={styles.headerSubtitle}>{childName ? `For ${childName}` : 'Select a child from Home'}</Text>}</View>
        <TouchableOpacity style={styles.backButton} onPress={loadData}><Ionicons name="refresh" size={20} color={colors.primary} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.subText, marginTop: 10 }}>Loading...</Text></View>
        ) : error ? (
          <View style={styles.center}><Text style={{ color: colors.danger }}>{error}</Text></View>
        ) : isManagement ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15 }]}>Manage Results by Exam</Text>
            {exams.length === 0 ? <View style={styles.center}><Text style={{ color: colors.subText }}>No exams available.</Text></View> : exams.map((exam) => (
              <TouchableOpacity key={exam.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => openEditor(exam)}>
                <View style={styles.cardHeaderCopy}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{exam.title}</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.subText }]}>{exam.subject?.name} · Class {exam.section?.class?.name} {exam.section?.name}</Text>
                </View>
                <Ionicons name="add-circle" size={24} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.summaryItem}><Text style={[styles.summaryValue, { color: colors.primary }]}>{overallPercentage}%</Text><Text style={[styles.summaryLabel, { color: colors.subText }]}>Overall</Text></View>
              <View style={styles.summaryItem}><Text style={[styles.summaryValue, { color: colors.text }]}>{totalMarks} / {maximumMarks}</Text><Text style={[styles.summaryLabel, { color: colors.subText }]}>Marks</Text></View>
            </View>
            {results.map((group, idx) => (
              <View key={idx} style={{ marginBottom: 20 }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{group.examName}</Text>
                {group.results?.map((row: any, i: number) => (
                  <View key={i} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeaderCopy}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>{row.subject}</Text>
                      <Text style={[styles.cardSubtitle, { color: colors.subText }]}>Marks: {row.marksObtained} / {row.totalMarks}</Text>
                    </View>
                    {row.grade && <View style={[styles.badge, { backgroundColor: colors.primary + '18' }]}><Text style={{ color: colors.primary, fontWeight: '800' }}>{row.grade}</Text></View>}
                  </View>
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={editorVisible} animationType="slide" transparent onRequestClose={() => setEditorVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Result</Text>
              <TouchableOpacity onPress={() => setEditorVisible(false)}><Ionicons name="close" size={24} color={colors.subText} /></TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700', marginBottom: 15 }}>{selectedExam?.title} ({selectedExam?.subject?.name})</Text>
              <Text style={[styles.inputLabel, { color: colors.subText }]}>Student</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                {students.map((s: any) => (
                  <TouchableOpacity key={s.id} onPress={() => setForm({...form, studentId: s.id})} style={[styles.chip, { borderColor: colors.border, backgroundColor: form.studentId === s.id ? colors.primary + '18' : colors.card }]}>
                    <Text style={{ color: form.studentId === s.id ? colors.primary : colors.subText }}>{s.studentProfile?.firstName || s.email}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.subText }]}>Marks</Text>
                  <TextInput value={form.marksObtained} onChangeText={t => setForm({...form, marksObtained: t})} keyboardType="numeric" style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} placeholder="85" placeholderTextColor={colors.subText} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.subText }]}>Out of</Text>
                  <TextInput value={form.totalMarks} onChangeText={t => setForm({...form, totalMarks: t})} keyboardType="numeric" style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} placeholder="100" placeholderTextColor={colors.subText} />
                </View>
              </View>
              <Text style={[styles.inputLabel, { color: colors.subText }]}>Grade (Optional)</Text>
              <TextInput value={form.grade} onChangeText={t => setForm({...form, grade: t})} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} placeholder="A+" placeholderTextColor={colors.subText} />
              
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={submitResult} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Add Result</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
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
  content: { padding: 16, paddingBottom: 40 },
  center: { padding: 40, alignItems: 'center' },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  cardHeaderCopy: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  cardSubtitle: { fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '900', marginBottom: 12, marginTop: 10 },
  summaryCard: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 20 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 28, fontWeight: '900' },
  summaryLabel: { fontSize: 12, fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  saveButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' }
});

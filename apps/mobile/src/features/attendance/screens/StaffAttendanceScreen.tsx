import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { api, API_BASE_URL } from '../../../core/networking/api';
import { getInMemoryAccessToken } from '../../../core/networking/session';
import { useTheme } from '../../../core/theme/ThemeContext';
import BottomNavigation from '../../../core/components/BottomNavigation';

type Status = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
type RecordItem = { id: string; date: string; status: Status; subject?: string; createdAt?: string };
type Student = { studentId: string; rollNo?: string; student?: { email: string; studentProfile?: { firstName: string; lastName: string; rollNo: string } } };
const statusColor = (s: Status) => s === 'PRESENT' ? '#16A36A' : s === 'ABSENT' ? '#EF4444' : s === 'LATE' ? '#F59E0B' : '#3B82F6';

export default function StaffAttendanceScreen({ navigation }: any) {
  const { colors } = useTheme(); const s = makeStyles(colors);
  const [role, setRole] = useState('TEACHER');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sections, setSections] = useState<any[]>([]);
  const [sectionId, setSectionId] = useState('');
  
  // Subject Selection
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectId, setSubjectId] = useState('');

  const [students, setStudents] = useState<Student[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<Record<string, Status>>({});
  const [editing, setEditing] = useState<any | null>(null);
  const [reason, setReason] = useState('');

  const loadBase = async () => {
    try {
      const raw = await SecureStore.getItemAsync('user_data');
      if (raw) setRole(JSON.parse(raw).role || 'TEACHER');
      const struct = await api.get('/academics/structure').catch(() => ({ data: {} }));
      const allSections = (struct.data.classes || []).flatMap((c: any) => (c.sections || []).map((sec: any) => ({ ...sec, className: c.name })));
      setSections(allSections);
      if (allSections.length && !sectionId) setSectionId(allSections[0].id);
      setSubjects(struct.data.subjects || []);
    } catch { setError('Failed to load classes.'); }
  };

  const load = useCallback(async () => {
    if (!sectionId || !date) return;
    setLoading(true); setError('');
    try {
      const res = await api.get('/attendance/register', { params: { date, sectionId } });
      setStudents(res.data.students || []);
      setRows(res.data.records || []);
      const defaults: Record<string, Status> = {};
      (res.data.students || []).forEach((st: Student) => { defaults[st.studentId] = 'PRESENT'; });
      setDrafts(defaults);
    } catch (e: any) { setError(e.response?.data?.message || 'Failed to load register.'); }
    finally { setLoading(false); }
  }, [sectionId, date]);

  useEffect(() => { loadBase(); }, []);
  useEffect(() => { load(); }, [load]);

  const exportCsv = async () => {
    try {
      const d = new Date(date);
      const url = `${API_BASE_URL}/attendance/export?sectionId=${sectionId}&month=${d.getMonth() + 1}&year=${d.getFullYear()}`;
      const token = await getInMemoryAccessToken();
      const path = `${FileSystem.documentDirectory}Attendance_Export.csv`;
      const dl = FileSystem.createDownloadResumable(url, path, { headers: { Authorization: `Bearer ${token}` } });
      const result = await dl.downloadAsync();
      if (result && result.uri) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(result.uri);
        } else {
          Alert.alert('Success', 'File downloaded, but sharing is not supported on this device.');
        }
      }
    } catch (e: any) {
      Alert.alert('Export Failed', 'Could not export attendance data.');
    }
  };

  const setStatus = (id: string, st: Status) => setDrafts(d => ({ ...d, [id]: st }));
  
  const markBulk = async () => {
    setSaving(true);
    try {
      const payload = {
        sectionId, date, subjectId: subjectId || undefined,
        records: students.map(st => ({ studentId: st.studentId, status: drafts[st.studentId] }))
      };
      await api.post('/attendance/register/bulk', payload);
      await load();
      Alert.alert('Success', 'Attendance saved.');
    } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const correct = async () => {
    if (!editing || !reason.trim()) return Alert.alert('Error', 'Please provide a reason for correction.');
    setSaving(true);
    try {
      await api.patch(`/attendance/${editing.id}`, { status: editing.status, reason });
      setEditing(null); setReason('');
      await load();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Failed to update.'); }
    finally { setSaving(false); }
  };

  const sectionLabel = sections.find(s => s.id === sectionId);
  const nameFor = (row: any) => {
    const profile = row.student?.studentProfile;
    return [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || row.student?.email || 'Student';
  };

  return <SafeAreaView style={s.screen}>
    <View style={s.header}>
      <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24} color={colors.text} /></TouchableOpacity>
      <View style={s.headerCopy}><Text style={s.title}>Class Register</Text></View>
      <TouchableOpacity style={s.refresh} onPress={exportCsv}><Ionicons name="download-outline" size={20} color={colors.primary} /></TouchableOpacity>
      <TouchableOpacity style={s.refresh} onPress={load}><Ionicons name="refresh" size={20} color={colors.primary} /></TouchableOpacity>
    </View>
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.filters}>
        <TextInput value={date} onChangeText={setDate} onSubmitEditing={load} placeholder="YYYY-MM-DD" placeholderTextColor={colors.subText} style={s.dateInput} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.sectionChoices}>
          {sections.map(sec => (
            <TouchableOpacity key={sec.id} onPress={() => setSectionId(sec.id)} style={[s.choice, sectionId === sec.id && s.choiceActive]}>
              <Text style={[s.choiceText, sectionId === sec.id && s.choiceTextActive]}>{sec.className} {sec.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {subjects.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.sectionChoices}>
            <TouchableOpacity onPress={() => setSubjectId('')} style={[s.choice, !subjectId && s.choiceActive]}>
              <Text style={[s.choiceText, !subjectId && s.choiceTextActive]}>Day / General</Text>
            </TouchableOpacity>
            {subjects.map((sub: any) => (
              <TouchableOpacity key={sub.id} onPress={() => setSubjectId(sub.id)} style={[s.choice, subjectId === sub.id && s.choiceActive]}>
                <Text style={[s.choiceText, subjectId === sub.id && s.choiceTextActive]}>{sub.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
      
      {loading ? <View style={s.center}><ActivityIndicator color={colors.primary} /><Text style={s.muted}>Loading register…</Text></View> : error ? <View style={s.center}><Text style={s.muted}>{error}</Text></View> : <>
        {students.length > 0 && <View style={s.markCard}>
          <View style={s.cardHeader}>
            <View><Text style={s.sectionTitle}>Mark {sectionLabel?.className} {sectionLabel?.name}</Text></View>
            <TouchableOpacity disabled={saving} onPress={markBulk} style={s.saveButton}>{saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveText}>Save All</Text>}</TouchableOpacity>
          </View>
          {students.map(st => {
            const profile = st.student?.studentProfile;
            const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || st.student?.email || 'Student';
            const selected = drafts[st.studentId] || 'PRESENT';
            return <View key={st.studentId} style={s.studentRow}>
              <View style={{ flex: 1 }}><Text style={s.studentName}>{name}</Text><Text style={s.muted}>Roll {st.rollNo || profile?.rollNo || '—'}</Text></View>
              <View style={s.statusRow}>{(['PRESENT', 'ABSENT', 'LATE'] as Status[]).map(status => <TouchableOpacity key={status} onPress={() => setStatus(st.studentId, status)} style={[s.statusButton, selected === status && { borderColor: statusColor(status), backgroundColor: statusColor(status) + '18' }]}><Text style={{ color: selected === status ? statusColor(status) : colors.subText, fontSize: 10, fontWeight: '900' }}>{status[0]}</Text></TouchableOpacity>)}</View>
            </View>
          })}
        </View>}
        <Text style={[s.sectionTitle, { marginTop: 17, marginBottom: 8 }]}>{rows.length} recorded sessions</Text>
        {rows.map(row => <TouchableOpacity key={row.id} onPress={() => setEditing(row)} style={s.record}>
          <View style={[s.marker, { backgroundColor: statusColor(row.status) }]} />
          <View style={{ flex: 1 }}><Text style={s.studentName}>{nameFor(row)}</Text><Text style={s.muted}>Marked at {new Date(row.createdAt || row.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text></View>
          <Text style={{ color: statusColor(row.status), fontSize: 10, fontWeight: '900' }}>{row.status.replace('_', ' ')}</Text>
          <Ionicons name="create-outline" size={17} color={colors.subText} />
        </TouchableOpacity>)}
      </>}
    </ScrollView>
    <BottomNavigation navigation={navigation} activeRoute="Attendance" colors={colors} role={role} />
    
    <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
      <View style={s.overlay}>
        <View style={s.modal}>
          <Text style={s.sectionTitle}>Correct Attendance</Text>
          <Text style={s.muted}>{editing ? nameFor(editing) : ''}</Text>
          <View style={s.statusChoices}>{(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'] as Status[]).map(status => <TouchableOpacity key={status} onPress={() => setEditing((c: any) => c ? { ...c, status } : c)} style={[s.choice, editing?.status === status && s.choiceActive]}><Text style={[s.choiceText, editing?.status === status && s.choiceTextActive]}>{status}</Text></TouchableOpacity>)}</View>
          <TextInput value={reason} onChangeText={setReason} placeholder="Reason for correction" placeholderTextColor={colors.subText} style={s.reason} />
          <View style={s.modalActions}>
            <TouchableOpacity onPress={() => setEditing(null)} style={s.cancel}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity disabled={saving} onPress={correct} style={s.saveButton}>{saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveText}>Save Correction</Text>}</TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  </SafeAreaView>;
}

const makeStyles = (c: any) => StyleSheet.create({ screen: { flex: 1, backgroundColor: c.background }, header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border }, back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, marginLeft: 8 }, title: { color: c.text, fontSize: 19, fontWeight: '900', marginTop: 2 }, refresh: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, content: { padding: 15, paddingBottom: 28 }, filters: { padding: 13, borderRadius: 15, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, dateInput: { height: 43, borderRadius: 10, borderWidth: 1, borderColor: c.border, color: c.text, paddingHorizontal: 11, fontSize: 12, backgroundColor: c.background }, sectionChoices: { gap: 7, paddingTop: 9 }, choice: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.card }, choiceActive: { backgroundColor: c.primary + '14', borderColor: c.primary }, choiceText: { color: c.subText, fontSize: 10, fontWeight: '800' }, choiceTextActive: { color: c.primary }, center: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 9 }, muted: { color: c.subText, fontSize: 10 }, markCard: { padding: 13, marginTop: 13, borderRadius: 15, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }, sectionTitle: { color: c.text, fontSize: 14, fontWeight: '900' }, saveButton: { minHeight: 36, paddingHorizontal: 11, borderRadius: 9, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }, saveText: { color: '#fff', fontSize: 10, fontWeight: '900' }, studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderColor: c.border }, studentName: { color: c.text, fontSize: 11, fontWeight: '800' }, statusRow: { flexDirection: 'row', gap: 5 }, statusButton: { width: 29, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: c.border }, record: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, marginBottom: 7, borderRadius: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, marker: { width: 7, height: 30, borderRadius: 4 }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000070' }, modal: { backgroundColor: c.card, padding: 19, borderTopLeftRadius: 22, borderTopRightRadius: 22 }, statusChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginVertical: 14 }, reason: { height: 46, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 11, color: c.text, backgroundColor: c.background }, modalActions: { flexDirection: 'row', gap: 8, marginTop: 13 }, cancel: { flex: 1, minHeight: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: c.mutedSurface }, cancelText: { color: c.text, fontWeight: '800', fontSize: 11 } });

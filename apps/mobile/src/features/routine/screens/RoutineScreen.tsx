import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../core/networking/api';
import { useTheme } from '../../../core/theme/ThemeContext';
import { getCachedUserData } from '../../../core/networking/session';

const DAYS = [{ id: 1, name: 'Monday' }, { id: 2, name: 'Tuesday' }, { id: 3, name: 'Wednesday' }, { id: 4, name: 'Thursday' }, { id: 5, name: 'Friday' }, { id: 6, name: 'Saturday' }, { id: 0, name: 'Sunday' }];
const initials = (name: string) => name.trim().slice(0, 2).toUpperCase();

export default function RoutineScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [role, setRole] = useState('STUDENT');
  const [structure, setStructure] = useState<any>({ classes: [], subjects: [], assignments: [] });
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [routines, setRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [day, setDay] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:45');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const classes = structure.classes || [];
  const selectedClass = classes.find((item: any) => item.id === classId);
  const sections = selectedClass?.sections || [];
  const assignments = useMemo(() => (structure.assignments || []).filter((item: any) => item.sectionId === sectionId && item.academicYear?.isCurrent), [structure.assignments, sectionId]);
  const subjects = useMemo(() => {
    const byId = new Map<string, any>();
    assignments.forEach((item: any) => byId.set(item.subjectId, item.subject));
    return [...byId.values()].filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
  }, [assignments]);
  const teachersForSubject = useMemo(() => assignments.filter((item: any) => !subjectId || item.subjectId === subjectId).map((item: any) => ({ id: item.teacherId, name: [item.teacher?.teacherProfile?.firstName, item.teacher?.teacherProfile?.lastName].filter(Boolean).join(' ') || item.teacher?.email || 'Teacher' })), [assignments, subjectId]);

  const loadUserAndStructure = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const cached = await getCachedUserData();
      const currentRole = cached ? JSON.parse(cached).role || 'STUDENT' : 'STUDENT';
      setRole(currentRole);
      if (currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN') {
        const { data } = await api.get('/academics/structure');
        const nextStructure = { classes: data.classes || [], subjects: data.subjects || [], assignments: data.assignments || [] };
        setStructure(nextStructure);
        const nextClass = nextStructure.classes.find((item: any) => item.id === classId) || nextStructure.classes[0];
        const nextSection = nextClass?.sections?.find((item: any) => item.id === sectionId) || nextClass?.sections?.[0];
        setClassId(nextClass?.id || ''); setSectionId(nextSection?.id || '');
        if (!nextSection) { setRoutines([]); setLoading(false); }
      } else {
        const { data } = await api.get('/routine/class');
        setRoutines(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Could not load the class routine.'); setLoading(false);
    }
  }, [classId, sectionId]);

  const loadSelectedRoutine = useCallback(async () => {
    if (!isAdmin || !sectionId) return;
    setLoading(true); setError('');
    try {
      const { data } = await api.get(`/routine/class/section/${sectionId}`);
      setRoutines(Array.isArray(data) ? data : []);
    } catch (e: any) { setError(e.response?.data?.message || 'Could not load this section routine.'); }
    finally { setLoading(false); }
  }, [isAdmin, sectionId]);

  useEffect(() => { loadUserAndStructure(); }, []);
  useEffect(() => { if (isAdmin && sectionId) loadSelectedRoutine(); }, [isAdmin, sectionId, loadSelectedRoutine]);

  const periods = useMemo(() => {
    const values = new Map<string, { startTime: string; endTime: string }>();
    routines.forEach(item => values.set(`${item.startTime}-${item.endTime}`, { startTime: item.startTime, endTime: item.endTime }));
    return [...values.values()].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [routines]);

  const openEditor = (entry?: any, targetDay = 1, period?: any) => {
    const chosenSubject = entry?.subjectId || assignments[0]?.subjectId || '';
    setEditing(entry || null); setDay(entry?.dayOfWeek ?? targetDay);
    setStartTime(entry?.startTime || period?.startTime || '09:00');
    setEndTime(entry?.endTime || period?.endTime || '09:45');
    setSubjectId(chosenSubject);
    const teacherOptions = assignments.filter((item: any) => !chosenSubject || item.subjectId === chosenSubject);
    setTeacherId(entry?.teacherId || teacherOptions[0]?.teacherId || '');
    setEditorOpen(true);
  };

  const saveEntry = async () => {
    if (!sectionId || !subjectId || !teacherId) { Alert.alert('Complete the routine entry', 'Choose an assigned subject and teacher first.'); return; }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || startTime >= endTime) { Alert.alert('Check the time', 'Use 24-hour time (HH:mm) and set an end time after the start time.'); return; }
    setSaving(true);
    try {
      const payload = { sectionId, subjectId, teacherId, dayOfWeek: day, startTime, endTime };
      if (editing) await api.patch(`/routine/class/${editing.id}`, payload);
      else await api.post('/routine/class', payload);
      setEditorOpen(false); await loadSelectedRoutine();
    } catch (e: any) { Alert.alert('Could not save', e.response?.data?.message || 'Please check the teacher assignment and try again.'); }
    finally { setSaving(false); }
  };

  const deleteEntry = (entry: any) => Alert.alert('Remove this period?', `${entry.subject?.name || 'This class'} · ${entry.startTime}–${entry.endTime}`, [
    { text: 'Keep period', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => {
      try { await api.delete(`/routine/class/${entry.id}`); await loadSelectedRoutine(); }
      catch (e: any) { Alert.alert('Could not remove period', e.response?.data?.message || 'Please try again.'); }
    } },
  ]);

  const showAdminGrid = isAdmin;
  return <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity accessibilityLabel="Go back" style={styles.back} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24} color={colors.text} /></TouchableOpacity>
      <View style={styles.headerCopy}><Text style={styles.eyebrow}>WEEKLY PLANNER</Text><Text style={styles.title}>Class routine</Text></View>
      <TouchableOpacity accessibilityLabel="Refresh routine" style={styles.refresh} onPress={isAdmin ? loadSelectedRoutine : loadUserAndStructure}><Ionicons name="refresh" size={19} color={colors.primary} /></TouchableOpacity>
    </View>

    {showAdminGrid && <View style={styles.selectorPanel}>
      <Text style={styles.sectionLabel}>SELECT CLASS</Text>
      {classes.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>{classes.map((item: any) => <TouchableOpacity key={item.id} onPress={() => { setClassId(item.id); setSectionId(item.sections?.[0]?.id || ''); }} style={[styles.chip, classId === item.id && styles.chipActive]}><Text style={[styles.chipText, classId === item.id && styles.chipTextActive]}>{item.name}</Text></TouchableOpacity>)}</ScrollView> : <Text style={styles.helper}>Create classes and sections in Academic Structure first.</Text>}
      {!!sections.length && <><Text style={styles.sectionLabel}>SECTION</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>{sections.map((item: any) => <TouchableOpacity key={item.id} onPress={() => setSectionId(item.id)} style={[styles.chip, styles.sectionChip, sectionId === item.id && styles.chipActive]}><Text style={[styles.chipText, sectionId === item.id && styles.chipTextActive]}>Section {item.name}</Text></TouchableOpacity>)}</ScrollView></>}
    </View>}

    <ScrollView contentContainerStyle={styles.content}>
      {loading ? <View style={styles.state}><ActivityIndicator color={colors.primary} /><Text style={styles.stateText}>Loading routine…</Text></View>
        : error ? <View style={styles.state}><Ionicons name="cloud-offline-outline" size={27} color={colors.subText} /><Text style={styles.stateText}>{error}</Text><TouchableOpacity onPress={isAdmin ? loadSelectedRoutine : loadUserAndStructure}><Text style={styles.retryText}>Try again</Text></TouchableOpacity></View>
        : showAdminGrid ? !sectionId ? <View style={styles.state}><Ionicons name="albums-outline" size={28} color={colors.primary} /><Text style={styles.stateText}>Add a section to a class to start building its weekly routine.</Text></View>
          : <>
            <View style={styles.gridIntro}><View><Text style={styles.gridTitle}>{selectedClass?.name || 'Class'} · Section {sections.find((item: any) => item.id === sectionId)?.name || ''}</Text><Text style={styles.gridSubtitle}>Tap a cell to add, edit, or remove a period.</Text></View><View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveText}>EDITABLE</Text></View></View>
            {!periods.length ? <View style={styles.emptyGrid}><View style={styles.emptyIcon}><Ionicons name="grid-outline" size={23} color={colors.primary} /></View><Text style={styles.emptyTitle}>Start this class routine</Text><Text style={styles.stateText}>Add the first period. Its time slot will become a column for every school day.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => openEditor(undefined, 1)}><Ionicons name="add" size={18} color="#fff" /><Text style={styles.primaryButtonText}>Add first period</Text></TouchableOpacity></View>
              : <><TouchableOpacity style={styles.addPeriodButton} onPress={() => openEditor(undefined, 1)}><Ionicons name="add-circle-outline" size={17} color={colors.primary} /><Text style={styles.addPeriodText}>Add period / time column</Text></TouchableOpacity><ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.tableScroller}><View>
                <View style={styles.tableRow}><View style={[styles.dayCell, styles.cornerCell]}><Text style={styles.columnHeading}>DAY</Text></View>{periods.map(period => <View key={`${period.startTime}-${period.endTime}`} style={styles.periodHeading}><Text style={styles.columnHeading}>PERIOD {periods.indexOf(period) + 1}</Text><Text style={styles.periodTime}>{period.startTime}–{period.endTime}</Text></View>)}</View>
                {DAYS.map(dayItem => <View key={dayItem.id} style={styles.tableRow}><View style={styles.dayCell}><Text style={styles.dayName}>{dayItem.name}</Text></View>{periods.map(period => {
                  const entry = routines.find(item => item.dayOfWeek === dayItem.id && item.startTime === period.startTime && item.endTime === period.endTime);
                  return <TouchableOpacity key={`${dayItem.id}-${period.startTime}`} activeOpacity={0.75} onPress={() => entry ? openEditor(entry) : openEditor(undefined, dayItem.id, period)} style={[styles.tableCell, entry && styles.filledCell]}>
                    {entry ? <><View style={styles.cellTop}><Text style={styles.cellSubject} numberOfLines={1}>{entry.subject?.name || 'Subject'}</Text><TouchableOpacity accessibilityLabel="Delete routine period" onPress={() => deleteEntry(entry)} hitSlop={8}><Ionicons name="close-circle" size={17} color={colors.danger} /></TouchableOpacity></View><Text style={styles.cellTeacher} numberOfLines={1}>{[entry.teacher?.teacherProfile?.firstName, entry.teacher?.teacherProfile?.lastName].filter(Boolean).join(' ') || 'Teacher'}</Text><View style={styles.cellEdit}><Ionicons name="create-outline" size={12} color={colors.primary} /><Text style={styles.cellEditText}>Edit</Text></View></> : <View style={styles.addCell}><Ionicons name="add-circle-outline" size={20} color={colors.primary} /><Text style={styles.addCellText}>Add</Text></View>}
                  </TouchableOpacity>;
                })}</View>)}
              </View></ScrollView></>}
            {!!sectionId && !!periods.length && <View style={styles.tip}><Ionicons name="information-circle-outline" size={17} color={colors.primary} /><Text style={styles.tipText}>Periods are shared time columns. Add a period from any day, then fill its other days.</Text></View>}
            {!!sectionId && <View style={styles.assignmentNote}><Ionicons name="people-outline" size={17} color={colors.subText} /><Text style={styles.helper}>Only teachers assigned to this section and subject for the current academic year can be scheduled.</Text></View>}
          </>
        : routines.length === 0 ? <View style={styles.state}><Ionicons name="calendar-outline" size={28} color={colors.subText} /><Text style={styles.stateText}>No routine is published for your class yet.</Text></View>
          : DAYS.map(dayItem => {
            const entries = routines.filter(item => item.dayOfWeek === dayItem.id).sort((a, b) => a.startTime.localeCompare(b.startTime));
            if (!entries.length) return null;
            return <View key={dayItem.id} style={styles.dayCard}><View style={styles.dayHeader}><View style={styles.dayIcon}><Ionicons name="calendar-outline" size={17} color={colors.primary} /></View><Text style={styles.dayTitle}>{dayItem.name}</Text><Text style={styles.dayCount}>{entries.length} periods</Text></View>{entries.map((entry, index) => <View key={entry.id} style={[styles.readPeriod, index === entries.length - 1 && { borderBottomWidth: 0 }]}><View style={styles.timePill}><Text style={styles.readTime}>{entry.startTime}</Text><View style={styles.timeRule} /><Text style={styles.readTimeEnd}>{entry.endTime}</Text></View><View style={styles.readCopy}><Text style={styles.readSubject}>{entry.subject?.name || 'Subject'}</Text><Text style={styles.readTeacher}>{[entry.teacher?.teacherProfile?.firstName, entry.teacher?.teacherProfile?.lastName].filter(Boolean).join(' ') || 'Teacher'}{entry.section ? ` · ${entry.section.class?.name} ${entry.section.name}` : ''}</Text></View></View>)}</View>;
          })}
    </ScrollView>

    <Modal visible={editorOpen} transparent animationType="slide" onRequestClose={() => !saving && setEditorOpen(false)}>
      <View style={styles.overlay}><View style={styles.modal}>
        <View style={styles.modalHeader}><View><Text style={styles.eyebrow}>{editing ? 'UPDATE TIMETABLE' : 'BUILD TIMETABLE'}</Text><Text style={styles.modalTitle}>{editing ? 'Edit period' : 'Add period'}</Text></View><TouchableOpacity disabled={saving} onPress={() => setEditorOpen(false)}><Ionicons name="close-circle" size={26} color={colors.subText} /></TouchableOpacity></View>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>DAY</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>{DAYS.map(item => <TouchableOpacity key={item.id} onPress={() => setDay(item.id)} style={[styles.chip, day === item.id && styles.chipActive]}><Text style={[styles.chipText, day === item.id && styles.chipTextActive]}>{initials(item.name)}</Text></TouchableOpacity>)}</ScrollView>
          <View style={styles.timeFields}><View style={styles.timeField}><Text style={styles.sectionLabel}>START · 24H</Text><TextInput value={startTime} onChangeText={setStartTime} placeholder="09:00" keyboardType="numbers-and-punctuation" maxLength={5} style={styles.input} placeholderTextColor={colors.subText} /></View><View style={styles.timeSeparator}><Text style={styles.timeDash}>—</Text></View><View style={styles.timeField}><Text style={styles.sectionLabel}>END · 24H</Text><TextInput value={endTime} onChangeText={setEndTime} placeholder="09:45" keyboardType="numbers-and-punctuation" maxLength={5} style={styles.input} placeholderTextColor={colors.subText} /></View></View>
          <Text style={styles.sectionLabel}>SUBJECT</Text>{subjects.length ? <View style={styles.optionList}>{subjects.map((item: any) => <TouchableOpacity key={item.id} onPress={() => { setSubjectId(item.id); const next = assignments.find((row: any) => row.subjectId === item.id); setTeacherId(next?.teacherId || ''); }} style={[styles.option, subjectId === item.id && styles.optionActive]}><Text style={[styles.optionText, subjectId === item.id && styles.optionTextActive]}>{item.name}</Text>{subjectId === item.id && <Ionicons name="checkmark-circle" size={17} color={colors.primary} />}</TouchableOpacity>)}</View> : <Text style={styles.helper}>No subjects are assigned to this section for the current academic year. Add a teacher assignment in Academic Structure first.</Text>}
          <Text style={styles.sectionLabel}>ASSIGNED TEACHER</Text>{teachersForSubject.length ? <View style={styles.optionList}>{teachersForSubject.map((item: any) => <TouchableOpacity key={item.id} onPress={() => setTeacherId(item.id)} style={[styles.option, teacherId === item.id && styles.optionActive]}><Text style={[styles.optionText, teacherId === item.id && styles.optionTextActive]}>{item.name}</Text>{teacherId === item.id && <Ionicons name="checkmark-circle" size={17} color={colors.primary} />}</TouchableOpacity>)}</View> : <Text style={styles.helper}>Assign a teacher to this subject and section first.</Text>}
        </ScrollView>
        <TouchableOpacity disabled={saving || !subjects.length || !teachersForSubject.length} onPress={saveEntry} style={[styles.primaryButton, (saving || !subjects.length || !teachersForSubject.length) && { opacity: 0.55 }]}>{saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark" size={17} color="#fff" /><Text style={styles.primaryButtonText}>{editing ? 'Save changes' : 'Add to routine'}</Text></>}</TouchableOpacity>
      </View></View>
    </Modal>
  </SafeAreaView>;
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background }, header: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderColor: c.border }, back: { width: 38, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 8 }, headerCopy: { flex: 1 }, eyebrow: { color: c.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, title: { fontSize: 19, fontWeight: '900', color: c.text, marginTop: 2 }, refresh: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: c.primary + '14' },
  selectorPanel: { paddingHorizontal: 14, paddingTop: 9, paddingBottom: 5, backgroundColor: c.card, borderBottomWidth: 1, borderColor: c.border }, sectionLabel: { color: c.subText, fontSize: 9, fontWeight: '900', letterSpacing: 0.9, marginBottom: 6, marginTop: 7 }, chipRow: { flexDirection: 'row', gap: 7, paddingBottom: 6 }, chip: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 11, borderWidth: 1, borderColor: c.border, backgroundColor: c.background }, sectionChip: { minHeight: 29, paddingHorizontal: 11 }, chipActive: { backgroundColor: c.primary + '16', borderColor: c.primary }, chipText: { color: c.subText, fontSize: 10, fontWeight: '800' }, chipTextActive: { color: c.primary },
  content: { padding: 14, paddingBottom: 32, flexGrow: 1 }, state: { minHeight: 150, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 18, gap: 8 }, stateText: { color: c.subText, fontSize: 11, textAlign: 'center', lineHeight: 17 }, retryText: { color: c.primary, fontSize: 12, fontWeight: '900', marginTop: 4 }, helper: { color: c.subText, fontSize: 10, lineHeight: 15, paddingVertical: 5 }, gridIntro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, gridTitle: { color: c.text, fontSize: 14, fontWeight: '900' }, gridSubtitle: { color: c.subText, fontSize: 10, marginTop: 3 }, liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: c.success + '14' }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.success }, liveText: { color: c.success, fontSize: 8, fontWeight: '900', letterSpacing: 0.6 }, addPeriodButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 9, borderRadius: 10, backgroundColor: c.primary + '12' }, addPeriodText: { color: c.primary, fontSize: 10, fontWeight: '900' },
  emptyGrid: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 30, borderRadius: 17, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, gap: 9 }, emptyIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '14' }, emptyTitle: { color: c.text, fontSize: 14, fontWeight: '900' }, primaryButton: { minHeight: 44, paddingHorizontal: 15, marginTop: 12, borderRadius: 12, backgroundColor: c.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, primaryButtonText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  tableScroller: { paddingBottom: 4 }, tableRow: { flexDirection: 'row' }, dayCell: { width: 88, minHeight: 85, justifyContent: 'center', paddingHorizontal: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.card }, cornerCell: { minHeight: 55, borderTopLeftRadius: 12 }, columnHeading: { color: c.subText, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }, dayName: { color: c.text, fontSize: 10, fontWeight: '900' }, periodHeading: { width: 144, height: 55, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: c.border, backgroundColor: c.card }, periodTime: { color: c.primary, fontSize: 9, fontWeight: '800', marginTop: 4 }, tableCell: { width: 144, minHeight: 85, padding: 8, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, justifyContent: 'center' }, filledCell: { backgroundColor: c.primary + '0C' }, cellTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 }, cellSubject: { color: c.text, fontSize: 10, fontWeight: '900', flex: 1 }, cellTeacher: { color: c.subText, fontSize: 9, marginTop: 5 }, cellEdit: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 7 }, cellEditText: { color: c.primary, fontSize: 8, fontWeight: '800' }, addCell: { alignItems: 'center', justifyContent: 'center', gap: 4 }, addCellText: { color: c.primary, fontSize: 9, fontWeight: '800' }, tip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 11, padding: 10, borderRadius: 11, backgroundColor: c.primary + '0D' }, tipText: { flex: 1, color: c.subText, fontSize: 9, lineHeight: 14 }, assignmentNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 8 },
  dayCard: { marginBottom: 12, backgroundColor: c.card, borderRadius: 15, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }, dayHeader: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, backgroundColor: c.primary + '0C', borderBottomWidth: 1, borderColor: c.border }, dayIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '14' }, dayTitle: { flex: 1, color: c.text, fontSize: 12, fontWeight: '900' }, dayCount: { color: c.subText, fontSize: 9, fontWeight: '700' }, readPeriod: { flexDirection: 'row', alignItems: 'center', minHeight: 68, paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1, borderColor: c.border }, timePill: { width: 63, alignItems: 'center', justifyContent: 'center', paddingVertical: 5, borderRadius: 10, backgroundColor: c.primary + '10' }, readTime: { color: c.primary, fontSize: 10, fontWeight: '900' }, timeRule: { width: 20, height: 1, backgroundColor: c.primary + '60', marginVertical: 3 }, readTimeEnd: { color: c.subText, fontSize: 9, fontWeight: '700' }, readCopy: { flex: 1, paddingLeft: 12 }, readSubject: { color: c.text, fontSize: 12, fontWeight: '900' }, readTeacher: { color: c.subText, fontSize: 10, marginTop: 4 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000075' }, modal: { maxHeight: '90%', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: c.card }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, modalTitle: { color: c.text, fontSize: 19, fontWeight: '900', marginTop: 3 }, timeFields: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 }, timeField: { flex: 1 }, timeSeparator: { height: 45, justifyContent: 'center' }, timeDash: { color: c.subText, fontSize: 14 }, input: { height: 43, paddingHorizontal: 11, borderRadius: 11, borderWidth: 1, borderColor: c.border, backgroundColor: c.background, color: c.text, fontSize: 13, fontWeight: '800' }, optionList: { gap: 6 }, option: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, borderRadius: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.background }, optionActive: { borderColor: c.primary, backgroundColor: c.primary + '10' }, optionText: { color: c.text, fontSize: 11, fontWeight: '700' }, optionTextActive: { color: c.primary, fontWeight: '900' },
});

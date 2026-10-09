import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../core/networking/api';
import { useTheme } from '../../../core/theme/ThemeContext';
import { getCachedUserData } from '../../../core/networking/session';

const DAYS = [{ id: 1, name: 'Monday' }, { id: 2, name: 'Tuesday' }, { id: 3, name: 'Wednesday' }, { id: 4, name: 'Thursday' }, { id: 5, name: 'Friday' }, { id: 6, name: 'Saturday' }];
const DEFAULT_DAYS = [1, 2, 3, 4, 5];
const DEFAULT_PERIODS = Array.from({ length: 10 }, (_, index) => {
  const startMinutes = 10 * 60 + index * 40;
  const endMinutes = startMinutes + 40;
  const formatTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  return { startTime: formatTime(startMinutes), endTime: formatTime(endMinutes), kind: 'CLASS' };
});
const KIND_LABELS: Record<string, string> = { CLASS: 'Class', ASSEMBLY: 'Assembly', BREAK: 'Break', LUNCH: 'Lunch', STUDY: 'Study / Dismissal', CUSTOM: 'Custom activity' };
const formatTime12 = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
};
const parseTime12 = (time: string) => {
  const match = time.trim().match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i);
  if (!match) return null;
  const hour12 = Number(match[1]) % 12;
  const hour24 = hour12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  return `${String(hour24).padStart(2, '0')}:${match[2]}`;
};
const initials = (name: string) => name.trim().slice(0, 2).toUpperCase();
const classSortValue = (name: string) => {
  const key = name.trim().toLowerCase().replace(/^(class|grade|standard)\s*/i, '').replace(/\s+/g, ' ');
  const earlyYears: Record<string, number> = { nursery: -3, lkg: -2, 'lower kg': -2, 'lower kindergarten': -2, ukg: -1, 'upper kg': -1, 'upper kindergarten': -1 };
  if (key in earlyYears) return earlyYears[key];
  const grade = key.match(/\d+/);
  return grade ? Number(grade[0]) : Number.MAX_SAFE_INTEGER;
};
const orderClasses = (items: any[]) => [...items].sort((a, b) => classSortValue(String(a.name || '')) - classSortValue(String(b.name || '')) || String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' }));
const subjectAccent = (id?: string | null) => ['#3182F6', '#16A36A', '#8B5CF6', '#F59E0B', '#E94D75', '#0798A8'][[...(id || '')].reduce((value, char) => value + char.charCodeAt(0), 0) % 6];

export default function RoutineScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [role, setRole] = useState('STUDENT');
  const [structure, setStructure] = useState<any>({ classes: [], subjects: [], assignments: [] });
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [gridDays, setGridDays] = useState(DEFAULT_DAYS);
  const [gridPeriods, setGridPeriods] = useState(DEFAULT_PERIODS);
  const [routines, setRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingGridPeriod, setEditingGridPeriod] = useState<any>(null);
  const [sourceGridPeriod, setSourceGridPeriod] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [kind, setKind] = useState('CLASS');
  const [label, setLabel] = useState('');
  const [day, setDay] = useState(1);
  const [startTimeText, setStartTimeText] = useState('10:00 AM');
  const [endTimeText, setEndTimeText] = useState('10:40 AM');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const visibleDays = gridDays.map(dayId => DAYS.find(item => item.id === dayId)).filter(Boolean) as typeof DAYS;
  const classes = structure.classes || [];
  const selectedClass = classes.find((item: any) => item.id === classId);
  const sections = selectedClass?.sections || [];
  const routineScopeId = sectionId || (!sections.length ? classId : '');
  const routineScopePath = sectionId ? `/section/${sectionId}` : classId ? `/by-class/${classId}` : '';
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
        const nextStructure = { classes: orderClasses(data.classes || []), subjects: data.subjects || [], assignments: data.assignments || [] };
        setStructure(nextStructure);
        const nextClass = nextStructure.classes.find((item: any) => item.id === classId) || nextStructure.classes[0];
        const nextSection = nextClass?.sections?.find((item: any) => item.id === sectionId) || nextClass?.sections?.[0];
        setClassId(nextClass?.id || ''); setSectionId(nextSection?.id || '');
        if (!nextSection) {
          setRoutines([]); setLoading(false);
          if (nextClass?.id && !(nextClass.sections || []).length) setClassId(nextClass.id);
        }
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
    if (!isAdmin || !routineScopeId) return;
    setLoading(true); setError('');
    try {
      const { data } = await api.get(`/routine/class${routineScopePath}`);
      if (Array.isArray(data)) {
        setRoutines(data);
        setGridDays(DEFAULT_DAYS);
        setGridPeriods(DEFAULT_PERIODS);
      } else {
        setRoutines(Array.isArray(data.entries) ? data.entries : []);
        setGridDays(Array.isArray(data.days) && data.days.length ? data.days : DEFAULT_DAYS);
        setGridPeriods(Array.isArray(data.periods) ? data.periods : DEFAULT_PERIODS);
      }
    } catch (e: any) { setError(e.response?.data?.message || 'Could not load this section routine.'); }
    finally { setLoading(false); }
  }, [isAdmin, routineScopeId, routineScopePath]);

  useEffect(() => { loadUserAndStructure(); }, []);
  useEffect(() => { if (isAdmin && routineScopeId) loadSelectedRoutine(); }, [isAdmin, routineScopeId, loadSelectedRoutine]);

  const periods = gridPeriods;

  const saveGrid = async (nextDays: number[], nextPeriods: Array<{ startTime: string; endTime: string; kind?: string }>, periodChanges: any[] = []) => {
    if (!routineScopeId) return false;
    try {
      const { data } = await api.patch(`/routine/class${routineScopePath}/grid`, { days: nextDays, periods: nextPeriods.map(({ startTime: start, endTime: end }) => ({ startTime: start, endTime: end })), periodChanges });
      setGridDays(data.days); setGridPeriods(data.periods.map((period: any) => ({ ...period, kind: 'CLASS' })));
      await loadSelectedRoutine();
      return true;
    } catch (e: any) { Alert.alert('Could not update timetable layout', e.response?.data?.message || 'Please try again.'); return false; }
  };

  const addPeriodRow = () => {
    const lastEnd = periods[periods.length - 1]?.endTime || '10:00';
    const [hour, minute] = lastEnd.split(':').map(Number);
    const start = hour * 60 + minute;
    const end = start + 40;
    if (end > 23 * 60 + 59) { Alert.alert('Day is full', 'There is no room for another 40-minute period after the current final row.'); return; }
    const formatTime = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
    void saveGrid(gridDays, [...periods, { startTime: formatTime(start), endTime: formatTime(end), kind: 'CLASS' }]);
  };

  const removePeriodRow = (period: any) => Alert.alert('Delete this period row?', `${formatTime12(period.startTime)}–${formatTime12(period.endTime)} and all entries in that row will be removed from this timetable.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete row', style: 'destructive', onPress: () => void saveGrid(gridDays, periods.filter(item => item.startTime !== period.startTime || item.endTime !== period.endTime)) },
  ]);

  const addSaturdayColumn = () => void saveGrid([...gridDays, 6], periods);
  const removeSaturdayColumn = () => Alert.alert('Remove Saturday column?', 'This will also remove saved Saturday routine entries for this section.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove Saturday', style: 'destructive', onPress: () => void saveGrid(gridDays.filter(dayId => dayId !== 6), periods) },
  ]);

  const openEditor = (entry?: any, targetDay = 1, period?: any) => {
    setEditingGridPeriod(null);
    const chosenSubject = entry?.subjectId || '';
    setEditing(entry || null); setDay(entry?.dayOfWeek ?? targetDay);
    setStartTimeText(formatTime12(entry?.startTime || period?.startTime || '16:40'));
    setEndTimeText(formatTime12(entry?.endTime || period?.endTime || '17:20'));
    setSourceGridPeriod(period || periods.find(item => item.startTime === (entry?.startTime || '16:40') && item.endTime === (entry?.endTime || '17:20')) || null);
    const nextKind = entry?.kind || period?.kind || 'CLASS';
    setKind(nextKind);
    setLabel(entry?.label || (nextKind === 'CLASS' ? entry?.subject?.name : KIND_LABELS[nextKind]) || '');
    setSubjectId(chosenSubject);
    const teacherOptions = chosenSubject ? assignments.filter((item: any) => item.subjectId === chosenSubject) : [];
    setTeacherId(entry?.teacherId || teacherOptions[0]?.teacherId || '');
    setEditorOpen(true);
  };

  const openPeriodEditor = (period: any) => {
    setEditingGridPeriod(period); setSourceGridPeriod(period); setStartTimeText(formatTime12(period.startTime)); setEndTimeText(formatTime12(period.endTime)); setEditorOpen(true);
  };

  const savePeriodTime = async () => {
    if (!editingGridPeriod) return;
    const nextStart = parseTime12(startTimeText); const nextEnd = parseTime12(endTimeText);
    if (!nextStart || !nextEnd || nextStart >= nextEnd) { Alert.alert('Check the time', 'Enter a valid time such as 9:00 AM or 2:40 PM, with the end after the start.'); return; }
    const nextPeriods = periods.map(item => item === editingGridPeriod ? { ...item, startTime: nextStart, endTime: nextEnd } : item);
    const saved = await saveGrid(gridDays, nextPeriods, [{ fromStartTime: editingGridPeriod.startTime, fromEndTime: editingGridPeriod.endTime, toStartTime: nextStart, toEndTime: nextEnd }]);
    if (saved) { setEditingGridPeriod(null); setEditorOpen(false); }
  };

  const updateLabel = (value: string) => {
    setLabel(value);
    if (kind !== 'CLASS') return;
    const match = subjects.find((item: any) => item.name.trim().toLocaleLowerCase() === value.trim().toLocaleLowerCase());
    const assignment = match && assignments.find((item: any) => item.subjectId === match.id);
    setSubjectId(match?.id || '');
    setTeacherId(assignment?.teacherId || '');
  };

  const saveEntry = async () => {
    if (editingGridPeriod) { await savePeriodTime(); return; }
    if (!routineScopeId || !label.trim()) { Alert.alert('Enter a timetable label', 'Type a subject name, Lunch, Break, or another activity for this cell.'); return; }
    if (kind === 'CLASS' && subjectId && !teacherId) { Alert.alert('Choose an assigned teacher', 'The selected school subject needs a teacher assigned to this section. Or clear the subject link and keep it as a custom label.'); return; }
    const nextStart = parseTime12(startTimeText); const nextEnd = parseTime12(endTimeText);
    if (!nextStart || !nextEnd || nextStart >= nextEnd) { Alert.alert('Check the time', 'Enter a valid time such as 9:00 AM or 2:40 PM, with the end after the start.'); return; }
    setSaving(true);
    try {
      if (sourceGridPeriod && (sourceGridPeriod.startTime !== nextStart || sourceGridPeriod.endTime !== nextEnd)) {
        const nextPeriods = periods.map(item => item === sourceGridPeriod ? { ...item, startTime: nextStart, endTime: nextEnd } : item);
        const layoutSaved = await saveGrid(gridDays, nextPeriods, [{ fromStartTime: sourceGridPeriod.startTime, fromEndTime: sourceGridPeriod.endTime, toStartTime: nextStart, toEndTime: nextEnd }]);
        if (!layoutSaved) return;
      }
      const payload = { ...(sectionId ? { sectionId } : { classId }), kind, label: label.trim(), subjectId: kind === 'CLASS' && subjectId ? subjectId : null, teacherId: kind === 'CLASS' && subjectId ? teacherId : null, dayOfWeek: day, startTime: nextStart, endTime: nextEnd };
      if (editing) await api.patch(`/routine/class/${editing.id}`, payload);
      else await api.post('/routine/class', payload);
      setEditorOpen(false); await loadSelectedRoutine();
    } catch (e: any) { Alert.alert('Could not save', e.response?.data?.message || 'Please check the teacher assignment and try again.'); }
    finally { setSaving(false); }
  };

  const deleteEntry = (entry: any) => Alert.alert('Remove this period?', `${entry.subject?.name || 'This class'} · ${formatTime12(entry.startTime)}–${formatTime12(entry.endTime)}`, [
    { text: 'Keep period', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => {
      try { await api.delete(`/routine/class/${entry.id}`); await loadSelectedRoutine(); }
      catch (e: any) { Alert.alert('Could not remove period', e.response?.data?.message || 'Please try again.'); }
    } },
  ]);

  const clearRoutine = () => Alert.alert('Clear this class routine?', `This removes all saved periods for ${selectedClass?.name || 'this class'}${sectionId ? ` · Section ${sections.find((item: any) => item.id === sectionId)?.name || ''}` : ''}. You can add them again afterward.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Clear routine', style: 'destructive', onPress: async () => {
      try { await api.delete(`/routine/class${routineScopePath}`); await loadSelectedRoutine(); }
      catch (e: any) { Alert.alert('Could not clear routine', e.response?.data?.message || 'Please try again.'); }
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
        : showAdminGrid ? !routineScopeId ? <View style={styles.state}><Ionicons name="albums-outline" size={28} color={colors.primary} /><Text style={styles.stateText}>{selectedClass ? 'Select a section to build its routine.' : 'Select a class to start building its weekly routine.'}</Text></View>
          : <>
            <View style={styles.gridIntro}><View><Text style={styles.gridTitle}>{selectedClass?.name || 'Class'}{sectionId ? ` · Section ${sections.find((item: any) => item.id === sectionId)?.name || ''}` : ' · Whole class'}</Text><Text style={styles.gridSubtitle}>Tap a cell to add, edit, or remove a period.</Text></View><View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveText}>EDITABLE</Text></View></View>
            <View style={styles.quickActions}>
              <TouchableOpacity style={[styles.quickAction, styles.quickPrimary]} onPress={addPeriodRow}><Ionicons name="add" size={16} color="#fff" /><Text style={styles.quickPrimaryText}>Add period row</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.quickAction, styles.quickClear]} onPress={clearRoutine}><Ionicons name="trash-outline" size={15} color={colors.danger} /><Text style={[styles.quickText, { color: colors.danger }]}>Clear all</Text></TouchableOpacity>
            </View>
            {gridDays.includes(6)
              ? <TouchableOpacity style={styles.addColumnButton} onPress={removeSaturdayColumn}><Ionicons name="remove-circle-outline" size={15} color={colors.danger} /><Text style={[styles.addColumnText, { color: colors.danger }]}>Remove Saturday column</Text></TouchableOpacity>
              : <TouchableOpacity style={styles.addColumnButton} onPress={addSaturdayColumn}><Ionicons name="add-circle-outline" size={15} color={colors.primary} /><Text style={styles.addColumnText}>Add Saturday column</Text></TouchableOpacity>}
            <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.tableScroller}><View>
                <View style={styles.tableRow}><View style={[styles.timeCell, styles.cornerCell]}><Text style={styles.columnHeading}>TIME</Text></View>{visibleDays.map(dayItem => {
                  const isScheduled = routines.some(item => item.dayOfWeek === dayItem.id);
                  return <View key={dayItem.id} style={styles.dayHeading}><Text style={styles.dayName}>{dayItem.name}</Text><Text style={styles.dayStatus}>{isScheduled ? 'SCHEDULED' : 'SCHOOL DAY'}</Text></View>;
                })}</View>
                {periods.map((period, index) => <View key={`${period.startTime}-${period.endTime}`} style={styles.tableRow}><View style={styles.timeCell}><View style={styles.periodHeaderLine}><Text style={styles.periodNumber}>P{index + 1}</Text><TouchableOpacity accessibilityLabel={`Delete period row ${index + 1}`} onPress={() => removePeriodRow(period)} hitSlop={7}><Ionicons name="trash-outline" size={11} color={colors.danger} /></TouchableOpacity></View><TouchableOpacity accessibilityLabel={`Edit period ${index + 1} time`} onPress={() => openPeriodEditor(period)}><Text style={styles.periodTime}>{formatTime12(period.startTime)}</Text><Text style={styles.periodTimeEnd}>{formatTime12(period.endTime)}</Text><Ionicons name="create-outline" size={10} color={colors.primary} /></TouchableOpacity></View>{visibleDays.map(dayItem => {
                  const entry = routines.find(item => item.dayOfWeek === dayItem.id && item.startTime === period.startTime && item.endTime === period.endTime);
                  const entryKind = entry?.kind || period.kind;
                  const special = entryKind !== 'CLASS';
                  const accent = entry ? (special ? colors.warning : subjectAccent(entry.subjectId)) : special ? colors.warning : colors.primary;
                  return <TouchableOpacity key={`${dayItem.id}-${period.startTime}`} activeOpacity={0.75} onPress={() => entry ? openEditor(entry) : openEditor(undefined, dayItem.id, period)} style={[styles.tableCell, entry && { backgroundColor: `${accent}14`, borderColor: `${accent}45` }]}>
                    {entry ? <><View style={styles.cellTop}><Text style={[styles.cellSubject, { color: accent }]} numberOfLines={1}>{entry.label || (special ? KIND_LABELS[entry.kind] : entry.subject?.name) || '—'}</Text><TouchableOpacity accessibilityLabel="Delete routine period" onPress={() => deleteEntry(entry)} hitSlop={8}><Ionicons name="close-circle" size={15} color={colors.danger} /></TouchableOpacity></View>{entry.teacher && <Text style={styles.cellTeacher} numberOfLines={1}>{[entry.teacher?.teacherProfile?.firstName, entry.teacher?.teacherProfile?.lastName].filter(Boolean).join(' ') || 'Teacher'}</Text>}<View style={styles.cellEdit}><Ionicons name="create-outline" size={11} color={accent} /><Text style={[styles.cellEditText, { color: accent }]}>Edit</Text></View></> : <View style={styles.addCell}><Ionicons name="add-circle-outline" size={17} color={colors.primary} /><Text style={styles.addCellText}>Add</Text></View>}
                  </TouchableOpacity>;
                })}</View>)}
              </View></ScrollView>
            {!!routineScopeId && !!periods.length && <View style={styles.tip}><Ionicons name="information-circle-outline" size={17} color={colors.primary} /><Text style={styles.tipText}>Monday–Friday by default · 10 preset rows · 40 minutes each. Add Saturday or adjust rows as needed.</Text></View>}
            {!!sectionId && <View style={styles.assignmentNote}><Ionicons name="people-outline" size={17} color={colors.subText} /><Text style={styles.helper}>Only teachers assigned to this section and subject for the current academic year can be scheduled.</Text></View>}
          </>
        : routines.length === 0 ? <View style={styles.state}><Ionicons name="calendar-outline" size={28} color={colors.subText} /><Text style={styles.stateText}>No routine is published for your class yet.</Text></View>
            : visibleDays.map(dayItem => {
            const entries = routines.filter(item => item.dayOfWeek === dayItem.id).sort((a, b) => a.startTime.localeCompare(b.startTime));
            if (!entries.length) return null;
            return <View key={dayItem.id} style={styles.dayCard}><View style={styles.dayHeader}><View style={styles.dayIcon}><Ionicons name="calendar-outline" size={17} color={colors.primary} /></View><Text style={styles.dayTitle}>{dayItem.name}</Text><Text style={styles.dayCount}>{entries.length} periods</Text></View>{entries.map((entry, index) => <View key={entry.id} style={[styles.readPeriod, index === entries.length - 1 && { borderBottomWidth: 0 }]}><View style={styles.timePill}><Text style={styles.readTime}>{formatTime12(entry.startTime)}</Text><View style={styles.timeRule} /><Text style={styles.readTimeEnd}>{formatTime12(entry.endTime)}</Text></View><View style={styles.readCopy}><Text style={styles.readSubject}>{entry.label || (entry.kind && entry.kind !== 'CLASS' ? KIND_LABELS[entry.kind] : entry.subject?.name) || 'Subject'}</Text>{(!entry.kind || entry.kind === 'CLASS') && entry.teacher && <Text style={styles.readTeacher}>{[entry.teacher?.teacherProfile?.firstName, entry.teacher?.teacherProfile?.lastName].filter(Boolean).join(' ') || 'Teacher'}{entry.section ? ` · ${entry.section.class?.name} ${entry.section.name}` : ''}</Text>}</View></View>)}</View>;
          })}
    </ScrollView>

    <Modal visible={editorOpen} transparent animationType="slide" onRequestClose={() => !saving && setEditorOpen(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0} style={styles.overlay}><View style={styles.modal}>
        <View style={styles.modalHeader}><View><Text style={styles.eyebrow}>{editingGridPeriod ? 'EDIT SHARED PERIOD' : editing ? 'UPDATE TIMETABLE' : 'BUILD TIMETABLE'}</Text><Text style={styles.modalTitle}>{editingGridPeriod ? 'Change period time' : editing ? 'Edit period' : 'Add period'}</Text></View><TouchableOpacity disabled={saving} onPress={() => { setEditorOpen(false); setEditingGridPeriod(null); }}><Ionicons name="close-circle" size={26} color={colors.subText} /></TouchableOpacity></View>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.helper}>Start and end time are editable. Changing them updates this shared period row across all school days and keeps its entries.</Text>
          {!editingGridPeriod && <>
          <Text style={styles.sectionLabel}>DAY</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>{visibleDays.map(item => <TouchableOpacity key={item.id} onPress={() => setDay(item.id)} style={[styles.chip, day === item.id && styles.chipActive]}><Text style={[styles.chipText, day === item.id && styles.chipTextActive]}>{initials(item.name)}</Text></TouchableOpacity>)}</ScrollView>
          <Text style={styles.sectionLabel}>CELL TYPE</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>{Object.entries(KIND_LABELS).map(([key, title]) => <TouchableOpacity key={key} onPress={() => { setKind(key); if (key !== 'CLASS' && (!label || Object.values(KIND_LABELS).includes(label))) setLabel(title); if (key === 'CLASS' && Object.values(KIND_LABELS).includes(label)) setLabel(''); }} style={[styles.chip, kind === key && styles.chipActive]}><Text style={[styles.chipText, kind === key && styles.chipTextActive]}>{title}</Text></TouchableOpacity>)}</ScrollView>
          <Text style={styles.sectionLabel}>{kind === 'CLASS' ? 'SUBJECT / CELL TEXT' : 'ACTIVITY NAME'}</Text>
          <TextInput value={label} onChangeText={updateLabel} placeholder={kind === 'CLASS' ? 'Tap and type a subject, e.g. Mathematics' : `Type ${KIND_LABELS[kind]} or another label`} placeholderTextColor={colors.subText} style={styles.input} maxLength={80} autoCapitalize="words" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} />
          {kind === 'CLASS' && subjects.length > 0 && <><Text style={styles.helper}>Optional: tap an existing subject to link its assigned teacher.</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>{subjects.map((item: any) => <TouchableOpacity key={item.id} onPress={() => { setSubjectId(item.id); setLabel(item.name); const next = assignments.find((row: any) => row.subjectId === item.id); setTeacherId(next?.teacherId || ''); }} style={[styles.chip, subjectId === item.id && styles.chipActive]}><Text style={[styles.chipText, subjectId === item.id && styles.chipTextActive]}>{item.name}</Text></TouchableOpacity>)}</ScrollView></>}
          </>}
          <View style={styles.timeFields}><View style={styles.timeField}><Text style={styles.sectionLabel}>START TIME</Text><TextInput value={startTimeText} onChangeText={setStartTimeText} editable style={styles.input} keyboardType="default" autoCapitalize="characters" maxLength={8} placeholder="9:00 AM" placeholderTextColor={colors.subText} /></View><View style={styles.timeSeparator}><Text style={styles.timeDash}>—</Text></View><View style={styles.timeField}><Text style={styles.sectionLabel}>END TIME</Text><TextInput value={endTimeText} onChangeText={setEndTimeText} editable style={styles.input} keyboardType="default" autoCapitalize="characters" maxLength={8} placeholder="9:40 AM" placeholderTextColor={colors.subText} /></View></View>
        </ScrollView>
        <TouchableOpacity disabled={saving || (!editingGridPeriod && !label.trim())} onPress={saveEntry} style={[styles.primaryButton, (saving || (!editingGridPeriod && !label.trim())) && { opacity: 0.55 }]}>{saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark" size={17} color="#fff" /><Text style={styles.primaryButtonText}>{editingGridPeriod ? 'Save period time' : editing ? 'Save changes' : 'Add to routine'}</Text></>}</TouchableOpacity>
      </View></KeyboardAvoidingView>
    </Modal>
  </SafeAreaView>;
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background }, header: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderColor: c.border }, back: { width: 38, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 8 }, headerCopy: { flex: 1 }, eyebrow: { color: c.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, title: { fontSize: 19, fontWeight: '900', color: c.text, marginTop: 2 }, refresh: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: c.primary + '14' },
  selectorPanel: { paddingHorizontal: 14, paddingTop: 9, paddingBottom: 5, backgroundColor: c.card, borderBottomWidth: 1, borderColor: c.border }, sectionLabel: { color: c.subText, fontSize: 9, fontWeight: '900', letterSpacing: 0.9, marginBottom: 6, marginTop: 7 }, chipRow: { flexDirection: 'row', gap: 7, paddingBottom: 6 }, chip: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 11, borderWidth: 1, borderColor: c.border, backgroundColor: c.background }, sectionChip: { minHeight: 29, paddingHorizontal: 11 }, chipActive: { backgroundColor: c.primary + '16', borderColor: c.primary }, chipText: { color: c.subText, fontSize: 10, fontWeight: '800' }, chipTextActive: { color: c.primary },
  content: { padding: 14, paddingBottom: 32, flexGrow: 1 }, state: { minHeight: 150, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 18, gap: 8 }, stateText: { color: c.subText, fontSize: 11, textAlign: 'center', lineHeight: 17 }, retryText: { color: c.primary, fontSize: 12, fontWeight: '900', marginTop: 4 }, helper: { color: c.subText, fontSize: 10, lineHeight: 15, paddingVertical: 5 }, gridIntro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, gridTitle: { color: c.text, fontSize: 14, fontWeight: '900' }, gridSubtitle: { color: c.subText, fontSize: 10, marginTop: 3 }, liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: c.success + '14' }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.success }, liveText: { color: c.success, fontSize: 8, fontWeight: '900', letterSpacing: 0.6 }, quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }, quickAction: { minHeight: 34, flexGrow: 1, flexBasis: '22%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 7, borderRadius: 9, borderWidth: 1, borderColor: c.border, backgroundColor: c.card }, quickPrimary: { backgroundColor: c.primary, borderColor: c.primary }, quickClear: { borderColor: c.danger + '45', backgroundColor: c.danger + '08' }, quickText: { color: c.text, fontSize: 8, fontWeight: '800' }, quickPrimaryText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  emptyGrid: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 30, borderRadius: 17, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, gap: 9 }, emptyIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '14' }, emptyTitle: { color: c.text, fontSize: 14, fontWeight: '900' }, primaryButton: { minHeight: 44, paddingHorizontal: 15, marginTop: 12, borderRadius: 12, backgroundColor: c.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, primaryButtonText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  tableScroller: { paddingBottom: 4 }, tableRow: { flexDirection: 'row' }, timeCell: { width: 76, minHeight: 56, justifyContent: 'center', paddingHorizontal: 5, borderWidth: 1, borderColor: c.border, backgroundColor: c.card }, cornerCell: { minHeight: 46, borderTopLeftRadius: 9 }, columnHeading: { color: c.subText, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 }, dayHeading: { width: 82, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border, backgroundColor: c.primary + '0D' }, holidayHeading: { backgroundColor: c.warning + '18' }, holidayText: { color: c.warning }, dayName: { color: c.text, fontSize: 9, fontWeight: '900' }, dayStatus: { color: c.success, fontSize: 6, fontWeight: '900', letterSpacing: 0.3, marginTop: 3 }, holidayStatus: { color: c.warning }, periodHeaderLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, periodNumber: { color: c.subText, fontSize: 6, fontWeight: '900', letterSpacing: 0.2 }, periodTime: { color: c.primary, fontSize: 8, fontWeight: '900', marginTop: 3 }, periodTimeEnd: { color: c.subText, fontSize: 8, fontWeight: '700', marginTop: 1 }, tableCell: { width: 82, minHeight: 56, paddingHorizontal: 4, paddingVertical: 3, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, justifyContent: 'center' }, holidayCell: { backgroundColor: c.warning + '07' }, filledCell: { backgroundColor: c.primary + '0C' }, cellTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 2 }, cellSubject: { color: c.text, fontSize: 8, fontWeight: '900', flex: 1 }, cellTeacher: { color: c.subText, fontSize: 7, marginTop: 3 }, cellEdit: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3 }, cellEditText: { color: c.primary, fontSize: 7, fontWeight: '800' }, addCell: { alignItems: 'center', justifyContent: 'center', gap: 2 }, addCellText: { color: c.primary, fontSize: 7, fontWeight: '800' }, tip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9, padding: 8, borderRadius: 10, backgroundColor: c.primary + '0D' }, tipText: { flex: 1, color: c.subText, fontSize: 8, lineHeight: 12 }, assignmentNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 8 }, addColumnButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, marginBottom: 8, borderRadius: 9, backgroundColor: c.primary + '10' }, addColumnText: { color: c.primary, fontSize: 8, fontWeight: '800' },
  dayCard: { marginBottom: 12, backgroundColor: c.card, borderRadius: 15, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }, dayHeader: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, backgroundColor: c.primary + '0C', borderBottomWidth: 1, borderColor: c.border }, dayIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '14' }, dayTitle: { flex: 1, color: c.text, fontSize: 12, fontWeight: '900' }, dayCount: { color: c.subText, fontSize: 9, fontWeight: '700' }, readPeriod: { flexDirection: 'row', alignItems: 'center', minHeight: 68, paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1, borderColor: c.border }, timePill: { width: 76, alignItems: 'center', justifyContent: 'center', paddingVertical: 5, borderRadius: 10, backgroundColor: c.primary + '10' }, readTime: { color: c.primary, fontSize: 9, fontWeight: '900' }, timeRule: { width: 20, height: 1, backgroundColor: c.primary + '60', marginVertical: 3 }, readTimeEnd: { color: c.subText, fontSize: 9, fontWeight: '700' }, readCopy: { flex: 1, paddingLeft: 12 }, readSubject: { color: c.text, fontSize: 12, fontWeight: '900' }, readTeacher: { color: c.subText, fontSize: 10, marginTop: 4 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000075' }, modal: { maxHeight: '90%', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: c.card }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, modalTitle: { color: c.text, fontSize: 19, fontWeight: '900', marginTop: 3 }, timeFields: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 4 }, timeField: { flex: 1 }, timeSeparator: { height: 40, justifyContent: 'center' }, timeDash: { color: c.subText, fontSize: 14 }, input: { minHeight: 42, paddingHorizontal: 11, borderRadius: 11, borderWidth: 1, borderColor: c.border, backgroundColor: c.background, color: c.text, fontSize: 13, fontWeight: '800' }, fixedTime: { opacity: 0.78 }, optionList: { gap: 6 }, kindGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, kindOption: { minHeight: 37, minWidth: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.background }, option: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, borderRadius: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.background }, optionActive: { borderColor: c.primary, backgroundColor: c.primary + '10' }, optionText: { color: c.text, fontSize: 11, fontWeight: '700' }, optionTextActive: { color: c.primary, fontWeight: '900' },
});

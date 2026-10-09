import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../core/networking/api';
import { useTheme } from '../../../core/theme/ThemeContext';

type Structure = { academicYears: any[]; classes: any[]; subjects: any[]; assignments: any[] };
type FormKind = 'class' | 'section' | 'subject' | 'year' | 'assignment';
const emptyStructure: Structure = { academicYears: [], classes: [], subjects: [], assignments: [] };
const tabs = ['Years', 'Classes', 'Sections', 'Subjects', 'Assignments'];

export default function AcademicManagementScreen({ navigation }: any) {
  const { colors } = useTheme(); const s = makeStyles(colors);
  const [structure, setStructure] = useState<Structure>(emptyStructure);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [tab, setTab] = useState('Classes'); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const [modal, setModal] = useState<FormKind | null>(null); const [editingId, setEditingId] = useState('');
  const [value, setValue] = useState(''); const [secondary, setSecondary] = useState(''); const [tertiary, setTertiary] = useState(''); const [isCurrent, setIsCurrent] = useState(false);
  const [selectedClass, setSelectedClass] = useState(''); const [selectedSection, setSelectedSection] = useState(''); const [selectedSubject, setSelectedSubject] = useState(''); const [selectedTeacher, setSelectedTeacher] = useState(''); const [selectedYear, setSelectedYear] = useState('');

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      const [res, tRes] = await Promise.all([
        api.get('/academics/structure'),
        api.get('/users/admin/users', { params: { role: 'TEACHER' } }).catch(() => ({ data: [] })),
      ]);
      setStructure({ academicYears: res.data.academicYears || [], classes: res.data.classes || [], subjects: res.data.subjects || [], assignments: res.data.assignments || [] });
      setTeachers(Array.isArray(tRes.data) ? tRes.data : []);
    } catch (e: any) { setError(e.response?.data?.message || 'Could not load academic structure.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sections = useMemo(() => structure.classes.flatMap(item => (item.sections || []).map((section: any) => ({ ...section, classId: item.id, className: item.name }))), [structure.classes]);
  const duplicateSections = useMemo(() => {
    const groups = new Map<string, number>();
    sections.forEach((section: any) => { const key = `${section.classId}:${String(section.name).trim().toLocaleLowerCase()}`; groups.set(key, (groups.get(key) || 0) + 1); });
    return [...groups.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  }, [sections]);
  const currentYear = structure.academicYears.find(item => item.isCurrent);

  const open = (kind: FormKind, item?: any, classId = '') => {
    setModal(kind); setEditingId(item?.id || ''); setValue(''); setSecondary(''); setTertiary(''); setIsCurrent(false);
    if (kind === 'class') setValue(item?.name || '');
    if (kind === 'section') { setValue(item?.name || ''); setSelectedClass(item?.classId || classId || structure.classes[0]?.id || ''); }
    if (kind === 'subject') { setValue(item?.name || ''); setSecondary(item?.code || ''); }
    if (kind === 'year') {
      setValue(item?.name || '');
      setSecondary(item?.startDate ? new Date(item.startDate).toISOString().slice(0, 10) : `${new Date().getFullYear()}-01-01`);
      setTertiary(item?.endDate ? new Date(item.endDate).toISOString().slice(0, 10) : `${new Date().getFullYear() + 1}-12-31`);
      setIsCurrent(Boolean(item?.isCurrent));
    }
    if (kind === 'assignment') {
      setSelectedTeacher(item?.teacherId || teachers[0]?.id || ''); setSelectedSection(item?.sectionId || sections[0]?.id || '');
      setSelectedSubject(item?.subjectId || structure.subjects[0]?.id || ''); setSelectedYear(item?.academicYearId || currentYear?.id || structure.academicYears[0]?.id || '');
    }
  };

  const save = async () => {
    if (modal !== 'assignment' && !value.trim()) { Alert.alert('Required', 'Enter a name before saving.'); return; }
    if (modal === 'section' && !selectedClass) { Alert.alert('Select a class', 'Choose the class this section belongs to.'); return; }
    if (modal === 'year' && (!/^\d{4}-\d{2}-\d{2}$/.test(secondary) || !/^\d{4}-\d{2}-\d{2}$/.test(tertiary) || new Date(tertiary) <= new Date(secondary))) { Alert.alert('Check dates', 'Enter valid YYYY-MM-DD dates and ensure the end date is after the start date.'); return; }
    if (modal === 'assignment' && (!selectedTeacher || !selectedSection || !selectedSubject || !selectedYear)) { Alert.alert('Complete assignment', 'Select a teacher, section, subject, and academic year.'); return; }
    setSaving(true);
    try {
      const isEdit = Boolean(editingId);
      if (modal === 'class') await (isEdit ? api.patch(`/academics/classes/${editingId}`, { name: value.trim() }) : api.post('/academics/classes', { name: value.trim() }));
      if (modal === 'section') await (isEdit ? api.patch(`/academics/sections/${editingId}`, { name: value.trim() }) : api.post('/academics/sections', { classId: selectedClass, name: value.trim() }));
      if (modal === 'subject') await (isEdit ? api.patch(`/academics/subjects/${editingId}`, { name: value.trim(), code: secondary.trim() || null }) : api.post('/academics/subjects', { name: value.trim(), code: secondary.trim() || undefined }));
      if (modal === 'year') {
        const payload = { name: value.trim(), startDate: new Date(`${secondary}T00:00:00`).toISOString(), endDate: new Date(`${tertiary}T00:00:00`).toISOString(), isCurrent };
        await (isEdit ? api.patch(`/academics/academic-years/${editingId}`, payload) : api.post('/academics/academic-years', payload));
      }
      if (modal === 'assignment') {
        const payload = { teacherId: selectedTeacher, sectionId: selectedSection, subjectId: selectedSubject, academicYearId: selectedYear };
        await (isEdit ? api.patch(`/academics/teacher-assignments/${editingId}`, payload) : api.post('/academics/teacher-assignments', payload));
      }
      setModal(null); await load(false);
    } catch (e: any) { Alert.alert('Could not save', Array.isArray(e.response?.data?.message) ? e.response.data.message.join('\n') : e.response?.data?.message || 'Please try again.'); }
    finally { setSaving(false); }
  };

  const remove = (kind: FormKind, item: any) => {
    const labels: Record<FormKind, string> = { class: 'class', section: 'section', subject: 'subject', year: 'academic year', assignment: 'teacher assignment' };
    const endpoints: Record<FormKind, string> = { class: 'classes', section: 'sections', subject: 'subjects', year: 'academic-years', assignment: 'teacher-assignments' };
    Alert.alert(`Delete ${labels[kind]}?`, kind === 'assignment' ? 'This removes this teacher’s assignment for the selected year.' : 'If this record is in use, the server will safely prevent deletion and explain what must be reassigned first.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/academics/${endpoints[kind]}/${item.id}`); await load(false); }
        catch (e: any) { Alert.alert('Could not delete', e.response?.data?.message || 'This record may still be in use. Reassign its dependent data first.'); }
      } },
    ]);
  };

  const normalizeDuplicates = () => Alert.alert('Merge duplicate sections?', `This will merge ${duplicateSections} case-only duplicate section${duplicateSections === 1 ? '' : 's'} (for example, a into A), move their schedules, exams, homework, assignments and enrollments, and keep the uppercase section.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Merge duplicates', onPress: async () => {
      try { const { data } = await api.post('/academics/sections/normalize-duplicates'); await load(false); Alert.alert('Sections cleaned up', `${data.merged || 0} duplicate section${data.merged === 1 ? '' : 's'} merged.`); }
      catch (e: any) { Alert.alert('Could not merge', e.response?.data?.message || 'Resolve conflicting enrollments before merging. No changes were applied.'); }
    } },
  ]);

  const actions = (kind: FormKind, item: any) => <View style={s.actions}>
    <TouchableOpacity accessibilityLabel={`Edit ${kind}`} onPress={() => open(kind, item)} style={s.iconButton}><Ionicons name="create-outline" size={18} color={colors.primary} /></TouchableOpacity>
    <TouchableOpacity accessibilityLabel={`Delete ${kind}`} onPress={() => remove(kind, item)} style={[s.iconButton, s.deleteButton]}><Ionicons name="trash-outline" size={17} color={colors.danger} /></TouchableOpacity>
  </View>;
  const addButton = (label: string, kind: FormKind) => <TouchableOpacity onPress={() => open(kind)} style={s.addButton}><Ionicons name="add" size={19} color="#fff" /><Text style={s.addText}>{label}</Text></TouchableOpacity>;
  const choice = (label: string, items: any[], selected: string, setter: (value: string) => void, getLabel: (item: any) => string) => <><Text style={s.fieldLabel}>{label}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.choiceRow}>{items.map(item => <TouchableOpacity key={item.id} onPress={() => setter(item.id)} style={[s.choice, selected === item.id && s.choiceActive]}><Text style={[s.choiceText, selected === item.id && s.choiceTextActive]}>{getLabel(item)}</Text></TouchableOpacity>)}{!items.length && <Text style={s.helper}>Add the required academic records first.</Text>}</ScrollView></>;

  return <SafeAreaView style={s.screen}>
    <View style={s.header}><TouchableOpacity accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={s.back}><Ionicons name="chevron-back" size={23} color={colors.text} /></TouchableOpacity><View style={s.headerCopy}><Text style={s.eyebrow}>SCHOOL OPERATIONS</Text><Text style={s.title}>Academic structure</Text></View><TouchableOpacity accessibilityLabel="Refresh structure" onPress={() => load()} style={s.refresh}><Ionicons name="refresh-outline" size={20} color={colors.primary} /></TouchableOpacity></View>
    <View style={s.summary}><View style={s.summaryIcon}><Ionicons name="calendar-outline" size={20} color={colors.primary} /></View><View style={s.summaryCopy}><Text style={s.summaryTitle}>{currentYear?.name || 'Academic year not set'}</Text><Text style={s.summaryHint}>{structure.classes.length} classes · {sections.length} sections · {structure.subjects.length} subjects</Text></View><Ionicons name="school-outline" size={23} color={colors.primary} /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>{tabs.map(item => <TouchableOpacity key={item} onPress={() => setTab(item)} style={[s.tab, tab === item && s.tabActive]}><Text style={[s.tabText, tab === item && s.tabTextActive]}>{item}</Text></TouchableOpacity>)}</ScrollView>
    {duplicateSections > 0 && <TouchableOpacity onPress={normalizeDuplicates} style={s.warning}><Ionicons name="warning-outline" size={18} color={colors.warning} /><Text style={s.warningText}>{duplicateSections} duplicate section label{duplicateSections === 1 ? '' : 's'} differ only by case. Tap to merge and standardize.</Text><Ionicons name="chevron-forward" size={17} color={colors.warning} /></TouchableOpacity>}
    <ScrollView contentContainerStyle={s.content}>
      {loading ? <View style={s.center}><ActivityIndicator color={colors.primary} /><Text style={s.muted}>Loading academic structure…</Text></View> : error ? <View style={s.center}><Ionicons name="cloud-offline-outline" size={32} color={colors.subText} /><Text style={s.muted}>{error}</Text><TouchableOpacity onPress={() => load()} style={s.retry}><Text style={s.retryText}>Try again</Text></TouchableOpacity></View> : <>
        {tab === 'Years' && <>{addButton('Add academic year', 'year')}{structure.academicYears.map(item => <View key={item.id} style={s.itemCard}><View style={s.itemIcon}><Ionicons name="calendar-outline" size={19} color={colors.primary} /></View><View style={s.itemCopy}><View style={s.titleRow}><Text style={s.cardTitle}>{item.name}</Text>{item.isCurrent && <Text style={s.currentBadge}>CURRENT</Text>}</View><Text style={s.cardHint}>{new Date(item.startDate).toLocaleDateString()} — {new Date(item.endDate).toLocaleDateString()}</Text></View>{actions('year', item)}</View>)}{!structure.academicYears.length && <Empty text="No academic years yet. Create one before enrolling students or assigning teachers." />}</>}
        {tab === 'Classes' && <>{addButton('Add class', 'class')}{structure.classes.map(item => <View key={item.id} style={s.classCard}><View style={s.itemIcon}><Ionicons name="school-outline" size={20} color={colors.primary} /></View><View style={s.itemCopy}><Text style={s.cardTitle}>{item.name}</Text><Text style={s.cardHint}>{(item.sections || []).length} section{(item.sections || []).length === 1 ? '' : 's'}</Text>{(item.sections || []).map((section: any) => <TouchableOpacity key={section.id} onPress={() => open('section', { ...section, classId: item.id })} style={s.sectionRow}><View style={s.sectionDot} /><Text style={s.sectionLabel}>Section {section.name}</Text><Ionicons name="create-outline" size={15} color={colors.primary} /></TouchableOpacity>)}<TouchableOpacity onPress={() => open('section', undefined, item.id)} style={s.addSection}><Ionicons name="add-circle-outline" size={15} color={colors.primary} /><Text style={s.addSectionText}>Add section</Text></TouchableOpacity></View>{actions('class', item)}</View>)}{!structure.classes.length && <Empty text="No classes yet. Add a class, then create its sections." />}</>}
        {tab === 'Sections' && <>{addButton('Add section', 'section')}{sections.map((item: any) => <View key={item.id} style={s.itemCard}><View style={[s.itemIcon, s.sectionIcon]}><Ionicons name="albums-outline" size={18} color={colors.success} /></View><View style={s.itemCopy}><Text style={s.cardTitle}>{item.className} · Section {item.name}</Text><Text style={s.cardHint}>Section labels are case-insensitive; letter labels are saved as uppercase.</Text></View>{actions('section', item)}</View>)}{!sections.length && <Empty text="Create a class first, then add a section." />}</>}
        {tab === 'Subjects' && <>{addButton('Add subject', 'subject')}{structure.subjects.map(item => <View key={item.id} style={s.itemCard}><View style={s.itemIcon}><Ionicons name="book-outline" size={19} color={colors.primary} /></View><View style={s.itemCopy}><Text style={s.cardTitle}>{item.name}</Text><Text style={s.cardHint}>{item.code || 'No subject code'}</Text></View>{actions('subject', item)}</View>)}{!structure.subjects.length && <Empty text="No subjects yet. Add the subjects used by your classes." />}</>}
        {tab === 'Assignments' && <>{addButton('Assign teacher', 'assignment')}{structure.assignments.map(item => <View key={item.id} style={s.itemCard}><View style={[s.itemIcon, s.teacherIcon]}><Ionicons name="person-outline" size={19} color={colors.success} /></View><View style={s.itemCopy}><Text style={s.cardTitle}>{[item.teacher?.teacherProfile?.firstName, item.teacher?.teacherProfile?.lastName].filter(Boolean).join(' ') || item.teacher?.email || 'Teacher'}</Text><Text style={s.cardHint}>{item.section?.class?.name} · Section {item.section?.name} · {item.subject?.name}</Text><Text style={s.yearHint}>{item.academicYear?.name || 'Academic year not set'}</Text></View>{actions('assignment', item)}</View>)}{!structure.assignments.length && <Empty text="No teacher assignments yet. Add academic years, sections, subjects, and teachers first." />}</>}
      </>}
    </ScrollView>

    <Modal visible={!!modal} transparent animationType="slide" onRequestClose={() => !saving && setModal(null)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}><View style={s.modal}>
        <View style={s.modalHead}><View><Text style={s.modalEyebrow}>{editingId ? 'EDIT RECORD' : 'NEW RECORD'}</Text><Text style={s.modalTitle}>{modal === 'class' ? `${editingId ? 'Edit' : 'Add'} class` : modal === 'section' ? `${editingId ? 'Edit' : 'Add'} section` : modal === 'subject' ? `${editingId ? 'Edit' : 'Add'} subject` : modal === 'year' ? `${editingId ? 'Edit' : 'Add'} academic year` : `${editingId ? 'Edit' : 'Create'} teacher assignment`}</Text></View><TouchableOpacity disabled={saving} onPress={() => setModal(null)}><Ionicons name="close-circle" size={25} color={colors.subText} /></TouchableOpacity></View>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {modal === 'section' && !editingId && choice('CLASS', structure.classes, selectedClass, setSelectedClass, item => item.name)}
          {modal === 'assignment' && <>{choice('TEACHER', teachers, selectedTeacher, setSelectedTeacher, item => [item.teacherProfile?.firstName, item.teacherProfile?.lastName].filter(Boolean).join(' ') || item.email)}{choice('SECTION', sections, selectedSection, setSelectedSection, item => `${item.className} · ${item.name}`)}{choice('SUBJECT', structure.subjects, selectedSubject, setSelectedSubject, item => item.name)}{choice('ACADEMIC YEAR', structure.academicYears, selectedYear, setSelectedYear, item => item.name)}</>}
          {(modal === 'class' || modal === 'section' || modal === 'subject' || modal === 'year') && <><Text style={s.fieldLabel}>{modal === 'class' ? 'CLASS NAME' : modal === 'section' ? 'SECTION NAME' : modal === 'subject' ? 'SUBJECT NAME' : 'ACADEMIC YEAR NAME'}</Text><TextInput value={value} onChangeText={setValue} placeholder={modal === 'class' ? 'e.g. Class 10' : modal === 'section' ? 'e.g. A' : modal === 'subject' ? 'e.g. Mathematics' : 'e.g. 2026–2027'} placeholderTextColor={colors.subText} style={s.input} maxLength={modal === 'subject' ? 100 : 50} autoCapitalize="words" />
            {modal === 'subject' && <><Text style={s.fieldLabel}>SUBJECT CODE · OPTIONAL</Text><TextInput value={secondary} onChangeText={setSecondary} placeholder="e.g. MATH-10" placeholderTextColor={colors.subText} style={s.input} maxLength={30} autoCapitalize="characters" /> </>}
            {modal === 'year' && <><Text style={s.fieldLabel}>START DATE · YYYY-MM-DD</Text><TextInput value={secondary} onChangeText={setSecondary} placeholder="2026-04-14" placeholderTextColor={colors.subText} style={s.input} autoCapitalize="none" /><Text style={s.fieldLabel}>END DATE · YYYY-MM-DD</Text><TextInput value={tertiary} onChangeText={setTertiary} placeholder="2027-04-13" placeholderTextColor={colors.subText} style={s.input} autoCapitalize="none" /><View style={s.currentRow}><View style={s.currentCopy}><Text style={s.currentTitle}>Set as current year</Text><Text style={s.cardHint}>Only one year can be current for this school.</Text></View><Switch value={isCurrent} onValueChange={setIsCurrent} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" /></View></>}</>}
        </ScrollView>
        <TouchableOpacity disabled={saving} onPress={save} style={[s.saveButton, saving && { opacity: 0.7 }]}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>{editingId ? 'Save changes' : 'Create record'}</Text>}</TouchableOpacity>
      </View></KeyboardAvoidingView>
    </Modal>
  </SafeAreaView>;
}

function Empty({ text }: { text: string }) { return <View style={sEmpty}><Ionicons name="file-tray-outline" size={27} color="#9CA3AF" /><Text style={tEmpty}>{text}</Text></View>; }
const sEmpty = { alignItems: 'center' as const, paddingHorizontal: 24, paddingVertical: 32, gap: 8 };
const tEmpty = { color: '#6B7280', fontSize: 12, lineHeight: 18, textAlign: 'center' as const };
const makeStyles = (c: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border }, back: { width: 38, height: 40, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, marginLeft: 8 }, eyebrow: { color: c.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 }, title: { color: c.text, fontSize: 19, fontWeight: '900', marginTop: 2 }, refresh: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 14, padding: 13, borderRadius: 16, backgroundColor: c.primary + '10', borderWidth: 1, borderColor: c.primary + '20' }, summaryIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card }, summaryCopy: { flex: 1 }, summaryTitle: { color: c.text, fontSize: 14, fontWeight: '900' }, summaryHint: { color: c.subText, fontSize: 10, marginTop: 4 }, tabs: { paddingHorizontal: 14, gap: 7, paddingBottom: 9 }, tab: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 16, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, tabActive: { backgroundColor: c.primary, borderColor: c.primary }, tabText: { color: c.subText, fontSize: 10, fontWeight: '800' }, tabTextActive: { color: '#fff' }, warning: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 14, marginBottom: 6, padding: 11, borderRadius: 12, backgroundColor: c.warning + '12' }, warningText: { flex: 1, color: c.text, fontSize: 10, lineHeight: 15 },
  content: { padding: 14, paddingBottom: 34 }, addButton: { minHeight: 46, borderRadius: 13, backgroundColor: c.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 }, addText: { color: '#fff', fontSize: 12, fontWeight: '900' }, itemCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 8, borderRadius: 15, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, classCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 13, marginBottom: 9, borderRadius: 15, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, itemIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '14' }, sectionIcon: { backgroundColor: c.success + '14' }, teacherIcon: { backgroundColor: c.success + '14' }, itemCopy: { flex: 1 }, cardTitle: { color: c.text, fontSize: 12, fontWeight: '900' }, cardHint: { color: c.subText, fontSize: 10, lineHeight: 15, marginTop: 4 }, yearHint: { color: c.primary, fontSize: 9, fontWeight: '800', marginTop: 5 }, titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 }, currentBadge: { color: c.success, backgroundColor: c.success + '15', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, fontSize: 8, fontWeight: '900' }, actions: { flexDirection: 'row', gap: 5 }, iconButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: c.primary + '10' }, deleteButton: { backgroundColor: c.danger + '10' }, sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, marginTop: 7, borderTopWidth: 1, borderTopColor: c.border }, sectionDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.primary }, sectionLabel: { color: c.text, fontSize: 10, flex: 1 }, addSection: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 9 }, addSectionText: { color: c.primary, fontSize: 10, fontWeight: '800' },
  center: { minHeight: 190, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 25 }, muted: { color: c.subText, fontSize: 12, textAlign: 'center' }, retry: { paddingHorizontal: 17, paddingVertical: 9, borderRadius: 11, backgroundColor: c.primary }, retryText: { color: '#fff', fontSize: 11, fontWeight: '900' }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000070' }, modal: { maxHeight: '92%', backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, paddingBottom: 22 }, modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }, modalEyebrow: { color: c.primary, fontSize: 8, fontWeight: '900', letterSpacing: 1 }, modalTitle: { color: c.text, fontSize: 18, fontWeight: '900', marginTop: 3 }, fieldLabel: { color: c.subText, fontSize: 9, fontWeight: '900', letterSpacing: 0.7, marginTop: 9, marginBottom: 6 }, input: { minHeight: 45, color: c.text, backgroundColor: c.background, borderWidth: 1, borderColor: c.border, borderRadius: 11, paddingHorizontal: 12, marginBottom: 8, fontSize: 12 }, choiceRow: { flexDirection: 'row', gap: 7, paddingBottom: 9 }, choice: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.background }, choiceActive: { borderColor: c.primary, backgroundColor: c.primary + '14' }, choiceText: { color: c.subText, fontSize: 10, fontWeight: '800' }, choiceTextActive: { color: c.primary }, helper: { color: c.subText, fontSize: 10, paddingVertical: 8 }, currentRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8, padding: 11, borderRadius: 12, backgroundColor: c.background }, currentCopy: { flex: 1 }, currentTitle: { color: c.text, fontSize: 11, fontWeight: '800' }, saveButton: { minHeight: 48, borderRadius: 13, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginTop: 11 }, saveText: { color: '#fff', fontSize: 12, fontWeight: '900' },
});

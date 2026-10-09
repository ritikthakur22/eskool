import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useMemo } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';
import { api } from '../../../core/networking/api';
import { getSelectedChildId } from '../../../core/utils/childSelection';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { API_BASE_URL } from '../../../core/networking/api';
import { getInMemoryAccessToken } from '../../../core/networking/session';
import { orderAcademicClasses } from '../../../core/utils/classOrdering';

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
  const [structure, setStructure] = useState<any>(null);
  const [reportSectionId, setReportSectionId] = useState('');
  const [sectionReport, setSectionReport] = useState<any>(null);
  const [scheme, setScheme] = useState<any>(null);
  const [schemeVisible, setSchemeVisible] = useState(false);
  const [schemeSaving, setSchemeSaving] = useState(false);
  const [weights, setWeights] = useState({ TERMINAL_1: '10', TERMINAL_2: '10', TERMINAL_3: '10', FINAL: '70' });
  const [gradeBands, setGradeBands] = useState<any[]>([]);
  const [templateFile, setTemplateFile] = useState<any>(null);
  const [marksRows, setMarksRows] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [searchCategory, setSearchCategory] = useState('ALL');
  const [limitSearchToSection, setLimitSearchToSection] = useState(false);
  const [matchedReports, setMatchedReports] = useState<any[] | null>(null);
  const [studentResultMode, setStudentResultMode] = useState('ALL');

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const raw = await SecureStore.getItemAsync('user_data');
      if (!raw) { setLoading(false); return; }
      const nextRole = JSON.parse(raw).role || '';
      setRole(nextRole);

      if (['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(nextRole)) {
        const [examRes, studentRes, structureRes] = await Promise.all([
          api.get('/exams/manage'),
          api.get('/users/admin/users?role=STUDENT'),
          api.get('/academics/structure').catch(() => ({ data: {} }))
        ]);
        setExams(Array.isArray(examRes.data) ? examRes.data : []);
        setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
        setStructure(structureRes.data);
        const firstSection = (structureRes.data?.classes || []).flatMap((item: any) => item.sections || [])[0];
        if (firstSection) setReportSectionId((current: string) => current || firstSection.id);
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
        const reportEndpoint = nextRole === 'PARENT' ? `/exams/report/child/${childId}` : '/exams/report/me';
        const reportRes = await api.get(reportEndpoint);
        setSectionReport(reportRes.data?.student || null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Could not load results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!reportSectionId || !['ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(role)) return;
    api.get(`/exams/report/section/${reportSectionId}`).then(res => setSectionReport(res.data)).catch((error: any) => setError(error.response?.data?.message || 'Could not load the class progress report.'));
  }, [reportSectionId, role]);

  useEffect(() => {
    if (!['ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(role)) return;
    const term = studentSearch.trim();
    if (term.length < 2) { setMatchedReports(null); return; }
    const timer = setTimeout(() => {
      api.get('/exams/report/search/students', { params: { q: term, category: searchCategory === 'ALL' ? undefined : searchCategory, sectionId: limitSearchToSection ? reportSectionId : undefined } })
        .then(response => setMatchedReports(Array.isArray(response.data) ? response.data : []))
        .catch((error: any) => { setMatchedReports([]); setError(error.response?.data?.message || 'Student result search failed.'); });
    }, 350);
    return () => clearTimeout(timer);
  }, [studentSearch, searchCategory, limitSearchToSection, reportSectionId, role]);

  const isManagement = ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(role);
  const allRows = results.flatMap(group => group.results || []);
  const displayedReports = (matchedReports ?? sectionReport?.reports ?? []).map((report: any) => ({ ...report, subjects: (report.subjects || []).map((subject: any) => ({ ...subject, categoryProgress: searchCategory === 'ALL' ? subject.categoryProgress : Object.fromEntries(Object.entries(subject.categoryProgress || {}).filter(([key]) => searchCategory === 'MCQ' ? key === 'WEEKLY' : key !== 'WEEKLY' && key !== 'OTHER')) })) }));
  const visibleStudentResults = results.filter(group => studentResultMode === 'ALL' || (studentResultMode === 'MCQ' ? group.exam?.type === 'MCQ' : group.exam?.type !== 'MCQ'));
  const totalMarks = allRows.reduce((sum, row) => sum + Number(row.marksObtained || 0), 0);
  const maximumMarks = allRows.reduce((sum, row) => sum + Number(row.totalMarks || 0), 0);
  const overallPercentage = maximumMarks ? Math.round((totalMarks / maximumMarks) * 100) : 0;

  const openEditor = async (exam: any) => {
    setSelectedExam(exam);
    setForm({ studentId: '', marksObtained: '', totalMarks: '100', grade: '' });
    try {
      const response = await api.get(`/exams/${exam.id}/roster`);
      setStudents(response.data.students || []);
      setMarksRows((response.data.students || []).map((student: any) => ({ studentId: student.id, marksObtained: student.result ? String(student.result.marksObtained) : '', totalMarks: student.result ? String(student.result.totalMarks) : '100' })));
      setEditorVisible(true);
    } catch (error: any) { Alert.alert('Could not load class roster', error.response?.data?.message || 'Try again.'); }
  };

  const submitResult = async () => {
    const entries = marksRows.filter(row => row.marksObtained.trim() !== '');
    if (!entries.length || entries.some(row => !Number.isFinite(Number(row.marksObtained)) || !Number.isFinite(Number(row.totalMarks)) || Number(row.totalMarks) <= 0 || Number(row.marksObtained) < 0 || Number(row.marksObtained) > Number(row.totalMarks))) return Alert.alert('Check marks', 'Enter valid marks (not above the maximum) for at least one student.');
    setSaving(true);
    try {
      const response = await api.post('/exams/results/bulk', { examId: selectedExam.id, results: entries.map(row => ({ studentId: row.studentId, marksObtained: Number(row.marksObtained), totalMarks: Number(row.totalMarks) })) });
      setEditorVisible(false);
      await loadData();
      Alert.alert('Saved', `Marks saved for ${response.data.savedCount} student(s).`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add result.');
    } finally { setSaving(false); }
  };

  const openScheme = async () => {
    const selectedSection = (structure?.classes || []).flatMap((item: any) => item.sections || []).find((item: any) => item.id === reportSectionId);
    const classId = selectedSection?.classId || (structure?.classes || []).find((item: any) => item.sections?.some((section: any) => section.id === reportSectionId))?.id;
    if (!classId) return Alert.alert('Select a class section', 'Choose a section before editing its assessment format.');
    try {
      const response = await api.get(`/exams/scheme/${classId}`);
      setScheme({ ...response.data, classId });
      const data = response.data.categoryWeights || {};
      setWeights({ TERMINAL_1: String(data.TERMINAL_1 ?? 10), TERMINAL_2: String(data.TERMINAL_2 ?? 10), TERMINAL_3: String(data.TERMINAL_3 ?? 10), FINAL: String(data.FINAL ?? 70) });
      setGradeBands(Array.isArray(response.data.gradeBands) ? response.data.gradeBands : []);
      setSchemeVisible(true);
    } catch (error: any) { Alert.alert('Could not load settings', error.response?.data?.message || 'Try again.'); }
  };

  const pickTemplate = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'], copyToCacheDirectory: true });
    if (!picked.canceled && picked.assets?.[0]) setTemplateFile(picked.assets[0]);
  };

  const saveScheme = async () => {
    if (!scheme) return;
    setSchemeSaving(true);
    try {
      let templateUrl = scheme.templateUrl || undefined;
      let templateName = scheme.templateName || undefined;
      if (templateFile) {
        const data = new FormData();
        data.append('file', { uri: templateFile.uri, name: templateFile.name, type: templateFile.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } as any);
        const upload = await api.post('/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        templateUrl = upload.data.url;
        templateName = templateFile.name;
      }
      const payload = { categoryWeights: Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, Number(value)])), gradeBands: gradeBands.map(band => ({ ...band, minPercent: Number(band.minPercent), maxPercent: Number(band.maxPercent), gpa: band.gpa === '' || band.gpa === undefined ? undefined : Number(band.gpa) })), templateUrl, templateName };
      await api.put(`/exams/scheme/${scheme.classId}`, payload);
      setTemplateFile(null); setSchemeVisible(false);
      if (reportSectionId) { const report = await api.get(`/exams/report/section/${reportSectionId}`); setSectionReport(report.data); }
      Alert.alert('Saved', 'Assessment weights, grade scale and marksheet template were saved.');
    } catch (error: any) { Alert.alert('Could not save', error.response?.data?.message || 'Check that weights add to 100%.'); }
    finally { setSchemeSaving(false); }
  };

  const exportClassReport = async () => {
    try {
      const token = await getInMemoryAccessToken();
      const path = `${FileSystem.documentDirectory}Class_Progress_Report.xlsx`;
      const download = FileSystem.createDownloadResumable(`${API_BASE_URL}/exams/report/section/${reportSectionId}/export`, path, { headers: { Authorization: `Bearer ${token}` } });
      const result = await download.downloadAsync();
      if (result?.uri) await Sharing.shareAsync(result.uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    } catch { Alert.alert('Export failed', 'Could not generate the Excel progress report.'); }
  };

  const printProgressReport = async () => {
    const rows = isManagement ? sectionReport?.reports || [] : sectionReport ? [sectionReport] : [];
    if (!rows.length) return Alert.alert('Report unavailable', 'There are no report rows to print yet.');
    const escapeHtml = (value: any) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] as string));
    const reportRows = rows.map((student: any) => `<tr><td>${escapeHtml(student.rollNo || '')}</td><td>${escapeHtml([student.student?.studentProfile?.firstName, student.student?.studentProfile?.lastName].filter(Boolean).join(' ') || student.student?.email)}</td><td>${student.subjects.map((subject: any) => `${escapeHtml(subject.subject)}: ${subject.finalPercent === null ? 'Final pending' : `${subject.finalPercent}%`}<br/><small>${Object.entries(subject.categoryProgress || {}).map(([key, value]: any) => `${escapeHtml(key.replaceAll('_', ' '))}: ${escapeHtml(value.percentage)}%`).join(' · ')}</small>`).join('<br/><br/>')}</td><td>${student.overallPercentage === null ? 'Pending' : `${student.overallPercentage}%`}</td><td>${escapeHtml(student.overallGrade || '—')}</td><td>${student.gpa ?? '—'}</td><td>${student.rank ?? '—'}</td></tr>`).join('');
    const sectionLabel = isManagement ? `Class ${sectionReport?.section?.class?.name || ''} · ${sectionReport?.section?.name || ''}` : `Class ${sectionReport?.section?.class?.name || ''} · ${sectionReport?.section?.name || ''}`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#172033;padding:24px}h1{font-size:20px;margin:0 0 6px}p{color:#667085;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:22px;font-size:10px}th,td{border:1px solid #d5dbe5;padding:8px;text-align:left;vertical-align:top}th{background:#eef4ff}footer{margin-top:22px;color:#667085;font-size:9px}</style></head><body><h1>Student progress report</h1><p>${escapeHtml(sectionLabel)} · Generated ${new Date().toLocaleDateString()}</p><table><thead><tr><th>Roll</th><th>Student</th><th>Subject / assessment</th><th>Final %</th><th>Grade</th><th>GPA</th><th>Rank</th></tr></thead><tbody>${reportRows}</tbody></table><footer>Final weighted percentages are shown only when all configured terminal assessments are marked. Weekly and monthly progress are separate.</footer></body></html>`;
    try {
      const file = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Print or share progress report' });
      else await Print.printAsync({ html });
    } catch (error: any) { Alert.alert('Could not create PDF', error.message || 'Try again.'); }
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Class progress reports</Text>
            <View style={{ height: 46, marginBottom: 9, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderColor: colors.border }}><Ionicons name="search-outline" size={18} color={colors.subText} /><TextInput value={studentSearch} onChangeText={setStudentSearch} placeholder="Search name, email, student ID or EMIS" placeholderTextColor={colors.subText} style={{ color: colors.text, flex: 1, fontSize: 12 }} autoCapitalize="none" returnKeyType="search" /></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>{[['ALL', 'All results'], ['MCQ', 'Weekly MCQ'], ['ACADEMIC', 'Monthly / terminal']].map(([key, label]) => <TouchableOpacity key={key} onPress={() => setSearchCategory(key)} style={[styles.chip, { borderColor: searchCategory === key ? colors.primary : colors.border, backgroundColor: searchCategory === key ? colors.primary + '18' : colors.card }]}><Text style={{ color: searchCategory === key ? colors.primary : colors.subText, fontSize: 11, fontWeight: '700' }}>{label}</Text></TouchableOpacity>)}</ScrollView>
            {!!studentSearch.trim() && <TouchableOpacity onPress={() => setLimitSearchToSection(value => !value)} style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 7, marginBottom: 8, borderRadius: 9, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}><Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800' }}>{limitSearchToSection ? '✓ Selected section only' : 'Search all classes'}</Text></TouchableOpacity>}
            {!!studentSearch.trim() && <Text style={{ color: colors.subText, fontSize: 11, marginBottom: 8 }}>{matchedReports ? `${matchedReports.length} matching student(s)` : 'Searching school records…'}</Text>}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {orderAcademicClasses(structure?.classes || []).flatMap((item: any) => (item.sections || []).map((section: any) => ({ ...section, className: item.name }))).map((section: any) => <TouchableOpacity key={section.id} onPress={() => setReportSectionId(section.id)} style={[styles.chip, { borderColor: reportSectionId === section.id ? colors.primary : colors.border, backgroundColor: reportSectionId === section.id ? colors.primary + '18' : colors.card }]}><Text style={{ color: reportSectionId === section.id ? colors.primary : colors.subText }}>Class {section.className} · {section.name}</Text></TouchableOpacity>)}
            </ScrollView>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'column', alignItems: 'stretch' }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{sectionReport?.section?.class?.name ? `Class ${sectionReport.section.class.name} · ${sectionReport.section.name}` : 'Select a section'}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.subText, marginTop: 5 }]}>Terminal / final weighted results appear when all required marks are entered. Weekly and monthly percentages remain separate progress indicators.</Text>
              {role !== 'TEACHER' && <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary + '18', marginTop: 12 }]} onPress={openScheme}><Text style={[styles.actionButtonText, { color: colors.primary }]}>Assessment weights · grades · Excel template</Text></TouchableOpacity>}
              {!!sectionReport?.reports?.length && <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary, marginTop: 8 }]} onPress={exportClassReport}><Text style={[styles.actionButtonText, { color: '#fff' }]}>Download filled class Excel</Text></TouchableOpacity>}
              {!!sectionReport?.reports?.length && <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary + '18', marginTop: 8 }]} onPress={printProgressReport}><Text style={[styles.actionButtonText, { color: colors.primary }]}>Print / share class PDF</Text></TouchableOpacity>}
            </View>
            {displayedReports.map((item: any) => <View key={item.student.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'column', alignItems: 'stretch' }]}>
              <View style={styles.cardHeaderCopy}><Text style={[styles.cardTitle, { color: colors.text }]}>{item.rollNo ? `${item.rollNo}. ` : ''}{[item.student.studentProfile?.firstName, item.student.studentProfile?.lastName].filter(Boolean).join(' ') || item.student.email}</Text><Text style={[styles.cardSubtitle, { color: colors.subText, marginTop: 4 }]}>Final: {item.overallPercentage === null ? `Incomplete (${item.completion})` : `${item.overallPercentage}%${item.overallGrade ? ` · ${item.overallGrade}` : ''}${item.gpa !== null ? ` · GPA ${item.gpa}` : ''}`} · Rank {item.rank || '—'}</Text></View>
              {item.subjects?.map((subject: any) => <View key={subject.subjectId} style={{ marginTop: 9 }}><Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>{subject.subject}: {subject.finalPercent === null ? 'Pending required assessments' : `${subject.finalPercent}%${subject.finalGrade ? ` · ${subject.finalGrade}` : ''}`}</Text><Text style={{ color: colors.subText, fontSize: 10, marginTop: 3 }}>{Object.entries(subject.categoryProgress || {}).map(([category, progress]: any) => `${category.replaceAll('_', ' ')} ${progress.percentage}%`).join('  ·  ')}</Text></View>)}
            </View>)}
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>{[['ALL', 'All results'], ['MCQ', 'Weekly MCQ'], ['ACADEMIC', 'Monthly / terminal']].map(([key, label]) => <TouchableOpacity key={key} onPress={() => setStudentResultMode(key)} style={[styles.chip, { borderColor: studentResultMode === key ? colors.primary : colors.border, backgroundColor: studentResultMode === key ? colors.primary + '18' : colors.card }]}><Text style={{ color: studentResultMode === key ? colors.primary : colors.subText, fontSize: 11, fontWeight: '700' }}>{label}</Text></TouchableOpacity>)}</ScrollView>
            {sectionReport && <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'column', alignItems: 'stretch' }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Progress report · {sectionReport.completion} subjects complete</Text>
              <Text style={{ color: colors.primary, fontSize: 25, fontWeight: '900', marginTop: 8 }}>{sectionReport.overallPercentage === null ? 'In progress' : `${sectionReport.overallPercentage}%`}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.subText }]}>{sectionReport.overallGrade || 'Grade pending'}{sectionReport.gpa !== null ? ` · GPA ${sectionReport.gpa}` : ''}{sectionReport.rank ? ` · Class rank ${sectionReport.rank}` : ''}</Text>
              {sectionReport.subjects?.map((subject: any) => <View key={subject.subjectId} style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}><Text style={[styles.cardTitle, { color: colors.text }]}>{subject.subject}: {subject.finalPercent === null ? 'Final calculation pending' : `${subject.finalPercent}%${subject.finalGrade ? ` · ${subject.finalGrade}` : ''}`}</Text><Text style={[styles.cardSubtitle, { color: colors.subText, marginTop: 4 }]}>{Object.entries(subject.categoryProgress || {}).map(([category, progress]: any) => `${category.replaceAll('_', ' ')} ${progress.percentage}%`).join(' · ') || 'Progress results will appear as assessments are marked.'}</Text></View>)}
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary + '18', marginTop: 14 }]} onPress={printProgressReport}><Text style={[styles.actionButtonText, { color: colors.primary }]}>Download / print PDF report</Text></TouchableOpacity>
            </View>}
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.summaryItem}><Text style={[styles.summaryValue, { color: colors.primary }]}>{sectionReport?.overallPercentage ?? `${overallPercentage}%`}</Text><Text style={[styles.summaryLabel, { color: colors.subText }]}>Weighted overall</Text></View>
              <View style={styles.summaryItem}><Text style={[styles.summaryValue, { color: colors.text }]}>{totalMarks} / {maximumMarks}</Text><Text style={[styles.summaryLabel, { color: colors.subText }]}>Marks</Text></View>
            </View>
            {visibleStudentResults.map((group, idx) => (
              <View key={idx} style={{ marginBottom: 20 }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{group.exam?.title || 'Exam result'} · {group.exam?.assessmentCategory?.replaceAll('_', ' ') || 'Assessment'}</Text>
                {group.results?.map((row: any, i: number) => (
                  <View key={i} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeaderCopy}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>{group.exam?.subject?.name || 'Subject'}</Text>
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Result</Text>
              <TouchableOpacity onPress={() => setEditorVisible(false)}><Ionicons name="close" size={24} color={colors.subText} /></TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>{selectedExam?.title} · {selectedExam?.subject?.name}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.subText, marginBottom: 12 }]}>Enter marks against the enrolled class roster. Existing marks are prefilled; blank rows are left unchanged.</Text>
              {students.map((student: any, index: number) => <View key={student.id} style={[styles.markRow, { borderColor: colors.border }]}>
                <View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.text, fontSize: 13 }]}>{student.rollNo ? `${student.rollNo}. ` : ''}{[student.studentProfile?.firstName, student.studentProfile?.lastName].filter(Boolean).join(' ') || student.email}</Text><Text style={[styles.cardSubtitle, { color: colors.subText, fontSize: 10 }]}>{student.emisId || ''}</Text></View>
                <TextInput value={marksRows[index]?.marksObtained || ''} onChangeText={value => setMarksRows(rows => rows.map((row, rowIndex) => rowIndex === index ? { ...row, marksObtained: value.replace(/[^0-9.]/g, '') } : row))} keyboardType="decimal-pad" placeholder="Marks" placeholderTextColor={colors.subText} style={[styles.markInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} />
                <TextInput value={marksRows[index]?.totalMarks || '100'} onChangeText={value => setMarksRows(rows => rows.map((row, rowIndex) => rowIndex === index ? { ...row, totalMarks: value.replace(/[^0-9.]/g, '') } : row))} keyboardType="decimal-pad" placeholder="Out of" placeholderTextColor={colors.subText} style={[styles.markInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} />
              </View>)}
              
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={submitResult} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Add Result</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={schemeVisible} animationType="slide" transparent onRequestClose={() => setSchemeVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.text }]}>Assessment format</Text><TouchableOpacity onPress={() => setSchemeVisible(false)}><Ionicons name="close" size={24} color={colors.subText} /></TouchableOpacity></View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={[styles.cardSubtitle, { color: colors.subText, marginBottom: 12 }]}>Set terminal weights. They must total 100%. Weekly and monthly reports are tracked separately and do not enter the final unless your school policy changes.</Text>
              {(['TERMINAL_1', 'TERMINAL_2', 'TERMINAL_3', 'FINAL'] as const).map(key => <View key={key} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}><Text style={{ color: colors.text, flex: 1, fontWeight: '700' }}>{key.replaceAll('_', ' ')}</Text><TextInput value={weights[key]} onChangeText={value => setWeights(current => ({ ...current, [key]: value.replace(/[^0-9.]/g, '') }))} keyboardType="decimal-pad" style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background, width: 88, textAlign: 'right', marginBottom: 0 }]} /><Text style={{ color: colors.subText, marginLeft: 6 }}>%</Text></View>)}
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 18 }]}>School grade bands</Text>
              <Text style={[styles.cardSubtitle, { color: colors.subText, marginBottom: 10 }]}>Optional. Configure your school’s percentage-to-grade and GPA scale; the app does not assume a national scale.</Text>
              {gradeBands.map((band, index) => <View key={index} style={{ flexDirection: 'row', gap: 5, alignItems: 'center', marginBottom: 8 }}>
                {(['minPercent', 'maxPercent', 'grade', 'gpa'] as const).map((field, fieldIndex) => <TextInput key={field} value={String(band[field] ?? '')} onChangeText={value => setGradeBands(rows => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: field === 'grade' ? value : value.replace(/[^0-9.]/g, '') } : row))} keyboardType={field === 'grade' ? 'default' : 'decimal-pad'} placeholder={['Min %', 'Max %', 'Grade', 'GPA'][fieldIndex]} placeholderTextColor={colors.subText} style={[styles.input, { flex: field === 'grade' ? 1.2 : 1, color: colors.text, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: 7, marginBottom: 0, fontSize: 11 }]} />)}
                <TouchableOpacity onPress={() => setGradeBands(rows => rows.filter((_, rowIndex) => rowIndex !== index))}><Ionicons name="trash-outline" size={18} color={colors.danger} /></TouchableOpacity>
              </View>)}
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary + '18', marginTop: 4 }]} onPress={() => setGradeBands(rows => [...rows, { minPercent: '', maxPercent: '', grade: '', gpa: '' }])}><Text style={[styles.actionButtonText, { color: colors.primary }]}>+ Add grade band</Text></TouchableOpacity>
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 18 }]}>Excel marksheet template</Text>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary + '18' }]} onPress={pickTemplate}><Text style={[styles.actionButtonText, { color: colors.primary }]}>{templateFile?.name || scheme?.templateName || 'Choose school .xlsx template'}</Text></TouchableOpacity>
              <Text style={[styles.cardSubtitle, { color: colors.subText, marginTop: 6 }]}>The export fills matching header columns such as Roll No, EMIS ID, Student Name, subject names, Overall %, Grade, GPA, and Rank.</Text>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={saveScheme} disabled={schemeSaving}>{schemeSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save assessment format</Text>}</TouchableOpacity>
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
  actionButton: { paddingVertical: 11, paddingHorizontal: 13, borderRadius: 10, alignItems: 'center', marginBottom: 6 },
  actionButtonText: { fontSize: 12, fontWeight: '800' },
  markRow: { flexDirection: 'row', alignItems: 'center', gap: 7, borderBottomWidth: 1, paddingVertical: 8 },
  markInput: { width: 64, borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 8, fontSize: 12, textAlign: 'center' },
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

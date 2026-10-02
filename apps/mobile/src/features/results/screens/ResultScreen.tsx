import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../../core/theme/ThemeContext';
import { api } from '../../../core/networking/api';
import { getSelectedChildId } from '../../../core/utils/childSelection';

export default function ResultScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const [childId, setChildId] = useState('');
  const [childName, setChildName] = useState('');
  useEffect(() => { SecureStore.getItemAsync('user_data').then(raw => { if (raw) setRole(JSON.parse(raw).role || ''); }).catch(() => undefined); }, []);
  useEffect(() => { if (role === 'PARENT') getSelectedChildId().then(async id => { setChildId(id || ''); try { const { data } = await api.get('/academics/children'); const child = (Array.isArray(data) ? data : []).find((item: any) => item.student?.id === id) || data?.[0]; const profile = child?.student?.studentProfile; setChildName([profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || child?.student?.email || 'Selected child'); } catch { setChildName('Selected child'); } }).catch(() => undefined); }, [role]);
  useEffect(() => {
    if (!role || (role !== 'STUDENT' && role !== 'PARENT')) { setLoading(false); return; }
    if (role === 'PARENT' && !childId) { setLoading(false); setError('Select a child from the home screen first.'); return; }
    let active = true;
    api.get(role === 'PARENT' ? `/exams/student/${childId}` : '/exams/me/results').then(({ data }) => {
      if (active) { setResults(data); setError(''); }
    }).catch((err: any) => {
      if (active) setError(err.response?.data?.message || 'Could not load results.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [role, childId]);
  const allRows = results.flatMap(group => group.results || []);
  const totalMarks = allRows.reduce((sum, row) => sum + Number(row.marksObtained || 0), 0);
  const maximumMarks = allRows.reduce((sum, row) => sum + Number(row.totalMarks || 0), 0);
  const overallPercentage = maximumMarks ? Math.round((totalMarks / maximumMarks) * 100) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCopy}><Text style={styles.headerTitle}>Results</Text>{role === 'PARENT' && <Text style={styles.headerSubtitle}>{childName ? `For ${childName}` : 'Select a child from Home'}</Text>}</View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Performance Overview placeholder */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Overall Performance</Text>
          <View style={styles.progressCircle}>
            <Text style={styles.progressText}>{overallPercentage}%</Text>
            <Text style={styles.progressSubText}>{results.length ? 'Overall' : 'No results'}</Text>
          </View>
        </View>

        {!role || (role !== 'STUDENT' && role !== 'PARENT') ? <Text style={styles.stateText}>Published results for students or the selected parent-linked child appear here.</Text> : loading ? <Text style={styles.stateText}>Loading results…</Text> : error ? <Text style={styles.stateText}>{error}</Text> : results.length === 0 ? <Text style={styles.stateText}>No published results yet.</Text> : results.map((group: any) => {
          const exam = group.exam;
          const groupTotal = group.results.reduce((sum: number, row: any) => sum + Number(row.totalMarks || 0), 0);
          const groupMarks = group.results.reduce((sum: number, row: any) => sum + Number(row.marksObtained || 0), 0);
          return (
          <View key={exam.id} style={styles.examCard}>
            <View style={styles.examHeader}>
              <View>
                <Text style={styles.examTitle}>{exam.examTitle}</Text>
                <Text style={styles.examDate}>{new Date(exam.date).toLocaleDateString()}</Text>
              </View>
              <View style={styles.examOverallBadge}>
                <Text style={styles.examOverallText}>{groupTotal ? `${Math.round((groupMarks / groupTotal) * 100)}%` : '—'}</Text>
              </View>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.colLeft, styles.tableHeaderText]}>Subject</Text>
              <Text style={[styles.colCenter, styles.tableHeaderText]}>Marks</Text>
              <Text style={[styles.colRight, styles.tableHeaderText]}>Grade</Text>
            </View>

            {group.results.map((result: any, index: number) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.colLeft, styles.tableRowText]}>{exam.subject?.name || 'Subject'}</Text>
                <Text style={[styles.colCenter, styles.tableRowText]}>{result.marksObtained}/{result.totalMarks}</Text>
                <Text style={[styles.colRight, styles.tableGradeText]}>{result.grade || '—'}</Text>
              </View>
            ))}
          </View>
        ); })}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: c.card },
  backButton: { padding: 5 },
  backIcon: { fontSize: 24, color: c.text },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: c.text },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerSubtitle: { color: c.subText, fontSize: 10, marginTop: 3 },
  content: { padding: 20 },
  stateText: { color: c.subText, textAlign: 'center', padding: 30 },
  overviewCard: { backgroundColor: c.card, padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  overviewTitle: { fontSize: 16, fontWeight: 'bold', color: c.text, marginBottom: 15 },
  progressCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 8, borderColor: c.primary, justifyContent: 'center', alignItems: 'center' },
  progressText: { fontSize: 24, fontWeight: 'bold', color: c.primary },
  progressSubText: { fontSize: 12, color: c.subText },
  examCard: { backgroundColor: c.card, borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  examHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: 15 },
  examTitle: { fontSize: 16, fontWeight: 'bold', color: c.text, marginBottom: 4 },
  examDate: { fontSize: 12, color: c.subText },
  examOverallBadge: { backgroundColor: c.primary + '18', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  examOverallText: { color: c.primary, fontWeight: 'bold', fontSize: 16 },
  tableHeader: { flexDirection: 'row', marginBottom: 10, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: c.border },
  tableHeaderText: { fontSize: 12, color: c.subText, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border },
  tableRowText: { fontSize: 14, color: c.text },
  tableGradeText: { fontSize: 14, fontWeight: 'bold', color: c.success },
  colLeft: { flex: 2 },
  colCenter: { flex: 1, textAlign: 'center' },
  colRight: { flex: 1, textAlign: 'right' }
});

import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../../core/theme/ThemeContext';

export default function ResultScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const results = [
    {
      id: '1',
      examTitle: 'First Terminal Examination',
      date: 'Aug 2026',
      totalGrade: 'A',
      percentage: '85%',
      subjects: [
        { name: 'Mathematics', marks: 88, max: 100, grade: 'A' },
        { name: 'Science', marks: 82, max: 100, grade: 'A' },
        { name: 'English', marks: 75, max: 100, grade: 'B+' },
        { name: 'Computer', marks: 95, max: 100, grade: 'A+' },
      ]
    },
    {
      id: '2',
      examTitle: 'Mid Term Examination',
      date: 'Dec 2025',
      totalGrade: 'B+',
      percentage: '78%',
      subjects: [
        { name: 'Mathematics', marks: 72, max: 100, grade: 'B+' },
        { name: 'Science', marks: 80, max: 100, grade: 'A' },
        { name: 'English', marks: 70, max: 100, grade: 'B' },
        { name: 'Computer', marks: 90, max: 100, grade: 'A+' },
      ]
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Results</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Performance Overview placeholder */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Overall Performance</Text>
          <View style={styles.progressCircle}>
            <Text style={styles.progressText}>85%</Text>
            <Text style={styles.progressSubText}>Excellent</Text>
          </View>
        </View>

        {results.map((exam) => (
          <View key={exam.id} style={styles.examCard}>
            <View style={styles.examHeader}>
              <View>
                <Text style={styles.examTitle}>{exam.examTitle}</Text>
                <Text style={styles.examDate}>{exam.date}</Text>
              </View>
              <View style={styles.examOverallBadge}>
                <Text style={styles.examOverallText}>{exam.totalGrade}</Text>
              </View>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.colLeft, styles.tableHeaderText]}>Subject</Text>
              <Text style={[styles.colCenter, styles.tableHeaderText]}>Marks</Text>
              <Text style={[styles.colRight, styles.tableHeaderText]}>Grade</Text>
            </View>

            {exam.subjects.map((sub, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.colLeft, styles.tableRowText]}>{sub.name}</Text>
                <Text style={[styles.colCenter, styles.tableRowText]}>{sub.marks}/{sub.max}</Text>
                <Text style={[styles.colRight, styles.tableGradeText]}>{sub.grade}</Text>
              </View>
            ))}
          </View>
        ))}
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
  content: { padding: 20 },
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

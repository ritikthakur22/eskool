import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';

export default function ResultScreen({ navigation }: any) {
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFFFFF' },
  backButton: { padding: 5 },
  backIcon: { fontSize: 24, color: '#1A202C' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A202C' },
  content: { padding: 20 },
  overviewCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  overviewTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A202C', marginBottom: 15 },
  progressCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 8, borderColor: '#3182CE', justifyContent: 'center', alignItems: 'center' },
  progressText: { fontSize: 24, fontWeight: 'bold', color: '#2B6CB0' },
  progressSubText: { fontSize: 12, color: '#718096' },
  examCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  examHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 15 },
  examTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
  examDate: { fontSize: 12, color: '#A0AEC0' },
  examOverallBadge: { backgroundColor: '#EBF8FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  examOverallText: { color: '#3182CE', fontWeight: 'bold', fontSize: 16 },
  tableHeader: { flexDirection: 'row', marginBottom: 10, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
  tableHeaderText: { fontSize: 12, color: '#A0AEC0', fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
  tableRowText: { fontSize: 14, color: '#4A5568' },
  tableGradeText: { fontSize: 14, fontWeight: 'bold', color: '#38A169' },
  colLeft: { flex: 2 },
  colCenter: { flex: 1, textAlign: 'center' },
  colRight: { flex: 1, textAlign: 'right' }
});

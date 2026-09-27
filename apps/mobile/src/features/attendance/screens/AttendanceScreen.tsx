import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';

export default function AttendanceScreen({ navigation }: any) {
  const [filter, setFilter] = useState('Class-Wise');
  const filters = ['Class-Wise', 'Subject-Wise', 'Biometric'];
  
  // Dummy calendar data to represent 1-30 Sept
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const startDayOffset = 2; // Sept 1 starts on Tuesday (dummy offset)

  const getStatusColor = (day: number) => {
    if (day === 27) return '#3182CE'; // Selected/Today
    if ([7, 14, 21, 28].includes(day)) return '#E2E8F0'; // Weekends/Holidays
    if (day === 5 || day === 12) return '#E53E3E'; // Absent
    return '#38A169'; // Present (default)
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterContainer}>
        {filters.map((f) => (
          <TouchableOpacity key={f} style={[styles.filterButton, filter === f && styles.filterButtonActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.calendarCard}>
          <View style={styles.monthSelector}>
            <TouchableOpacity><Text style={styles.arrowIcon}>{'<'}</Text></TouchableOpacity>
            <Text style={styles.monthText}>September 2026</Text>
            <TouchableOpacity><Text style={styles.arrowIcon}>{'>'}</Text></TouchableOpacity>
          </View>
          
          <View style={styles.weekDays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <Text key={d} style={styles.weekDayText}>{d}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {Array.from({ length: startDayOffset }).map((_, i) => <View key={`empty-${i}`} style={styles.dayCell} />)}
            {daysInMonth.map(day => (
              <View key={day} style={styles.dayCell}>
                <View style={[
                  styles.dayCircle,
                  day === 27 && { backgroundColor: '#3182CE' }
                ]}>
                  <Text style={[styles.dayNumber, day === 27 && { color: '#FFF' }]}>{day}</Text>
                </View>
                {/* Status Dot */}
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(day) }]} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#38A169' }]}>11</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#E53E3E' }]}>1</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
        </View>

        <Text style={styles.overviewTitle}>Attendance Overview</Text>
        <View style={styles.overviewCard}>
          <View style={styles.circularProgress}>
            <Text style={styles.progressText}>92%</Text>
          </View>
          <View style={styles.legendContainer}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#38A169' }]} />
              <Text style={styles.legendLabel}>Present</Text>
              <Text style={styles.legendValue}>11 (92%)</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#E53E3E' }]} />
              <Text style={styles.legendLabel}>Absent</Text>
              <Text style={styles.legendValue}>1 (8%)</Text>
            </View>
          </View>
        </View>
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
  filterContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  filterButton: { paddingBottom: 10 },
  filterButtonActive: { borderBottomWidth: 2, borderBottomColor: '#3182CE' },
  filterText: { fontSize: 14, color: '#718096', fontWeight: '500' },
  filterTextActive: { color: '#3182CE', fontWeight: 'bold' },
  content: { padding: 20 },
  calendarCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  arrowIcon: { fontSize: 18, color: '#718096', paddingHorizontal: 10 },
  monthText: { fontSize: 16, fontWeight: 'bold', color: '#1A202C' },
  weekDays: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  weekDayText: { flex: 1, textAlign: 'center', fontSize: 12, color: '#A0AEC0', fontWeight: 'bold' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', alignItems: 'center', marginVertical: 8, height: 45 },
  dayCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  dayNumber: { fontSize: 14, color: '#4A5568' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statBox: { flex: 1, backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#718096' },
  overviewTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A202C', marginBottom: 15 },
  overviewCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  circularProgress: { width: 80, height: 80, borderRadius: 40, borderWidth: 8, borderColor: '#38A169', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  progressText: { fontSize: 18, fontWeight: 'bold', color: '#234E52' },
  legendContainer: { flex: 1 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  legendLabel: { flex: 1, fontSize: 14, color: '#4A5568' },
  legendValue: { fontSize: 14, fontWeight: 'bold', color: '#1A202C' },
});

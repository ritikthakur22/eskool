import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';

export default function RoutineScreen({ navigation }: any) {
  const [selectedDay, setSelectedDay] = useState('Tue');
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const routineData = [
    { id: '1', subject: 'Mathematics', time: '08:00 - 08:45 AM', room: 'Room 201' },
    { id: '2', subject: 'Science', time: '09:00 - 09:45 AM', room: 'Room 202' },
    { id: '3', subject: 'English', time: '10:00 - 10:45 AM', room: 'Room 203' },
    { id: '4', subject: 'Social Studies', time: '11:00 - 11:45 AM', room: 'Room 204' },
    { id: '5', subject: 'Computer', time: '01:00 - 01:45 PM', room: 'Lab 1' },
    { id: '6', subject: 'Optional Math', time: '02:00 - 02:45 PM', room: 'Room 205' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class Routine</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.daysContainer}>
        {days.map((day) => (
          <TouchableOpacity
            key={day}
            style={[styles.dayButton, selectedDay === day && styles.dayButtonActive]}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[styles.dayText, selectedDay === day && styles.dayTextActive]}>{day}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.routineList}>
        {routineData.map((item) => (
          <View key={item.id} style={styles.routineCard}>
            <View style={styles.periodNumberContainer}>
              <Text style={styles.periodNumber}>{item.id}</Text>
            </View>
            <View style={styles.routineDetails}>
              <Text style={styles.routineSubject}>{item.subject}</Text>
              <Text style={styles.routineTime}>{item.time}</Text>
              <Text style={styles.routineRoom}>{item.room}</Text>
            </View>
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
  daysContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  dayButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  dayButtonActive: { backgroundColor: '#3182CE' },
  dayText: { fontSize: 14, color: '#718096', fontWeight: '500' },
  dayTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
  routineList: { padding: 20 },
  routineCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, alignItems: 'center' },
  periodNumberContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  periodNumber: { fontSize: 16, fontWeight: 'bold', color: '#4A5568' },
  routineDetails: { flex: 1 },
  routineSubject: { fontSize: 16, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
  routineTime: { fontSize: 12, color: '#718096', marginBottom: 2 },
  routineRoom: { fontSize: 12, color: '#718096' },
});

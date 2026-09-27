import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CalendarScreen({ navigation }: any) {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dates = [
    [30, 31, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11, 12],
    [13, 14, 15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24, 25, 26],
    [27, 28, 29, 30, 1, 2, 3]
  ];

  const events = [
    { id: '1', title: 'School Assembly', time: '08:00 AM - 08:30 AM', location: 'Main Hall', color: '#3182CE' },
    { id: '2', title: 'Math Test', time: '10:00 AM - 10:45 AM', location: 'Room 201', color: '#E53E3E' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="calendar-outline" size={24} color="#1A202C" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.calendarHeader}>
          <Ionicons name="chevron-back" size={20} color="#718096" />
          <Text style={styles.monthText}>September 2026</Text>
          <Ionicons name="chevron-forward" size={20} color="#718096" />
        </View>

        <View style={styles.daysRow}>
          {daysOfWeek.map(day => (
            <Text key={day} style={styles.dayText}>{day}</Text>
          ))}
        </View>

        <View style={styles.datesGrid}>
          {dates.map((week, wIdx) => (
            <View key={wIdx} style={styles.weekRow}>
              {week.map((date, dIdx) => {
                const isSelected = date === 27;
                const isOtherMonth = (wIdx === 0 && date > 20) || (wIdx === 4 && date < 10);
                const hasEvent = date === 27 || date === 1 || date === 9 || date === 15;
                const eventColor = date === 15 ? '#38A169' : date === 9 ? '#E53E3E' : '#3182CE';

                return (
                  <TouchableOpacity key={dIdx} style={[styles.dateCell, isSelected && styles.dateCellSelected]}>
                    <Text style={[styles.dateText, isOtherMonth && styles.dateTextMuted, isSelected && styles.dateTextSelected]}>
                      {date}
                    </Text>
                    {hasEvent && <View style={[styles.eventDot, { backgroundColor: eventColor }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.eventsSection}>
          <Text style={styles.eventsTitle}>Events for Sep 27, 2026</Text>
          {events.map(event => (
            <View key={event.id} style={styles.eventCard}>
              <View style={[styles.eventStripe, { backgroundColor: event.color }]} />
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventTime}>{event.time}</Text>
                <Text style={styles.eventLocation}>{event.location}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A202C' },
  content: { padding: 20 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  monthText: { fontSize: 16, fontWeight: 'bold', color: '#1A202C' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  dayText: { fontSize: 12, color: '#A0AEC0', width: 30, textAlign: 'center' },
  datesGrid: { marginBottom: 30 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  dateCell: { width: 35, height: 35, justifyContent: 'center', alignItems: 'center', borderRadius: 17.5 },
  dateCellSelected: { backgroundColor: '#3182CE' },
  dateText: { fontSize: 14, color: '#1A202C' },
  dateTextMuted: { color: '#CBD5E0' },
  dateTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },
  eventDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  eventsSection: { marginTop: 10 },
  eventsTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A202C', marginBottom: 15 },
  eventCard: { flexDirection: 'row', backgroundColor: '#F7FAFC', borderRadius: 8, overflow: 'hidden', marginBottom: 15 },
  eventStripe: { width: 4 },
  eventContent: { padding: 15, flex: 1 },
  eventTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
  eventTime: { fontSize: 13, color: '#718096', marginBottom: 4 },
  eventLocation: { fontSize: 12, color: '#A0AEC0' }
});

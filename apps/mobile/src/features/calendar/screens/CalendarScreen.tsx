import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CalendarScreen({ navigation }: any) {
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  const calendarData = [
    [null, null, null, { bs: 1, ad: '17' }, { bs: 2, ad: '18' }, { bs: 3, ad: '19', red: true }, { bs: 4, ad: '20', red: true }],
    [{ bs: 5, ad: '21' }, { bs: 6, ad: '22', red: true }, { bs: 7, ad: '23' }, { bs: 8, ad: '24' }, { bs: 9, ad: '25' }, { bs: 10, ad: '26' }, { bs: 11, ad: '27', red: true }],
    [{ bs: 12, ad: '28' }, { bs: 13, ad: '29', red: true }, { bs: 14, ad: '30', red: true }, { bs: 15, ad: '01', red: true }, { bs: 16, ad: '02', red: true }, { bs: 17, ad: '03', red: true }, { bs: 18, ad: '04', red: true }],
    [{ bs: 19, ad: '05' }, { bs: 20, ad: '06' }, { bs: 21, ad: '07' }, { bs: 22, ad: '08' }, { bs: 23, ad: '09' }, { bs: 24, ad: '10' }, { bs: 25, ad: '11', red: true }],
    [{ bs: 26, ad: '12' }, { bs: 27, ad: '13' }, { bs: 28, ad: '14' }, { bs: 29, ad: '15' }, { bs: 30, ad: '16' }, { bs: 31, ad: '17' }, null],
  ];

  const events = [
    { id: '1', title: 'Dashain Festival', time: 'All Day', location: 'Public Holiday', color: '#EF4444' },
    { id: '2', title: 'First Term Exams', time: '10:00 AM - 1:00 PM', location: 'Examination Hall', color: '#2F80ED' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="calendar-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Calendar Top Header */}
          <View style={styles.calendarHeaderRow}>
            <Text style={styles.monthLeftText}>Ashoj</Text>
            <Text style={styles.monthRightText}>Sep/Oct 2025</Text>
          </View>

          {/* Days of week */}
          <View style={styles.daysRow}>
            {daysOfWeek.map((day, index) => (
              <View key={index} style={styles.dayCell}>
                <Text style={[styles.dayText, day === 'S' && index === 6 && { color: '#E53E3E' }]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Dates Grid */}
          <View style={styles.gridContainer}>
            {calendarData.map((week, wIdx) => (
              <View key={wIdx} style={styles.weekRow}>
                {week.map((dateObj, dIdx) => (
                  <View key={dIdx} style={styles.dateCell}>
                    {dateObj ? (
                      <>
                        <Text style={[styles.bsText, dateObj.red && styles.redText]}>
                          {dateObj.bs}
                        </Text>
                        <Text style={[styles.adText, dateObj.red && styles.redText]}>
                          {dateObj.ad}
                        </Text>
                      </>
                    ) : null}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.eventsSection}>
          <Text style={styles.eventsTitle}>Upcoming Events</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40, backgroundColor: '#FFFFFF' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  content: { padding: 20 },
  
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 24,
    overflow: 'hidden'
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  monthLeftText: { fontSize: 16, color: '#1F2937', fontWeight: '500' },
  monthRightText: { fontSize: 15, color: '#4B5563', fontWeight: '400' },
  
  daysRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  dayCell: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
  },
  dayText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500'
  },
  
  gridContainer: {
    flexDirection: 'column'
  },
  weekRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  dateCell: {
    flex: 1,
    aspectRatio: 1, // Make cells perfectly square
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
    position: 'relative',
    padding: 8
  },
  bsText: {
    fontSize: 18,
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 8
  },
  adText: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    fontSize: 10,
    color: '#4B5563'
  },
  redText: {
    color: '#E53E3E'
  },
  
  eventsSection: { marginTop: 10 },
  eventsTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 15 },
  eventCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  eventStripe: { width: 4 },
  eventContent: { padding: 15, flex: 1 },
  eventTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  eventTime: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  eventLocation: { fontSize: 12, color: '#9CA3AF' }
});

import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OnlineClassScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState('Upcoming');
  const tabs = ['Upcoming', 'Live', 'Recorded'];

  const upcomingClasses = [
    { id: '1', subject: 'Mathematics', time: 'Today, 08:00 - 08:45 AM', teacher: 'By: Mr. Sharma', iconColor: '#3182CE', bg: '#EBF8FF' },
    { id: '2', subject: 'Science', time: 'Today, 09:00 - 09:45 AM', teacher: 'By: Ms. Rai', iconColor: '#38A169', bg: '#C6F6D5' },
    { id: '3', subject: 'English', time: 'Today, 11:00 - 11:45 AM', teacher: 'By: Mr. KC', iconColor: '#805AD5', bg: '#E9D8FD' }
  ];

  const recordedClasses = [
    { id: '4', subject: 'Algebra - Part 1', duration: '45 min', date: 'Sep 20', bg: '#EDF2F7' },
    { id: '5', subject: 'Cell Structure', duration: '38 min', date: 'Sep 18', bg: '#EDF2F7' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Online Class</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {activeTab === 'Upcoming' && (
          <View>
            {upcomingClasses.map((item) => (
              <View key={item.id} style={styles.classCard}>
                <View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
                  <Ionicons name="videocam-outline" size={24} color={item.iconColor} />
                </View>
                <View style={styles.classContent}>
                  <Text style={styles.classSubject}>{item.subject}</Text>
                  <Text style={styles.classTime}>{item.time}</Text>
                  <Text style={styles.classTeacher}>{item.teacher}</Text>
                </View>
                <TouchableOpacity style={styles.joinButton}>
                  <Text style={styles.joinButtonText}>Join</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'Recorded' && (
          <View>
            <Text style={styles.sectionTitle}>Recorded Classes</Text>
            {recordedClasses.map((item) => (
              <View key={item.id} style={styles.recordedCard}>
                <View style={[styles.thumbnail, { backgroundColor: item.bg }]}>
                  <Ionicons name="play-circle" size={32} color="#A0AEC0" />
                </View>
                <View style={styles.recordedContent}>
                  <Text style={styles.classSubject}>{item.subject}</Text>
                  <View style={styles.recordedMeta}>
                    <Ionicons name="time-outline" size={14} color="#718096" />
                    <Text style={styles.metaText}>{item.duration} • {item.date}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A202C' },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabButton: { paddingVertical: 15, paddingHorizontal: 20 },
  tabButtonActive: { borderBottomWidth: 2, borderBottomColor: '#3182CE' },
  tabText: { fontSize: 14, color: '#718096', fontWeight: '500' },
  tabTextActive: { color: '#3182CE', fontWeight: 'bold' },
  listContainer: { padding: 20 },
  classCard: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#F7FAFC' },
  iconContainer: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  classContent: { flex: 1 },
  classSubject: { fontSize: 16, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
  classTime: { fontSize: 13, color: '#4A5568', marginBottom: 2 },
  classTeacher: { fontSize: 12, color: '#A0AEC0' },
  joinButton: { backgroundColor: '#3182CE', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  joinButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A202C', marginBottom: 15, marginTop: 10 },
  recordedCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  thumbnail: { width: 100, height: 70, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  recordedContent: { flex: 1, justifyContent: 'center' },
  recordedMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaText: { fontSize: 12, color: '#718096', marginLeft: 4 }
});

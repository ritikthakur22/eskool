import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ExamsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState('Online Exam');
  const tabs = ['Online Exam', 'Upcoming', 'Result'];

  const exams = [
    { id: '1', title: 'First Terminal Exam', subtitle: 'Mathematics - 30 Questions', badge: 'Upcoming', type: 'scheduled' },
    { id: '2', title: 'Practice Quiz', subtitle: '', badge: null, type: 'start' },
    { id: '3', title: 'Science Mock Test', subtitle: '30 Questions • 45 min', badge: null, type: 'start' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exams</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab(tab);
              if (tab === 'Result') navigation.navigate('Result');
            }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {exams.map((exam) => (
          <View key={exam.id} style={styles.examCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="document-text" size={24} color="#3182CE" />
            </View>
            <View style={styles.examContent}>
              <Text style={styles.examTitle}>{exam.title}</Text>
              {exam.subtitle ? <Text style={styles.examSubtitle}>{exam.subtitle}</Text> : null}
              
              {exam.type === 'scheduled' && (
                <View style={styles.upcomingBadge}>
                  <Text style={styles.upcomingBadgeText}>{exam.badge}</Text>
                </View>
              )}
              
              {exam.type === 'start' && (
                <TouchableOpacity style={styles.startButton}>
                  <Text style={styles.startButtonText}>Start</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.viewPastButton}>
          <Ionicons name="documents-outline" size={20} color="#718096" />
          <Text style={styles.viewPastText}>View Past Exams</Text>
          <View style={{ flex: 1 }} />
          <Ionicons name="chevron-forward" size={20} color="#718096" />
        </TouchableOpacity>
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
  examCard: { flexDirection: 'row', padding: 15, backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#F7FAFC' },
  iconContainer: { width: 45, height: 45, borderRadius: 8, backgroundColor: '#EBF8FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  examContent: { flex: 1 },
  examTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
  examSubtitle: { fontSize: 13, color: '#718096', marginBottom: 10 },
  upcomingBadge: { backgroundColor: '#EBF8FF', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  upcomingBadgeText: { color: '#3182CE', fontSize: 12, fontWeight: 'bold' },
  startButton: { backgroundColor: '#EBF8FF', alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 6, borderRadius: 12 },
  startButtonText: { color: '#3182CE', fontSize: 12, fontWeight: 'bold' },
  viewPastButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', padding: 15, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  viewPastText: { marginLeft: 10, fontSize: 14, color: '#4A5568', fontWeight: 'bold' }
});

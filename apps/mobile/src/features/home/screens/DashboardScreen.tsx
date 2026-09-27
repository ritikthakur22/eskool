import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function DashboardScreen({ navigation }: Props) {
  const features = [
    { name: 'Attendance', icon: '📅' },
    { name: 'Homework', icon: '📝' },
    { name: 'Online Class', icon: '💻' },
    { name: 'Routine', icon: '⏰' },
    { name: 'Exams', icon: '📄' },
    { name: 'Results', icon: '🏆' },
    { name: 'Library', icon: '📚' },
    { name: 'Calendar', icon: '🗓' },
    { name: 'Notice', icon: '🔔' },
    { name: 'Chat', icon: '💬' },
    { name: 'Complaint', icon: '⚠️' },
    { name: 'More', icon: '⋯' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarPlaceholder} />
            <View>
              <Text style={styles.greetingText}>Hi, Tapas Dev S.</Text>
              <Text style={styles.subText}>Class 10 • Student</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}><Text>🔔</Text></TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}><Text>🔍</Text></TouchableOpacity>
          </View>
        </View>

        {/* Classes Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryTitleRow}>
              <Text style={styles.summaryIcon}>📚</Text>
              <Text style={styles.summaryTitle}>Today's Classes</Text>
            </View>
            <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
          </View>
          <Text style={styles.summarySubtitle}>2 / 5 completed</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '40%' }]} />
          </View>
        </View>

        {/* Grid Features */}
        <View style={styles.gridContainer}>
          {features.map((feature, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.gridItem}
              onPress={() => {
                if (feature.name === 'Routine') navigation.navigate('Routine');
                if (feature.name === 'Attendance') navigation.navigate('Attendance');
                if (feature.name === 'Notice') navigation.navigate('Notice');
              }}
            >
              <View style={styles.gridIconContainer}>
                <Text style={styles.gridIcon}>{feature.icon}</Text>
              </View>
              <Text style={styles.gridText}>{feature.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Schedule */}
        <View style={styles.scheduleSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
          </View>
          
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleIconContainer}>
              <Text style={styles.scheduleIcon}>📐</Text>
            </View>
            <View style={styles.scheduleDetails}>
              <Text style={styles.scheduleSubject}>Mathematics</Text>
              <Text style={styles.scheduleTime}>08:00 AM - 08:45 AM</Text>
              <Text style={styles.scheduleRoom}>Room 201</Text>
            </View>
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>● Live</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIconActive}>🏠</Text>
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Notice')}>
          <Text style={styles.navIcon}>🔔</Text>
          <Text style={styles.navText}>Notice</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>💻</Text>
          <Text style={styles.navText}>Classes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>💬</Text>
          <Text style={styles.navText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#E2E8F0', marginRight: 12 },
  greetingText: { fontSize: 18, fontWeight: 'bold', color: '#1A202C' },
  subText: { fontSize: 14, color: '#718096' },
  headerIcons: { flexDirection: 'row' },
  iconButton: { marginLeft: 15, padding: 5 },
  summaryCard: { backgroundColor: '#E6FFFA', padding: 20, borderRadius: 16, marginBottom: 25 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTitleRow: { flexDirection: 'row', alignItems: 'center' },
  summaryIcon: { fontSize: 20, marginRight: 8 },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#234E52' },
  viewAll: { color: '#3182CE', fontWeight: '600', fontSize: 14 },
  summarySubtitle: { color: '#285E61', marginTop: 8, marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: '#B2F5EA', borderRadius: 3 },
  progressFill: { height: '100%', backgroundColor: '#319795', borderRadius: 3 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '22%', alignItems: 'center', marginBottom: 20 },
  gridIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 8 },
  gridIcon: { fontSize: 24 },
  gridText: { fontSize: 12, color: '#4A5568', textAlign: 'center' },
  scheduleSection: { marginTop: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A202C' },
  scheduleCard: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  scheduleIconContainer: { width: 40, height: 40, backgroundColor: '#FEFCBF', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  scheduleIcon: { fontSize: 20 },
  scheduleDetails: { flex: 1 },
  scheduleSubject: { fontSize: 16, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
  scheduleTime: { fontSize: 12, color: '#718096', marginBottom: 2 },
  scheduleRoom: { fontSize: 12, color: '#718096' },
  liveBadge: { backgroundColor: '#FED7D7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  liveText: { color: '#E53E3E', fontSize: 12, fontWeight: 'bold' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 15, paddingBottom: 25, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  navItem: { alignItems: 'center' },
  navIconActive: { fontSize: 20, color: '#3182CE' },
  navTextActive: { fontSize: 12, color: '#3182CE', marginTop: 4, fontWeight: 'bold' },
  navIcon: { fontSize: 20, color: '#A0AEC0' },
  navText: { fontSize: 12, color: '#A0AEC0', marginTop: 4 },
});

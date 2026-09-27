import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }: any) {
  const features = [
    { name: 'Attendance', icon: 'finger-print-outline', color: '#3182CE', bg: '#EBF8FF' },
    { name: 'Homework', icon: 'book-outline', color: '#DD6B20', bg: '#FEEBC8' },
    { name: 'Online Class', icon: 'laptop-outline', color: '#38A169', bg: '#C6F6D5' },
    { name: 'Routine', icon: 'calendar-outline', color: '#805AD5', bg: '#E9D8FD' },
    { name: 'Exams', icon: 'document-text-outline', color: '#E53E3E', bg: '#FED7D7' },
    { name: 'Results', icon: 'trophy-outline', color: '#D69E2E', bg: '#FEFCBF' },
    { name: 'Library', icon: 'library-outline', color: '#319795', bg: '#B2F5EA' },
    { name: 'Calendar', icon: 'calendar-number-outline', color: '#D53F8C', bg: '#FED7E2' },
    { name: 'Notice', icon: 'notifications-outline', color: '#E53E3E', bg: '#FED7D7' },
    { name: 'Chat', icon: 'chatbubbles-outline', color: '#3182CE', bg: '#EBF8FF' },
    { name: 'Complaint', icon: 'megaphone-outline', color: '#DD6B20', bg: '#FEEBC8' },
    { name: 'More', icon: 'grid-outline', color: '#718096', bg: '#EDF2F7' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.profileSection} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color="#FFF" />
            </View>
            <View>
              <Text style={styles.greetingText}>Hi, Tapas Dev S.</Text>
              <Text style={styles.subText}>Class 10 • Student</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notice')}>
              <Ionicons name="notifications-outline" size={24} color="#1A202C" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="search-outline" size={24} color="#1A202C" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Classes Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewTextContainer}>
            <Text style={styles.overviewTitle}>Today's Classes</Text>
            <Text style={styles.overviewSubTitle}>2 / 5 completed</Text>
          </View>
          <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
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
                if (feature.name === 'Homework') navigation.navigate('Homework');
                if (feature.name === 'Results') navigation.navigate('Result');
                if (feature.name === 'Online Class') navigation.navigate('OnlineClass');
                if (feature.name === 'Chat') navigation.navigate('Chat');
                if (feature.name === 'Exams') navigation.navigate('Exams');
                if (feature.name === 'Library') navigation.navigate('Library');
                if (feature.name === 'Calendar') navigation.navigate('Calendar');
              }}
            >
              <View style={[styles.gridIconContainer, { backgroundColor: feature.bg }]}>
                <Ionicons name={feature.icon as any} size={28} color={feature.color} />
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
            <View style={[styles.scheduleIconContainer, { backgroundColor: '#FEEBC8' }]}>
              <Ionicons name="calculator-outline" size={24} color="#DD6B20" />
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
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
          <Ionicons name="home" size={24} color="#3182CE" />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Notice')}>
          <Ionicons name="notifications-outline" size={24} color="#A0AEC0" />
          <Text style={styles.navText}>Notice</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('OnlineClass')}>
          <Ionicons name="laptop-outline" size={24} color="#A0AEC0" />
          <Text style={styles.navText}>Classes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Chat')}>
          <Ionicons name="chatbubble-outline" size={24} color="#A0AEC0" />
          <Text style={styles.navText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-outline" size={24} color="#A0AEC0" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, backgroundColor: '#FFFFFF' },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#A0AEC0', marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  greetingText: { fontSize: 18, fontWeight: 'bold', color: '#1A202C' },
  subText: { fontSize: 14, color: '#718096' },
  headerIcons: { flexDirection: 'row' },
  iconButton: { marginLeft: 15 },
  overviewCard: { margin: 20, padding: 20, backgroundColor: '#EBF8FF', borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overviewTextContainer: { flex: 1 },
  overviewTitle: { fontSize: 16, fontWeight: 'bold', color: '#2B6CB0' },
  overviewSubTitle: { fontSize: 14, color: '#4299E1', marginTop: 4 },
  viewAll: { color: '#3182CE', fontWeight: 'bold' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
  gridItem: { width: '25%', alignItems: 'center', marginBottom: 20 },
  gridIconContainer: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridText: { fontSize: 12, color: '#4A5568', textAlign: 'center' },
  scheduleSection: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A202C' },
  scheduleCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 15, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  scheduleIconContainer: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  scheduleDetails: { flex: 1 },
  scheduleSubject: { fontSize: 16, fontWeight: 'bold', color: '#1A202C' },
  scheduleTime: { fontSize: 14, color: '#718096', marginVertical: 2 },
  scheduleRoom: { fontSize: 12, color: '#A0AEC0' },
  liveBadge: { backgroundColor: '#FED7D7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  liveText: { color: '#E53E3E', fontSize: 12, fontWeight: 'bold' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingBottom: 25 },
  navItem: { flex: 1, alignItems: 'center' },
  navTextActive: { fontSize: 12, color: '#3182CE', marginTop: 4, fontWeight: 'bold' },
  navText: { fontSize: 12, color: '#A0AEC0', marginTop: 4 }
});

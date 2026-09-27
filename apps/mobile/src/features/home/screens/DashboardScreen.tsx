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
              <Ionicons name="notifications-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="search-outline" size={20} color="#ffffff" />
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
  container: { flex: 1, backgroundColor: '#080808' },
  scrollContent: { paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 48, backgroundColor: '#080808' },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#191d20', borderWidth: 1, borderColor: '#2a2e33', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  greetingText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  subText: { fontSize: 12, color: '#9c9da1', marginTop: 4 },
  headerIcons: { flexDirection: 'row' },
  iconButton: { marginLeft: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: '#191d20', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2a2e33' },
  
  overviewCard: { margin: 24, padding: 24, backgroundColor: '#191d20', borderRadius: 9, borderWidth: 1, borderColor: '#2a2e33', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overviewTextContainer: { flex: 1 },
  overviewTitle: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  overviewSubTitle: { fontSize: 13, color: '#9c9da1', marginTop: 4 },
  viewAll: { color: '#7170ff', fontWeight: '500', fontSize: 13 },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  gridItem: { width: '25%', alignItems: 'center', marginBottom: 24 },
  gridIconContainer: { width: 56, height: 56, borderRadius: 9, backgroundColor: '#191d20', borderWidth: 1, borderColor: '#2a2e33', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridText: { fontSize: 12, color: '#9c9da1', textAlign: 'center', fontWeight: '500' },
  
  scheduleSection: { padding: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  
  scheduleCard: { flexDirection: 'row', backgroundColor: '#191d20', padding: 16, borderRadius: 9, borderWidth: 1, borderColor: '#2a2e33', alignItems: 'center' },
  scheduleIconContainer: { width: 48, height: 48, borderRadius: 9, backgroundColor: '#080808', borderWidth: 1, borderColor: '#2a2e33', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  scheduleDetails: { flex: 1 },
  scheduleSubject: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  scheduleTime: { fontSize: 12, color: '#9c9da1', marginVertical: 4 },
  scheduleRoom: { fontSize: 12, color: '#6b6b6b' },
  
  liveBadge: { backgroundColor: '#f34e5220', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, borderWidth: 1, borderColor: '#f34e5240' },
  liveText: { color: '#f34e52', fontSize: 12, fontWeight: '600' },
  
  bottomNav: { flexDirection: 'row', backgroundColor: '#191d20', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#2a2e33', paddingBottom: 32 },
  navItem: { flex: 1, alignItems: 'center' },
  navTextActive: { fontSize: 12, color: '#7170ff', marginTop: 4, fontWeight: '600' },
  navText: { fontSize: 12, color: '#9c9da1', marginTop: 4, fontWeight: '500' }
});

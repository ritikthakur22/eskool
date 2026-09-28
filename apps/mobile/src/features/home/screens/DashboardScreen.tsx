import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function DashboardScreen({ navigation }: Props) {
  const features = [
    { name: 'Attendance', icon: 'finger-print-outline', color: '#10B981', bg: '#E7F8F2', route: 'Attendance' },
    { name: 'Homework', icon: 'book-outline', color: '#2F80ED', bg: '#EBF3FE', route: 'Homework' },
    { name: 'Online Class', icon: 'laptop-outline', color: '#38A169', bg: '#E6FFFA', route: 'OnlineClass' },
    { name: 'Class Routine', icon: 'calendar-outline', color: '#EF4444', bg: '#FEE2E2', route: 'Routine' },
    { name: 'Exams', icon: 'document-text-outline', color: '#2F80ED', bg: '#EBF3FE', route: 'Exams' },
    { name: 'Result', icon: 'podium-outline', color: '#2F80ED', bg: '#EBF3FE', route: 'Result' },
    { name: 'Library', icon: 'library-outline', color: '#8B5CF6', bg: '#F3E8FF', route: 'Library' },
    { name: 'Calendar', icon: 'calendar-number-outline', color: '#F59E0B', bg: '#FEF3C7', route: 'Calendar' },
    { name: 'Notice', icon: 'notifications-outline', color: '#EF4444', bg: '#FEE2E2', route: 'Notice' },
    { name: 'Study Materials', icon: 'folder-open-outline', color: '#10B981', bg: '#E7F8F2', route: 'Library' },
    { name: 'Complaints', icon: 'chatbubbles-outline', color: '#10B981', bg: '#E7F8F2', route: 'Chat' },
    { name: 'More', icon: 'ellipsis-horizontal', color: '#6B7280', bg: '#F3F4F6', route: 'Profile' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.profileSection} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>TD</Text>
            </View>
            <View>
              <Text style={styles.greetingText}>Hi, Tapas Dev S.</Text>
              <Text style={styles.subText}>Class 10 - Student</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notice')}>
              <Ionicons name="notifications-outline" size={22} color="#2F80ED" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="person-add-outline" size={20} color="#2F80ED" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Promotional Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Keep Learning</Text>
            <Text style={styles.bannerSubtitle}>Every day is a step towards your goal.</Text>
          </View>
          <View style={styles.bannerIllustration}>
            <Ionicons name="school" size={60} color="#FFFFFF" style={{ opacity: 0.8 }} />
          </View>
        </View>

        {/* Grid Features */}
        <View style={styles.gridContainer}>
          {features.map((feature, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.gridItem}
              onPress={() => navigation.navigate(feature.route)}
            >
              <View style={[styles.gridIconContainer, { backgroundColor: feature.bg }]}>
                <Ionicons name={feature.icon as any} size={26} color={feature.color} />
              </View>
              <Text style={styles.gridText} numberOfLines={1}>{feature.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notice & News */}
        <View style={styles.noticeSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notice & News</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Notice')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {/* Notice Item 1 */}
          <TouchableOpacity style={styles.noticeCard} onPress={() => navigation.navigate('Notice')}>
            <View style={[styles.noticeIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
            </View>
            <View style={styles.noticeDetails}>
              <Text style={styles.noticeCategory}>Notice</Text>
              <Text style={styles.noticeTitle} numberOfLines={1}>School Exhibition 2083</Text>
              <Text style={styles.noticeDate}>Sep 24, 2026</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Notice Item 2 */}
          <TouchableOpacity style={styles.noticeCard} onPress={() => navigation.navigate('Notice')}>
            <View style={[styles.noticeIconContainer, { backgroundColor: '#E7F8F2' }]}>
              <Ionicons name="newspaper" size={24} color="#10B981" />
            </View>
            <View style={styles.noticeDetails}>
              <Text style={styles.noticeCategory}>News</Text>
              <Text style={styles.noticeTitle} numberOfLines={1}>Science Exhibition 2083</Text>
              <Text style={styles.noticeDate}>Sep 20, 2026</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
          <Ionicons name="home" size={24} color="#2F80ED" />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Notice')}>
          <Ionicons name="notifications-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Notice</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('OnlineClass')}>
          <Ionicons name="laptop-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Classes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 24 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, backgroundColor: '#FFFFFF' },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFD700', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  greetingText: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  subText: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginLeft: 16, justifyContent: 'center', alignItems: 'center' },
  notificationDot: { position: 'absolute', top: 0, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#FFFFFF' },
  
  bannerCard: { marginHorizontal: 20, marginBottom: 24, padding: 24, backgroundColor: '#2F80ED', borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#2F80ED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  bannerContent: { flex: 1, paddingRight: 16 },
  bannerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  bannerSubtitle: { fontSize: 13, color: '#EBF3FE', lineHeight: 20 },
  bannerIllustration: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, marginBottom: 10 },
  gridItem: { width: '25%', alignItems: 'center', marginBottom: 20 },
  gridIconContainer: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridText: { fontSize: 11, color: '#1F2937', textAlign: 'center', fontWeight: '500', paddingHorizontal: 4 },
  
  noticeSection: { paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  viewAll: { color: '#2F80ED', fontWeight: '600', fontSize: 14 },
  
  noticeCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  noticeIconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  noticeDetails: { flex: 1 },
  noticeCategory: { fontSize: 12, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: '#4B5563', marginBottom: 6 },
  
  noticeDate: { fontSize: 12, color: '#9CA3AF' },
  
  bottomNav: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navTextActive: { fontSize: 11, color: '#2F80ED', marginTop: 4, fontWeight: '600' },
  navText: { fontSize: 11, color: '#6B7280', marginTop: 4, fontWeight: '500' }
});


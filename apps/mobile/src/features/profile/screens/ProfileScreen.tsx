import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export default function ProfileScreen({ navigation }: any) {
  
  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('user_data');
    navigation.replace('Login');
  };

  const details = [
    { label: 'Email', value: 'tapas.dev@school.com', icon: '✉️' },
    { label: 'Phone', value: '+977 9800000000', icon: '📱' },
    { label: 'Address', value: 'Kathmandu, Nepal', icon: '📍' },
    { label: 'Blood Group', value: 'O+', icon: '🩸' },
    { label: 'Father Name', value: 'Mr. Dev', icon: '👨' },
    { label: 'Mother Name', value: 'Mrs. Dev', icon: '👩' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>T</Text>
          </View>
          <Text style={styles.nameText}>Tapas Dev S.</Text>
          <Text style={styles.classText}>Class 10 | Roll No: 24</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Student</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          {details.map((item, index) => (
            <View key={index} style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Text style={styles.detailIcon}>{item.icon}</Text>
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
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
  editIcon: { fontSize: 20 },
  content: { padding: 20 },
  profileHeader: { alignItems: 'center', marginBottom: 25 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#3182CE', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { fontSize: 40, color: '#FFFFFF', fontWeight: 'bold' },
  nameText: { fontSize: 22, fontWeight: 'bold', color: '#1A202C', marginBottom: 5 },
  classText: { fontSize: 14, color: '#718096', marginBottom: 10 },
  badge: { backgroundColor: '#EBF4FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#4C51BF', fontWeight: 'bold', fontSize: 12 },
  detailsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A202C', marginBottom: 15 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  detailIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  detailIcon: { fontSize: 16 },
  detailTextContainer: { flex: 1 },
  detailLabel: { fontSize: 12, color: '#A0AEC0', marginBottom: 2 },
  detailValue: { fontSize: 14, color: '#1A202C', fontWeight: '500' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF5F5', paddingVertical: 15, borderRadius: 12, borderWidth: 1, borderColor: '#FEB2B2' },
  logoutIcon: { fontSize: 18, marginRight: 10 },
  logoutText: { color: '#E53E3E', fontSize: 16, fontWeight: 'bold' }
});

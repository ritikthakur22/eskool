import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AppInfoScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Info</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.content}>
        <Ionicons name="school" size={80} color="#2F80ED" style={styles.logo} />
        <Text style={styles.appName}>eSkool</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
        
        <View style={styles.details}>
          <Text style={styles.detailText}>Developed by: eSkool Inc.</Text>
          <Text style={styles.detailText}>Support: contact@eskool.com</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  content: { alignItems: 'center', padding: 40, flex: 1 },
  logo: { marginBottom: 16 },
  appName: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  version: { fontSize: 16, color: '#6B7280', marginBottom: 40 },
  details: { width: '100%', padding: 24, backgroundColor: '#F9FAFB', borderRadius: 12, alignItems: 'center' },
  detailText: { fontSize: 15, color: '#4B5563', marginBottom: 8 }
});

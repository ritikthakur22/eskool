import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';
import { api } from '../../../core/networking/api';
import { getSelectedChildId } from '../../../core/utils/childSelection';

export default function ExamsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [activeTab, setActiveTab] = useState('Online Exam');
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const [childId, setChildId] = useState('');
  const tabs = ['Online Exam', 'Upcoming', 'Result'];

  useEffect(() => { SecureStore.getItemAsync('user_data').then(async raw => { if (!raw) return; const nextRole = JSON.parse(raw).role || ''; setRole(nextRole); if (nextRole === 'PARENT') setChildId((await getSelectedChildId()) || ''); }).catch(() => undefined); }, []);

  useEffect(() => {
    if (!role || (role !== 'STUDENT' && role !== 'PARENT')) { setLoading(false); return; }
    if (role === 'PARENT' && !childId) { setLoading(false); setError('Select a child from the home screen first.'); return; }
    let active = true;
    api.get(role === 'PARENT' ? `/exams/child/${childId}` : '/exams/me').then(({ data }) => {
      if (active) { setExams(data); setError(''); }
    }).catch((err: any) => {
      if (active) setError(err.response?.data?.message || 'Could not load exams.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [role, childId]);
  const now = Date.now();
  const visibleExams = exams.filter(exam => activeTab !== 'Upcoming' || new Date(exam.date).getTime() >= now);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
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
        {!role || (role !== 'STUDENT' && role !== 'PARENT') ? <View style={styles.emptyState}><Text style={styles.emptyText}>Exam management for staff is available through the assigned-class workflow.</Text></View> : loading ? <View style={styles.emptyState}><Text style={styles.emptyText}>Loading exams…</Text></View> : error ? <View style={styles.emptyState}><Text style={styles.emptyText}>{error}</Text></View> : visibleExams.length === 0 ? <View style={styles.emptyState}><Text style={styles.emptyText}>No exams found.</Text></View> : visibleExams.map((exam) => (
          <View key={exam.id} style={styles.examCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="document-text" size={24} color={colors.primary} />
            </View>
            <View style={styles.examContent}>
              <Text style={styles.examTitle}>{exam.title}</Text>
              <Text style={styles.examSubtitle}>{exam.subject?.name || 'Exam'} · {new Date(exam.date).toLocaleDateString()}</Text>
              
              {new Date(exam.date).getTime() >= now && (
                <View style={styles.upcomingBadge}>
                  <Text style={styles.upcomingBadgeText}>{exam.badge}</Text>
                </View>
              )}
              
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.viewPastButton}>
          <Ionicons name="documents-outline" size={20} color={colors.subText} />
          <Text style={styles.viewPastText}>View Past Exams</Text>
          <View style={{ flex: 1 }} />
          <Ionicons name="chevron-forward" size={20} color={colors.subText} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: c.text },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: c.border },
  tabButton: { paddingVertical: 15, paddingHorizontal: 20 },
  tabButtonActive: { borderBottomWidth: 2, borderBottomColor: c.primary },
  tabText: { fontSize: 14, color: c.subText, fontWeight: '500' },
  tabTextActive: { color: c.primary, fontWeight: 'bold' },
  listContainer: { padding: 20 },
  emptyState: { alignItems: 'center', padding: 30 },
  emptyText: { color: c.subText, fontSize: 14 },
  examCard: { flexDirection: 'row', padding: 15, backgroundColor: c.card, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: c.border },
  iconContainer: { width: 45, height: 45, borderRadius: 8, backgroundColor: c.primary + '18', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  examContent: { flex: 1 },
  examTitle: { fontSize: 16, fontWeight: 'bold', color: c.text, marginBottom: 4 },
  examSubtitle: { fontSize: 13, color: c.subText, marginBottom: 10 },
  upcomingBadge: { backgroundColor: c.primary + '18', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  upcomingBadgeText: { color: c.primary, fontSize: 12, fontWeight: 'bold' },
  startButton: { backgroundColor: c.primary + '18', alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 6, borderRadius: 12 },
  startButtonText: { color: c.primary, fontSize: 12, fontWeight: 'bold' },
  viewPastButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, padding: 15, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: c.border },
  viewPastText: { marginLeft: 10, fontSize: 14, color: c.text, fontWeight: 'bold' }
});

import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../../core/theme/ThemeContext';
import { api } from '../../../core/networking/api';
import { getSelectedChildId } from '../../../core/utils/childSelection';

export default function HomeworkScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [activeTab, setActiveTab] = useState('Assigned');
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const [childSectionId, setChildSectionId] = useState('');
  const [childName, setChildName] = useState('');
  const tabs = ['Assigned', 'Submitted', 'Upcoming'];

  useEffect(() => {
    SecureStore.getItemAsync('user_data').then(async raw => {
      if (!raw) return;
      const nextRole = JSON.parse(raw).role || '';
      setRole(nextRole);
      if (nextRole === 'PARENT') {
        const selectedId = await getSelectedChildId();
        const { data } = await api.get('/academics/children');
        const child = (Array.isArray(data) ? data : []).find((item: any) => item.student?.id === selectedId) || data?.[0];
        setChildSectionId(child?.student?.enrollments?.[0]?.sectionId || '');
        const childProfile = child?.student?.studentProfile;
        setChildName([childProfile?.firstName, childProfile?.lastName].filter(Boolean).join(' ') || child?.student?.email || 'Selected child');
      }
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!role || (role !== 'STUDENT' && role !== 'PARENT')) { setLoading(false); return; }
    if (role === 'PARENT' && !childSectionId) { setLoading(false); setError('Select a child from the home screen first.'); return; }
    let active = true;
    const request = role === 'PARENT' ? api.get(`/homework/class/${childSectionId}`, { params: { limit: 50 } }) : api.get('/homework/me', { params: { limit: 50 } });
    request.then(({ data }) => {
      if (!active) return;
      setHomeworks(data.map((item: any) => ({
        ...item,
        subject: item.subjectName || 'Subject',
        description: item.description || item.title,
        dueDate: new Date(item.dueDate).toLocaleDateString(),
        status: item.submission ? 'Submitted' : 'Pending',
        icon: '📚',
        iconBg: '#EBF4FF',
      })));
      setError('');
    }).catch((err: any) => {
      if (active) setError(err.response?.data?.message || 'Could not load homework.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [role, childSectionId]);

  const filteredHomeworks = activeTab === 'Submitted'
    ? homeworks.filter(hw => hw.status === 'Submitted')
    : activeTab === 'Assigned'
    ? homeworks.filter(hw => hw.status === 'Pending')
    : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCopy}><Text style={styles.headerTitle}>Homework</Text>{role === 'PARENT' && <Text style={styles.headerSubtitle}>{childName ? `For ${childName}` : 'Select a child from Home'}</Text>}</View>
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
        {!role || (role !== 'STUDENT' && role !== 'PARENT') ? (
          <View style={styles.emptyState}><Text style={styles.emptyStateText}>Homework management for staff is available through the assigned-class workflow.</Text></View>
        ) : loading ? (
          <View style={styles.emptyState}><Text style={styles.emptyStateText}>Loading homework…</Text></View>
        ) : error ? (
          <View style={styles.emptyState}><Text style={styles.emptyStateText}>{error}</Text></View>
        ) : filteredHomeworks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No homework found in this category.</Text>
          </View>
        ) : (
          filteredHomeworks.map((hw) => (
            <TouchableOpacity key={hw.id} style={styles.homeworkCard}>
              <View style={[styles.iconContainer, { backgroundColor: hw.iconBg }]}>
                <Text style={styles.icon}>{hw.icon}</Text>
              </View>
              <View style={styles.contentContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.subjectText}>{hw.subject}</Text>
                  <View style={[styles.badge, hw.status === 'Pending' ? styles.badgePending : styles.badgeSubmitted]}>
                    <Text style={[styles.badgeText, hw.status === 'Pending' ? styles.badgeTextPending : styles.badgeTextSubmitted]}>
                      {hw.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.descriptionText}>{hw.description}</Text>
                <Text style={styles.dueDateText}>Submit by {hw.dueDate}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: c.card },
  backButton: { padding: 5 },
  backIcon: { fontSize: 24, color: c.text },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: c.text },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerSubtitle: { color: c.subText, fontSize: 10, marginTop: 3 },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: 5 },
  tabButton: { paddingBottom: 10, flex: 1, alignItems: 'center' },
  tabButtonActive: { borderBottomWidth: 2, borderBottomColor: c.primary },
  tabText: { fontSize: 14, color: c.subText, fontWeight: '500' },
  tabTextActive: { color: c.primary, fontWeight: 'bold' },
  listContainer: { padding: 20 },
  emptyState: { padding: 20, alignItems: 'center', marginTop: 50 },
  emptyStateText: { color: c.subText, fontSize: 16 },
  homeworkCard: { flexDirection: 'row', backgroundColor: c.card, padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  iconContainer: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  icon: { fontSize: 24 },
  contentContainer: { flex: 1, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  subjectText: { fontSize: 16, fontWeight: 'bold', color: c.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgePending: { backgroundColor: '#FEEBC8' },
  badgeSubmitted: { backgroundColor: '#C6F6D5' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  badgeTextPending: { color: '#DD6B20' },
  badgeTextSubmitted: { color: '#38A169' },
  descriptionText: { fontSize: 14, color: c.subText, marginBottom: 4 },
  dueDateText: { fontSize: 12, color: c.subText }
});

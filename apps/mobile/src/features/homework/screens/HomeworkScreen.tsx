import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../../core/theme/ThemeContext';

export default function HomeworkScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [activeTab, setActiveTab] = useState('Assigned');
  const tabs = ['Assigned', 'Submitted', 'Upcoming'];

  const homeworks = [
    {
      id: '1',
      subject: 'Mathematics',
      description: 'Chapter 3 - Exercise 5.1',
      dueDate: 'Sep 28, 2026',
      status: 'Pending',
      icon: '📐',
      iconBg: '#EBF4FF'
    },
    {
      id: '2',
      subject: 'Science',
      description: 'Practical Report',
      dueDate: 'Sep 26, 2026',
      status: 'Pending',
      icon: '🧪',
      iconBg: '#FFF5F5'
    },
    {
      id: '3',
      subject: 'English',
      description: 'Essay on Climate Change',
      dueDate: 'Sep 25, 2026',
      status: 'Submitted',
      icon: '📚',
      iconBg: '#F0FFF4'
    },
    {
      id: '4',
      subject: 'Social Studies',
      description: 'Map Work',
      dueDate: 'Sep 30, 2026',
      status: 'Pending',
      icon: '🌍',
      iconBg: '#FFFFF0'
    }
  ];

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
        <Text style={styles.headerTitle}>Homework</Text>
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
        {filteredHomeworks.length === 0 ? (
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

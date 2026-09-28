import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../core/networking/api';

export default function NoticeScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [allNotices, setAllNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const tabs = ['All', 'Important', 'Academic', 'Exam'];

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await api.get('/notices');
      const mappedNotices = response.data.map((n: any) => {
        let icon = 'document-text';
        let iconBg = '#EBF3FE';
        let iconColor = '#2F80ED';
        let badge = null;
        let badgeStyle = null;
        
        if (n.category === 'Important') {
          icon = 'alert-circle'; iconBg = '#EBF3FE'; iconColor = '#2F80ED'; badge = 'Important'; badgeStyle = 'important';
        } else if (n.category === 'Exam') {
          icon = 'document-text'; iconBg = '#EBF3FE'; iconColor = '#2F80ED'; badge = 'Exam'; badgeStyle = 'exam';
        } else if (n.category === 'Academic') {
          icon = 'book'; iconBg = '#EBF3FE'; iconColor = '#2F80ED';
        } else if (n.category === 'Holiday') {
          icon = 'home'; iconBg = '#E7F8F2'; iconColor = '#10B981'; badge = 'Holiday'; badgeStyle = 'holiday';
        } else if (n.category === 'Event') {
          icon = 'calendar'; iconBg = '#F3E8FF'; iconColor = '#8B5CF6'; badge = 'Event'; badgeStyle = 'event';
        }

        return {
          id: n.id,
          title: n.title,
          subtitle: n.content,
          date: new Date(n.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          badge: badge,
          badgeStyle: badgeStyle,
          category: n.category,
          icon,
          iconBg,
          iconColor
        };
      });
      setAllNotices(mappedNotices);
    } catch (error) {
      console.error('Failed to fetch notices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNotices = allNotices.filter(notice => {
    const matchesTab = activeTab === 'All' || notice.category === activeTab;
    const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          notice.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notice</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search notices..."
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#2F80ED" style={{ marginTop: 50 }} />
        ) : filteredNotices.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 50, color: '#6B7280' }}>No notices found.</Text>
        ) : (
          filteredNotices.map((notice) => (
            <TouchableOpacity key={notice.id} style={styles.noticeCard}>
              <View style={[styles.iconContainer, { backgroundColor: notice.iconBg }]}>
                <Ionicons name={notice.icon as any} size={24} color={notice.iconColor} />
              </View>
              <View style={styles.noticeContent}>
                <View style={styles.noticeHeaderRow}>
                  <Text style={styles.noticeTitle}>{notice.title}</Text>
                  {notice.badge && (
                    <View style={[styles.badge, 
                      notice.badgeStyle === 'important' && { backgroundColor: '#FEE2E2' },
                      notice.badgeStyle === 'exam' && { backgroundColor: '#DBEAFE' },
                      notice.badgeStyle === 'holiday' && { backgroundColor: '#D1FAE5' },
                      notice.badgeStyle === 'event' && { backgroundColor: '#F3E8FF' },
                    ]}>
                      <Text style={[styles.badgeText, 
                        notice.badgeStyle === 'important' && { color: '#EF4444' },
                        notice.badgeStyle === 'exam' && { color: '#2F80ED' },
                        notice.badgeStyle === 'holiday' && { color: '#10B981' },
                        notice.badgeStyle === 'event' && { color: '#8B5CF6' },
                      ]}>
                        {notice.badge}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.noticeSubtitle} numberOfLines={2}>{notice.subtitle}</Text>
                <Text style={styles.noticeDate}>{notice.date}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40, backgroundColor: '#FFFFFF' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, height: 40, alignItems: 'center' },
  tabButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 12 },
  tabButtonActive: { backgroundColor: '#EBF3FE', borderColor: '#2F80ED' },
  tabText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  tabTextActive: { color: '#2F80ED' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 14, color: '#1F2937' },
  
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  noticeCard: { flexDirection: 'row', padding: 16, marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  iconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  noticeContent: { flex: 1, justifyContent: 'center' },
  noticeHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  noticeTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  noticeSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 8, lineHeight: 18 },
  noticeDate: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' }
});

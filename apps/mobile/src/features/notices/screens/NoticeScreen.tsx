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
        let iconBg = '#E6FFFA';
        let iconColor = '#319795';
        let badge = null;
        
        if (n.category === 'Important') {
          icon = 'business'; iconBg = '#EBF8FF'; iconColor = '#3182CE'; badge = 'Important';
        } else if (n.category === 'Exam') {
          icon = 'document-text'; iconBg = '#E6FFFA'; iconColor = '#319795';
        } else if (n.category === 'Academic') {
          icon = 'flask'; iconBg = '#EBF4FF'; iconColor = '#4C51BF';
        } else {
          icon = 'calendar'; iconBg = '#F0FFF4'; iconColor = '#38A169';
        }

        return {
          id: n.id,
          title: n.title,
          subtitle: n.content,
          date: new Date(n.date).toLocaleDateString(),
          badge: badge,
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
          <Ionicons name="chevron-back" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notice</Text>
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

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search notices..."
          placeholderTextColor="#A0AEC0"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#3182CE" style={{ marginTop: 50 }} />
        ) : filteredNotices.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 50, color: '#A0AEC0' }}>No notices found.</Text>
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
                    <View style={[styles.badge, notice.badge === 'Important' ? styles.badgeImportant : styles.badgeNew]}>
                      <Text style={[styles.badgeText, notice.badge === 'Important' ? styles.badgeTextImportant : styles.badgeTextNew]}>
                        {notice.badge}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.noticeSubtitle} numberOfLines={1}>{notice.subtitle}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A202C' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 5 },
  tabButton: { marginRight: 25, paddingBottom: 10 },
  tabButtonActive: { borderBottomWidth: 2, borderBottomColor: '#3182CE' },
  tabText: { fontSize: 14, color: '#718096', fontWeight: '500' },
  tabTextActive: { color: '#3182CE', fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', margin: 20, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#1A202C' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  noticeCard: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
  iconContainer: { width: 45, height: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  noticeContent: { flex: 1, justifyContent: 'center' },
  noticeHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  noticeTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A202C', marginRight: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeImportant: { backgroundColor: '#FED7D7' },
  badgeNew: { backgroundColor: '#FEB2B2' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  badgeTextImportant: { color: '#C53030' },
  badgeTextNew: { color: '#C53030' },
  noticeSubtitle: { fontSize: 14, color: '#4A5568', marginBottom: 6 },
  noticeDate: { fontSize: 12, color: '#A0AEC0' }
});

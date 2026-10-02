import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';

export default function OnlineClassScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [activeTab, setActiveTab] = useState('Upcoming');
  const tabs = ['Upcoming', 'Live', 'Recorded'];
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Online Class</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>{tabs.map(tab => <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}><Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text></TouchableOpacity>)}</View>
      <View style={styles.comingSoonCard}>
        <View style={styles.comingSoonIcon}>
          <Ionicons name="videocam-outline" size={34} color="#3182CE" />
        </View>
        <Text style={styles.comingSoonTitle}>{activeTab} classes are coming soon</Text>
        <Text style={styles.comingSoonText}>
          {activeTab === 'Live' ? 'Live classes will appear here when your school connects its online classroom service.' : activeTab === 'Recorded' ? 'Recorded lessons will appear here after the online classroom service is connected.' : 'Your scheduled online classes will appear here when published by the school.'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: c.text },
  comingSoonCard: { margin: 20, padding: 28, alignItems: 'center', backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border },
  tabs: { flexDirection: 'row', margin: 16, padding: 4, borderRadius: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 10 },
  tabActive: { backgroundColor: c.primary + '18' },
  tabText: { color: c.subText, fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: c.primary, fontWeight: '900' },
  comingSoonIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: c.primary + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  comingSoonTitle: { fontSize: 18, fontWeight: 'bold', color: c.text, textAlign: 'center', marginBottom: 10 },
  comingSoonText: { fontSize: 14, lineHeight: 21, color: c.subText, textAlign: 'center' }
});

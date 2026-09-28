import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../../core/theme/ThemeContext';
import BottomNavigation from '../../../core/components/BottomNavigation';

type Props = { navigation: NativeStackNavigationProp<any> };
type Feature = { name: string; icon: any; route: string; accent: string };
const groups: { title: string; subtitle: string; features: Feature[] }[] = [
  { title: 'Learning', subtitle: 'Your day-to-day learning tools', features: [
    { name: 'Homework', icon: 'book-outline', route: 'Homework', accent: '#2F80ED' },
    { name: 'Class Routine', icon: 'time-outline', route: 'Routine', accent: '#8B5CF6' },
    { name: 'Attendance', icon: 'checkmark-circle-outline', route: 'Attendance', accent: '#10B981' },
    { name: 'Library', icon: 'library-outline', route: 'Library', accent: '#F59E0B' },
  ] },
  { title: 'Academic', subtitle: 'Plan and track your progress', features: [
    { name: 'Calendar', icon: 'calendar-outline', route: 'Calendar', accent: '#2F80ED' },
    { name: 'Exams', icon: 'document-text-outline', route: 'Exams', accent: '#EF4444' },
    { name: 'Results', icon: 'podium-outline', route: 'Result', accent: '#10B981' },
  ] },
  { title: 'School', subtitle: 'Updates and school services', features: [
    { name: 'Notices', icon: 'notifications-outline', route: 'Notice', accent: '#EF4444' },
    { name: 'Online class', icon: 'videocam-outline', route: 'OnlineClass', accent: '#0EA5E9' },
    { name: 'Study materials', icon: 'folder-open-outline', route: 'Library', accent: '#8B5CF6' },
    { name: 'Settings', icon: 'settings-outline', route: 'Profile', accent: '#14B8A6' },
  ] },
];

export default function DashboardScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [identity, setIdentity] = useState({ name: 'Student', detail: 'Welcome to eSkool' });

  useEffect(() => {
    SecureStore.getItemAsync('user_data').then(raw => {
      if (!raw) return;
      const user = JSON.parse(raw);
      const profile = user.studentProfile || user.teacherProfile || user.adminProfile;
      const name = profile ? `${profile.firstName} ${profile.lastName}`.trim() : user.email?.split('@')[0] || 'Student';
      const detail = user.studentProfile?.grade ? `Class ${user.studentProfile.grade}${user.studentProfile.section ? ` · ${user.studentProfile.section}` : ''}` : (user.role || 'School account').toLowerCase().replace('_', ' ');
      setIdentity({ name, detail });
    }).catch(() => undefined);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.profile} onPress={() => navigation.navigate('Profile')}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}><Text style={[styles.avatarText, { color: colors.primary }]}>{identity.name.slice(0, 1).toUpperCase()}</Text></View>
            <View><Text style={[styles.greeting, { color: colors.text }]}>Hello, {identity.name}</Text><Text style={[styles.meta, { color: colors.subText }]}>{identity.detail}</Text></View>
          </TouchableOpacity>
          <TouchableOpacity accessibilityLabel="Open notices" style={[styles.notificationButton, { backgroundColor: colors.mutedSurface }]} onPress={() => navigation.navigate('Notice')}><Ionicons name="notifications-outline" size={22} color={colors.primary} /></TouchableOpacity>
        </View>
        <View style={styles.content}>
          {groups.map(group => <View key={group.title} style={styles.section}>
            <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: colors.text }]}>{group.title}</Text><Text style={[styles.sectionSubtitle, { color: colors.subText }]}>{group.subtitle}</Text></View>
            <View style={styles.grid}>{group.features.map(feature => <TouchableOpacity key={feature.name} style={[styles.feature, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate(feature.route)}>
              <View style={[styles.featureIcon, { backgroundColor: feature.accent + '18' }]}><Ionicons name={feature.icon} size={22} color={feature.accent} /></View>
              <Text style={[styles.featureName, { color: colors.text }]}>{feature.name}</Text><Ionicons name="arrow-forward" size={15} color={colors.subText} style={styles.featureArrow} />
            </TouchableOpacity>)}</View>
          </View>)}
        </View>
      </ScrollView>
      <BottomNavigation navigation={navigation} activeRoute="Dashboard" colors={colors} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, scroll: { paddingBottom: 20 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 }, profile: { flexDirection: 'row', alignItems: 'center' }, avatar: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, avatarText: { fontSize: 20, fontWeight: '800' }, greeting: { fontSize: 17, fontWeight: '800' }, meta: { fontSize: 13, marginTop: 3, textTransform: 'capitalize' }, notificationButton: { height: 42, width: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }, content: { paddingHorizontal: 18, paddingTop: 20 }, section: { marginBottom: 25 }, sectionHeading: { marginBottom: 13 }, sectionTitle: { fontSize: 19, fontWeight: '800' }, sectionSubtitle: { fontSize: 12, marginTop: 3 }, grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, feature: { width: '48%', minHeight: 112, borderRadius: 16, padding: 14, borderWidth: 1, justifyContent: 'space-between', marginBottom: 10 }, featureIcon: { height: 39, width: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, featureName: { fontSize: 13, fontWeight: '700', marginTop: 13 }, featureArrow: { position: 'absolute', right: 14, bottom: 14 },
});

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const studentTabs = [
  { route: 'Dashboard', label: 'Home', icon: 'home-outline' },
  { route: 'Attendance', label: 'Attendance', icon: 'checkmark-circle-outline' },
  { route: 'Calendar', label: 'Calendar', icon: 'calendar-outline' },
  { route: 'Fees', label: 'Fees', icon: 'receipt-outline' },
  { route: 'Profile', label: 'Settings', icon: 'person-outline' },
];

const teacherTabs = [
  { route: 'Dashboard', label: 'Home', icon: 'home-outline' },
  { route: 'Attendance', label: 'Attendance', icon: 'checkmark-circle-outline' },
  { route: 'Routine', label: 'Classes', icon: 'school-outline' },
  { route: 'Notice', label: 'Notices', icon: 'notifications-outline' },
  { route: 'Profile', label: 'Settings', icon: 'person-outline' },
];

const managementTabs = [
  { route: 'Dashboard', label: 'Home', icon: 'home-outline' },
  { route: 'StaffManagement', label: 'People', icon: 'people-outline' },
  { route: 'AcademicManagement', label: 'Operations', icon: 'school-outline' },
  { route: 'AuditLogs', label: 'Audit', icon: 'shield-checkmark-outline' },
  { route: 'Profile', label: 'Settings', icon: 'person-outline' },
];

const parentTabs = [
  { route: 'Dashboard', label: 'Home', icon: 'home-outline' },
  { route: 'Calendar', label: 'Calendar', icon: 'calendar-outline' },
  { route: 'Fees', label: 'Fees', icon: 'receipt-outline' },
  { route: 'Notice', label: 'Notices', icon: 'notifications-outline' },
  { route: 'Profile', label: 'Settings', icon: 'person-outline' },
];

export default function BottomNavigation({ navigation, activeRoute, colors, role }: any) {
  const insets = useSafeAreaInsets();
  const tabs = role === 'ADMIN' || role === 'SUPER_ADMIN' ? managementTabs : role === 'TEACHER' ? teacherTabs : role === 'PARENT' ? parentTabs : studentTabs;
  
  return (
    <View style={[styles.bar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 10) }]}>
    {tabs.map(tab => {
      const active = tab.route === activeRoute;
      const color = active ? colors.primary : colors.subText;
      return <TouchableOpacity key={tab.route} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={tab.label} style={styles.tab} onPress={() => navigation.navigate(tab.route)}>
        <Ionicons name={tab.icon as any} size={24} color={color} />
        <Text style={[styles.label, { color, fontWeight: active ? '900' : '700' }]}>{tab.label}</Text>
      </TouchableOpacity>;
    })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', paddingTop: 9, borderTopWidth: 1 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  label: { fontSize: 11, marginTop: 4 },
});

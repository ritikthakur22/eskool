import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const studentTabs = [
  { route: 'Dashboard', label: 'Home', icon: 'home-outline' },
  { route: 'Attendance', label: 'Attendance', icon: 'checkmark-circle-outline' },
  { route: 'Calendar', label: 'Calendar', icon: 'calendar-outline' },
  { route: 'Fees', label: 'Fees', icon: 'receipt-outline' },
  { route: 'Profile', label: 'Settings', icon: 'person-outline' },
];

const operationalTabs = [
  { route: 'Dashboard', label: 'Home', icon: 'home-outline' },
  { route: 'Attendance', label: 'Attendance', icon: 'checkmark-circle-outline' },
  { route: 'Calendar', label: 'Calendar', icon: 'calendar-outline' },
  { route: 'Notice', label: 'Notices', icon: 'notifications-outline' },
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
  const tabs = role === 'TEACHER' || role === 'ADMIN' || role === 'SUPER_ADMIN' ? operationalTabs : role === 'PARENT' ? parentTabs : studentTabs;
  return (
    <View style={[styles.bar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
    {tabs.map(tab => {
      const active = tab.route === activeRoute;
      const color = active ? colors.primary : colors.subText;
      return <TouchableOpacity key={tab.route} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={tab.label} style={styles.tab} onPress={() => navigation.navigate(tab.route)}>
        <Ionicons name={tab.icon as any} size={21} color={color} />
        <Text style={[styles.label, { color, fontWeight: active ? '900' : '700' }]}>{tab.label}</Text>
      </TouchableOpacity>;
    })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', paddingTop: 9, paddingBottom: 10, borderTopWidth: 1 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 9, marginTop: 3 },
});

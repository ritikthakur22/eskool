import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';
import BottomNavigation from '../../../core/components/BottomNavigation';
import { currentBsMonth, getBsMonthDays, getBsMonthLabels, shiftBsMonth, type BsMonth } from '../../../core/utils/bsCalendar';
import { getCachedUserDataSync, getCachedUserData } from '../../../core/networking/session';

const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [role, setRole] = useState<string | undefined>(() => {
    const raw = getCachedUserDataSync();
    if (raw) {
      try { return JSON.parse(raw).role; } catch {}
    }
    return undefined;
  });
  const [month, setMonth] = useState<BsMonth>(currentBsMonth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => { if (!role) getCachedUserData().then(raw => { if (raw) { try { setRole(JSON.parse(raw).role); } catch {} } }).catch(() => undefined); }, [role]);
  const weeks = useMemo(() => {
    const days = getBsMonthDays(month);
    const cells: (typeof days[number] | null)[] = [...Array(days[0]?.weekDay || 0).fill(null), ...days];
    while (cells.length % 7) cells.push(null);
    return Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
  }, [month]);
  const moveMonth = (amount: number) => setMonth(value => shiftBsMonth(value, amount));
  const today = new Date();
  const events = [
    { title: 'Dashain Festival', date: 'Oct 17 - Oct 24, 2026', startDate: new Date('2026-10-17'), endDate: new Date('2026-10-24'), type: 'Holiday', icon: 'partly-sunny', color: colors.success },
    { title: 'Chhath Puja', date: 'Nov 6, 2026', startDate: new Date('2026-11-06'), endDate: new Date('2026-11-06'), type: 'Holiday', icon: 'sunny', color: colors.warning },
    { title: 'First Term Exams', date: 'Dec 10 - Dec 18, 2026', startDate: new Date('2026-12-10'), endDate: new Date('2026-12-18'), type: 'Exam', icon: 'document-text', color: colors.danger },
    { title: 'Winter Vacation', date: 'Jan 1 - Jan 15, 2027', startDate: new Date('2027-01-01'), endDate: new Date('2027-01-15'), type: 'Holiday', icon: 'snow', color: colors.primary },
    { title: 'Maghe Sankranti', date: 'Jan 14, 2027', startDate: new Date('2027-01-14'), endDate: new Date('2027-01-14'), type: 'Public Holiday', icon: 'bonfire', color: colors.warning },
    { title: 'School Sports Week', date: 'Feb 5 - Feb 10, 2027', startDate: new Date('2027-02-05'), endDate: new Date('2027-02-10'), type: 'Event', icon: 'trophy', color: colors.text },
  ];

  const filteredEvents = selectedDate ? events.filter(e => {
      const targetTime = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();
      const s = new Date(e.startDate.getFullYear(), e.startDate.getMonth(), e.startDate.getDate()).getTime();
      const end = new Date(e.endDate.getFullYear(), e.endDate.getMonth(), e.endDate.getDate()).getTime();
      return targetTime >= s && targetTime <= end;
  }) : events;
  const { bs: headerBs, ad: headerAd } = getBsMonthLabels(month);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.headerIcon}><Ionicons name="chevron-back" size={24} color={colors.text} /></TouchableOpacity>
        <View style={styles.headerCopy}><Text style={styles.title}>Academic Calendar</Text><Text style={styles.subtitle}>Bikram Sambat · Gregorian</Text></View>
        <TouchableOpacity accessibilityLabel="Go to current Bikram Sambat month" onPress={() => setMonth(currentBsMonth())} style={styles.todayButton}><Text style={styles.todayButtonText}>Today</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <TouchableOpacity accessibilityLabel="Previous month" style={styles.monthArrow} onPress={() => moveMonth(-1)}><Ionicons name="chevron-back" size={20} color={colors.text} /></TouchableOpacity>
            <View style={styles.monthLabels}><Text style={styles.bsMonth}>{headerBs}</Text><Text style={styles.adMonth}>{headerAd}</Text></View>
            <TouchableOpacity accessibilityLabel="Next month" style={styles.monthArrow} onPress={() => moveMonth(1)}><Ionicons name="chevron-forward" size={20} color={colors.text} /></TouchableOpacity>
          </View>
          <View style={styles.weekHeader}>{weekDays.map((day, index) => <View key={`${day}-${index}`} style={styles.weekdayCell}><Text style={[styles.weekday, index === 6 && styles.saturday]}>{day}</Text></View>)}</View>
          {weeks.map((week, weekIndex) => <View key={weekIndex} style={styles.weekRow}>{week.map((day, dayIndex) => {
            if (!day) return <View key={`blank-${dayIndex}`} style={styles.dayCell} />;
            const isToday = day.adDate.toDateString() === today.toDateString();
            const isSaturday = day.weekDay === 6;
            const isSelected = selectedDate && day.adDate.toDateString() === selectedDate.toDateString();
            return <TouchableOpacity key={day.adDate.toISOString()} style={[styles.dayCell, isToday && styles.todayCell, isSelected && !isToday && styles.selectedCell]} onPress={() => setSelectedDate(isSelected ? null : day.adDate)}>
              <Text style={[styles.bsDay, isToday && styles.todayText, isSaturday && !isToday && styles.saturday, isSelected && !isToday && styles.selectedText]}>{day.bsDay}</Text>
              <Text style={[styles.adDay, isToday && styles.todaySubText, isSelected && !isToday && styles.selectedSubText]}>{day.adDate.getDate()}</Text>
              {isToday && <View style={styles.todayMark} />}
            </TouchableOpacity>;
          })}</View>)}
          <View style={styles.legend}><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primary }]} /><Text style={styles.legendText}>Today</Text><View style={[styles.legendDot, { backgroundColor: colors.danger, marginLeft: 8 }]} /><Text style={styles.legendText}>Saturday</Text></View><Text style={styles.legendCaption}>Large: BS · Small: AD</Text></View>
        </View>
        <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>School calendar</Text><Text style={styles.sectionSubtitle}>Academic dates and events</Text></View><Ionicons name="calendar-clear-outline" size={21} color={colors.primary} /></View>
        
        <View style={{ gap: 10 }}>
          {filteredEvents.length > 0 ? filteredEvents.map((e, i) => (
            <View key={i} style={styles.eventCard}>
              <View style={[styles.eventIcon, { backgroundColor: e.color + '15' }]}>
                <Ionicons name={e.icon as any} size={22} color={e.color} />
              </View>
              <View style={styles.eventCopy}>
                <Text style={styles.eventTitle}>{e.title}</Text>
                <Text style={styles.eventDate}>{e.date}</Text>
              </View>
              <View style={[styles.eventBadge, { backgroundColor: e.color + '15' }]}>
                <Text style={[styles.eventBadgeText, { color: e.color }]}>{e.type}</Text>
              </View>
            </View>
          )) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.emptyCopy}>
                <Text style={styles.emptyTitle}>No events</Text>
                <Text style={styles.emptyText}>There are no events on this date.</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.calendarTypes}><Text style={styles.typesTitle}>Calendar views</Text><View style={styles.typeRow}><Ionicons name="calendar-outline" size={18} color={colors.primary} /><Text style={styles.typeText}>Bikram Sambat school calendar</Text></View><View style={styles.typeRow}><Ionicons name="globe-outline" size={18} color={colors.success} /><Text style={styles.typeText}>Gregorian date reference</Text></View><View style={styles.typeRow}><Ionicons name="school-outline" size={18} color={colors.warning} /><Text style={styles.typeText}>Academic events and holidays</Text></View></View>
      </ScrollView>
      <BottomNavigation navigation={navigation} activeRoute="Calendar" colors={colors} role={role} />
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background }, header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: c.card, borderBottomWidth: 1, borderColor: c.border }, headerIcon: { padding: 5, marginRight: 8 }, headerCopy: { flex: 1 }, title: { fontSize: 19, fontWeight: '800', color: c.text }, subtitle: { color: c.subText, fontSize: 12, marginTop: 3 }, todayButton: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 10, backgroundColor: c.primary + '15' }, todayButtonText: { color: c.primary, fontWeight: '800', fontSize: 12 }, content: { padding: 16, paddingBottom: 30 }, calendarCard: { backgroundColor: c.card, borderRadius: 18, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }, monthHeader: { height: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }, monthArrow: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: c.mutedSurface }, monthLabels: { alignItems: 'center' }, bsMonth: { color: c.text, fontSize: 16, fontWeight: '800' }, adMonth: { color: c.subText, fontSize: 12, marginTop: 3 }, weekHeader: { flexDirection: 'row', backgroundColor: c.mutedSurface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.border }, weekdayCell: { flex: 1, height: 36, justifyContent: 'center', alignItems: 'center' }, weekday: { fontSize: 12, color: c.subText, fontWeight: '700' }, saturday: { color: c.danger }, weekRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: c.border }, dayCell: { flex: 1, minHeight: 54, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: c.border, position: 'relative' }, bsDay: { color: c.text, fontSize: 15, fontWeight: '600' }, adDay: { color: c.subText, fontSize: 9, position: 'absolute', right: 5, bottom: 3 }, todayCell: { backgroundColor: c.primary }, todayText: { color: '#fff', fontWeight: '800' }, todaySubText: { color: '#ffffffcc' }, todayMark: { position: 'absolute', bottom: 2, width: 3, height: 3, borderRadius: 2, backgroundColor: '#fff' }, selectedCell: { backgroundColor: c.primary + '20' }, selectedText: { color: c.primary }, selectedSubText: { color: c.primary }, legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 }, legendDot: { width: 8, height: 8, borderRadius: 4 }, legendText: { fontSize: 11, color: c.subText }, legendCaption: { fontSize: 9, color: c.subText }, sectionHeader: { marginTop: 25, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { color: c.text, fontSize: 18, fontWeight: '800' }, sectionSubtitle: { color: c.subText, fontSize: 12, marginTop: 3 }, emptyCard: { padding: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border }, emptyIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: c.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: 12 }, emptyCopy: { flex: 1 }, emptyTitle: { color: c.text, fontSize: 13, fontWeight: '700' }, emptyText: { color: c.subText, fontSize: 12, lineHeight: 17, marginTop: 4 }, eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: c.border }, eventIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 }, eventCopy: { flex: 1 }, eventTitle: { color: c.text, fontSize: 14, fontWeight: '800' }, eventDate: { color: c.subText, fontSize: 12, marginTop: 3 }, eventBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }, eventBadgeText: { fontSize: 10, fontWeight: '800' }, calendarTypes: { marginTop: 16, backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 15, gap: 12 }, typesTitle: { color: c.text, fontSize: 14, fontWeight: '800', marginBottom: 2 }, typeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, typeText: { color: c.subText, fontSize: 12 },
});

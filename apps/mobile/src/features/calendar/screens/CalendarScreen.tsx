import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { useTheme } from '../../../core/theme/ThemeContext';
import BottomNavigation from '../../../core/components/BottomNavigation';
import { getCachedUserDataSync, getCachedUserData } from '../../../core/networking/session';
import { currentBsMonth, getBsMonthDays, getBsMonthLabels, shiftBsMonth, type BsMonth } from '../../../core/utils/bsCalendar';

const weekDaysBs = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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

  const [calendarMode, setCalendarMode] = useState<'AD' | 'BS'>('AD');
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  
  // BS mode states
  const [bsMonth, setBsMonth] = useState<BsMonth>(currentBsMonth);

  useEffect(() => {
    if (!role) {
      getCachedUserData().then(raw => {
        if (raw) {
          try { setRole(JSON.parse(raw).role); } catch {}
        }
      }).catch(() => undefined);
    }
  }, [role]);

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const events = useMemo(() => [
    { title: 'Dashain Festival', date: 'Oct 17 - Oct 24, 2026', startDate: new Date('2026-10-17'), endDate: new Date('2026-10-24'), type: 'Holiday', icon: 'partly-sunny', color: colors.success },
    { title: 'Chhath Puja', date: 'Nov 6, 2026', startDate: new Date('2026-11-06'), endDate: new Date('2026-11-06'), type: 'Holiday', icon: 'sunny', color: colors.warning },
    { title: 'First Term Exams', date: 'Dec 10 - Dec 18, 2026', startDate: new Date('2026-12-10'), endDate: new Date('2026-12-18'), type: 'Exam', icon: 'document-text', color: colors.danger },
    { title: 'Winter Vacation', date: 'Jan 1 - Jan 15, 2027', startDate: new Date('2027-01-01'), endDate: new Date('2027-01-15'), type: 'Holiday', icon: 'snow', color: colors.primary },
    { title: 'Maghe Sankranti', date: 'Jan 14, 2027', startDate: new Date('2027-01-14'), endDate: new Date('2027-01-14'), type: 'Public Holiday', icon: 'bonfire', color: colors.warning },
    { title: 'School Sports Week', date: 'Feb 5 - Feb 10, 2027', startDate: new Date('2027-02-05'), endDate: new Date('2027-02-10'), type: 'Event', icon: 'trophy', color: colors.text },
  ], [colors]);

  // Marked dates for react-native-calendars
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    // Highlight today
    marks[todayStr] = { today: true, selected: selectedDateStr === todayStr, selectedColor: colors.primary, textColor: selectedDateStr === todayStr ? '#ffffff' : colors.primary };

    // Add dots for events
    events.forEach(e => {
      const cur = new Date(e.startDate);
      while (cur <= e.endDate) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${d}`;

        const isSel = selectedDateStr === key;
        const isTday = key === todayStr;

        if (!marks[key]) {
          marks[key] = {
            marked: true,
            dotColor: e.color,
            selected: isSel,
            selectedColor: colors.primary,
            textColor: isSel ? '#ffffff' : (isTday ? colors.primary : colors.text),
          };
        } else {
          marks[key] = {
            ...marks[key],
            marked: true,
            dotColor: e.color,
            selected: isSel,
            selectedColor: isSel ? colors.primary : marks[key].selectedColor,
            textColor: isSel ? '#ffffff' : marks[key].textColor,
          };
        }

        cur.setDate(cur.getDate() + 1);
      }
    });

    if (selectedDateStr && !marks[selectedDateStr]) {
      marks[selectedDateStr] = { selected: true, selectedColor: colors.primary, textColor: '#ffffff' };
    }

    return marks;
  }, [events, todayStr, selectedDateStr, colors]);

  const filteredEvents = useMemo(() => {
    if (!selectedDateStr) return events;
    const target = new Date(selectedDateStr + 'T00:00:00');
    const targetTime = target.getTime();
    return events.filter(e => {
      const s = new Date(e.startDate.getFullYear(), e.startDate.getMonth(), e.startDate.getDate()).getTime();
      const end = new Date(e.endDate.getFullYear(), e.endDate.getMonth(), e.endDate.getDate()).getTime();
      return targetTime >= s && targetTime <= end;
    });
  }, [events, selectedDateStr]);

  // BS Calendar Logic
  const weeksBs = useMemo(() => {
    const days = getBsMonthDays(bsMonth);
    const cells: (typeof days[number] | null)[] = [...Array(days[0]?.weekDay || 0).fill(null), ...days];
    while (cells.length % 7) cells.push(null);
    return Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
  }, [bsMonth]);

  const { bs: headerBs, ad: headerAd } = getBsMonthLabels(bsMonth);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Academic Calendar</Text>
          <Text style={styles.subtitle}>Interactive School Schedule</Text>
        </View>

        {/* Mode Toggle Switch */}
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity
            style={[styles.modeTab, calendarMode === 'AD' && styles.modeTabActive]}
            onPress={() => setCalendarMode('AD')}
          >
            <Text style={[styles.modeTabText, calendarMode === 'AD' && styles.modeTabTextActive]}>AD</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, calendarMode === 'BS' && styles.modeTabActive]}
            onPress={() => setCalendarMode('BS')}
          >
            <Text style={[styles.modeTabText, calendarMode === 'BS' && styles.modeTabTextActive]}>BS</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {calendarMode === 'AD' ? (
          /* Reusable react-native-calendars View */
          <View style={styles.calendarCard}>
            <Calendar
              key={colors.background}
              theme={{
                backgroundColor: colors.card,
                calendarBackground: colors.card,
                textSectionTitleColor: colors.subText,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.subText + '40',
                dotColor: colors.primary,
                selectedDotColor: '#ffffff',
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                textDayFontWeight: '600',
                textMonthFontWeight: '800',
                textDayHeaderFontWeight: '700',
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12,
              }}
              markedDates={markedDates}
              onDayPress={(day: DateData) => {
                setSelectedDateStr(prev => prev === day.dateString ? null : day.dateString);
              }}
              enableSwipeMonths
            />
          </View>
        ) : (
          /* Bikram Sambat (BS) View */
          <View style={styles.calendarCard}>
            <View style={styles.monthHeader}>
              <TouchableOpacity style={styles.monthArrow} onPress={() => setBsMonth(m => shiftBsMonth(m, -1))}>
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.monthLabels}>
                <Text style={styles.bsMonth}>{headerBs}</Text>
                <Text style={styles.adMonth}>{headerAd}</Text>
              </View>
              <TouchableOpacity style={styles.monthArrow} onPress={() => setBsMonth(m => shiftBsMonth(m, 1))}>
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.weekHeader}>
              {weekDaysBs.map((day, index) => (
                <View key={`${day}-${index}`} style={styles.weekdayCell}>
                  <Text style={[styles.weekday, index === 6 && styles.saturday]}>{day}</Text>
                </View>
              ))}
            </View>
            {weeksBs.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.map((day, dayIndex) => {
                  if (!day) return <View key={`blank-${dayIndex}`} style={styles.dayCell} />;
                  const isToday = day.adDate.toDateString() === today.toDateString();
                  const isSaturday = day.weekDay === 6;
                  const dateKey = `${day.adDate.getFullYear()}-${String(day.adDate.getMonth() + 1).padStart(2, '0')}-${String(day.adDate.getDate()).padStart(2, '0')}`;
                  const isSelected = selectedDateStr === dateKey;
                  return (
                    <TouchableOpacity
                      key={day.adDate.toISOString()}
                      style={[styles.dayCell, isToday && styles.todayCell, isSelected && !isToday && styles.selectedCell]}
                      onPress={() => setSelectedDateStr(isSelected ? null : dateKey)}
                    >
                      <Text style={[styles.bsDay, isToday && styles.todayText, isSaturday && !isToday && styles.saturday, isSelected && !isToday && styles.selectedText]}>
                        {day.bsDay}
                      </Text>
                      <Text style={[styles.adDay, isToday && styles.todaySubText, isSelected && !isToday && styles.selectedSubText]}>
                        {day.adDate.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* Selected Date Indicator & Filter Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {selectedDateStr ? `Events for ${selectedDateStr}` : 'All School Events'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {selectedDateStr ? 'Tap date again to clear filter' : 'Upcoming holidays & exams'}
            </Text>
          </View>
          {selectedDateStr && (
            <TouchableOpacity onPress={() => setSelectedDateStr(null)} style={styles.clearFilterBtn}>
              <Text style={styles.clearFilterText}>Show All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Events List */}
        <View style={{ gap: 10 }}>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((e, i) => (
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
            ))
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.emptyCopy}>
                <Text style={styles.emptyTitle}>No events scheduled</Text>
                <Text style={styles.emptyText}>There are no events or holidays on this selected date.</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      <BottomNavigation navigation={navigation} activeRoute="Calendar" colors={colors} role={role} />
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: c.card, borderBottomWidth: 1, borderColor: c.border },
  headerIcon: { padding: 5, marginRight: 8 },
  headerCopy: { flex: 1 },
  title: { fontSize: 19, fontWeight: '800', color: c.text },
  subtitle: { color: c.subText, fontSize: 12, marginTop: 2 },
  modeToggleContainer: { flexDirection: 'row', backgroundColor: c.mutedSurface, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: c.border },
  modeTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  modeTabActive: { backgroundColor: c.primary },
  modeTabText: { fontSize: 12, fontWeight: '700', color: c.subText },
  modeTabTextActive: { color: '#ffffff' },
  content: { padding: 16, paddingBottom: 30 },
  calendarCard: { backgroundColor: c.card, borderRadius: 18, borderWidth: 1, borderColor: c.border, overflow: 'hidden', paddingBottom: 8 },
  monthHeader: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  monthArrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: c.mutedSurface },
  monthLabels: { alignItems: 'center' },
  bsMonth: { color: c.text, fontSize: 16, fontWeight: '800' },
  adMonth: { color: c.subText, fontSize: 12, marginTop: 2 },
  weekHeader: { flexDirection: 'row', backgroundColor: c.mutedSurface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.border },
  weekdayCell: { flex: 1, height: 34, justifyContent: 'center', alignItems: 'center' },
  weekday: { fontSize: 12, color: c.subText, fontWeight: '700' },
  saturday: { color: c.danger },
  weekRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: c.border },
  dayCell: { flex: 1, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: c.border, position: 'relative' },
  bsDay: { color: c.text, fontSize: 14, fontWeight: '600' },
  adDay: { color: c.subText, fontSize: 9, position: 'absolute', right: 4, bottom: 2 },
  todayCell: { backgroundColor: c.primary },
  todayText: { color: '#fff', fontWeight: '800' },
  todaySubText: { color: '#ffffffcc' },
  selectedCell: { backgroundColor: c.primary + '25' },
  selectedText: { color: c.primary, fontWeight: '800' },
  selectedSubText: { color: c.primary },
  sectionHeader: { marginTop: 20, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: c.text, fontSize: 17, fontWeight: '800' },
  sectionSubtitle: { color: c.subText, fontSize: 12, marginTop: 2 },
  clearFilterBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: c.primary + '15' },
  clearFilterText: { color: c.primary, fontSize: 12, fontWeight: '700' },
  emptyCard: { padding: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border },
  emptyIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: c.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  emptyCopy: { flex: 1 },
  emptyTitle: { color: c.text, fontSize: 13, fontWeight: '700' },
  emptyText: { color: c.subText, fontSize: 12, lineHeight: 16, marginTop: 3 },
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: c.border },
  eventIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  eventCopy: { flex: 1 },
  eventTitle: { color: c.text, fontSize: 14, fontWeight: '800' },
  eventDate: { color: c.subText, fontSize: 12, marginTop: 3 },
  eventBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  eventBadgeText: { fontSize: 10, fontWeight: '800' },
});

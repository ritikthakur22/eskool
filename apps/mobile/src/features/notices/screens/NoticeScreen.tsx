import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import { API_BASE_URL, api } from '../../../core/networking/api';
import { useTheme } from '../../../core/theme/ThemeContext';
import { isNoticeUnread, loadNoticeReadState, markAllNoticesRead, markNoticeRead, saveNoticeReadState, type NoticeReadState } from '../../../core/utils/noticeReadState';

type Notice = { id: string; title: string; content: string; category: string; date: string; createdAt?: string; authorId?: string; author?: any; attachmentUrl?: string; attachmentType?: string; targetClasses?: any[]; };
const categories = ['All', 'Important', 'Academic', 'Exam', 'Holiday', 'Event'];
const editCategories = ['Important', 'Academic', 'Exam', 'Holiday', 'Event'];
const publisherName = (notice?: Notice | null) => {
  const author = notice?.author?.adminProfile || notice?.author?.teacherProfile;
  return [author?.firstName, author?.lastName].filter(Boolean).join(' ') || 'School administration';
};
const noticeTimestamp = (notice?: Notice | null) => {
  if (!notice?.date) return 'Recently posted';
  const value = new Date(notice.date);
  return Number.isNaN(value.getTime()) ? 'Recently posted' : value.toLocaleString(undefined, {
    dateStyle: 'medium', timeStyle: 'short',
  });
};

export default function NoticeScreen({ navigation }: any) {
  const { colors } = useTheme(); const s = makeStyles(colors);
  const [activeCategory, setActiveCategory] = useState('All'); const [search, setSearch] = useState('');
  const [notices, setNotices] = useState<Notice[]>([]); const [readState, setReadState] = useState<NoticeReadState>({ initialized: false, readThrough: 0, readIds: [] });
  const [selected, setSelected] = useState<Notice | null>(null); const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState('');
  
  // CRUD states
  const [me, setMe] = useState<any>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editNotice, setEditNotice] = useState<Notice | null>(null);
  const [form, setForm] = useState<{ title: string; content: string; category: string; targetClassIds: string[] }>({ title: '', content: '', category: 'Academic', targetClassIds: [] });
  const [classes, setClasses] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true); setError('');
    try {
      const [nRes, mRes] = await Promise.all([
        api.get('/notices').catch(() => ({ data: [] })),
        api.get('/users/me').catch(() => ({ data: null }))
      ]);
      api.get('/academics/structure').then(res => setClasses(res.data.classes || [])).catch(() => {});
      const normalized = (nRes.data || []).map((n: any) => ({ ...n, content: n.content || '', category: n.category || 'General' }));
      setNotices(normalized);
      setReadState(await loadNoticeReadState(normalized));
      setMe(mRes.data);
    }
    catch (e: any) { setError('Could not load notices. Check your connection and try again.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  
  useEffect(() => { fetchData(); }, [fetchData]);
  
  const filtered = useMemo(() => notices.filter(n => {
    const matchesCategory = activeCategory === 'All' || n.category.toLowerCase() === activeCategory.toLowerCase();
    const query = search.trim().toLowerCase(); return matchesCategory && (!query || n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query));
  }), [activeCategory, notices, search]);
  const featured = notices.find(n => ['important', 'emergency'].includes(n.category.toLowerCase()));
  const unreadCount = notices.filter(notice => isNoticeUnread(notice, readState)).length;
  
  const openNotice = (n: Notice) => {
    const next = markNoticeRead(readState, n.id);
    setReadState(next); void saveNoticeReadState(next);
    setSelected(n);
  };
  
  const markAllAsRead = () => {
    const next = markAllNoticesRead(readState, notices);
    setReadState(next); void saveNoticeReadState(next);
  };
  
  const iconFor = (category: string) => {
    const key = category.toLowerCase();
    if (['important', 'emergency'].includes(key)) return { name: 'alert-circle', color: colors.danger, bg: colors.danger + '18' };
    if (key === 'exam') return { name: 'document-text', color: colors.primary, bg: colors.primary + '18' };
    if (key === 'holiday') return { name: 'sunny', color: colors.warning, bg: colors.warning + '20' };
    if (key === 'event') return { name: 'calendar', color: '#8B5CF6', bg: '#8B5CF618' };
    return { name: 'school', color: colors.success, bg: colors.success + '18' };
  };

  const [attachment, setAttachment] = useState<any>(null);

  const openEditor = (n: Notice | null = null) => {
    setEditNotice(n);
    setForm(n ? { title: n.title, content: n.content, category: n.category, targetClassIds: n.targetClasses?.map((c: any) => c.id) || [] } : { title: '', content: '', category: 'Academic', targetClassIds: [] });
    setAttachment(null);
    setEditorVisible(true);
  };

  const pickAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets[0]) {
        setAttachment(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick file.');
    }
  };

  const saveNotice = async () => {
    if (!form.title.trim() || !form.content.trim()) return Alert.alert('Error', 'Please enter a title and content.');
    setSaving(true);
    try {
      let attachmentUrl = editNotice?.attachmentUrl;
      let attachmentType = editNotice?.attachmentType;
      
      if (attachment) {
        const formData = new FormData();
        formData.append('file', { uri: attachment.uri, name: attachment.name, type: attachment.mimeType || 'application/octet-stream' } as any);
        const uploadRes = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        attachmentUrl = uploadRes.data.url;
        attachmentType = uploadRes.data.mimeType;
      }
      
      let data = { ...form, attachmentUrl, attachmentType };

      if (editNotice) {
        await api.patch(`/notices/${editNotice.id}`, data);
        Alert.alert('Success', 'Notice updated.');
      } else {
        await api.post('/notices', data);
        Alert.alert('Success', 'Notice posted.');
      }
      setEditorVisible(false);
      fetchData(true);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Could not save notice.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Notice', 'Are you sure you want to delete this notice? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteNotice(id) }
    ]);
  };

  const deleteNotice = async (id: string) => {
    try {
      await api.delete(`/notices/${id}`);
      setSelected(null);
      fetchData(true);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Could not delete notice.');
    }
  };

  const canEdit = selected && me && (me.role === 'ADMIN' || me.role === 'SUPER_ADMIN' || (me.role === 'TEACHER' && selected.authorId === me.id));

  return <SafeAreaView style={s.screen}>
    <ScrollView stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} />}>
      <View style={s.topHeader}>
        <TouchableOpacity accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={s.back}><Ionicons name="chevron-back" size={23} color={colors.text} /></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={s.eyebrow}>YOUR SCHOOL, IN THE LOOP</Text><Text style={s.title}>Notices</Text></View>
        <TouchableOpacity accessibilityLabel="Refresh notices" onPress={() => fetchData(true)} style={s.refresh}><Ionicons name="refresh-outline" size={20} color={colors.primary} /></TouchableOpacity>
      </View>
      <View style={s.sticky}>
        <View style={s.search}><Ionicons name="search-outline" size={19} color={colors.subText} /><TextInput value={search} onChangeText={setSearch} placeholder="Search updates" placeholderTextColor={colors.subText} style={s.searchInput} returnKeyType="search" />{search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={colors.subText} /></TouchableOpacity>}</View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categories}>{categories.map(category => <TouchableOpacity key={category} onPress={() => setActiveCategory(category)} style={[s.chip, activeCategory === category && s.chipActive]}><Text style={[s.chipText, activeCategory === category && s.chipTextActive]}>{category}</Text></TouchableOpacity>)}</ScrollView>
      </View>
      <View style={s.content}>
        {featured && <TouchableOpacity activeOpacity={0.9} onPress={() => openNotice(featured)} style={s.featured}><View style={s.featuredTop}><View style={s.urgentTag}><Ionicons name="warning" size={12} color="#fff" /><Text style={s.urgentText}>IMPORTANT UPDATE</Text></View><Ionicons name="chevron-forward" size={20} color="#fff" /></View><Text style={s.featuredTitle} numberOfLines={2}>{featured.title}</Text><Text style={s.featuredPreview} numberOfLines={2}>{featured.content}</Text><Text style={s.featuredDate}>{new Date(featured.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text></TouchableOpacity>}
        <View style={s.sectionHeading}><View><Text style={s.sectionTitle}>{activeCategory === 'All' ? 'Recent updates' : activeCategory}</Text><Text style={s.sectionSubtitle}>{filtered.length} {filtered.length === 1 ? 'notice' : 'notices'} · {unreadCount} unread</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel={unreadCount ? 'Mark all notices as read' : 'All notices are read'} accessibilityState={{ disabled: unreadCount === 0 }} disabled={unreadCount === 0} onPress={markAllAsRead} style={{ minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, borderRadius: 11, backgroundColor: unreadCount ? colors.primary + '12' : colors.success + '12' }}><Ionicons name="checkmark-done-outline" size={15} color={unreadCount ? colors.primary : colors.success} /><Text style={{ color: unreadCount ? colors.primary : colors.success, fontSize: 10, fontWeight: '800' }}>{unreadCount ? 'Mark all read' : 'All read'}</Text></TouchableOpacity></View>
        {loading ? <View style={s.state}><ActivityIndicator size="large" color={colors.primary} /><Text style={s.stateText}>Bringing you the latest updates…</Text></View> : error ? <View style={s.state}><Ionicons name="cloud-offline-outline" size={42} color={colors.subText} /><Text style={s.stateTitle}>Notices unavailable</Text><Text style={s.stateText}>{error}</Text><TouchableOpacity style={s.retry} onPress={() => fetchData()}><Text style={s.retryText}>Try again</Text></TouchableOpacity></View> : filtered.length === 0 ? <View style={s.empty}><View style={s.emptyIcon}><Ionicons name="notifications-off-outline" size={25} color={colors.primary} /></View><Text style={s.stateTitle}>Nothing to show</Text><Text style={s.stateText}>{search ? 'Try a different search phrase or clear your search.' : 'New school updates will appear here when they’re posted.'}</Text></View> : filtered.map(notice => {
          const icon = iconFor(notice.category); const unread = isNoticeUnread(notice, readState);
          const publisher = publisherName(notice);
          return <TouchableOpacity accessibilityRole="button" key={notice.id} style={s.noticeCard} onPress={() => openNotice(notice)}><View style={[s.noticeIcon, { backgroundColor: icon.bg }]}><Ionicons name={icon.name as any} size={21} color={icon.color} /></View><View style={s.noticeBody}><View style={s.categoryLine}><Text style={[s.categoryLabel, { color: icon.color }]}>{notice.category}</Text>{unread && <View style={s.newTag}><View style={s.dot} /><Text style={s.newText}>NEW</Text></View>}</View><Text style={[s.noticeTitle, unread && { fontWeight: '800' }]} numberOfLines={2}>{notice.title}</Text><Text style={s.preview} numberOfLines={2}>{notice.content}</Text><Text style={s.date}>{publisher} · {new Date(notice.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text></View><Ionicons name="chevron-forward" size={17} color={colors.subText} /></TouchableOpacity>;
        })}
      </View>
    </ScrollView>
    
    {me && (me.role === 'ADMIN' || me.role === 'SUPER_ADMIN' || me.role === 'TEACHER') && (
      <TouchableOpacity style={s.fab} onPress={() => openEditor()}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    )}

    <Modal visible={!!selected && !editorVisible} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <View style={s.modalHandle} />
          <View style={s.modalHeader}>
            <View style={[s.modalBadge, { backgroundColor: selected ? iconFor(selected.category).bg : colors.mutedSurface }]}>
              <Text style={[s.modalCategory, { color: selected ? iconFor(selected.category).color : colors.primary }]}>{selected?.category}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {canEdit && <TouchableOpacity accessibilityLabel="Edit notice" style={s.close} onPress={() => openEditor(selected)}><Ionicons name="pencil" size={22} color={colors.text} /></TouchableOpacity>}
              {canEdit && <TouchableOpacity accessibilityLabel="Delete notice" style={s.close} onPress={() => confirmDelete(selected!.id)}><Ionicons name="trash" size={22} color={colors.danger} /></TouchableOpacity>}
              <TouchableOpacity accessibilityLabel="Close notice" style={s.close} onPress={() => setSelected(null)}><Ionicons name="close" size={22} color={colors.text} /></TouchableOpacity>
            </View>
          </View>
          <Text style={s.modalTitle}>{selected?.title}</Text>
          <View style={s.modalMeta}>
            <Ionicons name="person-outline" size={14} color={colors.subText} /><Text style={s.modalDate}>{publisherName(selected)}</Text><Text style={s.modalSeparator}>·</Text>
            <Ionicons name="time-outline" size={14} color={colors.subText} /><Text style={s.modalDate}>{noticeTimestamp(selected)}</Text>
          </View>
          {selected?.targetClasses && selected.targetClasses.length > 0 && (
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12}}>
              {selected.targetClasses.map((c: any) => (
                <View key={c.id} style={{backgroundColor: colors.primary + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8}}>
                  <Text style={{color: colors.primary, fontSize: 11, fontWeight: '700'}}>{c.name || c.course?.name || 'Class'}</Text>
                </View>
              ))}
            </View>
          )}
          <ScrollView>
            <Text style={s.modalContent}>{selected?.content}</Text>
            {selected?.attachmentUrl && (
              <TouchableOpacity onPress={() => Linking.openURL(API_BASE_URL + selected.attachmentUrl)} style={{ marginTop: 15, marginBottom: 25 }}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>View Attachment</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>

    <Modal visible={editorVisible} animationType="slide" transparent onRequestClose={() => setEditorVisible(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
        <View style={s.modalCard}>
          <View style={s.modalHeader}>
            <Text style={[s.modalTitle, {fontSize: 20, fontWeight: '900', color: colors.text}]}>{editNotice ? 'Edit Notice' : 'New Notice'}</Text>
            <TouchableOpacity accessibilityLabel="Close editor" style={s.close} onPress={() => setEditorVisible(false)}><Ionicons name="close" size={22} color={colors.text} /></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={{marginTop: 15}}>
            <TextInput value={form.title} onChangeText={t => setForm({...form, title: t})} placeholder="Notice Title" placeholderTextColor={colors.subText} style={s.input} />
            <TextInput value={form.content} onChangeText={t => setForm({...form, content: t})} placeholder="Notice details..." placeholderTextColor={colors.subText} style={[s.input, { height: 120, textAlignVertical: 'top' }]} multiline />
            <Text style={{color: colors.subText, fontSize: 12, marginBottom: 8, fontWeight: '700', marginLeft: 5}}>Category</Text>
            <TextInput value={form.category} onChangeText={t => setForm({...form, category: t})} placeholder="Type custom category..." placeholderTextColor={colors.subText} style={[s.input, { marginBottom: 15 }]} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8, marginBottom: 15}}>
              {editCategories.map(cat => (
                <TouchableOpacity key={cat} onPress={() => setForm({...form, category: cat})} style={[s.chip, form.category === cat && s.chipActive]}>
                  <Text style={[s.chipText, form.category === cat && s.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {classes.length > 0 && (
              <>
                <Text style={{color: colors.subText, fontSize: 12, marginBottom: 8, fontWeight: '700', marginLeft: 5}}>Target Classes (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8, marginBottom: 15}}>
                  {classes.map(c => {
                    const isSelected = form.targetClassIds.includes(c.id);
                    return (
                      <TouchableOpacity key={c.id} onPress={() => {
                        setForm(f => ({
                          ...f,
                          targetClassIds: isSelected ? f.targetClassIds.filter(id => id !== c.id) : [...f.targetClassIds, c.id]
                        }))
                      }} style={[s.chip, isSelected && s.chipActive]}>
                        <Text style={[s.chipText, isSelected && s.chipTextActive]}>{c.name || c.course?.name || 'Class'}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            <TouchableOpacity style={[s.input, { alignItems: 'center', justifyContent: 'center' }]} onPress={pickAttachment}>
              <Text style={{ color: colors.primary }}>{attachment ? `Attachment: ${attachment.name}` : 'Attach File/Image'}</Text>
            </TouchableOpacity>

            <TouchableOpacity disabled={saving} onPress={saveNotice} style={s.primaryButton}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>{editNotice ? 'Save Changes' : 'Post Notice'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>

  </SafeAreaView>;
}

const makeStyles = (c: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background }, topHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16, backgroundColor: c.background }, back: { height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, marginRight: 12 }, eyebrow: { color: c.primary, fontSize: 9, letterSpacing: 1.4, fontWeight: '900' }, title: { color: c.text, fontSize: 26, fontWeight: '900', marginTop: 2 }, refresh: { height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, sticky: { backgroundColor: c.background, paddingTop: 2, paddingBottom: 4 }, search: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, marginBottom: 12, paddingHorizontal: 14, height: 48, borderRadius: 15, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, searchInput: { flex: 1, color: c.text, fontSize: 14, marginLeft: 9 }, categories: { paddingHorizontal: 18, paddingBottom: 11, gap: 8 }, chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, chipActive: { backgroundColor: c.text, borderColor: c.text }, chipText: { color: c.subText, fontSize: 12, fontWeight: '700' }, chipTextActive: { color: c.background }, content: { paddingHorizontal: 18, paddingBottom: 80 }, featured: { padding: 17, borderRadius: 19, backgroundColor: c.danger, marginTop: 5, marginBottom: 22 }, featuredTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, urgentTag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFFFF28', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 }, urgentText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }, featuredTitle: { color: '#fff', fontSize: 19, lineHeight: 24, fontWeight: '900', marginTop: 13 }, featuredPreview: { color: '#FFFFFFDF', fontSize: 12, lineHeight: 18, marginTop: 6 }, featuredDate: { color: '#FFFFFFB8', fontSize: 10, fontWeight: '700', marginTop: 12 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, sectionTitle: { color: c.text, fontSize: 19, fontWeight: '900' }, sectionSubtitle: { color: c.subText, fontSize: 11, marginTop: 3 }, count: { minWidth: 32, height: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: c.mutedSurface, borderRadius: 10, paddingHorizontal: 8 }, countText: { color: c.text, fontSize: 12, fontWeight: '800' }, noticeCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 17, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, marginBottom: 10 }, noticeIcon: { height: 42, width: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, noticeBody: { flex: 1, marginRight: 8 }, categoryLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }, categoryLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7 }, newTag: { flexDirection: 'row', alignItems: 'center', gap: 4 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.primary }, newText: { color: c.primary, fontSize: 9, fontWeight: '900' }, noticeTitle: { color: c.text, fontSize: 14, lineHeight: 19, fontWeight: '700' }, preview: { color: c.subText, fontSize: 12, lineHeight: 18, marginTop: 5 }, date: { color: c.subText, fontSize: 10, fontWeight: '600', marginTop: 9 }, state: { alignItems: 'center', paddingVertical: 55, paddingHorizontal: 24 }, stateTitle: { color: c.text, fontSize: 16, fontWeight: '800', marginTop: 12, textAlign: 'center' }, stateText: { color: c.subText, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 6 }, retry: { paddingHorizontal: 19, paddingVertical: 10, borderRadius: 12, backgroundColor: c.primary, marginTop: 14 }, retryText: { color: '#fff', fontWeight: '800' }, empty: { alignItems: 'center', paddingTop: 45, paddingBottom: 60, paddingHorizontal: 20 }, emptyIcon: { width: 55, height: 55, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '15' }, modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000070' }, modalCard: { maxHeight: '84%', minHeight: '45%', backgroundColor: c.card, borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingHorizontal: 22, paddingBottom: 25 }, modalHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: c.subText + '70', alignSelf: 'center', marginTop: 10, marginBottom: 16 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, modalBadge: { borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7 }, modalCategory: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 }, close: { padding: 7, borderRadius: 20, backgroundColor: c.mutedSurface }, modalTitle: { color: c.text, fontSize: 23, lineHeight: 29, fontWeight: '900', marginTop: 18 }, modalMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 7 }, modalSeparator: { color: c.subText, fontSize: 12 }, modalDate: { color: c.subText, fontSize: 12 }, modalContent: { color: c.text, fontSize: 14, lineHeight: 23, marginTop: 21, paddingBottom: 25 },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  input: { backgroundColor: c.background, borderWidth: 1, borderColor: c.border, borderRadius: 13, paddingHorizontal: 16, paddingVertical: 14, color: c.text, fontSize: 15, marginBottom: 12 },
  primaryButton: { backgroundColor: c.primary, borderRadius: 13, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '800' }
});

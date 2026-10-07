import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useMemo } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import { useTheme } from '../../../core/theme/ThemeContext';
import { API_BASE_URL, api } from '../../../core/networking/api';
import { getSelectedChildId } from '../../../core/utils/childSelection';

export default function HomeworkScreen({ navigation }: any) {
  const { colors } = useTheme(); const styles = makeStyles(colors);
  const [activeTab, setActiveTab] = useState('Assigned');
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const [childSectionId, setChildSectionId] = useState('');
  const [childName, setChildName] = useState('');
  
  // Management state for teachers
  const [structure, setStructure] = useState<any>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editHomework, setEditHomework] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', subjectId: '', sectionId: '', dueDate: '' });
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [saving, setSaving] = useState(false);

  const tabs = useMemo(() => {
    return ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(role) ? ['Manage', 'Submissions'] : ['Assigned', 'Submitted', 'Upcoming'];
  }, [role]);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.includes(activeTab)) setActiveTab(tabs[0]);
  }, [tabs, activeTab]);

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const raw = await SecureStore.getItemAsync('user_data');
      if (!raw) { setLoading(false); return; }
      const nextRole = JSON.parse(raw).role || '';
      setRole(nextRole);

      if (['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(nextRole)) {
        const [hwRes, structRes] = await Promise.all([
          api.get('/homework/manage'),
          api.get('/academics/structure').catch(() => ({ data: {} }))
        ]);
        setHomeworks(hwRes.data);
        setStructure(structRes.data);
      } else {
        if (nextRole === 'PARENT') {
          const selectedId = (await getSelectedChildId()) || '';
          if (!selectedId) throw new Error('Select a child from the home screen first.');
          const childRes = await api.get('/academics/children').catch(() => ({ data: [] }));
          const data = Array.isArray(childRes.data) ? childRes.data : [];
          const child = data.find((item: any) => item.student?.id === selectedId) || data[0];
          setChildSectionId(child?.student?.enrollments?.[0]?.sectionId || '');
          const childProfile = child?.student?.studentProfile;
          setChildName([childProfile?.firstName, childProfile?.lastName].filter(Boolean).join(' ') || child?.student?.email || 'Selected child');
        }
        const endpoint = nextRole === 'PARENT' ? `/homework/class/${childSectionId}` : '/homework/me';
        const res = await api.get(endpoint, { params: { limit: 50 } });
        setHomeworks(res.data.map((item: any) => ({
          ...item,
          subject: item.subjectName || 'Subject',
          description: item.description || item.title,
          dueDate: new Date(item.dueDate).toLocaleDateString(),
          status: item.submission ? 'Submitted' : 'Pending'
        })));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Could not load homework.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [activeTab, childSectionId]);

  const isManagement = ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(role);
  const now = Date.now();
  const visibleHomeworks = isManagement ? homeworks : homeworks.filter(hw => {
    if (activeTab === 'Assigned') return hw.status !== 'Submitted';
    if (activeTab === 'Submitted') return hw.status === 'Submitted';
    return new Date(hw.dueDate).getTime() >= now;
  });

  const [attachment, setAttachment] = useState<any>(null);

  const openEditor = (hw: any = null) => {
    setEditHomework(hw);
    setForm(hw ? { title: hw.title, description: hw.description, subjectId: hw.subjectId, sectionId: hw.sectionId, dueDate: hw.dueDate.split('T')[0] } : { title: '', description: '', subjectId: '', sectionId: '', dueDate: new Date().toISOString().split('T')[0] });
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

  const saveHomework = async () => {
    let finalSubjectId = form.subjectId;
    if (customSubjectName.trim()) {
      try {
        const res = await api.post('/academics/subjects', { name: customSubjectName.trim() });
        finalSubjectId = res.data.id;
      } catch (err) {
        Alert.alert('Error', 'Failed to create custom subject');
        return;
      }
    }
    if (!form.title || !finalSubjectId || !form.sectionId || !form.dueDate) return Alert.alert('Error', 'Fill required fields.');
    setSaving(true);
    try {
      let attachmentUrl = editHomework?.attachmentUrl;
      let attachmentType = editHomework?.attachmentType;
      
      if (attachment) {
        const formData = new FormData();
        formData.append('file', { uri: attachment.uri, name: attachment.name, type: attachment.mimeType || 'application/octet-stream' } as any);
        const uploadRes = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        attachmentUrl = uploadRes.data.url;
        attachmentType = uploadRes.data.mimeType;
      }
      
      let data: any = editHomework 
        ? { title: form.title, description: form.description, dueDate: new Date(form.dueDate).toISOString(), attachmentUrl, attachmentType }
        : { ...form, subjectId: finalSubjectId, dueDate: new Date(form.dueDate).toISOString(), attachmentUrl, attachmentType };

      if (editHomework) await api.patch(`/homework/${editHomework.id}`, data);
      else await api.post('/homework', data);
      setEditorVisible(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save homework.');
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24} color={colors.text} /></TouchableOpacity>
        <View style={styles.headerCopy}><Text style={styles.headerTitle}>Homework</Text>{role === 'PARENT' && <Text style={styles.headerSubtitle}>{childName ? `For ${childName}` : 'Select a child from Home'}</Text>}</View>
        <TouchableOpacity style={styles.backButton} onPress={loadData}><Ionicons name="refresh" size={20} color={colors.primary} /></TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab, { borderColor: activeTab === tab ? colors.primary : colors.border }]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText, { color: activeTab === tab ? colors.primary : colors.subText }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isManagement && activeTab === 'Manage' && (
          <TouchableOpacity style={styles.addButton} onPress={() => openEditor()}>
            <Text style={styles.addButtonText}>+ Create New Homework</Text>
          </TouchableOpacity>
        )}
        
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.subText, marginTop: 10 }}>Loading homework...</Text></View>
        ) : error ? (
          <View style={styles.center}><Text style={{ color: colors.danger }}>{error}</Text></View>
        ) : visibleHomeworks.length === 0 ? (
          <View style={styles.center}><Text style={{ color: colors.subText }}>No homework found.</Text></View>
        ) : (
          visibleHomeworks.map((hw) => (
            <TouchableOpacity key={hw.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => isManagement && openEditor(hw)}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderCopy}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{hw.title || hw.subject}</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.subText }]}>{hw.description || 'No description'}</Text>
                  {hw.attachmentUrl && (
                    <TouchableOpacity onPress={() => Linking.openURL(API_BASE_URL + hw.attachmentUrl)}>
                      <Text style={{ color: colors.primary, marginTop: 4, fontWeight: '700' }}>View Attachment</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={[styles.cardSubtitle, { color: colors.primary, marginTop: 6, fontWeight: '700' }]}>Due: {isManagement ? new Date(hw.dueDate).toLocaleDateString() : hw.dueDate}</Text>
                </View>
                {!isManagement && <View style={[styles.badge, { backgroundColor: hw.status === 'Submitted' ? colors.success + '20' : colors.warning + '20' }]}><Text style={{ color: hw.status === 'Submitted' ? colors.success : colors.warning, fontSize: 12, fontWeight: '800' }}>{hw.status}</Text></View>}
              </View>
              {isManagement && <Text style={{ color: colors.subText, fontSize: 11, marginTop: 8 }}>Class {hw.section?.class?.name} · Section {hw.section?.name}</Text>}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={editorVisible} animationType="slide" transparent onRequestClose={() => setEditorVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{editHomework ? 'Edit Homework' : 'Create Homework'}</Text>
              <TouchableOpacity onPress={() => setEditorVisible(false)}><Ionicons name="close" size={24} color={colors.subText} /></TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={[styles.inputLabel, { color: colors.subText }]}>Title</Text>
              <TextInput value={form.title} onChangeText={t => setForm({...form, title: t})} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} placeholder="Chapter 4 Reading" placeholderTextColor={colors.subText} />
              <Text style={[styles.inputLabel, { color: colors.subText }]}>Description</Text>
              <TextInput value={form.description} onChangeText={t => setForm({...form, description: t})} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background, height: 80, textAlignVertical: 'top' }]} multiline placeholder="Read pages 40-50..." placeholderTextColor={colors.subText} />
              <Text style={[styles.inputLabel, { color: colors.subText }]}>Due Date (YYYY-MM-DD)</Text>
              <TextInput value={form.dueDate} onChangeText={t => setForm({...form, dueDate: t})} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} placeholder="2026-12-01" placeholderTextColor={colors.subText} />
              
              {!editHomework && structure && (
                <>
                  <Text style={[styles.inputLabel, { color: colors.subText }]}>Subject</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                    {structure.subjects?.map((s: any) => (
                      <TouchableOpacity key={s.id} onPress={() => setForm({...form, subjectId: s.id})} style={[styles.chip, { borderColor: colors.border, backgroundColor: form.subjectId === s.id ? colors.primary + '18' : colors.card }]}>
                        <Text style={{ color: form.subjectId === s.id ? colors.primary : colors.subText }}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TextInput value={customSubjectName} onChangeText={t => { setCustomSubjectName(t); if(t) setForm({...form, subjectId: ''}); }} placeholder="Or type new subject..." placeholderTextColor={colors.subText} style={[styles.input, { marginBottom: 15 }]} />
                  <Text style={[styles.inputLabel, { color: colors.subText }]}>Section</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                    {structure.classes?.flatMap((c: any) => c.sections?.map((sec: any) => (
                      <TouchableOpacity key={sec.id} onPress={() => setForm({...form, sectionId: sec.id})} style={[styles.chip, { borderColor: colors.border, backgroundColor: form.sectionId === sec.id ? colors.primary + '18' : colors.card }]}>
                        <Text style={{ color: form.sectionId === sec.id ? colors.primary : colors.subText }}>Class {c.name} {sec.name}</Text>
                      </TouchableOpacity>
                    )))}
                  </ScrollView>
                </>
              )}
              
              <TouchableOpacity style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginTop: 10 }]} onPress={pickAttachment}>
                <Text style={{ color: colors.primary }}>{attachment ? `Attachment: ${attachment.name}` : 'Attach File/Image'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={saveHomework} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Homework</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  backButton: { padding: 4 },
  headerCopy: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: c.text },
  headerSubtitle: { fontSize: 12, color: c.subText, marginTop: 2 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  activeTab: { backgroundColor: c.primary + '18' },
  tabText: { fontSize: 13, fontWeight: '700' },
  activeTabText: { color: c.primary },
  content: { padding: 16, paddingBottom: 40 },
  center: { padding: 40, alignItems: 'center' },
  addButton: { paddingVertical: 14, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center', marginBottom: 16 },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardHeaderCopy: { flex: 1, marginRight: 10 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardSubtitle: { fontSize: 13, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  saveButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' }
});

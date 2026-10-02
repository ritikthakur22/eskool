import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../../core/networking/api';
import { useTheme } from '../../../core/theme/ThemeContext';

type RoutineFile = { id?: string; fileName: string; mimeType: string; base64?: string; createdAt?: string };
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const periods = [
  { time: '08:00\n08:45', subjects: ['Mathematics', 'Mathematics', 'Science', 'English', 'Mathematics', 'Science', ''] },
  { time: '08:50\n09:35', subjects: ['English', 'Science', 'Mathematics', 'Mathematics', 'English', 'Mathematics', ''] },
  { time: '09:50\n10:35', subjects: ['Science', 'English', 'Social Studies', 'Science', 'Computer', 'English', ''] },
  { time: '10:40\n11:25', subjects: ['Social Studies', 'Computer', 'English', 'Computer', 'Science', 'Social Studies', ''] },
  { time: '11:30\n12:15', subjects: ['Computer', 'Social Studies', 'Computer', 'Social Studies', 'Social Studies', 'Computer', ''] },
];

export default function RoutineScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [role, setRole] = useState('STUDENT');
  const [routineFile, setRoutineFile] = useState<RoutineFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const canUpload = ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(role);

  const loadRoutine = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [savedUser, response] = await Promise.all([
        SecureStore.getItemAsync('user_data'),
        api.get('/routine/document'),
      ]);
      if (savedUser) setRole(JSON.parse(savedUser).role || 'STUDENT');
      setRoutineFile(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) setRoutineFile(null);
      else setError('Could not load the uploaded routine. Pull to retry or try again below.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoutine(); }, [loadRoutine]);

  const uploadRoutine = async () => {
    let result;
    try {
      const DocumentPicker = await import('expo-document-picker');
      result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true, multiple: false });
    } catch {
      Alert.alert('Update the app build', 'This installed app does not include the document picker. Install a fresh development build, then try again.');
      return;
    }
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType || (asset.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      Alert.alert('Unsupported file', 'Choose a PDF, JPG, PNG, or WEBP file.');
      return;
    }
    const form = new FormData();
    form.append('file', { uri: asset.uri, name: asset.name, type: mimeType } as any);
    setUploading(true);
    try {
      await api.post('/routine/document', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await loadRoutine();
      Alert.alert('Routine uploaded', 'The latest routine is now available to your school.');
    } catch (err: any) {
      Alert.alert('Upload failed', err.response?.data?.message || 'Could not upload this file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const openPdf = async () => {
    if (!routineFile?.base64) return;
    try {
      const safeName = routineFile.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${FileSystem.cacheDirectory}${safeName}`;
      await FileSystem.writeAsStringAsync(path, routineFile.base64, { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(path, { mimeType: 'application/pdf', dialogTitle: routineFile.fileName });
      else Alert.alert('PDF ready', 'Sharing or a PDF viewer is not available on this device.');
    } catch {
      Alert.alert('Could not open PDF', 'Please try downloading the routine again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24} color={colors.text} /></TouchableOpacity>
        <View style={styles.headerCopy}><Text style={styles.title}>Class Routine</Text><Text style={styles.subtitle}>Weekly class timetable</Text></View>
        <TouchableOpacity accessibilityLabel="Refresh routine" style={styles.refresh} onPress={loadRoutine}><Ionicons name="refresh" size={19} color={colors.primary} /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.tableHeading}><View><Text style={styles.sectionTitle}>Weekly timetable</Text><Text style={styles.sectionSubtitle}>Example layout · scroll sideways for all days</Text></View><Ionicons name="grid-outline" size={21} color={colors.primary} /></View>
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.tableScroll}>
          <View style={styles.table}>
            <View style={styles.tableRow}><View style={[styles.timeCell, styles.headCell]}><Text style={styles.headText}>Time</Text></View>{days.map(day => <View key={day} style={[styles.dayCell, styles.headCell]}><Text style={styles.headText}>{day}</Text></View>)}</View>
            {periods.map((period, row) => <View key={period.time} style={[styles.tableRow, row % 2 === 1 && styles.alternateRow]}><View style={[styles.timeCell, styles.bodyCell]}><Text style={styles.timeText}>{period.time}</Text></View>{period.subjects.map((subject, column) => <View key={`${row}-${column}`} style={[styles.dayCell, styles.bodyCell]}><Text style={styles.subjectText}>{subject || '—'}</Text></View>)}</View>)}
          </View>
        </ScrollView>

        <View style={styles.uploadHeading}><View style={{ flex: 1 }}><Text style={styles.sectionTitle}>School routine file</Text><Text style={styles.sectionSubtitle}>Official image or PDF uploaded by staff</Text></View>{canUpload && <TouchableOpacity style={styles.uploadButton} onPress={uploadRoutine} disabled={uploading}><Ionicons name="cloud-upload-outline" size={17} color="#fff" /><Text style={styles.uploadButtonText}>{uploading ? 'Uploading' : 'Upload'}</Text></TouchableOpacity>}</View>
        {loading ? <View style={styles.fileState}><ActivityIndicator color={colors.primary} /><Text style={styles.stateText}>Loading school routine…</Text></View> : error ? <View style={styles.fileState}><Ionicons name="cloud-offline-outline" size={28} color={colors.subText} /><Text style={styles.stateText}>{error}</Text><TouchableOpacity onPress={loadRoutine}><Text style={styles.retryText}>Try again</Text></TouchableOpacity></View> : routineFile ? <View style={styles.fileCard}>
          <View style={styles.fileMeta}><View style={styles.fileIcon}><Ionicons name={routineFile.mimeType === 'application/pdf' ? 'document-text' : 'image'} size={21} color={colors.primary} /></View><View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.fileName}>{routineFile.fileName}</Text><Text style={styles.fileDate}>{routineFile.createdAt ? `Uploaded ${new Date(routineFile.createdAt).toLocaleDateString()}` : 'School timetable'}</Text></View>{routineFile.mimeType === 'application/pdf' && <TouchableOpacity onPress={openPdf} style={styles.openButton}><Text style={styles.openText}>Open</Text></TouchableOpacity>}</View>
          {routineFile.mimeType.startsWith('image/') && routineFile.base64 ? <Image source={{ uri: `data:${routineFile.mimeType};base64,${routineFile.base64}` }} resizeMode="contain" style={styles.previewImage} /> : routineFile.mimeType === 'application/pdf' ? <TouchableOpacity onPress={openPdf} style={styles.pdfPreview}><Ionicons name="document-text-outline" size={34} color={colors.primary} /><Text style={styles.pdfTitle}>PDF routine</Text><Text style={styles.stateText}>Tap Open to view or share this document</Text></TouchableOpacity> : null}
        </View> : <View style={styles.noFile}><Ionicons name="document-attach-outline" size={28} color={colors.subText} /><Text style={styles.noFileTitle}>No official routine uploaded yet</Text><Text style={styles.stateText}>{canUpload ? 'Upload a timetable image or PDF to share it with your school.' : 'Your school timetable file will appear here when staff upload it.'}</Text></View>}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background }, header: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, padding: 15, borderBottomWidth: 1, borderColor: c.border }, back: { padding: 5, marginRight: 9 }, headerCopy: { flex: 1 }, title: { fontSize: 19, fontWeight: '800', color: c.text }, subtitle: { color: c.subText, fontSize: 12, marginTop: 3 }, refresh: { padding: 9, borderRadius: 10, backgroundColor: c.primary + '15' }, content: { padding: 16, paddingBottom: 30 }, tableHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, sectionTitle: { color: c.text, fontSize: 17, fontWeight: '800' }, sectionSubtitle: { color: c.subText, fontSize: 12, marginTop: 3 }, tableScroll: { paddingBottom: 6 }, table: { borderWidth: 1, borderColor: c.border, borderRadius: 13, overflow: 'hidden', backgroundColor: c.card }, tableRow: { flexDirection: 'row' }, alternateRow: { backgroundColor: c.mutedSurface }, timeCell: { width: 65 }, dayCell: { width: 91 }, headCell: { height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary }, headText: { color: '#fff', fontSize: 12, fontWeight: '800' }, bodyCell: { minHeight: 66, alignItems: 'center', justifyContent: 'center', padding: 5, borderTopWidth: 1, borderRightWidth: 1, borderColor: c.border }, timeText: { color: c.subText, fontSize: 10, fontWeight: '700', textAlign: 'center', lineHeight: 14 }, subjectText: { color: c.text, fontSize: 10, textAlign: 'center', fontWeight: '600', lineHeight: 14 }, uploadHeading: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 12 }, uploadButton: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 11, backgroundColor: c.primary, marginLeft: 10 }, uploadButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' }, fileCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 16, overflow: 'hidden' }, fileMeta: { flexDirection: 'row', alignItems: 'center', padding: 13 }, fileIcon: { height: 40, width: 40, borderRadius: 12, backgroundColor: c.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: 10 }, fileName: { color: c.text, fontSize: 13, fontWeight: '700' }, fileDate: { color: c.subText, fontSize: 11, marginTop: 3 }, openButton: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 9, backgroundColor: c.primary + '15' }, openText: { color: c.primary, fontSize: 12, fontWeight: '800' }, previewImage: { width: '100%', height: 330, backgroundColor: c.mutedSurface }, pdfPreview: { alignItems: 'center', padding: 25, backgroundColor: c.mutedSurface, margin: 12, borderRadius: 13 }, pdfTitle: { color: c.text, fontSize: 14, fontWeight: '800', marginTop: 8 }, fileState: { minHeight: 110, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card, borderRadius: 15, borderWidth: 1, borderColor: c.border, padding: 16, gap: 8 }, stateText: { color: c.subText, fontSize: 12, textAlign: 'center', lineHeight: 17, marginTop: 6 }, retryText: { color: c.primary, fontWeight: '800', marginTop: 5 }, noFile: { alignItems: 'center', padding: 22, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 15 }, noFileTitle: { color: c.text, fontSize: 14, fontWeight: '800', marginTop: 9, textAlign: 'center' },
});

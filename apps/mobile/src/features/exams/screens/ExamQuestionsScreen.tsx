import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, useTheme } from '../../../core/theme/ThemeContext';
import { KeyboardAvoidingView, Platform, api } from '../../../core/networking/api';

export default function ExamQuestionsScreen({ route, navigation }: any) {
  const { exam } = route.params;
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editorVisible, setEditorVisible] = useState(false);
  const [editQuestion, setEditQuestion] = useState<any>(null);
  const [form, setForm] = useState({ text: '', options: ['', '', '', ''], correctOptionIndex: 0 });
  const [saving, setSaving] = useState(false);

  const loadQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/exams/${exam.id}/questions`);
      setQuestions(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Could not load questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [exam.id]);

  const openEditor = (q: any = null) => {
    setEditQuestion(q);
    if (q) {
      setForm({ text: q.text, options: [...q.options], correctOptionIndex: q.correctOptionIndex });
    } else {
      setForm({ text: '', options: ['', '', '', ''], correctOptionIndex: 0 });
    }
    setEditorVisible(true);
  };

  const updateOption = (text: string, index: number) => {
    const newOptions = [...form.options];
    newOptions[index] = text;
    setForm({ ...form, options: newOptions });
  };

  const saveQuestion = async () => {
    if (!form.text || form.options.some(o => !o)) {
      return Alert.alert('Error', 'Please fill the question and all options.');
    }
    setSaving(true);
    try {
      if (editQuestion) {
        await api.patch(`/exams/questions/${editQuestion.id}`, form);
      } else {
        await api.post(`/exams/${exam.id}/questions`, form);
      }
      setEditorVisible(false);
      loadQuestions();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Manage Questions</Text>
          <Text style={styles.headerSubtitle}>{exam.title}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.addButton} onPress={() => openEditor()}>
          <Text style={styles.addButtonText}>+ Add Question</Text>
        </TouchableOpacity>
        
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.subText, marginTop: 10 }}>Loading...</Text></View>
        ) : error ? (
          <View style={styles.center}><Text style={{ color: colors.danger }}>{error}</Text></View>
        ) : questions.length === 0 ? (
          <View style={styles.center}><Text style={{ color: colors.subText }}>No questions yet.</Text></View>
        ) : (
          questions.map((q, idx) => (
            <TouchableOpacity key={q.id || idx} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => openEditor(q)}>
              <Text style={[styles.questionText, { color: colors.text }]}>{idx + 1}. {q.text}</Text>
              {q.options.map((opt: string, optIdx: number) => (
                <View key={optIdx} style={[styles.optionRow, q.correctOptionIndex === optIdx && { backgroundColor: colors.success + '22', borderRadius: 8, paddingHorizontal: 8 }]}>
                  <Text style={[styles.optionText, { color: q.correctOptionIndex === optIdx ? colors.success : colors.subText }]}>
                    {String.fromCharCode(65 + optIdx)}. {opt}
                  </Text>
                  {q.correctOptionIndex === optIdx && <Ionicons name="checkmark-circle" size={16} color={colors.success} />}
                </View>
              ))}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={editorVisible} animationType="slide" transparent onRequestClose={() => setEditorVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{editQuestion ? 'Edit Question' : 'Add Question'}</Text>
              <TouchableOpacity onPress={() => setEditorVisible(false)}><Ionicons name="close" size={24} color={colors.subText} /></TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={[styles.inputLabel, { color: colors.subText }]}>Question Text</Text>
              <TextInput value={form.text} onChangeText={t => setForm({...form, text: t})} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} placeholder="What is 2+2?" placeholderTextColor={colors.subText} multiline />
              
              <Text style={[styles.inputLabel, { color: colors.subText, marginTop: 10 }]}>Options (Select Correct)</Text>
              {form.options.map((opt, idx) => (
                <View key={idx} style={styles.optionInputRow}>
                  <TouchableOpacity style={styles.radioBtn} onPress={() => setForm({...form, correctOptionIndex: idx})}>
                    <Ionicons name={form.correctOptionIndex === idx ? "radio-button-on" : "radio-button-off"} size={24} color={form.correctOptionIndex === idx ? colors.success : colors.subText} />
                  </TouchableOpacity>
                  <TextInput value={opt} onChangeText={t => updateOption(t, idx)} style={[styles.input, { flex: 1, marginBottom: 0, color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} placeholder={`Option ${String.fromCharCode(65 + idx)}`} placeholderTextColor={colors.subText} />
                </View>
              ))}

              <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={saveQuestion} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Question</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  backButton: { padding: 4 },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: c.text },
  headerSubtitle: { fontSize: 12, color: c.subText, marginTop: 2 },
  content: { padding: 16, paddingBottom: 40 },
  center: { padding: 40, alignItems: 'center' },
  addButton: { paddingVertical: 14, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center', marginBottom: 16 },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  questionText: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  optionText: { fontSize: 14, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
  optionInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  radioBtn: { padding: 4 },
  saveButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 20 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' }
});

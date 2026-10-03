import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';
import { api } from '../../../core/networking/api';

export default function ExamTakingScreen({ route, navigation }: any) {
  const { exam } = route.params;
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [answers, setAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    const startAttempt = async () => {
      try {
        const attemptRes = await api.post(`/exams/${exam.id}/attempts`);
        setAttemptId(attemptRes.data.id);
        const qRes = await api.get(`/exams/${exam.id}/questions`);
        setQuestions(qRes.data);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Could not start exam attempt.');
      } finally {
        setLoading(false);
      }
    };
    startAttempt();
  }, [exam.id]);

  const selectOption = async (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    try {
      await api.patch(`/exams/attempts/${attemptId}/answers`, { questionId, selectedOptionIndex: optionIndex });
    } catch (err: any) {
      console.error('Failed to save answer', err);
    }
  };

  const submitExam = async () => {
    Alert.alert('Submit Exam', 'Are you sure you want to finish?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', style: 'destructive', onPress: async () => {
        setSubmitting(true);
        try {
          await api.post(`/exams/attempts/${attemptId}/finish`);
          Alert.alert('Success', 'Exam submitted successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (err: any) {
          Alert.alert('Error', err.response?.data?.message || 'Failed to submit exam.');
          setSubmitting(false);
        }
      }}
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          Alert.alert('Exit', 'Are you sure you want to exit? Your progress is saved.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', onPress: () => navigation.goBack() }
          ]);
        }}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>{exam.title}</Text>
          <Text style={styles.headerSubtitle}>Taking Exam</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.subText, marginTop: 10 }}>Preparing your exam...</Text></View>
        ) : error ? (
          <View style={styles.center}><Text style={{ color: colors.danger }}>{error}</Text></View>
        ) : questions.length === 0 ? (
          <View style={styles.center}><Text style={{ color: colors.subText }}>No questions available for this exam.</Text></View>
        ) : (
          <>
            {questions.map((q, idx) => (
              <View key={q.id || idx} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.questionText, { color: colors.text }]}>{idx + 1}. {q.text}</Text>
                {q.options.map((opt: string, optIdx: number) => {
                  const isSelected = answers[q.id] === optIdx;
                  return (
                    <TouchableOpacity 
                      key={optIdx} 
                      style={[
                        styles.optionButton, 
                        { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.primary + '18' : colors.background }
                      ]} 
                      onPress={() => selectOption(q.id, optIdx)}
                    >
                      <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.border }]}>
                        {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                      </View>
                      <Text style={[styles.optionText, { color: isSelected ? colors.primary : colors.text }]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            
            <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={submitExam} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Exam</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
  content: { padding: 16, paddingBottom: 60 },
  center: { padding: 40, alignItems: 'center' },
  card: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  questionText: { fontSize: 16, fontWeight: '800', marginBottom: 16, lineHeight: 22 },
  optionButton: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  optionText: { fontSize: 15, flex: 1 },
  submitButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});

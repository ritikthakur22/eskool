const fs = require('fs');
const file = 'apps/mobile/src/features/exams/screens/ExamsScreen.tsx';
let content = fs.readFileSync(file, 'utf8');
const oldSave = `  const saveExam = async () => {
    if (!form.title || !form.subjectId || !form.sectionId || !form.date) return Alert.alert('Error', 'Fill all fields.');
    setSaving(true);`;
const newSave = `  const saveExam = async () => {
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
    if (!form.title || !finalSubjectId || !form.sectionId || !form.date) return Alert.alert('Error', 'Fill all fields.');
    setSaving(true);`;
content = content.replace(oldSave, newSave);

const oldData = `: { ...form, date: new Date(form.date).toISOString() };`;
const newData = `: { ...form, subjectId: finalSubjectId, date: new Date(form.date).toISOString() };`;
content = content.replace(oldData, newData);

const oldUI = `                    ))}
                  </ScrollView>
                  <Text style={[styles.inputLabel, { color: colors.subText }]}>Section</Text>`;

const newUI = `                    ))}
                  </ScrollView>
                  <TextInput value={customSubjectName} onChangeText={t => { setCustomSubjectName(t); if(t) setForm({...form, subjectId: ''}); }} placeholder="Or type new subject..." placeholderTextColor={colors.subText} style={[styles.input, { marginBottom: 15 }]} />
                  <Text style={[styles.inputLabel, { color: colors.subText }]}>Section</Text>`;
content = content.replace(oldUI, newUI);

fs.writeFileSync(file, content);

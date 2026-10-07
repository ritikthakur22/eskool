const fs = require('fs');
const file = 'apps/mobile/src/features/homework/screens/HomeworkScreen.tsx';
let content = fs.readFileSync(file, 'utf8');
const oldSave = `  const saveHomework = async () => {
    if (!form.title || !form.subjectId || !form.sectionId || !form.dueDate) return Alert.alert('Error', 'Fill required fields.');
    setSaving(true);
    try {`;
const newSave = `  const saveHomework = async () => {
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
    try {`;
content = content.replace(oldSave, newSave);

const oldData = `: { ...form, dueDate: new Date(form.dueDate).toISOString(), attachmentUrl, attachmentType };`;
const newData = `: { ...form, subjectId: finalSubjectId, dueDate: new Date(form.dueDate).toISOString(), attachmentUrl, attachmentType };`;
content = content.replace(oldData, newData);

fs.writeFileSync(file, content);

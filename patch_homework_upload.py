import re

with open('apps/mobile/src/features/homework/screens/HomeworkScreen.tsx', 'r') as f:
    content = f.read()

old_save = """  const saveHomework = async () => {
    if (!form.title || !form.subjectId || !form.sectionId || !form.dueDate) return Alert.alert('Error', 'Fill required fields.');
    setSaving(true);
    try {
      let data: any = { ...form, dueDate: new Date(form.dueDate).toISOString() };
      let headers: any = {};
      
      if (attachment) {
        data = new FormData();
        data.append('title', form.title);
        data.append('description', form.description);
        data.append('subjectId', form.subjectId);
        data.append('sectionId', form.sectionId);
        data.append('dueDate', new Date(form.dueDate).toISOString());
        data.append('attachment', { uri: attachment.uri, name: attachment.name, type: attachment.mimeType || 'application/octet-stream' } as any);
        headers = { 'Content-Type': 'multipart/form-data' };
      } else if (editHomework) {
        data = { title: form.title, description: form.description, dueDate: new Date(form.dueDate).toISOString() };
      }

      if (editHomework) await api.patch(`/homework/${editHomework.id}`, data, { headers });
      else await api.post('/homework', data, { headers });"""

new_save = """  const saveHomework = async () => {
    if (!form.title || !form.subjectId || !form.sectionId || !form.dueDate) return Alert.alert('Error', 'Fill required fields.');
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
        : { ...form, dueDate: new Date(form.dueDate).toISOString(), attachmentUrl, attachmentType };

      if (editHomework) await api.patch(`/homework/${editHomework.id}`, data);
      else await api.post('/homework', data);"""

content = content.replace(old_save, new_save)

with open('apps/mobile/src/features/homework/screens/HomeworkScreen.tsx', 'w') as f:
    f.write(content)

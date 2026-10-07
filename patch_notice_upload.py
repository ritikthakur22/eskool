import re

with open('apps/mobile/src/features/notices/screens/NoticeScreen.tsx', 'r') as f:
    content = f.read()

old_save = """  const saveNotice = async () => {
    if (!form.title.trim() || !form.content.trim()) return Alert.alert('Error', 'Please enter a title and content.');
    setSaving(true);
    try {
      let data: any = form;
      let headers: any = {};
      
      if (attachment) {
        data = new FormData();
        data.append('title', form.title);
        data.append('content', form.content);
        data.append('category', form.category);
        data.append('attachment', { uri: attachment.uri, name: attachment.name, type: attachment.mimeType || 'application/octet-stream' } as any);
        headers = { 'Content-Type': 'multipart/form-data' };
      }

      if (editNotice) {
        await api.patch(`/notices/${editNotice.id}`, data, { headers });
        Alert.alert('Success', 'Notice updated.');
      } else {
        await api.post('/notices', data, { headers });"""

new_save = """  const saveNotice = async () => {
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
        await api.post('/notices', data);"""

content = content.replace(old_save, new_save)

with open('apps/mobile/src/features/notices/screens/NoticeScreen.tsx', 'w') as f:
    f.write(content)

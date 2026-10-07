import re

# Fix ExamsScreen.tsx
with open('apps/mobile/src/features/exams/screens/ExamsScreen.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "const [form, setForm] = useState({ title: '', subjectId: '', sectionId: '', date: '' });",
    "const [form, setForm] = useState({ title: '', subjectId: '', sectionId: '', date: '', type: 'MCQ' });"
)

with open('apps/mobile/src/features/exams/screens/ExamsScreen.tsx', 'w') as f:
    f.write(content)


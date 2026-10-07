with open('apps/backend/prisma/schema.prisma', 'r') as f:
    content = f.read()

# Add to Homework model
old_hw = """  subject     Subject              @relation(fields: [subjectId], references: [id])
  submissions HomeworkSubmission[]"""
new_hw = """  subject     Subject              @relation(fields: [subjectId], references: [id])
  section     Section?             @relation(fields: [sectionId], references: [id])
  attachmentUrl String?
  attachmentType String?
  submissions HomeworkSubmission[]"""
content = content.replace(old_hw, new_hw)

# Add to Section model
old_sec = """  teacherAssignments TeacherAssignment[]
  exams              Exam[]"""
new_sec = """  teacherAssignments TeacherAssignment[]
  exams              Exam[]
  homeworks          Homework[]"""
content = content.replace(old_sec, new_sec)

with open('apps/backend/prisma/schema.prisma', 'w') as f:
    f.write(content)

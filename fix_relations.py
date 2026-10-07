with open('apps/backend/prisma/schema.prisma', 'r') as f:
    content = f.read()

# Add to Exam model
old_exam = """  subject         Subject      @relation(fields: [subjectId], references: [id])
  results         ExamResult[]"""
new_exam = """  subject         Subject      @relation(fields: [subjectId], references: [id])
  section         Section      @relation(fields: [sectionId], references: [id])
  results         ExamResult[]"""
content = content.replace(old_exam, new_exam)

# Add to Section model
old_section = """  enrollments        Enrollment[]
  teacherAssignments TeacherAssignment[]

  @@unique([classId, name])"""
new_section = """  enrollments        Enrollment[]
  teacherAssignments TeacherAssignment[]
  exams              Exam[]

  @@unique([classId, name])"""
content = content.replace(old_section, new_section)

with open('apps/backend/prisma/schema.prisma', 'w') as f:
    f.write(content)

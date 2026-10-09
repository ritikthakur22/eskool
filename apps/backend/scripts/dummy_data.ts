import { PrismaClient, Role, FeeInvoiceStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findFirst();
  if (!school) throw new Error('School not found');

  let year = await prisma.academicYear.findFirst();
  if (!year) throw new Error('Academic year not found');

  // 1. Ensure Class "3" and Section "a" exist.
  let class3 = await prisma.class.findFirst({ where: { name: '3', schoolId: school.id } });
  if (!class3) {
    class3 = await prisma.class.create({ data: { name: '3', schoolId: school.id } });
  }

  let sec3a = await prisma.section.findFirst({ where: { name: 'a', classId: class3.id, schoolId: school.id } });
  if (!sec3a) {
    sec3a = await prisma.section.create({ data: { name: 'a', classId: class3.id, schoolId: school.id } });
  }

  // 1b. Assign dummy teacher to it
  let dummyTeacher = await prisma.user.findFirst({ where: { email: 'teacher1011@eskool.com' } });
  if (!dummyTeacher) {
    const pw = await bcrypt.hash('password123', 10);
    dummyTeacher = await prisma.user.create({
      data: {
        email: 'teacher1011@eskool.com',
        password: pw,
        role: Role.TEACHER,
        schoolId: school.id,
      }
    });
    await prisma.teacherProfile.create({ data: { userId: dummyTeacher.id, firstName: 'Dummy', lastName: 'Teacher' } });
  }

  let subject = await prisma.subject.findFirst({ where: { schoolId: school.id } });
  if (!subject) {
    subject = await prisma.subject.create({ data: { name: 'Dummy Subject', code: 'DUM101', schoolId: school.id } });
  }
  
  let teacherAssignment = await prisma.teacherAssignment.findFirst({ where: { teacherId: dummyTeacher.id, sectionId: sec3a.id } });
  if (!teacherAssignment) {
    await prisma.teacherAssignment.create({ data: { teacherId: dummyTeacher.id, sectionId: sec3a.id, subjectId: subject.id, academicYearId: year.id } });
  }

  // 2. Assign `student1011` (and 2-3 other dummy students) to Class 3, Section a.
  const students = ['student1011', 'student1012', 'student1013'];
  let mainStudent = null;
  for (const s of students) {
    const email = `${s}@eskool.com`;
    let st = await prisma.user.findUnique({ where: { email } });
    if (!st) {
      const pw = await bcrypt.hash('password123', 10);
      st = await prisma.user.create({
        data: {
          email,
          password: pw,
          role: Role.STUDENT,
          schoolId: school.id,
        }
      });
      await prisma.studentProfile.create({ data: { userId: st.id, firstName: s, lastName: 'Test', rollNo: s } });
    }
    
    let enroll = await prisma.enrollment.findFirst({ where: { studentId: st.id, academicYearId: year.id } });
    if (!enroll) {
      await prisma.enrollment.create({ data: { studentId: st.id, sectionId: sec3a.id, academicYearId: year.id } });
    } else {
      await prisma.enrollment.update({ where: { id: enroll.id }, data: { sectionId: sec3a.id } });
    }
    if (s === 'student1011') mainStudent = st;
  }

  if (!mainStudent) throw new Error('Student not created');

  // 3. Add Dummy Fee details for this student
  let fee = await prisma.feeInvoice.findFirst({ where: { studentId: mainStudent.id } });
  if (!fee) {
    await prisma.feeInvoice.create({
      data: {
        schoolId: school.id,
        studentId: mainStudent.id,
        invoiceNumber: `INV-${Date.now()}`,
        title: 'Term 1 Fee',
        amount: 5000.00,
        dueDate: new Date(),
        status: FeeInvoiceStatus.DUE,
      }
    });
  }

  // 4. Add Dummy Class Routine for 3a (Monday to Friday, 3-4 subjects).
  const days = [1, 2, 3, 4, 5]; // Mon to Fri
  for (const d of days) {
    let routine = await prisma.classRoutine.findFirst({ where: { sectionId: sec3a.id, dayOfWeek: d, startTime: '10:00' } });
    if (!routine) {
      await prisma.classRoutine.create({
        data: {
          schoolId: school.id,
          sectionId: sec3a.id,
          subjectId: subject.id,
          teacherId: dummyTeacher.id,
          dayOfWeek: d,
          startTime: '10:00',
          endTime: '11:00',
        }
      });
    }
  }

  // 5. Add Dummy Homework (one "upcoming/pending" and one "submitted/graded")
  let upcomingHw = await prisma.homework.findFirst({ where: { title: 'Upcoming HW', sectionId: sec3a.id } });
  if (!upcomingHw) {
    upcomingHw = await prisma.homework.create({
      data: {
        schoolId: school.id,
        title: 'Upcoming HW',
        description: 'Do the pending homework',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        subjectId: subject.id,
        teacherId: dummyTeacher.id,
        sectionId: sec3a.id,
      }
    });
  }
  let submittedHw = await prisma.homework.findFirst({ where: { title: 'Submitted HW', sectionId: sec3a.id } });
  if (!submittedHw) {
    submittedHw = await prisma.homework.create({
      data: {
        schoolId: school.id,
        title: 'Submitted HW',
        description: 'This is graded',
        dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
        subjectId: subject.id,
        teacherId: dummyTeacher.id,
        sectionId: sec3a.id,
      }
    });
  }

  let submission = await prisma.homeworkSubmission.findFirst({ where: { studentId: mainStudent.id, homeworkId: submittedHw.id } });
  if (!submission) {
    await prisma.homeworkSubmission.create({
      data: {
        schoolId: school.id,
        homeworkId: submittedHw.id,
        studentId: mainStudent.id,
        status: 'GRADED',
        grade: 'A+',
        feedback: 'Good job',
        content: 'Here is my homework',
      }
    });
  }

  // 6. Add Dummy Results for this student (1st Term, 2nd Term, 3rd Terminal).
  const exams = ['1st Term', '2nd Term', '3rd Terminal'];
  for (const exName of exams) {
    let exam = await prisma.exam.findFirst({ where: { title: exName, sectionId: sec3a.id } });
    if (!exam) {
      exam = await prisma.exam.create({
        data: {
          schoolId: school.id,
          title: exName,
          date: new Date(),
          subjectId: subject.id,
          sectionId: sec3a.id,
        }
      });
    }

    let result = await prisma.examResult.findFirst({ where: { examId: exam.id, studentId: mainStudent.id } });
    if (!result) {
      await prisma.examResult.create({
        data: {
          schoolId: school.id,
          examId: exam.id,
          studentId: mainStudent.id,
          marksObtained: 85,
          totalMarks: 100,
          grade: 'A',
        }
      });
    }
  }

  console.log('Dummy data successfully created.');
}

main().catch(console.error).finally(() => prisma.$disconnect());

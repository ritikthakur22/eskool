# eSchooling — Product Requirements Document

## 1. Product
A cross-platform school management and student learning application for schools in Nepal.

Primary client:
- Student mobile app
- School staff/admin web dashboard

Current scope intentionally excludes:
- Parent account/role
- In-app chat UI
- Parent portal

Chat infrastructure may be designed as a future module but must remain hidden from the current product.

## 2. Product Goals
1. Give students one place for academic information.
2. Give teachers/admins a reliable system for attendance, homework, notices, exams and schedules.
3. Make Nepal-specific calendar handling a first-class feature.
4. Provide a clean, fast mobile experience.
5. Keep the architecture ready for future parent accounts and chat.

## 3. User Roles

### Student
- View profile
- View dashboard
- View attendance
- View class routine
- View homework
- Submit homework where enabled
- Join/view online classes
- View notices
- View academic calendar
- View library
- Take online exams
- View results
- Submit academic feedback
- Submit complaints/requests
- Receive notifications
- Manage personal settings

### Teacher
- Teacher dashboard
- View assigned classes/subjects
- Mark and correct attendance
- Create/manage homework
- Review submissions
- Publish class materials
- Create/manage online classes
- View class routine
- Create academic notices
- Conduct/manage exams
- Enter/review marks
- View student academic records
- Receive/respond to student requests where permitted

### School Admin
- Manage students
- Manage teachers/staff
- Manage classes/sections
- Manage subjects
- Manage academic years/terms
- Manage attendance
- Manage routine
- Manage notices
- Manage homework
- Manage exams/results
- Manage library
- Manage calendar/events
- Manage notifications
- Manage school settings
- Audit important system actions

### Super Admin
Optional platform-level role for the product owner.
- Manage schools/tenants
- Platform configuration
- Support and system administration
- No unnecessary access to school data by default

## 4. Main Student Modules

### Dashboard
- Greeting and student identity
- Today's class progress
- Quick actions
- Attendance summary
- Pending homework
- Upcoming exams
- Today's routine
- Latest notices
- Upcoming events
- Notification indicator
- Academic progress snapshot

### Attendance
Views:
- Class-wise
- Subject-wise
- Monthly calendar
- Academic-year summary

Display:
- Present
- Absent
- Late
- Leave/excused where supported
- Percentage
- Total classes
- Attendance trend

Calendar:
- Primary date display in Bikram Sambat (BS)
- Gregorian AD date shown smaller beneath/in secondary text
- Example: `१० असोज २०८३`
  `26 Sep 2026`

### Notices
Categories:
- General
- Academic
- Exam
- Holiday
- Emergency
- Assignment
- Fees/administrative
- Event

Features:
- Search
- Category filter
- Read/unread state
- Priority
- Attachments
- Published/expiry dates

### Homework
- Assigned
- Pending
- Submitted
- Reviewed
- Overdue
- Subject filter
- Due date
- Attachments
- Submission upload
- Teacher feedback

### Online Classes
- Upcoming
- Live
- Recorded
- Class details
- Teacher
- Start time
- Join action
- Recording where available

### Class Routine
- Daily view
- Weekly view
- Subject
- Teacher
- Room
- Start/end time
- Special/changed class indicator

### Library
- Search books
- Categories
- Availability
- Issued books
- Due date
- Return status
- Book details

### Exams
- Upcoming exams
- Online exams
- Past exams
- Exam instructions
- Timer
- Question navigation
- Submit confirmation
- Result availability

### Results
- Term-wise
- Subject-wise
- Marks
- Grade
- GPA where applicable
- Remarks
- Academic-year history

### Calendar
Primary:
- BS calendar

Secondary:
- AD date in smaller text

Events:
- School holidays
- Exams
- Assignments
- Classes
- Events
- Results
- Important deadlines

### Complaints / Requests
- Submit issue
- Category
- Description
- Attachment
- Status
- Response/history

### Notifications
- Push notifications
- Notice alerts
- Homework deadlines
- Exam reminders
- Routine changes
- Result publication
- Administrative announcements

### Profile
- Student information
- Class/section
- Academic year
- Profile photo
- School information
- Settings

### Settings
- Change password
- Biometric unlock
- Notification preferences
- Dark mode
- Language readiness
- Privacy
- Terms
- Feedback
- App version
- Logout

## 5. MVP

### Must Have
- Authentication
- Student dashboard
- Attendance
- Notices
- Homework
- Class routine
- Calendar with BS + AD
- Exams/results
- Notifications
- Profile/settings
- Admin/teacher management interface

### Phase 2
- Library
- Online classes
- Complaints
- Rich analytics
- Advanced teacher workflows

### Future
- Parent role
- Chat
- In-app messaging
- Parent/student linked accounts
- Advanced payment/fee module (In-app gateways like eSewa deferred to future due to cost. For MVP/now: show QR and bank details, user uploads screenshot, admin verifies and confirms).

## 6. Non-functional Requirements
- Fast startup
- Responsive UI
- Offline-friendly cached read data
- Secure authentication
- Role-based authorization
- Auditability
- Accessible typography
- Consistent loading/error/empty states
- API versioning
- Automated testing
- CI/CD ready

## 7. Success Criteria
The student should be able to open the app and answer:
- What classes do I have today?
- Am I attending regularly?
- What homework is pending?
- What notices are new?
- When is my next exam?
- What are my results?
- What school events are coming?

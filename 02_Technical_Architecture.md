# eSchooling — Technical Architecture

## 1. Recommended Architecture

Use a modular client/server architecture.

```text
                    ┌──────────────────────┐
                    │   Student Mobile App │
                    │    Cross-platform    │
                    └──────────┬───────────┘
                               │ HTTPS
                               ▼
                    ┌──────────────────────┐
                    │      API Layer       │
                    │ REST / typed API     │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       Authentication     Core Services     Notification
       & Authorization    & Business Logic   Service
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │     PostgreSQL       │
                    │     Main Database    │
                    └──────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
           Object          Cache/Queue       Push
          Storage          (optional)      Notifications
```

## 2. Cross-platform choice

Recommended:
- React Native / Expo for the student mobile application
- Web admin dashboard using React/Next.js
- Backend using NestJS (Node.js + TypeScript)
- PostgreSQL as primary database
- REST API initially

Reason:
- React Native / Expo provides a single mobile codebase for Android and iOS, sharing the JavaScript/TypeScript ecosystem with the web admin dashboard.
- Admin operations are better suited to a browser dashboard.
- NestJS with TypeScript provides strong typing and an enterprise-ready architecture across backend tooling.
- PostgreSQL fits relational school data very well.

Do not force the student mobile UI and admin dashboard into the same UI framework merely for code reuse, but rather optimize for user experience.

## 3. Backend modules

```text
auth
users
schools
students
teachers
classes
subjects
attendance
homework
online-classes
routine
notices
exams
results
library
calendar
notifications
complaints
files
audit
settings
```

Keep modules isolated so future features such as parents and chat can be added without rewriting the core.

## 4. Database Core Entities

### School
- id
- name
- address
- logo
- contact
- timezone
- default academic year
- settings

### User
- id
- school_id
- role
- name
- email/phone
- password_hash
- avatar
- status
- created_at
- updated_at

### Student
- id
- user_id
- admission_number
- class_id
- section_id
- roll_number
- academic_year_id

### Teacher
- id
- user_id
- employee_id
- department

### Class
- id
- school_id
- name
- grade
- section

### Subject
- id
- school_id
- name
- code

### Attendance
- id
- student_id
- subject_id
- date
- status
- marked_by
- remarks

### Homework
- id
- class_id
- subject_id
- teacher_id
- title
- description
- due_at
- attachments
- status

### HomeworkSubmission
- id
- homework_id
- student_id
- submitted_at
- files
- remarks
- teacher_feedback
- score

### Notice
- id
- school_id
- title
- body
- category
- priority
- published_at
- expires_at
- attachments

### Exam
- id
- academic_year_id
- name
- start_at
- end_at
- type
- instructions

### Result
- id
- student_id
- exam_id
- subject_id
- marks
- grade
- remarks

### CalendarEvent
- id
- school_id
- title
- type
- bs_date
- ad_date
- start_at
- end_at
- description

## 5. API Structure

Example:

```text
/api/v1/auth/*
/api/v1/me
/api/v1/students/*
/api/v1/attendance/*
/api/v1/homework/*
/api/v1/notices/*
/api/v1/routine/*
/api/v1/exams/*
/api/v1/results/*
/api/v1/calendar/*
/api/v1/library/*
/api/v1/notifications/*
```

Use pagination for lists.

Use consistent response format:

```json
{
  "success": true,
  "data": {},
  "message": null,
  "meta": {}
}
```

Errors:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource."
  }
}
```

## 6. File Storage
Do not store uploaded PDFs/images/videos directly inside PostgreSQL.

Store:
- Object storage
- File metadata in PostgreSQL
- Signed URLs for private files

## 7. Caching
Initially keep caching simple.

Useful cache candidates:
- School configuration
- Class routine
- Public/current notices
- Calendar
- Subject lists

Do not cache sensitive student records without a clear invalidation strategy.

## 8. Offline strategy
The student app should cache read-only/non-sensitive data:
- Recent notices
- Routine
- Calendar
- Basic profile
- Recent attendance summary

Mutating operations require connectivity unless an explicit offline queue is implemented later.

## 9. Background jobs
Use background jobs for:
- Push notification delivery
- Deadline reminders
- Bulk notice notifications
- Result publication notifications
- File processing

## 10. Deployment

Recommended environments:
- development
- staging
- production

Use:
- Git
- CI/CD
- Environment variables/secrets
- Automated database migrations
- Automated tests
- Error monitoring
- Backups

Antigravity CLI can be used as the primary development/orchestration environment, but production architecture should remain tool-independent.

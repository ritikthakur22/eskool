# eSchooling — Antigravity CLI Implementation Plan

## 1. Development Strategy

Build vertically instead of implementing every database table first.

Each milestone should produce a working feature end-to-end:

```text
Database
→ Backend API
→ Authentication/authorization
→ Mobile UI
→ Testing
→ Documentation
```

## 2. Phase 0 — Foundation
Create:
- Repository
- Mobile application
- Backend
- Admin web application
- Shared API specification
- Environment configuration
- CI pipeline
- Database migrations
- Design system

Do not implement chat.

## 3. Phase 1 — Identity
Implement:
- School
- User
- Student
- Teacher
- Admin
- Authentication
- Role/permission system
- Profile

Acceptance:
A student can securely log in and only access their own school-scoped data.

## 4. Phase 2 — Dashboard
Implement:
- Home
- Today's schedule
- Notices preview
- Homework preview
- Attendance summary
- Upcoming exams
- Notifications

## 5. Phase 3 — Attendance
Implement:
- Attendance API
- Student attendance calendar
- Subject-wise attendance
- Class-wise attendance
- Monthly statistics
- Teacher attendance marking
- Admin correction workflow

## 6. Phase 4 — Academic Workflow
Implement:
- Homework
- Submission
- Teacher feedback
- Class routine
- Notices
- Calendar

## 7. Phase 5 — Exams
Implement:
- Exam schedule
- Online exam
- Question management
- Attempt
- Submission
- Results
- Grade/marks display

## 8. Phase 6 — Supporting Modules
Implement:
- Library
- Complaints
- Notifications
- Reports

## 9. Phase 7 — Hardening
Implement:
- Security testing
- Authorization tests
- Tenant isolation tests
- Performance optimization
- Error monitoring
- Backup/restore verification
- App-store production preparation

## 10. Future Modules
Keep interfaces ready for:
- Parent accounts
- Chat
- Fees/payments
- Transport
- Certificates
- Advanced analytics

Do not build these into the MVP merely because the architecture can support them.

## 11. Antigravity Rules

Use the coding agent to generate implementation, but keep these project rules:

1. Read existing architecture before changing code.
2. Do not duplicate business logic.
3. Never bypass backend authorization.
4. Never hard-code school/student data.
5. Never commit secrets.
6. Add tests for every critical permission rule.
7. Update API documentation with endpoint changes.
8. Use migrations for database changes.
9. Keep modules isolated.
10. Keep Chat hidden until explicitly enabled.

## 12. Definition of Done

A feature is complete only when:
- UI exists
- API exists
- Database model exists where required
- Authorization is implemented
- Loading/empty/error states exist
- Tests exist
- API documentation is updated
- Audit requirements are handled
- Mobile behavior is tested
- No secrets are committed

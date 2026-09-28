# eSchooling — Frontend & Backend Specification

## 1. Frontend

### Mobile
Recommended:
- React Native / Expo
- TypeScript
- Material 3 with a custom design system

Architecture:
```text
Presentation
    ↓
State Management
    ↓
Repository
    ↓
API / Local Cache
```

Suggested organization:

```text
lib/
  core/
    networking/
    storage/
    routing/
    theme/
    localization/
    errors/
  features/
    auth/
    home/
    attendance/
    notices/
    homework/
    routine/
    online_classes/
    exams/
    results/
    library/
    calendar/
    complaints/
    notifications/
    profile/
  shared/
    widgets/
    models/
```

## 2. UI Design System

Visual direction:
- Clean educational interface
- White/light surfaces
- Blue as primary accent
- Secondary colors for status
- Rounded cards
- Clear hierarchy
- Large touch targets
- Minimal visual noise
- Optional dark mode

Do not copy the reference application's exact layouts, icons or branding.

## 3. Navigation

Bottom navigation:
1. Home
2. Attendance
3. Notices
4. Profile

Additional modules appear from Home/More.

Do not show Chat in the current release.

A hidden/internal feature flag can reserve the module for future development.

## 4. Home Screen
Sections:
- Header
- Today's classes
- Quick actions
- Attendance summary
- Pending homework
- Upcoming exams
- Latest notices
- Upcoming events
- Academic progress

The dashboard should prioritize actionable information instead of displaying every feature at once.

## 5. Calendar / Date System

Use BS as the primary school calendar.

Display pattern:

```text
१० असोज २०८३
26 Sep 2026
```

For calendar cells:
- Main: BS day
- Small: AD day

Store dates safely in a canonical server representation while generating BS/AD display values at the presentation layer.

Do not treat BS as a string-only date system.

Use a tested BS↔AD conversion library/service and cover leap-year/month-boundary cases with automated tests.

## 6. State Handling

Every async screen should define:
- Loading
- Loaded
- Empty
- Error
- Retry

Example:

```text
Loading → Skeleton
Empty → Helpful empty state
Error → Message + Retry
Success → Data
```

## 7. Backend

Recommended:
- NestJS (Node.js framework)
- TypeScript
- REST API
- PostgreSQL
- Prisma or another mature ORM
- Redis only when actually required
- Object storage for files

Backend layers:

```text
Route
  ↓
Controller
  ↓
Validation
  ↓
Service
  ↓
Repository
  ↓
Database
```

Do not put business logic directly inside route handlers.

## 8. Validation
Validate all incoming data on the server.

Examples:
- Student IDs
- Dates
- Marks
- Exam duration
- File sizes
- Notice categories
- Homework submissions

Frontend validation improves UX; backend validation provides security.

## 9. API Contract

Use OpenAPI/Swagger as the API contract.

Every endpoint should document:
- Method
- Path
- Authentication
- Permission
- Request schema
- Response schema
- Error codes
- Pagination
- Example

## 10. Testing

### Mobile
- Unit tests
- Widget/component tests
- Navigation tests
- Repository tests
- Critical integration tests

### Backend
- Unit tests
- Service tests
- API integration tests
- Authorization tests
- Tenant isolation tests

### End-to-end
Test critical flows:
1. Login
2. Open dashboard
3. View attendance
4. Read notice
5. Submit homework
6. View exam
7. View result
8. Logout

## 11. Performance
Target:
- Fast initial dashboard
- Paginated lists
- Image compression
- Lazy loading
- Cached static assets
- Minimal API payloads

Do not load all notices, attendance history and homework records on application startup.

## 12. Error Handling
Use human-readable messages while keeping technical details out of production UI.

Example:
`Unable to load attendance. Check your connection and try again.`

Log technical details securely on the server.

## 13. Admin Web Application

A school management web dashboard is strongly recommended.

Admin/teacher web features:
- Dashboard
- Student management
- Teacher management
- Classes/sections
- Subjects
- Attendance
- Homework
- Notices
- Exams
- Results
- Routine
- Calendar
- Library
- Notifications
- Reports
- Audit logs
- Settings

This is different from a public marketing website.

## 14. Public Website

A public website is NOT required for the core MVP.

If created later, keep it separate:
- Home
- About school
- Features
- Contact
- Download app
- Privacy policy
- Terms
- School-specific information

The admin web portal is operationally important; the public marketing site is optional.

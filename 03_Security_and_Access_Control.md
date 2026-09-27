# eSchooling — Security & Access Control Specification

## 1. Security Principles
- Least privilege
- Deny by default
- Server-side authorization
- Secure password storage
- Encrypted transport
- Audit important actions
- Minimize collected personal data
- Never trust client-side role checks

## 2. Authentication
Support:
- Student ID/email/phone + password
- Optional biometric unlock on device
- Password reset
- Session/token expiration
- Logout from current device
- Optional multi-device session management

Biometric authentication should unlock a locally stored credential/token. It should not transmit biometric data to the server.

## 3. Authorization

Every protected API request must validate:

```text
authenticated user
        ↓
school/tenant membership
        ↓
role
        ↓
resource ownership/scope
        ↓
permission
```

Example:
A student can read their own attendance but cannot request another student's attendance by changing an ID in the API URL.

## 4. Permission Model

### Student
READ:
- own profile
- own attendance
- own homework
- own results
- assigned notices
- own routine
- school calendar

WRITE:
- homework submission
- complaints
- feedback
- profile fields explicitly allowed by school

### Teacher
READ:
- assigned students/classes
- assigned subjects
- relevant academic records

WRITE:
- attendance for assigned classes
- homework
- class materials
- marks/results according to permission
- notices where authorized

### Admin
Broad school-level management.

### Super Admin
Platform-level access only where necessary.

## 5. Multi-tenancy
Every school-owned record must contain a school/tenant scope directly or indirectly.

The backend must prevent:

```text
School A user → School B data
```

Never rely on a mobile app's school_id parameter for isolation.

The server derives school scope from authenticated identity.

## 6. Password Security
- Never store plaintext passwords.
- Use a modern password hashing algorithm such as Argon2id or bcrypt with an appropriate cost.
- Rate-limit authentication attempts.
- Avoid revealing whether an account exists during password recovery.

## 7. Tokens/Sessions
- Short-lived access tokens
- Secure refresh mechanism
- Revoke refresh tokens on logout/password reset where appropriate
- Secure storage on mobile
- Never place authentication tokens in URLs

## 8. API Security
- HTTPS only
- Input validation
- Output validation
- Rate limiting
- Request size limits
- File type/size validation
- SQL injection protection through parameterized queries/ORM
- CORS restrictions for web clients
- Security headers
- Audit logs

## 9. File Upload Security
For homework, profile photos, notices and documents:
- Validate MIME type
- Validate extension
- Limit size
- Rename uploaded files
- Store outside executable application directories
- Virus/malware scanning where appropriate
- Use private object storage for sensitive documents
- Serve via short-lived signed URLs

## 10. Sensitive Data
Potentially sensitive:
- Student identity information
- Attendance
- Results
- Teacher records
- Uploaded documents
- Complaints

Only collect what the school actually needs.

## 11. Audit Log
Record important events:
- Login/logout
- Password changes
- Attendance modifications
- Result changes
- Notice publication/deletion
- Student record changes
- Permission changes
- Administrative actions

Audit records should be append-oriented and restricted from normal users.

## 12. Notifications
Push notifications must not expose sensitive information in notification previews.

Prefer:
`New result published. Open eSchooling to view.`

Instead of:
`Ritik scored 87 in Mathematics.`

## 13. Security Headers
For web:
- Content-Security-Policy
- Strict-Transport-Security
- X-Content-Type-Options
- Referrer-Policy
- Frame protection where appropriate

## 14. Backups
- Automated database backups
- Encrypted backups
- Tested restore procedure
- Retention policy
- Separate backup credentials

## 15. Security Testing
Before production:
- Dependency scanning
- API authorization tests
- Authentication tests
- File upload tests
- Rate-limit tests
- SQL injection tests
- XSS tests
- IDOR/BOLA tests
- Tenant-isolation tests

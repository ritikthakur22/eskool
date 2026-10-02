# eSkool Re-audit and Role/Permission Matrix

**Repository:** `ritikthakur22/eskool`  
**Reviewed commit:** `94cf1126ab36212aafc3b43bc514e24f1468fcc9`  
**Review date:** 2 October 2026 (Asia/Kathmandu)  
**Compared with:** previous audit of commit `fd2e289d6793261c90eebcfd4d2c5269a5732da0`  
**Runtime checked:** `https://eskool-api.onrender.com`

## Verdict

### **NO — all requested fixes are not done. Current status remains NO-GO for production.**

There are meaningful backend improvements in the repository, especially access-token lifetime, refresh-session storage, selected role checks, tenant filters, CORS/header configuration, and Cloudinary integration. However:

1. **The updated backend does not compile.**
2. **The deployed API is still the old vulnerable version.** Cross-student attendance and result requests still return HTTP 200.
3. **The active mobile application is currently incomplete/unusable.** Login is empty/missing, private routes are empty, and the route guard is entirely commented out.
4. **Working admin/super-admin/student passwords remain public and still authenticate against the deployed API.**
5. **The core multi-tenant academic schema was not redesigned.** Parent-child, class enrollment, teacher assignment, and tenant-owned academic records remain missing.
6. **Role controls are too broad.** Parents can read any same-school student's attendance/results, teachers can control any same-school student, and admins can create other admins.

---

# Verification results

| Check | Result |
|---|---|
| Fresh backend `npm ci` | **FAIL** — package-lock is out of sync (`typescript@5.9.3` missing) |
| Backend build after `npm install` | **FAIL** — `BadRequestException` is used but not imported in `auth.controller.ts:54` |
| Backend unit tests | 15 pass, but they remain mostly “is defined” tests |
| Backend e2e | **FAIL** — requires a real `DATABASE_URL`; no isolated test database setup |
| Backend lint | Passes with 6 warnings |
| Backend dependency install audit | 5 total findings during full install; production-only audit reported 0 after lock repair |
| Mobile `npm ci` | Pass |
| Mobile TypeScript | Pass, largely because several route files are empty/comment-only |
| Expo Doctor | **20/21** — four Expo patch versions mismatched |
| Mobile lint/format | **FAIL** — 9 ESLint warnings and 31 files fail Prettier check |
| Mobile production dependency audit | **21 findings: 5 high, 16 moderate** |
| Live API hardening headers | **Not deployed** — wildcard CORS, `x-powered-by: Express`, no observed no-store/nosniff |
| Live cross-student attendance test | **FAIL** — student A received HTTP 200 for student B |
| Live cross-student result test | **FAIL** — student A received HTTP 200 for student B |
| Public demo credentials | **Still present and still working** |

---

# Previous finding remediation status

Legend: **Fixed**, **Partial**, **Not fixed**, **Regressed**, **Not deployed**.

| Previous finding | Repository status | Runtime status | Notes |
|---|---|---|---|
| C-01 Broken authorization | **Partial** | **Not deployed / still vulnerable** | Student self-checks and staff roles were added, but parent and staff scopes remain overbroad. |
| C-02 Missing tenant model | **Not fixed** | **Not fixed** | Academic entities still lack direct `schoolId`; class/subject/enrollment/assignment models are absent. |
| C-03 Public privileged credentials | **Not fixed** | **Still exploitable** | README still publishes all passwords; verified logins still succeed. |
| H-01 Client-controlled school in user creation | **Partial** | **Not deployed** | Non-super-admin school is now server-derived, but role hierarchy remains unsafe/incomplete. |
| H-02 Unrevokable refresh JWT | **Partial improvement** | **Not deployed** | Opaque hashed rotating sessions added. Password change still does not revoke sessions; no session management UI/family reuse response. |
| H-03 No rate limiting | **Partial** | **Not deployed** | In-memory auth-only limiter added. It is per-process, not proxy-aware/distributed, and uploads/writes are unthrottled. |
| H-04 Trusting upload MIME | **Not fixed** | **Not fixed** | Still trusts multipart MIME; no magic-byte verification, decode/re-encode, malware scan, dimension/page limits. |
| H-05 Database blob storage | **Partial** | Unknown/old runtime | Cloudinary optional path added, but database fallback remains; routine is still returned as base64. Sensitive Cloudinary asset privacy is not established. |
| H-06 Mobile vulnerabilities | **Not fixed** | N/A | Now 5 high + 16 moderate production findings. |
| H-07 No global validation | **Partial** | **Not deployed** | Global pipe and three auth DTOs added, but most controllers still use `any` or Prisma unchecked inputs. Build currently fails in auth controller. |
| H-08 Security test coverage | **Not fixed** | N/A | No meaningful role/tenant matrix tests; e2e fails. |
| M-01 CORS/security headers | **Fixed in source** | **Not deployed** | Source allowlists CORS and adds basic headers; live API still reports old behavior. |
| M-02 No-store policy | **Fixed in source** | **Not deployed** | Global no-store headers added. |
| M-03 Email change verification | **Not fixed** | Old runtime | Email can still be changed without verified challenge/recent-auth notification. |
| M-04 Google relink recent auth | **Not fixed** | Old runtime | Link/unlink still requires only an access token. |
| M-05 Stale user claims | **Partial improvement** | **Not deployed** | JWT strategy reloads user role/school each request; no account status/session version exists. |
| M-06 Missing integrity constraints | **Not fixed** | **Not fixed** | Duplicate attendance/submission/result DB constraints remain absent. |
| M-07 Timezone/date handling | **Not fixed** | **Not fixed** | No school timezone and server-local month calculations remain. |
| M-08 Pagination | **Not fixed** | **Not fixed** | Most list APIs remain unbounded. |
| M-09 CI/release workflow | **Not fixed** | N/A | Uses `npm install`, omits e2e/security, debug APK path still depends on uncommitted `android/`, Actions not SHA-pinned. |
| M-10 Expo configuration | **Partial improvement** | N/A | Asset/config problems improved; four SDK patch mismatches remain. |
| M-11 Auth navigation/session gating | **Regressed critically** | N/A | Active mobile login/private app is empty; guard is comments only; onboarding always opens. |
| M-12 Privacy/legal | **Not fixed / removed from active app** | N/A | Current active mobile has no adequate Terms/Privacy experience. |
| M-13 Operations/audit/backups | **Not fixed** | Unknown | No audit entity, structured observability, backup/restore proof, alerts, SLOs, or runbooks. |

---

# New and remaining release blockers

## RB-01 — Backend source does not compile

`apps/backend/src/auth/auth.controller.ts:54` throws `BadRequestException`, but that symbol is not imported. `npm run build` fails with TS2304.

**Fix:** Import it, preferably replace the `any` body with `GoogleLoginDto`, and make build a required CI check using a clean install.

## RB-02 — Clean backend install still fails

The committed backend lock file is not synchronized with `package.json`. `npm ci` fails. The invalid postinstall command `prisma skills sync || exit 0` also remains and silently ignores failure.

**Fix:** Run the intended Node 22 version, replace postinstall with `prisma generate`, regenerate/commit the lock file, and switch CI to `npm ci`.

## RB-03 — The new backend has not been deployed

Observed live behavior matches the prior version:

- `Access-Control-Allow-Origin: *`
- `x-powered-by: Express`
- no observed global `Cache-Control: no-store` or `X-Content-Type-Options`
- old JWT behavior/response shape
- cross-student attendance and results return HTTP 200

**Fix:** Do not deploy until the source compiles and tests pass. Then apply Prisma migrations, deploy to staging, run the full role matrix, and promote to production only after verification.

## RB-04 — Active mobile app is effectively a skeleton

Under `apps/mobile/src/app`:

- `/(auth)/index.tsx` is empty.
- Attendance, calendar, dashboard, fees, and settings routes are empty/comment-only.
- `/(private)/_layout.tsx` contains only commented example code; there is no active authentication guard.
- `/login` is referenced by onboarding but no matching functional route exists.
- Auth API/hook/type files are placeholders.
- The endpoint constant literally contains `"/original api route"`.
- `index.tsx` always redirects to onboarding; completion is not persisted.

The former UI is stored under `apps/mobile_old`, which is not the active Expo Router app.

**Impact:** The polished UI shown in older screenshots is not the app currently built from `apps/mobile`. UI role visibility cannot be considered implemented.

## RB-05 — Public credentials remain live

README lines 176–195 still contain real working credentials, including super-admin and admins. Calling them “disposable” does not make this safe while they authenticate to a public writable API.

**Fix now:** Remove and rotate/delete all listed accounts, revoke sessions, purge if required, and use a resettable isolated sandbox with no privileged external access.

## RB-06 — Global validation gives false confidence

The global `ValidationPipe` only meaningfully validates handlers with DTO classes. Most handlers still use `any` or `Prisma.*UncheckedCreateInput`; these are TypeScript types, not runtime validation metadata.

**Fix:** Create DTOs for every endpoint with UUID, enum, max length, range, date, and nested rules. Use `transform: true`, explicit parameter pipes, and response DTOs.

## RB-07 — Cloudinary does not yet prove private file storage

Cloudinary upload is optional and falls back to PostgreSQL. Uploads use returned `secure_url`; no authenticated/private delivery type, signed URL expiry, malware scan, or deletion lifecycle is demonstrated. Payment proofs can contain financial/personal data.

**Fix:** Make private object storage mandatory in production, verify content signatures, scan files, use authenticated short-lived delivery, stream rather than base64, and implement deletion/retention.

---

# Who sees what and controls what

## Important distinction

The matrix below describes the **latest repository's backend intent**, not the live deployment. The live deployment still exposes the old authorization flaw. The active mobile UI does not implement these role views.

Legend: **View**, **Control**, **No**, **Unsafe/broader than intended**.

| Capability | Student | Parent | Teacher | Admin | Super Admin |
|---|---|---|---|---|---|
| Own profile | View/edit | View/edit | View/edit | View/edit | View/edit |
| Change own password/photo | Control | Control | Control | Control | Control |
| Link/unlink Google | Control | Control | Control | Control | Control |
| School notices | View own school | View own school | View + create | View + create | View + create, but only own JWT school |
| School routine | View | View | View + upload | View + upload | View + upload, own JWT school |
| Attendance: own | View | N/A | View any same-school student | View any same-school student | View any student in own JWT school |
| Attendance: another student | No | **Unsafe: any same-school student** | **Any same-school student** | **Any same-school student** | **Any student in own JWT school** |
| Mark attendance | No | No | **Any same-school student; no class assignment check** | Any same-school student | Any student in own JWT school |
| Results: own | View | N/A | View any same-school student | View any same-school student | View any student in own JWT school |
| Results: child/other | No | **Unsafe: any same-school student, not linked child** | **Any same-school student** | Any same-school student | Any student in own JWT school |
| Create exams | No | No | Yes; **exam has no tenant/assignment link** | Yes | Yes |
| Add results | No | No | Same-school student, but **arbitrary exam ID** | Same | Same |
| Read homework by class | **Any class ID whose author is in same school; no enrollment check** | Same broad access | Same-school | Same-school | Own JWT school |
| Create homework | No | No | Yes, actor becomes teacher | Yes, admin user is stored as `teacherId` | Same |
| Submit homework | Own identity only; one submission checked in service | No | No | No | No |
| Grade homework | No | No | **Any submission in school, not only assigned/owned class** | Any school submission | Own JWT school |
| Own fee invoices | View own | Returns parent's own/nonexistent invoices; cannot view child | Returns own/nonexistent | Returns own/nonexistent | Returns own/nonexistent |
| Submit payment proof | Student only, own invoice | No | No | No | No |
| Manage invoices/proofs | **No endpoint exists** | No | No | **No endpoint exists** | **No endpoint exists** |
| Create student | No | No | Yes, own school | Yes, own school | Existing selected school |
| Create parent | No | No | Yes, but no parent profile/child relation | Yes | Existing selected school |
| Create teacher | No | No | No | Yes | Existing selected school |
| Create admin | No | No | No | **Yes — privilege delegation risk** | Existing selected school |
| Create super-admin | No | No | No | No | Yes if target school exists |
| Create/manage school | No | No | No | No | **No API exists** |
| Platform-wide reporting/control | No | No | No | No | **Not implemented** |

## Role-specific explanation

### Student

Expected and mostly enforced in new source:

- Can read/edit own profile and identity links.
- Can read school notices and routine.
- Can view only own attendance/results.
- Can submit homework as self and fee proof for own invoice.

Still too broad:

- Can request homework for any class in the school if the class ID is known; no enrollment/section check.
- No database uniqueness guarantees the one-submission service check under concurrency.

### Parent

**Parent functionality is not correctly implemented.** There is no `ParentProfile` or `ParentStudent` relationship.

Current source allows a parent to:

- Read any same-school student's attendance and results because service checks restrict only `Role.STUDENT`.
- Read any same-school class homework.
- Not view a child's fees through `/fees/me`.

This is a high-severity privacy defect. Parent access must be limited to explicitly linked children.

### Teacher

Current source permits a teacher to:

- Mark attendance for any student in the school.
- Read any student's attendance/results in the school.
- Create homework/notices/exams and upload routine documents.
- Grade any homework submission in the school.
- Create student and parent accounts.

Missing restrictions:

- No teacher-class/subject assignment model.
- No check that attendance/homework/exam/result belongs to an assigned class/subject.
- No check that a graded submission belongs to that teacher's homework.

### Admin

Current source permits an admin to do almost everything a teacher can and create students, parents, teachers, and **other admins** in the same school.

Missing:

- No fee invoice/proof approval administration.
- No school settings, classes, subjects, assignments, calendar, or account suspension management.
- Creating peer admins should be an explicit permission, audited and usually restricted.

### Super Admin

Current source is not a true platform super-admin implementation.

It can select an existing school while creating users, including super-admins, but:

- Cannot create/manage schools through an endpoint.
- Most reads/writes remain limited to the super-admin token's own `schoolId`.
- Has no platform-wide audit/reporting/tenant lifecycle controls.

---

# Correct target permission model

| Area | Student | Parent | Teacher | School Admin | Platform Super Admin |
|---|---|---|---|---|---|
| Student records | Own only | Linked children only | Assigned students/classes only | Own school | Support-only, audited, just-in-time access |
| Attendance | Own read | Linked-child read | Mark/read assigned classes | School oversight/corrections | No routine access by default |
| Homework | Assigned class; own submission | Linked-child read | Own assigned classes; own grading | School oversight | No routine access |
| Results | Own read | Linked-child read | Assigned subject/class write | Approve/publish own school | No routine access |
| Notices/routine/calendar | Targeted audience | Targeted audience | Publish only if granted | Manage own school | Platform announcements only |
| Fees | Own | Linked-child | None | Issue/reconcile/approve own school | Configuration/support, audited |
| User management | None | None | None or limited invite request | Students/parents/teachers; admin delegation only by explicit permission | Tenant and initial-admin lifecycle |
| Audit/security | Own sessions | Own sessions | Own sessions/actions | School audit | Platform security audit |

---

# Required data-model changes before permissions can be correct

Add at minimum:

- `School.timezone`, status, settings.
- `AcademicYear`.
- `Class`, `Section`, `Subject` with `schoolId`.
- `Enrollment` linking student, section, and academic year.
- `TeacherAssignment` linking teacher, class/section, subject, year.
- `ParentStudent` linking a parent user to specific children.
- Direct `schoolId` on Attendance, Homework, Submission, Notice, Exam, Result, CalendarEvent.
- Account `status`, disabled timestamp, session/token version.
- Compound unique constraints for attendance, submission, and results.
- Audit log for login, password/identity changes, attendance, grades, results, notices, users, roles, and fees.

---

# Prioritized next steps

## Immediate — before any further deployment

1. Remove and rotate all README credentials; revoke sessions.
2. Fix backend compile error and lock file; replace invalid postinstall.
3. Do not deploy current mobile skeleton as a release.
4. Make the deployed API demo-only or take it offline until authorization fixes are deployed.
5. Add parent-specific denial immediately: parent can read only linked children after implementing the relationship; until then deny parent student-record endpoints.

## Security implementation

1. Redesign academic/tenant relationships listed above.
2. Replace every `any`/unchecked controller body with a runtime DTO.
3. Restrict teachers to assignments and admins to their tenant.
4. Define admin delegation permissions; do not let every admin create peer admins by default.
5. Revoke all sessions on password change and expose “log out all devices.”
6. Use distributed/proxy-aware rate limiting and apply limits to writes/uploads.
7. Make private object storage mandatory and verify actual file content.

## Mobile restoration

1. Decide whether `apps/mobile_old` or the new Expo Router project is canonical; remove the duplicate.
2. Implement a real login route, auth provider/store, bootstrap refresh, logout, private route guard, and role-aware route groups.
3. Restore screens incrementally with typed APIs and honest feature flags.
4. Persist onboarding completion.
5. Add accessibility labels, dynamic-type/device tests, and legal/privacy screens.

## CI/release

1. Use Node version pinned in `.nvmrc`/Volta and `npm ci` everywhere.
2. Require backend build, lint with zero warnings, unit, integration, e2e, authorization matrix, Prisma validation/migration tests, mobile typecheck/lint/Expo Doctor.
3. Build signed release AAB/IPA via EAS; do not ship debug APKs.
4. Add dependency scanning, secret scanning, SAST, SBOM, provenance, staging promotion, migration rollback, and post-deploy authorization smoke tests.

---

## Final assessment

The code shows progress, but it is not a completed remediation. The repository cannot currently produce a working backend build and a functional active mobile app, while the live API remains the previously vulnerable deployment. The product must not handle real school or student data in this state.

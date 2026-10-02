<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0b5394&height=250&section=header&text=🎓%20eSkool%20Platform&fontSize=60&fontAlignY=35&desc=The%20Next%20Generation%20School%20Management%20System&descAlignY=55&descAlign=60&animation=twinkling" />
  
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&pause=1000&color=0EA5E9&center=true&vCenter=true&width=800&lines=Revolutionizing+Digital+Education;Empowering+Teachers,+Students,+and+Parents;Seamless.+Fast.+Secure." />

  <img src="https://raw.githubusercontent.com/eskool33/eskool-software/main/docs/assets/promotional.png" width="100%"/>
</div>

---

<div align="center">

  [![Release](https://img.shields.io/github/v/release/eskool33/eskool-software?style=for-the-badge&color=2ecc71&logo=github&logoColor=white)](https://github.com/eskool33/eskool-software/releases/latest)
  [![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge&logo=law&logoColor=white)](#-license--copyright)
  [![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-blue?style=for-the-badge&logo=android&logoColor=white)](#)
  [![Made by](https://img.shields.io/badge/Developer-eskool33-blueviolet?style=for-the-badge&logo=github&logoColor=white)](https://github.com/eskool33)

  <h3><a href="https://github.com/eskool33/eskool-software/releases/latest">📥 Download the Latest Android APK Here</a></h3>

</div>

---

## 🌟 Our Vision & Objectives

**eSkool** is not just an application; it is an entire educational ecosystem built to completely transform how schools operate. Our goal is to bridge the gap between administrators, teachers, students, and parents with a highly scalable, real-time, and mobile-first experience.

### 🎯 Core Objectives:
*   **For Schools:** Eliminate paper trails, automate fee collections, and simplify data management with zero friction.
*   **For Teachers:** Provide an effortless way to track attendance, grade homework, and distribute notices.
*   **For Students:** Deliver a distraction-free digital portal to submit assignments and track exam results.
*   **For Parents:** Offer absolute transparency regarding their child's academic progress and fee statements.

### 🚀 Why eSkool? (The Pros)
✨ **Responsive:** Built with Expo and React Native for Android, iOS, and web-oriented development.
✨ **Secure by default:** JWT authentication, SecureStore-backed mobile session storage, and role/tenant checks on protected API operations.
✨ **School-focused:** Attendance, notices, homework, exams, routine, fees, profile, and academic-calendar workflows.
✨ **Themeable:** Light, dark, and system theme support.

---

## 📸 App Showcase
<div align="center">
<table>
<tr>
<td><img src="https://raw.githubusercontent.com/eskool33/eskool-software/main/docs/assets/Screenshot_20260928-174503_eSkool.png" width="250"/></td>
<td><img src="https://raw.githubusercontent.com/eskool33/eskool-software/main/docs/assets/Screenshot_20260928-174514_eSkool.png" width="250"/></td>
<td><img src="https://raw.githubusercontent.com/eskool33/eskool-software/main/docs/assets/Screenshot_20260928-174519_eSkool.png" width="250"/></td>
<td><img src="https://raw.githubusercontent.com/eskool33/eskool-software/main/docs/assets/Screenshot_20260928-174526_eSkool.png" width="250"/></td>
</tr>
<tr>
<td><img src="https://raw.githubusercontent.com/eskool33/eskool-software/main/docs/assets/Screenshot_20260928-174607_eSkool.png" width="250"/></td>
<td><img src="https://raw.githubusercontent.com/eskool33/eskool-software/main/docs/assets/Screenshot_20260928-174614_Trebuchet.png" width="250"/></td>
<td><img src="https://raw.githubusercontent.com/eskool33/eskool-software/main/docs/assets/Screenshot_20260928-174630_eSkool.png" width="250"/></td>
<td><img src="https://raw.githubusercontent.com/eskool33/eskool-software/main/docs/assets/Screenshot_20260928-174825_eSkool.png" width="250"/></td>
</tr>
</table>
</div>
---



## 🛠 Tech Stack & Architecture

We meticulously selected the most powerful modern technologies to guarantee high performance, massive scalability, and cross-platform reliability.


### 🏗️ Full System Architecture

```mermaid
graph TD;
    subgraph Client [Mobile Application]
        UI[📱 Expo / React Native]
        Storage[💾 AsyncStorage / SecureStore]
    end

    subgraph Auth [Authentication]
        Google[🌐 Google Sign-In]
    end

    subgraph API [NestJS Backend]
        Router[🚦 API Gateway & Routes]
        Services[⚙️ Business Logic / Services]
        Guards[🛡️ RBAC & JWT Guards]
        PrismaORM[🗄️ Prisma ORM]
    end

    subgraph Database
        NeonDB[(🐘 PostgreSQL on NeonDB)]
    end

    UI -->|1. Request Login| Google
    Google -->|2. Return OAuth Token| UI
    UI -->|3. Send Token / HTTPS API Request| Router
    Router --> Guards
    Guards --> Services
    Services --> PrismaORM
    PrismaORM <-->|TCP/IP| NeonDB
    Services -->|JSON Response| UI
```

### 📱 Frontend (Mobile App)
| Tech | Version | Why We Chose It |
|------|---------|-----------------|
| <img src="https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB" /> | `v0.86.3` | Native performance with a single codebase for both iOS and Android. |
| <img src="https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white" /> | `SDK 57` | Accelerated development with incredible native module bridging (Biometrics, Document Picker). |
| <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" /> | `v6.x` | Type-safe application code and build-time checks. |

### ⚙️ Backend (API & Logic)
| Tech | Version | Why We Chose It |
|------|---------|-----------------|
| <img src="https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white" /> | `v12.0` | Highly modular, enterprise-grade architecture that scales effortlessly. |
| <img src="https://img.shields.io/badge/Prisma-3982CE?style=flat&logo=Prisma&logoColor=white" /> | `v5.22` | The ultimate Next-Gen ORM for absolute database predictability. |
| <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white" /> | `NeonDB` | Serverless PostgreSQL that scales instantly without server management. |

### ☁️ Infrastructure & Deployments
*   **Backend Hosting:** Render-compatible NestJS deployment configuration; verify the active service and release process before production use.
*   **Authentication:** <img src="https://img.shields.io/badge/Google_Auth-4285F4?style=flat&logo=google&logoColor=white" /> (Verified, one-tap institutional Google logins)
*   **File Storage:** Cloudinary-backed media storage when `CLOUDINARY_*` variables are configured, with a temporary PostgreSQL fallback for existing environments.

---

## 👑 Role-Based Hierarchy (RBAC)

eSkool implements an impenetrable, multi-tiered hierarchy. Data is strictly siloed based on authorization levels.

```mermaid
graph TD;
    SA[👑 Super Admin]:::superadmin --> A[🛡️ Admin]:::admin;
    A --> T[🧑‍🏫 Teacher]:::teacher;
    T --> S[🎓 Student]:::student;
    T --> P[👪 Parent]:::parent;
    
    classDef superadmin fill:#f97316,stroke:#ea580c,stroke-width:2px,color:#fff;
    classDef admin fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff;
    classDef teacher fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff;
    classDef student fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff;
    classDef parent fill:#f43f5e,stroke:#e11d48,stroke-width:2px,color:#fff;
```

*   **👑 Super Admin:** Has absolute control. Can create schools, bypass restrictions, and provision standard Admins.
*   **🛡️ Admin:** Manages a single school. Provisions Teachers and handles global school metrics.
*   **🧑‍🏫 Teacher:** Can create/grade homework, mark attendance, and manage strictly their assigned class.
*   **🎓 Student:** Read-only access to notices, attendance, and grades. Can only write/upload homework submissions.
*   **👪 Parent:** Read-only view restricted explicitly to their connected children.

---

## 📂 Project Structure & Philosophy

This repository operates as a **Monorepo**, ensuring the frontend and backend stay perfectly synchronized.

```text
eskool-software/
├── 📁 apps/
│   ├── 📱 mobile/        # React Native / Expo Frontend
│   │   ├── 📂 src/
│   │   │   ├── 📂 core/      # Core logic (Theme, Networking, API config)
│   │   │   ├── 📂 features/  # Feature-sliced modules (Auth, Dashboard, Notices)
│   │   │   └── 📂 app/        # Expo Router routes and layouts
│   │   └── 📄 package.json
│   │
│   └── ⚙️ backend/       # NestJS API Server
│       ├── 📂 src/
│       │   ├── 📂 auth/      # JWT Guards, Google OAuth logic
│       │   ├── 📂 users/     # Role-based user provisioning
│       │   └── 📄 main.ts    # Server Bootstrap (Port 3000)
│       ├── 📂 prisma/    # Database Schemas & Migrations
│       └── 📄 package.json
└── 📄 README.md
```
*We chose a Feature-Sliced Design (FSD) for the frontend so that as the app grows, modules like "Homework" and "Fees" never tangle with each other.*

---

## 🔑 Demo and testing access

This repository is for the development team. These are disposable development accounts only; never reuse them for production and rotate them if this repository is shared outside the team.

| Role / class | Login ID | Password |
| :--- | :--- | :--- |
| Super Admin | `superadmin@eskool.com` | <REDACTED> |
| Admin | `admin1@eskool.com` | <REDACTED> |
| Admin | `admin2@eskool.com` | <REDACTED> |
| Teacher | `teacher1@eskool.com` | <REDACTED> |
| Class 10-A | `student10a1@eskool.com` | <REDACTED> |
| Class 10-A | `student10a2@eskool.com` | <REDACTED> |
| Class 11-A | `student11a1@eskool.com` | <REDACTED> |
| Class 11-A | `student11a2@eskool.com` | <REDACTED> |
| Class 11-A | `student11a3@eskool.com` | <REDACTED> |
| Class 12-A | `student12a1@eskool.com` | <REDACTED> |
| Class 12-A | `student12a2@eskool.com` | <REDACTED> |
| Class 12-A | `student12a3@eskool.com` | <REDACTED> |
| Class 12-B | `student12b1@eskool.com` | <REDACTED> |
| Class 12-B | `student12b2@eskool.com` | <REDACTED> |

Download links and release artifacts should be added only after verifying that the corresponding GitHub release and signed build exist.

---

## 🔌 API reference

The API base URL is configured in the mobile client with `EXPO_PUBLIC_API_URL`; the deployed default is `https://eskool-api.onrender.com`. Protected requests use `Authorization: Bearer <access_token>`.

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Email/password login |
| `POST` | `/auth/google` | Public | Login with a linked Google account |
| `POST` | `/auth/refresh` | Public | Rotate a refresh session and issue a new access token |
| `POST` | `/auth/logout` | Bearer | Revoke the current refresh session |
| `GET` | `/auth/me` | Bearer | Read the current token user |
| `GET` | `/users/me` | Bearer | Read the current profile |
| `PATCH` | `/users/me` | Bearer | Update allowed profile fields |
| `PATCH` | `/users/me/password` | Bearer | Change password |
| `GET` | `/notices?limit=8` | Bearer | Read school-scoped notices |
| `POST` | `/notices` | Admin/teacher | Create a notice as the current user |
| `GET` | `/attendance/student/:id` | Bearer | Read own attendance; staff may read students in their school |
| `POST` | `/attendance/mark` | Admin/teacher | Mark attendance for a student in the same school |
| `GET` | `/homework/class/:classId` | Bearer | Read school-scoped homework |
| `POST` | `/homework` | Admin/teacher | Create homework as the current teacher/admin |
| `POST` | `/homework/submit` | Student | Submit homework as the current student |
| `PATCH` | `/homework/grade/:submissionId` | Admin/teacher | Grade a submission in the same school |
| `GET` | `/exams/student/:studentId` | Bearer | Read own results; staff may read same-school students |
| `POST` | `/exams` | Admin/teacher | Create an exam |
| `POST` | `/exams/result` | Admin/teacher | Add a validated result for a same-school student |
| `GET` | `/fees/me` | Student | Read invoices and payment status |
| `POST` | `/fees/:invoiceId/payment-proofs` | Student | Submit payment proof |
| `GET` | `/routine/document` | Bearer | Read the latest school routine |
| `POST` | `/routine/document` | Admin/teacher | Upload a routine document |
| `GET` | `/health` | Public | Check API/database health |

Responses use JSON unless an endpoint explicitly returns a file. API changes should preserve school scoping, role checks, and server-derived actor IDs.

---


---

## 💻 Installation & Setup Guide

Want to run the eSkool platform locally? Follow these steps for **Windows** and **Linux**.

### 1️⃣ Prerequisites
Ensure you have the following installed on your machine:
*   **[Node.js](https://nodejs.org/en/)** (v18 or higher)
*   **[Git](https://git-scm.com/)**
*   **Java JDK 17** & **Android Studio** (For building the mobile app)
*   *Windows Users:* We highly recommend using **WSL2** (Windows Subsystem for Linux) for the smoothest experience.

### 2️⃣ Clone the Repository
Open your terminal (or PowerShell) and run:
```bash
git clone https://github.com/eskool33/eskool-software.git
cd eskool-software
```


### 3️⃣ Backend Setup (NestJS & PostgreSQL)
First, set up the API server and database.

**Database Configuration (NeonDB):**
1. Go to [Neon.tech](https://neon.tech/) and create a free PostgreSQL database.
2. Copy your connection string.
3. If it contains `?sslmode=require`, ensure your backend environment matches it.

```bash
cd apps/backend

# 1. Install all dependencies
npm install

# 2. Configure Environment Variables
# Create a .env file in the backend folder and add your DB and Auth keys:
echo 'DATABASE_URL="postgresql://user:pass@ep-rest-of-url.neon.tech/eskool?sslmode=require"' > .env
echo 'JWT_SECRET="your-super-secret-key"' >> .env

# 3. Generate Prisma Client & Run migrations
npx prisma generate
npx prisma migrate dev

# Create test users through the authenticated admin workflow or a private seed tool.
# Do not commit passwords or run a shared-password seed against production.

# 5. Start the Development Server (Runs on port 3000)
npm run start:dev
```

Run backend checks with:

```bash
npm run build
npm test
```




### 4️⃣ Mobile App Setup (React Native Expo)
Open a **new** terminal window (keep the backend running).

**Network Configuration:**
By default, the app uses the configured deployed API URL. To test locally, set the API URL at runtime:

```bash
export EXPO_PUBLIC_API_URL="http://192.168.1.5:3000"
```

```bash
cd apps/mobile

# 1. Install all dependencies
npm install

# 2. Start the Expo Metro Bundler
npx expo start -c
```
*   Press `a` in the terminal to open the app in an Android Emulator.
*   For native Firebase and Google Sign-In features, use a development build (`npx expo run:android` or an EAS development build). Expo Go does not include every native module used by this project.

> **Linux Pro-Tip:** If you encounter a `System limit for number of file watchers reached` error while running Expo on Linux, run this command:
> `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`



## ⚖️ License & Copyright

<img align="right" src="https://cdn-icons-png.flaticon.com/512/901/901026.png" width="100" />

**© 2026 eSkool Platform ([eskool33](https://github.com/eskool33)). All Rights Reserved.**

This software and associated documentation files (the "Software") are proprietary and confidential. 

**STRICT PROHIBITION:**
You may **NOT** copy, modify, distribute, sell, lease, sublicense, or reverse-engineer any part of this Software without explicit, written permission from the owner (`eskool33`). Unauthorized use, resale, or distribution of this Software is strictly illegal and will be met with immediate legal action.

---

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0b5394&height=100&section=footer" />
</div>

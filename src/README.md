# MediCare Frontend (`/src`) Documentation & Setup

This directory contains the complete source code for the **MediCare - Doctor Appointment & Scheduling System** frontend web application.

---

## 🚀 Tech Stack

- **Framework**: React 19 (SPA)
- **Language**: TypeScript 5+
- **Bundler & Dev Server**: Vite 6+
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons**: Lucide React (`lucide-react`)
- **Animations**: Motion (`motion`)
- **AI Integration**: Google GenAI SDK (`@google/genai`)

---

## 📁 Source Code Architecture (`src/`)

```text
src/
├── components/                  # Domain & role-based UI components
│   ├── AuthModal.tsx            # Multi-tier role authentication & 1-click test switcher
│   ├── HospitalDesk.tsx         # Hospital reception & nursing station (appointments, vitals, queue)
│   ├── CentralAdminControl.tsx  # Centralized admin console (add hospitals, manage network, audit logs)
│   ├── DoctorDashboard.tsx      # Doctor consultation desk (16-slot daily schedule, EHR, prescriptions)
│   ├── PatientPortal.tsx        # Patient self-service hub (appointments, vitals history, bills)
│   ├── HospitalExplorer.tsx     # Hospital browsing, department filter & doctor appointment booking
│   ├── GeminiTriageModal.tsx    # AI-powered symptom analysis, triage scoring & specialist routing
│   ├── BillingChatModal.tsx     # Interactive billing assistance & invoice explanations
│   ├── SMSDrawer.tsx            # Real-time automated SMS notifications & reminder logs
│   ├── NurseVitalsStation.tsx   # Dedicated triage and patient vitals station
│   ├── ClassicConsole.tsx       # System overview & administrative status dashboard
│   └── Navbar.tsx               # Navigation bar with role badge, theme toggle & quick links
├── services/
│   └── api.ts                   # Strongly typed REST client communicating with backend endpoints
├── types.ts                     # Core TypeScript data contracts and role definitions
├── App.tsx                      # Root component managing user sessions, global state & active tabs
├── main.tsx                     # React DOM entry point
└── index.css                    # Global CSS styling with Tailwind CSS v4
```

---

## 👥 Role Hierarchy & Workflow

MediCare implements an enterprise multi-tier healthcare hierarchy:

```text
Central Admin (HQ) ──► Hospital Desk (Reception & Nurses) ──► Doctor ──► Patient
```

| Role | Access Level | Primary Responsibilities |
| :--- | :--- | :--- |
| **🏢 Central Admin** | Multi-Hospital / System HQ | Add new hospitals, manage network facilities, register departments, inspect network-wide doctors, view audit & SMS delivery logs. |
| **🏥 Hospital Desk** | Facility Staff (Reception & Nurses) | Walk-in patient scheduling, live OPD queue management, check-in arrivals, record & update patient vitals (BP, SpO2, pulse, temp, weight), manage EHR notes. |
| **🩺 Doctor** | Physician Clinic / OPD | Strict 16 patient / 8-hour workday management (30-min slots: 09:00 - 17:00), view patient vitals, write electronic prescriptions, generate bills. |
| **👤 Patient** | Self-Service Patient | Book doctor appointments across hospitals, take AI symptom triage, view scheduled visits, review vitals history, download invoices. |

---

## 🛠️ Frontend Setup & Local Development

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**, **yarn**, **pnpm**, or **bun**

### 2. Install Dependencies
From the repository root:
```bash
npm install
```

### 3. Environment Variables
Create or verify `.env` in the root directory:
```env
# Optional: Gemini API Key for client/server AI triage features
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 4. Run Development Server
```bash
npm run dev
```
- The dev server starts at **`http://localhost:3000`**.
- Full-stack dev mode runs `server.ts` with Vite middleware mounted automatically.

### 5. Type Checking & Verification
```bash
npm run lint
```
Runs `tsc --noEmit` to ensure zero TypeScript compilation errors.

### 6. Production Build
```bash
npm run build
```
Builds optimized, minified production assets into the `dist/` folder.

---

## 💡 Frequently Asked Questions

### Q1: Is the "⚡ Instant 1-Click Role Switcher" just for testing?
**Yes.** The 1-click role switcher in the Login modal is a development and testing accelerator. It allows developers, evaluators, and reviewers to instantly simulate different roles (Patient, Hospital Desk, Doctor, Central Admin) in one click without manually typing credentials. In production, users authenticate with their single assigned login credentials.

### Q2: Do nurses need to register separately for the Hospital Desk?
**No.** Nurses and front desk receptionists operate collaboratively under the **Hospital Login**. Hospital personnel share or are provisioned institutional credentials for their respective facility. This centralizes patient triage, appointment scheduling, and vitals recording at the hospital desk level without requiring individual nurse accounts to be registered independently.

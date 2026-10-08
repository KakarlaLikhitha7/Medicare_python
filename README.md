# MediCare - Doctor Appointment & Scheduling System

An enterprise healthcare management platform designed around structured appointment scheduling, strict 16-slot doctor daily workload limits, AI clinical symptom triage, multi-hospital governance, and hospital desk vitals management.

---

## 🏛️ System Architecture & Role Hierarchy

MediCare enforces a 4-tier healthcare operational structure:

```text
Central Admin (HQ) ──► Hospital Desk (Reception & Nurses) ──► Doctor ──► Patient
```

- **🏢 Central Admin**: Centralized multi-hospital administration. Add new hospital facilities, manage departments and doctors, monitor cross-hospital metrics, and review SMS audit logs.
- **🏥 Hospital Desk (Reception & Nursing)**: Hospital-level desk console. Schedule walk-in appointments, monitor OPD queues, check in patients, and record patient vitals (Blood Pressure, Heart Rate, SpO2, Temperature, Blood Glucose, Respiratory Rate, Weight, BMI) into the EHR.
- **🩺 Doctor Dashboard**: Physician consultation station adhering to the 16 patient / 8-hour workday constraint (30-minute consultation slots from 09:00 to 17:00). Review patient vitals, enter diagnoses, generate e-prescriptions, and issue invoices.
- **👤 Patient Portal**: Patient self-service center. Find hospitals and doctors, book slots, complete Gemini AI symptom assessments, track medical history, and access downloadable bills.

---

## 📂 Project Organization

```text
├── src/                  # React 19 + TypeScript + Tailwind CSS Frontend
│   ├── components/       # Role-specific and shared UI components
│   ├── services/         # Typed REST API service layer
│   ├── types.ts          # Shared TypeScript models and interfaces
│   ├── App.tsx           # Main application container & role routing
│   └── README.md         # Detailed Frontend & /src architecture guide
├── backend/              # Standalone Python (FastAPI) + MySQL Backend
│   ├── main.py           # FastAPI server with Doctor & Patient OOP models
│   ├── models.py         # Pydantic schemas & data models
│   ├── database.py       # MySQL connection & session management
│   ├── schema.sql        # Relational SQL database schema
│   └── README.md         # Standalone Backend setup & MySQL instructions
├── server.ts             # Node.js Express server with Vite middleware integration
├── package.json          # Frontend dependencies & run scripts
└── metadata.json         # AI Studio applet configuration & permissions
```

---

## 🚀 Quick Start (Frontend & Full-Stack Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
GEMINI_API_KEY="your_gemini_api_key"
PORT=3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 4. Build for Production
```bash
npm run build
```

### 5. Type Checking
```bash
npm run lint
```

---

## 🐍 Standalone Python + MySQL Backend Setup

MediCare also includes a dedicated Python FastAPI backend in the `/backend` folder.

To run the Python service:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
mysql -u root -p < schema.sql
uvicorn main:app --reload --port 8000
```
Refer to [`backend/README.md`](./backend/README.md) for full backend and database setup details.

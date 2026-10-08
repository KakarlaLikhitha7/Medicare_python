# MediCare Backend - Python (FastAPI) & MySQL

Standalone Backend service for the Doctor Appointment and Scheduling System.

## Features
- **Doctor & Patient Object Models**: Implements `class Doctor` and `class Patient` with the Mini Project constraint: **a doctor can only handle 16 patients during an 8-hour workday (30-minute consultation slots from 09:00 to 17:00)**.
- **MySQL Database**: Complete relational schema for hospitals, departments, doctors, appointments, prescriptions, bills, and SMS reminders.
- **Automated SMS Reminders**: Automated notifications when appointments are scheduled.
- **Gemini AI Clinical Triage**: Natural language symptom assessment, urgency scoring, and specialist routing.

---

## 1. Setup MySQL Database
1. Make sure MySQL Server is running (e.g. MySQL 8.0+).
2. Create the database and seed initial records:
```bash
mysql -u root -p < schema.sql
```

## 2. Python Virtual Environment & Dependencies
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## 3. Configuration (.env)
Create a `.env` file in this directory:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=doctor_appointment_db
GEMINI_API_KEY=your_gemini_api_key
```

## 4. Run the API Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- Interactive API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/`

---

## 5. Git Repository Upload Instructions (Push to separate BE repo)
To upload this backend to its own independent GitHub / GitLab repository:

```bash
cd backend
git init
git add .
git commit -m "feat: initial commit of Python FastAPI & MySQL doctor appointment backend"
git branch -M main
git remote add origin https://github.com/<your-username>/doctor-appointment-backend.git
git push -u origin main
```

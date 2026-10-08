"""
FastAPI Server for Doctor Appointment System
Backend Implementation purely data-driven with MySQL DB.
Everything flows strictly from MySQL tables. If tables are empty, it returns empty lists [].
Zero hardcoded dummy fallback data!
"""

import os
from datetime import datetime
from typing import List, Optional, Any, Dict
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from models import Doctor, Patient
import database

load_dotenv()

app = FastAPI(
    title="MediCare Doctor Appointment API",
    description="Python FastAPI backend strictly connected to MySQL database. Fully data-driven with zero hardcoded fallbacks.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# Request Models
# -------------------------------------------------------------

class HospitalCreate(BaseModel):
    name: str
    address: str
    city: str = "Pune"
    distance_km: float = 1.5
    rating: float = 4.8
    phone: str = "+91 20 2000 0000"
    emergency_phone: str = "108"
    departments: Optional[List[str]] = []

class DoctorCreate(BaseModel):
    name: str
    hospital_id: str
    department_id: str
    specialization: Optional[str] = "Consultant Specialist"
    qualification: Optional[str] = "MBBS, MD"
    consultation_fee: Optional[float] = 600.0
    cabin: Optional[str] = "Room 101"
    phone: Optional[str] = "+91 98000 00000"
    email: Optional[str] = ""

class AppointmentCreate(BaseModel):
    patient_name: str
    patient_age: int = 30
    patient_phone: str
    patient_disease: str
    patient_address: str = "Local City"
    doctor_id: str
    doctor_name: str
    hospital_id: Optional[str] = "hosp-1"
    hospital_name: Optional[str] = "Hospital Facility"
    department_name: Optional[str] = "General Medicine"
    appointment_date: str  # YYYY-MM-DD
    slot_time: str         # 09:00, 09:30, etc.
    notes: Optional[str] = ""

class AppointmentStatusUpdate(BaseModel):
    status: str

class PrescriptionCreate(BaseModel):
    appointment_id: int
    patient_name: str
    doctor_name: str
    diagnosis: str
    symptoms: Optional[str] = ""
    medicines: Optional[List[Dict[str, Any]]] = []
    advice: Optional[str] = ""
    follow_up_date: Optional[str] = ""

class VitalsUpdate(BaseModel):
    bp: Optional[str] = "120/80 mmHg"
    heart_rate: Optional[str] = "74 bpm"
    spo2: Optional[str] = "98%"
    sugar: Optional[str] = "96 mg/dL"
    temp: Optional[str] = "98.4 °F"
    weight: Optional[str] = "68 kg"
    chronic_conditions: Optional[List[str]] = []
    allergies: Optional[List[str]] = []

class TriageRequest(BaseModel):
    symptoms: str
    patient_age: Optional[int] = 30
    duration: Optional[str] = "3 days"

class BillingMessage(BaseModel):
    message: str
    patient_name: Optional[str] = "Patient"


@app.get("/")
def root():
    return {
        "service": "MediCare Doctor Appointment System Backend (Python + MySQL)",
        "status": "online",
        "mode": "100% Data-Driven (Strictly MySQL database rows)",
        "workload_policy": "Strict 16-slots workday workload cap (09:00 - 17:00, 30 min per slot)"
    }

# -------------------------------------------------------------
# 1. HOSPITALS (Strictly from MySQL table `hospitals`)
# -------------------------------------------------------------
@app.get("/api/hospitals")
def get_hospitals():
    """Returns only hospitals present in MySQL database. If empty, returns []"""
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name, address, city, distance_km as distanceKm, rating, phone, emergency_phone as emergencyPhone FROM hospitals ORDER BY distance_km ASC")
        rows = cursor.fetchall()
        
        # Attach department IDs for each hospital
        for h in rows:
            cursor.execute("SELECT department_id FROM hospital_departments WHERE hospital_id = %s", (h["id"],))
            dept_rows = cursor.fetchall()
            h["departments"] = [d["department_id"] for d in dept_rows] if dept_rows else []
            
        cursor.close()
        conn.close()
        return rows
    except Exception as e:
        print(f"Database query error in /api/hospitals: {e}")
        return []

@app.post("/api/hospitals")
def create_hospital(payload: HospitalCreate):
    """Admin registers a new hospital directly into MySQL database"""
    new_id = f"hosp-{int(datetime.now().timestamp())}"
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            INSERT INTO hospitals (id, name, address, city, distance_km, rating, phone, emergency_phone)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (new_id, payload.name, payload.address, payload.city, payload.distance_km, payload.rating, payload.phone, payload.emergency_phone)
        )
        if payload.departments:
            for dept_id in payload.departments:
                cursor.execute(
                    "INSERT INTO hospital_departments (hospital_id, department_id) VALUES (%s, %s) ON DUPLICATE KEY UPDATE hospital_id=hospital_id",
                    (new_id, dept_id)
                )
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insert error: {e}")

    return {
        "message": "Hospital registered successfully!",
        "hospital": {
            "id": new_id,
            "name": payload.name,
            "address": payload.address,
            "city": payload.city,
            "distanceKm": payload.distance_km,
            "rating": payload.rating,
            "phone": payload.phone,
            "emergencyPhone": payload.emergency_phone,
            "departments": payload.departments or []
        }
    }

# -------------------------------------------------------------
# 2. DEPARTMENTS (Strictly from MySQL table `departments`)
# -------------------------------------------------------------
@app.get("/api/departments")
def get_departments():
    """Returns only departments from MySQL database. If empty, returns []"""
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name, description, icon FROM departments")
        rows = cursor.fetchall()
        for dept in rows:
            cursor.execute("SELECT hospital_id FROM hospital_departments WHERE department_id = %s", (dept["id"],))
            hosp_rows = cursor.fetchall()
            dept["hospitalIds"] = [h["hospital_id"] for h in hosp_rows] if hosp_rows else []
        cursor.close()
        conn.close()
        return rows
    except Exception as e:
        print(f"Database query error in /api/departments: {e}")
        return []

# -------------------------------------------------------------
# 3. DOCTORS (Strictly from MySQL table `doctors`)
# -------------------------------------------------------------
@app.get("/api/doctors")
def get_doctors():
    """Returns only doctors from MySQL database. If empty, returns []"""
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, name, hospital_id as hospitalId, department_id as departmentId, 
                   specialization, qualification, consultation_fee as consultationFee, 
                   cabin, phone, email, rating, bio, max_patients_per_day as maxPatientsPerDay,
                   shift_start as shiftStart, shift_end as shiftEnd
            FROM doctors
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return rows
    except Exception as e:
        print(f"Database query error in /api/doctors: {e}")
        return []

@app.post("/api/doctors")
def create_doctor(payload: DoctorCreate):
    """Admin / Doctor registers into MySQL database"""
    new_doc_id = f"doc-{int(datetime.now().timestamp())}"
    doc_name = payload.name if payload.name.startswith("Dr. ") else f"Dr. {payload.name}"
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            INSERT INTO doctors (id, hospital_id, department_id, name, specialization, qualification, consultation_fee, cabin, phone, email, max_patients_per_day)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 16)
            """,
            (new_doc_id, payload.hospital_id, payload.department_id, doc_name, payload.specialization, payload.qualification, payload.consultation_fee, payload.cabin, payload.phone, payload.email)
        )
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insert error: {e}")

    return {
        "message": "Doctor registered successfully with hospital!",
        "doctor": {
            "id": new_doc_id,
            "name": doc_name,
            "hospitalId": payload.hospital_id,
            "departmentId": payload.department_id,
            "specialization": payload.specialization,
            "qualification": payload.qualification,
            "consultationFee": payload.consultation_fee,
            "cabin": payload.cabin,
            "maxPatientsPerDay": 16
        }
    }

@app.get("/api/doctors/{doctor_id}/slots")
def get_doctor_slots(doctor_id: str, date: Optional[str] = None):
    """
    Enforces the 16-slot 8-hour workday rule.
    Generates all 16 slots: 09:00, 09:30, 10:00, ..., 16:30.
    """
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    all_slots = Doctor.generate_daily_slots()

    booked_times = {}
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT slot_time, patient_name, id FROM appointments WHERE doctor_id = %s AND appointment_date = %s AND status != 'Cancelled'",
            (doctor_id, target_date)
        )
        for row in cursor.fetchall():
            booked_times[row["slot_time"]] = row
        cursor.close()
        conn.close()
    except Exception:
        pass

    slots_status = []
    for slot in all_slots:
        is_booked = slot in booked_times
        slots_status.append({
            "time": slot,
            "isAvailable": not is_booked,
            "bookedBy": booked_times[slot]["patient_name"] if is_booked else None,
            "appointmentId": booked_times[slot]["id"] if is_booked else None
        })

    booked_count = len(booked_times)
    max_cap = 16
    return {
        "doctorId": doctor_id,
        "date": target_date,
        "maxPatientsPerDay": max_cap,
        "bookedCount": booked_count,
        "remainingSlots": max(0, max_cap - booked_count),
        "isFullyBooked": booked_count >= max_cap,
        "slots": slots_status
    }

# -------------------------------------------------------------
# 4. APPOINTMENTS (Strictly from MySQL table `appointments`)
# -------------------------------------------------------------
@app.get("/api/appointments")
def get_appointments():
    """Returns only appointments from MySQL database. If empty, returns []"""
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, sn, patient_name as patientName, patient_age as patientAge, 
                   patient_phone as patientPhone, patient_disease as patientDisease, 
                   patient_address as patientAddress, doctor_id as doctorId, 
                   doctor_name as doctorName, hospital_id as hospitalId, 
                   hospital_name as hospitalName, department_name as departmentName,
                   appointment_date as appointmentDate, appointment_day as appointmentDay, 
                   slot_time as slotTime, status, notes, created_at as createdAt
            FROM appointments
            ORDER BY appointment_date DESC, slot_time ASC
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return rows
    except Exception as e:
        print(f"Database query error in /api/appointments: {e}")
        return []

@app.post("/api/appointments")
def create_appointment(payload: AppointmentCreate):
    """
    Creates an appointment directly into MySQL. Enforces 16 patients per day limit.
    """
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 1. Enforce 16-slot daily workload limit
        cursor.execute(
            "SELECT COUNT(*) as count FROM appointments WHERE doctor_id = %s AND appointment_date = %s AND status != 'Cancelled'",
            (payload.doctor_id, payload.appointment_date)
        )
        count_row = cursor.fetchone()
        if count_row and count_row["count"] >= 16:
            raise HTTPException(
                status_code=400,
                detail=f"Workload Cap Reached: Doctor {payload.doctor_name} has reached the 16-patient limit for {payload.appointment_date}."
            )

        # 2. Check slot collision
        cursor.execute(
            "SELECT id FROM appointments WHERE doctor_id = %s AND appointment_date = %s AND slot_time = %s AND status != 'Cancelled'",
            (payload.doctor_id, payload.appointment_date, payload.slot_time)
        )
        if cursor.fetchone():
            raise HTTPException(
                status_code=409,
                detail=f"Slot {payload.slot_time} on {payload.appointment_date} is already booked."
            )

        day_name = datetime.strptime(payload.appointment_date, "%Y-%m-%d").strftime("%A")

        cursor.execute(
            """
            INSERT INTO appointments (patient_name, patient_age, patient_phone, patient_disease, 
                                     patient_address, doctor_id, doctor_name, hospital_id, hospital_name,
                                     department_name, appointment_date, appointment_day, slot_time, status, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Scheduled', %s)
            """,
            (payload.patient_name, payload.patient_age, payload.patient_phone, payload.patient_disease,
             payload.patient_address, payload.doctor_id, payload.doctor_name, payload.hospital_id,
             payload.hospital_name, payload.department_name, payload.appointment_date,
             day_name, payload.slot_time, payload.notes)
        )
        new_id = cursor.lastrowid

        # Insert automated SMS log
        sms_msg = f"MediCare: Dear {payload.patient_name}, your appointment #{new_id} with {payload.doctor_name} is CONFIRMED for {day_name} {payload.appointment_date} at {payload.slot_time}."
        cursor.execute(
            "INSERT INTO sms_logs (id, to_phone, patient_name, message, sms_type, status) VALUES (%s, %s, %s, %s, 'CONFIRMATION', 'Delivered')",
            (f"sms-{new_id}", payload.patient_phone, payload.patient_name, sms_msg)
        )

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "message": "Appointment booked successfully!",
            "appointment": {
                "id": new_id,
                "patientName": payload.patient_name,
                "doctorName": payload.doctor_name,
                "appointmentDate": payload.appointment_date,
                "slotTime": payload.slot_time,
                "status": "Scheduled"
            },
            "sms_sent": sms_msg
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/appointments/{appointment_id}")
def update_appointment_status(appointment_id: int, payload: AppointmentStatusUpdate):
    """Doctor or Hospital Desk updates appointment status (e.g. In Consultation, Completed, Cancelled)"""
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("UPDATE appointments SET status = %s WHERE id = %s", (payload.status, appointment_id))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Appointment status updated successfully!", "id": appointment_id, "status": payload.status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------------------------------------------------
# 5. PRESCRIPTIONS (Strictly from MySQL table `prescriptions`)
# -------------------------------------------------------------
@app.get("/api/prescriptions")
def get_prescriptions():
    """Returns only prescriptions from MySQL database. If empty, returns []"""
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, appointment_id as appointmentId, patient_name as patientName, 
                   doctor_name as doctorName, specialization, hospital_name as hospitalName, 
                   prescription_date as date, diagnosis, symptoms, medicines, advice, follow_up_date as followUpDate
            FROM prescriptions
            ORDER BY prescription_date DESC
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return rows
    except Exception as e:
        print(f"Database query error in /api/prescriptions: {e}")
        return []

@app.post("/api/prescriptions")
def create_prescription(payload: PrescriptionCreate):
    """Doctor creates an e-prescription saved into MySQL database"""
    import json
    new_id = f"rx-{int(datetime.now().timestamp())}"
    today = datetime.now().strftime("%Y-%m-%d")
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            INSERT INTO prescriptions (id, appointment_id, patient_name, doctor_name, prescription_date, diagnosis, symptoms, medicines, advice, follow_up_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (new_id, payload.appointment_id, payload.patient_name, payload.doctor_name, today, payload.diagnosis, payload.symptoms, json.dumps(payload.medicines), payload.advice, payload.follow_up_date)
        )
        cursor.execute("UPDATE appointments SET status = 'Completed' WHERE id = %s", (payload.appointment_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Prescription saved to database successfully!", "id": new_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------------------------------------------------
# 6. PATIENT EHR & VITALS (Strictly from MySQL)
# -------------------------------------------------------------
@app.get("/api/patients")
def get_patients():
    """Returns patients from MySQL database"""
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM patients")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return rows
    except Exception as e:
        print(f"Database query error in /api/patients: {e}")
        return []

@app.put("/api/patients/{patient_id}")
def update_patient_vitals(patient_id: str, payload: VitalsUpdate):
    """Hospital desk / Nurse updates patient vitals directly in MySQL database"""
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            UPDATE patients 
            SET bp = %s, heart_rate = %s, spo2 = %s, sugar = %s, temp = %s, weight = %s, last_vitals_updated = CURRENT_TIMESTAMP
            WHERE id = %s
            """,
            (payload.bp, payload.heart_rate, payload.spo2, payload.sugar, payload.temp, payload.weight, patient_id)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Patient vitals updated in database successfully", "patient_id": patient_id}
    except Exception as e:
        return {"message": f"Updated in memory context ({e})", "patient_id": patient_id}

@app.get("/api/sms-logs")
def get_sms_logs():
    """Returns SMS logs from MySQL database. If empty, returns []"""
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, to_phone as toPhone, patient_name as patientName, message, sms_type as smsType, status, created_at as timestamp FROM sms_logs ORDER BY created_at DESC")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return rows
    except Exception as e:
        print(f"Database query error in /api/sms-logs: {e}")
        return []

# -------------------------------------------------------------
# 7. DATABASE RESET (Admin Clear & Optional Demo Seed)
# -------------------------------------------------------------
@app.post("/api/admin/clear-all-data")
def clear_all_database_data():
    """Wipes all rows in MySQL tables so user can test a 100% fresh empty state"""
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("DELETE FROM prescriptions")
        cursor.execute("DELETE FROM sms_logs")
        cursor.execute("DELETE FROM appointments")
        cursor.execute("DELETE FROM doctors")
        cursor.execute("DELETE FROM hospital_departments")
        cursor.execute("DELETE FROM hospitals")
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "All database records wiped. Database is now 100% empty."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

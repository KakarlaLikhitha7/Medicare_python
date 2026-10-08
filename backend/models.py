"""
Mini Project 2: Doctor and Patient Classes
Implements 16-patients per 8-hour workday workload constraint (30 mins per slot)
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

class Patient:
    """
    Patient Class representing an individual seeking medical care.
    Stores personal health details, disease symptoms, vitals, and EHR notes.
    """
    def __init__(
        self,
        patient_id: int,
        name: str,
        age: int,
        phone: str,
        disease: str,
        address: str,
        blood_group: str = "Unknown",
        email: str = "",
        bp: str = "120/80 mmHg",
        heart_rate: str = "74 bpm",
        spo2: str = "98%",
        sugar: str = "96 mg/dL",
        temp: str = "98.4 °F",
        weight: str = "68 kg",
        chronic_conditions: Optional[List[str]] = None,
        allergies: Optional[List[str]] = None
    ):
        self.patient_id = patient_id
        self.name = name
        self.age = age
        self.phone = phone
        self.disease = disease
        self.address = address
        self.blood_group = blood_group
        self.email = email
        self.vitals = {
            "bp": bp,
            "heart_rate": heart_rate,
            "spo2": spo2,
            "sugar": sugar,
            "temp": temp,
            "weight": weight
        }
        self.chronic_conditions = chronic_conditions or []
        self.allergies = allergies or []
        self.medical_history: List[Dict[str, Any]] = []
        self.health_notes: List[Dict[str, Any]] = []

    def update_vitals(self, **kwargs):
        """Nurse updates patient vitals"""
        for k, v in kwargs.items():
            if k in self.vitals:
                self.vitals[k] = v

    def add_health_note(self, note: str, recorded_by: str, role: str = "Staff Nurse"):
        """Staff nurse documents a clinical observation in the EHR"""
        self.health_notes.insert(0, {
            "id": f"note-{len(self.health_notes) + 1}",
            "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "note": note,
            "recorded_by": recorded_by,
            "role": role
        })

    def add_medical_record(self, record: Dict[str, Any]):
        self.medical_history.append(record)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.patient_id,
            "name": self.name,
            "age": self.age,
            "phone": self.phone,
            "disease": self.disease,
            "address": self.address,
            "blood_group": self.blood_group,
            "email": self.email,
            "vitals": self.vitals,
            "chronic_conditions": self.chronic_conditions,
            "allergies": self.allergies,
            "health_notes": self.health_notes
        }


class Doctor:
    """
    Doctor Class representing a medical specialist.
    Core Constraint: A doctor can only handle 16 patients during an 8 hr work day.
    Shift: 09:00 to 17:00 (8 hours total = 16 x 30-minute slots).
    """
    MAX_PATIENTS_PER_DAY = 16
    SHIFT_START = "09:00"
    SHIFT_END = "17:00"
    SLOT_DURATION_MINUTES = 30

    def __init__(
        self,
        doctor_id: str,
        name: str,
        department_id: str,
        hospital_id: str,
        specialization: str,
        qualification: str,
        experience_years: int = 10,
        consultation_fee: float = 600.0,
        cabin: str = "Room 101",
        phone: str = "",
        email: str = ""
    ):
        self.doctor_id = doctor_id
        self.name = name
        self.department_id = department_id
        self.hospital_id = hospital_id
        self.specialization = specialization
        self.qualification = qualification
        self.experience_years = experience_years
        self.consultation_fee = consultation_fee
        self.cabin = cabin
        self.phone = phone
        self.email = email
        # Daily appointments tracker: { "YYYY-MM-DD": [Appointment objects or dicts] }
        self.appointments_by_date: Dict[str, List[Dict[str, Any]]] = {}

    @classmethod
    def generate_daily_slots(cls) -> List[str]:
        """
        Generates the 16 fixed 30-minute slots during the 8-hour workday.
        09:00, 09:30, 10:00, 10:30, 11:00, 11:30, 12:00, 12:30,
        13:00, 13:30, 14:00, 14:30, 15:00, 15:30, 16:00, 16:30
        """
        slots = []
        current = datetime.strptime(cls.SHIFT_START, "%H:%M")
        for _ in range(cls.MAX_PATIENTS_PER_DAY):
            slots.append(current.strftime("%H:%M"))
            current += timedelta(minutes=cls.SLOT_DURATION_MINUTES)
        return slots

    def get_remaining_slots_count(self, appointment_date: str) -> int:
        booked = len(self.appointments_by_date.get(appointment_date, []))
        return max(0, self.MAX_PATIENTS_PER_DAY - booked)

    def is_fully_booked(self, appointment_date: str) -> bool:
        return len(self.appointments_by_date.get(appointment_date, [])) >= self.MAX_PATIENTS_PER_DAY

    def get_slot_availability(self, appointment_date: str) -> List[Dict[str, Any]]:
        """Returns availability map for all 16 slots on a given date"""
        all_slots = self.generate_daily_slots()
        day_appointments = self.appointments_by_date.get(appointment_date, [])
        booked_times = {appt["slot_time"]: appt for appt in day_appointments}

        result = []
        for slot in all_slots:
            if slot in booked_times:
                result.append({
                    "time": slot,
                    "is_available": False,
                    "booked_by": booked_times[slot].get("patient_name"),
                    "appointment_id": booked_times[slot].get("id")
                })
            else:
                result.append({
                    "time": slot,
                    "is_available": True,
                    "booked_by": None,
                    "appointment_id": None
                })
        return result

    def book_appointment(
        self,
        appointment_date: str,
        slot_time: str,
        patient: Patient,
        appointment_id: int
    ) -> Dict[str, Any]:
        """
        Validates 16 patients per day cap and time slot collision before booking.
        """
        if appointment_date not in self.appointments_by_date:
            self.appointments_by_date[appointment_date] = []

        day_appointments = self.appointments_by_date[appointment_date]

        # 1. Enforce 16 patients maximum per 8-hour workday
        if len(day_appointments) >= self.MAX_PATIENTS_PER_DAY:
            raise ValueError(
                f"Workload Cap Reached: Doctor {self.name} can only handle {self.MAX_PATIENTS_PER_DAY} "
                f"patients during the 8-hour workday on {appointment_date}."
            )

        # 2. Check slot collision
        valid_slots = self.generate_daily_slots()
        if slot_time not in valid_slots:
            raise ValueError(f"Invalid time slot {slot_time}. Doctor working hours are 09:00 - 17:00.")

        if any(appt["slot_time"] == slot_time for appt in day_appointments):
            raise ValueError(f"Time slot {slot_time} is already booked for Dr. {self.name} on {appointment_date}.")

        # Determine day name
        day_name = datetime.strptime(appointment_date, "%Y-%m-%d").strftime("%A")

        appointment = {
            "id": appointment_id,
            "sn": len(day_appointments) + 1,
            "patient_id": patient.patient_id,
            "patient_name": patient.name,
            "patient_age": patient.age,
            "patient_phone": patient.phone,
            "patient_disease": patient.disease,
            "patient_address": patient.address,
            "doctor_id": self.doctor_id,
            "doctor_name": self.name,
            "appointment_date": appointment_date,
            "appointment_day": day_name,
            "slot_time": slot_time,
            "status": "Scheduled",
            "created_at": datetime.now().isoformat()
        }

        day_appointments.append(appointment)
        return appointment

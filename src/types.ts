export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  distanceKm: number;
  rating: number;
  phone: string;
  emergencyPhone: string;
  departments: string[];
}

export interface Department {
  id: string;
  name: string;
  description: string;
  icon: string;
  hospitalIds: string[];
}

export interface Doctor {
  id: string;
  name: string;
  departmentId: string;
  hospitalId: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  cabin: string;
  phone: string;
  email: string;
  rating: number;
  bio: string;
  maxPatientsPerDay: number; // 16
  shiftStart: string;
  shiftEnd: string;
}

export interface SlotStatus {
  time: string;
  isAvailable: boolean;
  bookedBy: string | null;
  appointmentId: number | null;
  disease: string | null;
}

export interface DoctorSlotsData {
  doctorId: string;
  doctorName: string;
  date: string;
  maxPatientsPerDay: number;
  bookedCount: number;
  remainingSlots: number;
  isFullyBooked: boolean;
  slots: SlotStatus[];
}

export interface Appointment {
  id: number;
  sn?: number;
  patientId?: string;
  patientName: string;
  patientAge: number;
  patientPhone: string;
  patientDisease: string;
  patientAddress: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  hospitalName: string;
  departmentName: string;
  appointmentDate: string;
  appointmentDay: string;
  slotTime: string;
  status: 'Scheduled' | 'In Consultation' | 'Completed' | 'Cancelled';
  notes?: string;
  createdAt: string;
}

export interface Prescription {
  id: string;
  appointmentId: number;
  patientName: string;
  doctorName: string;
  specialization: string;
  hospitalName: string;
  date: string;
  diagnosis: string;
  symptoms: string;
  medicines: {
    name: string;
    dosage: string;
    timing: string;
    duration: string;
  }[];
  advice: string;
  followUpDate: string;
}

export interface SMSLog {
  id: string;
  toPhone: string;
  patientName: string;
  message: string;
  type: 'CONFIRMATION' | 'REMINDER_24H' | 'REMINDER_2H' | 'CANCELLATION';
  timestamp: string;
  status: 'Delivered';
}

export interface Bill {
  id: string;
  appointmentId: number;
  patientName: string;
  doctorName: string;
  hospitalName: string;
  date: string;
  items: { description: string; amount: number }[];
  subtotal: number;
  tax: number;
  insuranceDiscount: number;
  total: number;
  status: 'Paid' | 'Pending' | 'Insurance Claimed';
}

export type BillRecord = Bill;

export interface TriageResult {
  recommendedDepartment: string;
  recommendedSpecialist: string;
  matchedDoctorName: string;
  urgencyLevel: 'Routine' | 'Moderate' | 'Priority' | 'Emergency';
  summaryDiagnosis: string;
  keyQuestionsForDoctor: string[];
  immediateCareAdvice: string;
  redFlagWarnings: string;
}

export interface VitalsData {
  bp: string;
  heartRate: string;
  spo2: string;
  sugar: string;
  temp: string;
  weight: string;
  respirationRate?: string;
  lastUpdated: string;
  recordedBy: string;
}

export interface HealthNote {
  id: string;
  date: string;
  note: string;
  recordedBy: string;
  role: string;
}

export interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  hospitalId?: string;
  hospitalName?: string;
  vitals: VitalsData;
  chronicConditions: string[];
  allergies: string[];
  healthNotes: HealthNote[];
}

export interface UserSession {
  role: 'admin' | 'hospital' | 'doctor' | 'patient' | 'nurse';
  name: string;
  email: string;
  phone?: string;
  doctorId?: string;
  patientId?: string;
  department?: string;
  hospitalId?: string;
  hospitalName?: string;
}


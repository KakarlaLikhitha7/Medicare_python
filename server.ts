import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini SDK server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// ==========================================
// IN-MEMORY RELATIONAL DATABASE (MySQL Schema simulation)
// ==========================================

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
  maxPatientsPerDay: number; // 16 patients per 8-hr workday
  shiftStart: string; // "09:00"
  shiftEnd: string; // "17:00"
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

export interface Patient {
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
  appointmentDate: string; // YYYY-MM-DD
  appointmentDay: string; // "Monday", etc.
  slotTime: string; // "09:00", "09:30", etc.
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
    timing: string; // "After Food" / "Before Food"
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

// 16 30-minute standard daily slots (8-hour shift from 09:00 to 17:00)
export const STANDARD_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
];

// Seed Data
let hospitals: Hospital[] = [
  {
    id: 'hosp-1',
    name: 'City Care General Hospital',
    address: '42 Medical Boulevard, Central District',
    city: 'Pune',
    distanceKm: 0.8,
    rating: 4.9,
    phone: '+91 20 2567 8900',
    emergencyPhone: '108',
    departments: ['dept-1', 'dept-2', 'dept-3', 'dept-4', 'dept-5'],
  },
  {
    id: 'hosp-2',
    name: 'Apollo Health City & Research Center',
    address: '15 High Tech Avenue, Baner',
    city: 'Pune',
    distanceKm: 2.3,
    rating: 4.8,
    phone: '+91 20 6688 1234',
    emergencyPhone: '102',
    departments: ['dept-1', 'dept-2', 'dept-3', 'dept-6', 'dept-7'],
  },
  {
    id: 'hosp-3',
    name: 'Metro Superspecialty Healthcare',
    address: '88 Station Link Road, Shivaji Nagar',
    city: 'Pune',
    distanceKm: 3.5,
    rating: 4.7,
    phone: '+91 20 2445 7788',
    emergencyPhone: '112',
    departments: ['dept-1', 'dept-4', 'dept-5', 'dept-6'],
  },
  {
    id: 'hosp-4',
    name: 'Sunrise Family & Children Hospital',
    address: '102 Green Park Avenue, Kothrud',
    city: 'Pune',
    distanceKm: 5.1,
    rating: 4.9,
    phone: '+91 20 2544 3322',
    emergencyPhone: '108',
    departments: ['dept-3', 'dept-4', 'dept-7'],
  },
];

const departments: Department[] = [
  {
    id: 'dept-1',
    name: 'Pulmonology & Respiratory Care',
    description: 'Expert care for respiratory disorders, viral pneumonia, COVID-19 & asthma.',
    icon: 'Stethoscope',
    hospitalIds: ['hosp-1', 'hosp-2', 'hosp-3'],
  },
  {
    id: 'dept-2',
    name: 'Cardiology',
    description: 'Comprehensive heart care, coronary diagnostics, hypertension and ECG monitoring.',
    icon: 'HeartPulse',
    hospitalIds: ['hosp-1', 'hosp-2'],
  },
  {
    id: 'dept-3',
    name: 'General Medicine & Infectious Diseases',
    description: 'Primary care, viral fever management, diabetes, infections and general wellness.',
    icon: 'Activity',
    hospitalIds: ['hosp-1', 'hosp-2', 'hosp-4'],
  },
  {
    id: 'dept-4',
    name: 'Pediatrics',
    description: 'Specialized healthcare for infants, children, immunization and child development.',
    icon: 'Baby',
    hospitalIds: ['hosp-1', 'hosp-3', 'hosp-4'],
  },
  {
    id: 'dept-5',
    name: 'Orthopedics & Joint Care',
    description: 'Bone fractures, arthritis, joint replacements and musculoskeletal therapy.',
    icon: 'Bone',
    hospitalIds: ['hosp-1', 'hosp-3'],
  },
  {
    id: 'dept-6',
    name: 'Neurology & Brain Sciences',
    description: 'Diagnosis and care for chronic migraines, epilepsy, nerve disorders and stroke.',
    icon: 'Brain',
    hospitalIds: ['hosp-2', 'hosp-3'],
  },
  {
    id: 'dept-7',
    name: 'Dermatology & Skin Health',
    description: 'Skin allergies, eczema, acne solutions, cosmetic dermatology and biopsy.',
    icon: 'Sparkles',
    hospitalIds: ['hosp-2', 'hosp-4'],
  },
];

let doctors: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Ramesh',
    departmentId: 'dept-1',
    hospitalId: 'hosp-1',
    specialization: 'Senior Pulmonologist & Critical Care',
    qualification: 'MBBS, MD (Pulmonary Medicine), FCCP',
    experienceYears: 16,
    consultationFee: 600,
    cabin: 'Room 204, 2nd Floor',
    phone: '+91 98230 11223',
    email: 'dr.ramesh@citycare.org',
    rating: 4.9,
    bio: 'Renowned respiratory specialist with 16+ years experience treating respiratory viral infections, asthma, and chronic bronchitis.',
    maxPatientsPerDay: 16,
    shiftStart: '09:00',
    shiftEnd: '17:00',
  },
  {
    id: 'doc-2',
    name: 'Dr. Priyanka',
    departmentId: 'dept-3',
    hospitalId: 'hosp-1',
    specialization: 'Infectious Disease Specialist & Physician',
    qualification: 'MBBS, MD (General Medicine), DNB',
    experienceYears: 12,
    consultationFee: 550,
    cabin: 'Room 108, 1st Floor',
    phone: '+91 98230 44556',
    email: 'dr.priyanka@citycare.org',
    rating: 4.8,
    bio: 'Lead physician for infectious epidemiology, fever management, diabetes management and preventive health.',
    maxPatientsPerDay: 16,
    shiftStart: '09:00',
    shiftEnd: '17:00',
  },
  {
    id: 'doc-3',
    name: 'Dr. Rajesh Mehta',
    departmentId: 'dept-2',
    hospitalId: 'hosp-2',
    specialization: 'Senior Interventional Cardiologist',
    qualification: 'MBBS, MD, DM (Cardiology)',
    experienceYears: 20,
    consultationFee: 850,
    cabin: 'CathLab Suite B, Apollo Tower',
    phone: '+91 98231 77889',
    email: 'dr.mehta@apollo.org',
    rating: 4.95,
    bio: 'Over 5,000 successful cardiac interventions. Specialist in hypertension and preventative cardiology.',
    maxPatientsPerDay: 16,
    shiftStart: '09:00',
    shiftEnd: '17:00',
  },
  {
    id: 'doc-4',
    name: 'Dr. Sunita Rao',
    departmentId: 'dept-6',
    hospitalId: 'hosp-2',
    specialization: 'Consultant Neurologist',
    qualification: 'MBBS, MD, DM (Neurology)',
    experienceYears: 14,
    consultationFee: 800,
    cabin: 'Neuro Suite 305, Apollo Tower',
    phone: '+91 98232 99001',
    email: 'dr.sunita@apollo.org',
    rating: 4.85,
    bio: 'Specialist in migraine alleviation, neuropathies, vertigo, and movement disorders.',
    maxPatientsPerDay: 16,
    shiftStart: '09:00',
    shiftEnd: '17:00',
  },
  {
    id: 'doc-5',
    name: 'Dr. Arvind Patel',
    departmentId: 'dept-5',
    hospitalId: 'hosp-3',
    specialization: 'Orthopedic & Joint Replacement Surgeon',
    qualification: 'MBBS, MS (Ortho), M.Ch (UK)',
    experienceYears: 18,
    consultationFee: 750,
    cabin: 'Cabin 112, Metro Ortho Wing',
    phone: '+91 98233 22334',
    email: 'dr.arvind@metrohealth.org',
    rating: 4.9,
    bio: 'Expert in sports injuries, arthroscopy, joint reconstruction, and spinal ergonomics.',
    maxPatientsPerDay: 16,
    shiftStart: '09:00',
    shiftEnd: '17:00',
  },
  {
    id: 'doc-6',
    name: 'Dr. Ananya Sharma',
    departmentId: 'dept-4',
    hospitalId: 'hosp-4',
    specialization: 'Consultant Pediatrician & Neonatologist',
    qualification: 'MBBS, MD (Pediatrics), DCH',
    experienceYears: 11,
    consultationFee: 500,
    cabin: 'Kiddie Wing Room 12, Sunrise',
    phone: '+91 98234 55667',
    email: 'dr.ananya@sunrisekids.org',
    rating: 4.9,
    bio: 'Compassionate pediatric care, developmental milestone tracking, and newborn intensive care.',
    maxPatientsPerDay: 16,
    shiftStart: '09:00',
    shiftEnd: '17:00',
  },
];

// Seed Appointments exactly matching the user's uploaded Screenshot 3 & 4!
// In Screenshot 3:
// 1 | 1 | Kamlesh | COVID-19 | Dr. Ramesh | 2022-07-11 | 09:00 | Monday
// 2 | 2 | Sa | COVID-19 | Dr. Ramesh | 2022-07-11 | 09:30 | Monday
// ... up to 15 appointments
let appointments: Appointment[] = [
  {
    id: 1,
    sn: 1,
    patientId: 'p-1',
    patientName: 'Kamlesh',
    patientAge: 38,
    patientPhone: '9876543210',
    patientDisease: 'COVID-19',
    patientAddress: 'Camp, Pune',
    doctorId: 'doc-1',
    doctorName: 'Dr. Ramesh',
    hospitalId: 'hosp-1',
    hospitalName: 'City Care General Hospital',
    departmentName: 'Pulmonology & Respiratory Care',
    appointmentDate: '2022-07-11',
    appointmentDay: 'Monday',
    slotTime: '09:00',
    status: 'Scheduled',
    notes: 'Mild chest tightness and low-grade pyrexia for 3 days.',
    createdAt: '2022-07-10T14:20:00Z',
  },
  {
    id: 2,
    sn: 2,
    patientId: 'p-2',
    patientName: 'Sa',
    patientAge: 24,
    patientPhone: '7865432123',
    patientDisease: 'COVID-19',
    patientAddress: 'Pune',
    doctorId: 'doc-1',
    doctorName: 'Dr. Ramesh',
    hospitalId: 'hosp-1',
    hospitalName: 'City Care General Hospital',
    departmentName: 'Pulmonology & Respiratory Care',
    appointmentDate: '2022-07-11',
    appointmentDay: 'Monday',
    slotTime: '09:30',
    status: 'Scheduled',
    notes: 'Dry cough and loss of smell.',
    createdAt: '2022-07-10T15:10:00Z',
  },
  {
    id: 3,
    sn: 3,
    patientId: 'p-3',
    patientName: 'Deepak Kumar',
    patientAge: 45,
    patientPhone: '9822114455',
    patientDisease: 'COVID-19',
    patientAddress: 'Kothrud, Pune',
    doctorId: 'doc-1',
    doctorName: 'Dr. Ramesh',
    hospitalId: 'hosp-1',
    hospitalName: 'City Care General Hospital',
    departmentName: 'Pulmonology & Respiratory Care',
    appointmentDate: '2022-07-11',
    appointmentDay: 'Monday',
    slotTime: '10:00',
    status: 'Scheduled',
    notes: 'High CRP and SpO2 96%. Needs chest auscultation.',
    createdAt: '2022-07-10T16:00:00Z',
  },
  {
    id: 4,
    sn: 4,
    patientId: 'p-4',
    patientName: 'Raj Kamal',
    patientAge: 32,
    patientPhone: '9844223311',
    patientDisease: 'COVID-19',
    patientAddress: 'Hadapsar, Pune',
    doctorId: 'doc-1',
    doctorName: 'Dr. Ramesh',
    hospitalId: 'hosp-1',
    hospitalName: 'City Care General Hospital',
    departmentName: 'Pulmonology & Respiratory Care',
    appointmentDate: '2022-07-11',
    appointmentDay: 'Monday',
    slotTime: '10:30',
    status: 'Scheduled',
    notes: 'Sore throat and body aches.',
    createdAt: '2022-07-10T16:30:00Z',
  },
  {
    id: 5,
    sn: 5,
    patientId: 'p-5',
    patientName: 'Seema Devi',
    patientAge: 51,
    patientPhone: '9922334411',
    patientDisease: 'COVID-19',
    patientAddress: 'Aundh, Pune',
    doctorId: 'doc-1',
    doctorName: 'Dr. Ramesh',
    hospitalId: 'hosp-1',
    hospitalName: 'City Care General Hospital',
    departmentName: 'Pulmonology & Respiratory Care',
    appointmentDate: '2022-07-11',
    appointmentDay: 'Monday',
    slotTime: '11:00',
    status: 'Scheduled',
    notes: 'Diabetic comorbidity; respiratory checkup.',
    createdAt: '2022-07-10T17:15:00Z',
  },
  {
    id: 6,
    sn: 6,
    patientId: 'p-6',
    patientName: 'Suneeta Kumari',
    patientAge: 29,
    patientPhone: '9855112233',
    patientDisease: 'FEVER',
    patientAddress: 'Viman Nagar, Pune',
    doctorId: 'doc-1',
    doctorName: 'Dr. Ramesh',
    hospitalId: 'hosp-1',
    hospitalName: 'City Care General Hospital',
    departmentName: 'Pulmonology & Respiratory Care',
    appointmentDate: '2022-07-11',
    appointmentDay: 'Monday',
    slotTime: '11:30',
    status: 'Scheduled',
    notes: 'Intermittent chills and viral symptoms.',
    createdAt: '2022-07-10T18:00:00Z',
  },
  {
    id: 7,
    sn: 7,
    patientId: 'p-7',
    patientName: 'Ram Krishan',
    patientAge: 62,
    patientPhone: '9766554433',
    patientDisease: 'COVID-19',
    patientAddress: 'Deccan, Pune',
    doctorId: 'doc-1',
    doctorName: 'Dr. Ramesh',
    hospitalId: 'hosp-1',
    hospitalName: 'City Care General Hospital',
    departmentName: 'Pulmonology & Respiratory Care',
    appointmentDate: '2022-07-11',
    appointmentDay: 'Monday',
    slotTime: '12:00',
    status: 'Scheduled',
    notes: 'Senior citizen follow-up.',
    createdAt: '2022-07-10T18:20:00Z',
  },
  {
    id: 8,
    sn: 8,
    patientId: 'p-8',
    patientName: 'Ravi Kumar',
    patientAge: 35,
    patientPhone: '9833441122',
    patientDisease: 'COVID-19',
    patientAddress: 'Baner, Pune',
    doctorId: 'doc-1',
    doctorName: 'Dr. Ramesh',
    hospitalId: 'hosp-1',
    hospitalName: 'City Care General Hospital',
    departmentName: 'Pulmonology & Respiratory Care',
    appointmentDate: '2022-07-11',
    appointmentDay: 'Monday',
    slotTime: '12:30',
    status: 'Scheduled',
    notes: 'Post-viral fatigue and mild dyspnea.',
    createdAt: '2022-07-10T19:00:00Z',
  },
  {
    id: 9,
    sn: 9,
    patientId: 'p-9',
    patientName: 'Sateesh Kumar',
    patientAge: 41,
    patientPhone: '9811224455',
    patientDisease: 'COVID-19',
    patientAddress: 'Wakad, Pune',
    doctorId: 'doc-1',
    doctorName: 'Dr. Ramesh',
    hospitalId: 'hosp-1',
    hospitalName: 'City Care General Hospital',
    departmentName: 'Pulmonology & Respiratory Care',
    appointmentDate: '2022-07-11',
    appointmentDay: 'Monday',
    slotTime: '13:00',
    status: 'Scheduled',
    notes: 'Check breath sounds and clear airways.',
    createdAt: '2022-07-10T19:30:00Z',
  },
  {
    id: 10,
    sn: 10,
    patientId: 'p-10',
    patientName: 'Suneel Sharma',
    patientAge: 39,
    patientPhone: '9822336677',
    patientDisease: 'COVID-19',
    patientAddress: 'Koregaon Park, Pune',
    doctorId: 'doc-1',
    doctorName: 'Dr. Ramesh',
    hospitalId: 'hosp-1',
    hospitalName: 'City Care General Hospital',
    departmentName: 'Pulmonology & Respiratory Care',
    appointmentDate: '2022-07-11',
    appointmentDay: 'Monday',
    slotTime: '13:30',
    status: 'Scheduled',
    notes: 'Persistent nocturnal cough.',
    createdAt: '2022-07-10T20:00:00Z',
  },
  {
    id: 11,
    sn: 11,
    patientId: 'p-11',
    patientName: 'Shivam Panday',
    patientAge: 27,
    patientPhone: '9844551122',
    patientDisease: 'COVID-19',
    patientAddress: 'Bhosari, Pune',
    doctorId: 'doc-1',
    doctorName: 'Dr. Ramesh',
    hospitalId: 'hosp-1',
    hospitalName: 'City Care General Hospital',
    departmentName: 'Pulmonology & Respiratory Care',
    appointmentDate: '2022-07-11',
    appointmentDay: 'Monday',
    slotTime: '14:00',
    status: 'Scheduled',
    notes: 'Chest congestion.',
    createdAt: '2022-07-10T20:30:00Z',
  },
  {
    id: 12,
    sn: 12,
    patientId: 'p-12',
    patientName: 'Vineeta Sharma',
    patientAge: 34,
    patientPhone: '9899887766',
    patientDisease: 'COVID-19',
    patientAddress: 'Model Colony, Pune',
    doctorId: 'doc-1',
    doctorName: 'Dr. Ramesh',
    hospitalId: 'hosp-1',
    hospitalName: 'City Care General Hospital',
    departmentName: 'Pulmonology & Respiratory Care',
    appointmentDate: '2022-07-11',
    appointmentDay: 'Monday',
    slotTime: '14:30',
    status: 'Scheduled',
    notes: 'Second week post-exposure evaluation.',
    createdAt: '2022-07-10T21:00:00Z',
  },
  {
    id: 13,
    sn: 13,
    patientId: 'p-13',
    patientName: 'Vishwareshar Kumar',
    patientAge: 58,
    patientPhone: '9822998811',
    patientDisease: 'COVID-19',
    patientAddress: 'Pimpri, Pune',
    doctorId: 'doc-1',
    doctorName: 'Dr. Ramesh',
    hospitalId: 'hosp-1',
    hospitalName: 'City Care General Hospital',
    departmentName: 'Pulmonology & Respiratory Care',
    appointmentDate: '2022-07-11',
    appointmentDay: 'Monday',
    slotTime: '15:00',
    status: 'Scheduled',
    notes: 'Review blood reports and D-Dimer.',
    createdAt: '2022-07-10T21:30:00Z',
  },
  {
    id: 14,
    sn: 14,
    patientId: 'p-14',
    patientName: 'Radha Panday',
    patientAge: 48,
    patientPhone: '9811447788',
    patientDisease: 'COVID-19',
    patientAddress: 'Swargate, Pune',
    doctorId: 'doc-1',
    doctorName: 'Dr. Ramesh',
    hospitalId: 'hosp-1',
    hospitalName: 'City Care General Hospital',
    departmentName: 'Pulmonology & Respiratory Care',
    appointmentDate: '2022-07-11',
    appointmentDay: 'Monday',
    slotTime: '15:30',
    status: 'Scheduled',
    notes: 'Inhaler prescription refill.',
    createdAt: '2022-07-10T22:00:00Z',
  },
  {
    id: 15,
    sn: 15,
    patientId: 'p-15',
    patientName: 'Sohan Raj',
    patientAge: 31,
    patientPhone: '9877443322',
    patientDisease: 'COVID-19',
    patientAddress: 'Katraj, Pune',
    doctorId: 'doc-2',
    doctorName: 'Dr. Priyanka',
    hospitalId: 'hosp-1',
    hospitalName: 'City Care General Hospital',
    departmentName: 'General Medicine & Infectious Diseases',
    appointmentDate: '2022-07-11',
    appointmentDay: 'Monday',
    slotTime: '09:00',
    status: 'Scheduled',
    notes: 'Infectious disease consultation.',
    createdAt: '2022-07-10T22:30:00Z',
  },
];

// Seed Prescriptions
const prescriptions: Prescription[] = [
  {
    id: 'rx-101',
    appointmentId: 1,
    patientName: 'Kamlesh',
    doctorName: 'Dr. Ramesh',
    specialization: 'Senior Pulmonologist',
    hospitalName: 'City Care General Hospital',
    date: '2022-07-11',
    diagnosis: 'Acute Viral Bronchitis / Post-COVID Bronchial Hyper-reactivity',
    symptoms: 'Dry persistent cough, chest tightness, low-grade fever.',
    medicines: [
      {
        name: 'Tab. Paracetamol 650mg',
        dosage: '1 tablet thrice daily for 3 days',
        timing: 'After Food',
        duration: '3 days',
      },
      {
        name: 'Levocetirizine + Montelukast (10mg/5mg)',
        dosage: '1 tablet at bedtime',
        timing: 'Night after dinner',
        duration: '7 days',
      },
      {
        name: 'Budesonide 200mcg Inhaler',
        dosage: '2 puffs twice daily with spacer',
        timing: 'Morning & Night (Rinse mouth after use)',
        duration: '14 days',
      },
    ],
    advice:
      'Steam inhalation twice daily. Maintain hydration with warm fluids. Monitor pulse oximeter SpO2 3 times daily. Contact emergency if SpO2 drops below 94%.',
    followUpDate: '2022-07-18',
  },
  {
    id: 'rx-102',
    appointmentId: 2,
    patientName: 'Sa',
    doctorName: 'Dr. Ramesh',
    specialization: 'Senior Pulmonologist',
    hospitalName: 'City Care General Hospital',
    date: '2022-07-11',
    diagnosis: 'Mild Upper Respiratory Tract Infection (COVID-19 Positive)',
    symptoms: 'Loss of smell, mild sore throat, fatigue.',
    medicines: [
      {
        name: 'Tab. Vitamin C 500mg + Zinc 50mg',
        dosage: '1 tablet once daily',
        timing: 'After Lunch',
        duration: '10 days',
      },
      {
        name: 'Warm Saline Gargles',
        dosage: '3 times daily',
        timing: 'Morning, Afternoon, Night',
        duration: '5 days',
      },
    ],
    advice:
      'Strict home isolation for 7 days. High protein diet. Adequate rest. Avoid cold foods.',
    followUpDate: '2022-07-20',
  },
];

// Seed SMS Logs
const smsLogs: SMSLog[] = [
  {
    id: 'sms-1',
    toPhone: '9876543210',
    patientName: 'Kamlesh',
    message:
      'MediCare Alert: Your appointment #1 with Dr. Ramesh is CONFIRMED for Monday 11 July 2022 at 09:00 AM at City Care General Hospital (Cabin 204). Please arrive 10 mins prior.',
    type: 'CONFIRMATION',
    timestamp: '2022-07-10 14:21:05',
    status: 'Delivered',
  },
  {
    id: 'sms-2',
    toPhone: '7865432123',
    patientName: 'Sa',
    message:
      'MediCare Alert: Your appointment #2 with Dr. Ramesh is CONFIRMED for Monday 11 July 2022 at 09:30 AM at City Care General Hospital. Ref ID: 2.',
    type: 'CONFIRMATION',
    timestamp: '2022-07-10 15:10:45',
    status: 'Delivered',
  },
];

// Seed Patients with EHR Vitals, Chronic Conditions, Allergies, and Nurse Clinical Notes
const patients: Patient[] = [
  {
    id: 'p-1',
    name: 'Kamlesh',
    age: 38,
    gender: 'Male',
    phone: '9876543210',
    email: 'kamlesh.p@gmail.com',
    address: 'Camp, Pune',
    bloodGroup: 'B+',
    hospitalId: 'hosp-1',
    hospitalName: 'City Care General Hospital',
    vitals: {
      bp: '120/80 mmHg',
      heartRate: '74 bpm',
      spo2: '98%',
      sugar: '96 mg/dL',
      temp: '98.4 °F',
      weight: '68 kg',
      respirationRate: '16 breaths/min',
      lastUpdated: '2022-07-11 08:45 AM',
      recordedBy: 'Nurse Priya (City Care General Hospital)',
    },
    chronicConditions: [
      'Post-viral bronchial sensitivity',
      'Mild seasonal asthma',
    ],
    allergies: ['Penicillin', 'Sulfa drugs'],
    healthNotes: [
      {
        id: 'note-1',
        date: '2022-07-11 08:50',
        note: 'Pre-consultation intake: Blood pressure normal (120/80). Lungs clear, SpO2 98% on room air. Advised patient to wear mask during consultation.',
        recordedBy: 'Nurse Priya',
        role: 'Staff Nurse',
      },
      {
        id: 'note-2',
        date: '2022-07-09 14:15',
        note: 'Triage assessment: Patient reported dry cough following mild fever 3 days ago. No respiratory distress. Referred to Pulmonology department.',
        recordedBy: 'Nurse Anita',
        role: 'Triage Nurse',
      },
    ],
  },
  {
    id: 'p-2',
    name: 'Sa',
    age: 24,
    gender: 'Female',
    phone: '7865432123',
    email: 'sa.user@gmail.com',
    address: 'Pune',
    bloodGroup: 'O+',
    hospitalId: 'hosp-1',
    hospitalName: 'City Care General Hospital',
    vitals: {
      bp: '115/75 mmHg',
      heartRate: '78 bpm',
      spo2: '99%',
      sugar: '92 mg/dL',
      temp: '98.6 °F',
      weight: '54 kg',
      respirationRate: '15 breaths/min',
      lastUpdated: '2022-07-11 09:15 AM',
      recordedBy: 'Nurse Priya (City Care General Hospital)',
    },
    chronicConditions: ['None recorded'],
    allergies: ['None known'],
    healthNotes: [
      {
        id: 'note-3',
        date: '2022-07-11 09:20',
        note: 'Baseline vitals measured in OPD. Temperature afebrile. Oxygen saturation excellent.',
        recordedBy: 'Nurse Priya',
        role: 'Staff Nurse',
      },
    ],
  },
  {
    id: 'p-3',
    name: 'Deepak Kumar',
    age: 45,
    gender: 'Male',
    phone: '9822114455',
    email: 'deepak.k@gmail.com',
    address: 'Kothrud, Pune',
    bloodGroup: 'A+',
    hospitalId: 'hosp-2',
    hospitalName: 'Apex Multispeciality Hospital',
    vitals: {
      bp: '135/88 mmHg',
      heartRate: '82 bpm',
      spo2: '97%',
      sugar: '118 mg/dL',
      temp: '98.2 °F',
      weight: '76 kg',
      respirationRate: '18 breaths/min',
      lastUpdated: '2022-07-10 16:30 PM',
      recordedBy: 'Nurse Sunita (Apex Multispeciality)',
    },
    chronicConditions: ['Hypertension', 'Pre-diabetes'],
    allergies: ['NSAIDs / Ibuprofen'],
    healthNotes: [
      {
        id: 'note-4',
        date: '2022-07-10 16:35',
        note: 'BP slightly elevated at 135/88. Advised reducing dietary sodium and scheduled regular cardiology BP checks.',
        recordedBy: 'Nurse Sunita',
        role: 'Senior Nurse',
      },
    ],
  },
];

// Billing records
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

const bills: Bill[] = [
  {
    id: 'INV-2022-001',
    appointmentId: 1,
    patientName: 'Kamlesh',
    doctorName: 'Dr. Ramesh',
    hospitalName: 'City Care General Hospital',
    date: '2022-07-11',
    items: [
      { description: 'Specialist Consultation (Pulmonology)', amount: 600 },
      { description: 'Digital Chest Spirometry & Peak Flow', amount: 450 },
      { description: 'Vitals & Oxygen Saturation Check', amount: 150 },
    ],
    subtotal: 1200,
    tax: 60,
    insuranceDiscount: 300,
    total: 960,
    status: 'Paid',
  },
  {
    id: 'INV-2022-002',
    appointmentId: 2,
    patientName: 'Sa',
    doctorName: 'Dr. Ramesh',
    hospitalName: 'City Care General Hospital',
    date: '2022-07-11',
    items: [
      { description: 'Doctor Consultation (Dr. Ramesh)', amount: 600 },
      { description: 'Rapid Antigen Diagnostic Screen', amount: 300 },
    ],
    subtotal: 900,
    tax: 45,
    insuranceDiscount: 0,
    total: 945,
    status: 'Pending',
  },
];

// ==========================================
// API ROUTES
// ==========================================

// Hospitals
app.get('/api/hospitals', (_req: Request, res: Response) => {
  res.json(hospitals);
});

// Admin creates a new hospital
app.post('/api/hospitals', (req: Request, res: Response) => {
  try {
    const { name, address, city, distanceKm, rating, phone, emergencyPhone, departments: deptList } = req.body;
    if (!name || !address) {
      return res.status(400).json({ error: 'Hospital Name and Address are required.' });
    }

    const newHosp: Hospital = {
      id: 'hosp-' + Date.now(),
      name: name.trim(),
      address: address.trim(),
      city: city?.trim() || 'Pune',
      distanceKm: Number(distanceKm) || 1.5,
      rating: Number(rating) || 4.8,
      phone: phone?.trim() || '+91 20 2000 0000',
      emergencyPhone: emergencyPhone?.trim() || '108',
      departments: Array.isArray(deptList) && deptList.length > 0 ? deptList : ['dept-1', 'dept-3'],
    };

    hospitals.unshift(newHosp);
    res.status(201).json({ message: 'Hospital added successfully', hospital: newHosp });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error adding hospital' });
  }
});

app.put('/api/hospitals/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = hospitals.findIndex((h) => h.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Hospital not found' });
  }
  hospitals[index] = { ...hospitals[index], ...req.body };
  res.json({ message: 'Hospital updated successfully', hospital: hospitals[index] });
});

app.delete('/api/hospitals/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = hospitals.findIndex((h) => h.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Hospital not found' });
  }
  const deleted = hospitals.splice(index, 1)[0];
  res.json({ message: 'Hospital removed successfully', hospital: deleted });
});

// Departments
app.get('/api/departments', (_req: Request, res: Response) => {
  res.json(departments);
});

// Doctors
app.get('/api/doctors', (req: Request, res: Response) => {
  let filtered = [...doctors];
  const { hospitalId, departmentId } = req.query;
  if (hospitalId) {
    filtered = filtered.filter((d) => d.hospitalId === hospitalId);
  }
  if (departmentId) {
    filtered = filtered.filter((d) => d.departmentId === departmentId);
  }
  res.json(filtered);
});

// Doctor Signup / Registration with Hospital & Department
app.post('/api/doctors', (req: Request, res: Response) => {
  try {
    const {
      name,
      hospitalId,
      departmentId,
      specialization,
      qualification,
      experienceYears,
      consultationFee,
      cabin,
      phone,
      email,
      bio,
    } = req.body;

    if (!name || !hospitalId || !departmentId) {
      return res.status(400).json({ error: 'Doctor Name, Hospital, and Department are required.' });
    }

    const docId = 'doc-' + Date.now();
    const newDoc: Doctor = {
      id: docId,
      name: name.startsWith('Dr. ') ? name : `Dr. ${name}`,
      hospitalId,
      departmentId,
      specialization: specialization || 'Consultant Specialist',
      qualification: qualification || 'MBBS, MD',
      experienceYears: Number(experienceYears) || 5,
      consultationFee: Number(consultationFee) || 600,
      cabin: cabin || 'Room 101',
      phone: phone || '+91 98000 00000',
      email: email || `${docId}@medicare.org`,
      rating: 4.9,
      bio: bio || 'Compassionate clinical practitioner.',
      maxPatientsPerDay: 16, // Mini project constraint: 16 patients per 8-hr workday
      shiftStart: '09:00',
      shiftEnd: '17:00',
    };

    doctors.push(newDoc);

    // Ensure hospital links to this department
    const hosp = hospitals.find((h) => h.id === hospitalId);
    if (hosp && !hosp.departments.includes(departmentId)) {
      hosp.departments.push(departmentId);
    }

    res.status(201).json({ message: 'Doctor registered successfully with hospital!', doctor: newDoc });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error creating doctor' });
  }
});

// Doctor Slots and 16-patient daily workload verification
app.get('/api/doctors/:doctorId/slots', (req: Request, res: Response) => {
  const { doctorId } = req.params;
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const doctor = doctors.find((d) => d.id === doctorId);
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  // Find all appointments for this doctor on this specific date
  const bookedAppointments = appointments.filter(
    (a) => a.doctorId === doctorId && a.appointmentDate === date && a.status !== 'Cancelled'
  );

  const bookedSlots = bookedAppointments.map((a) => a.slotTime);
  const slotsStatus = STANDARD_SLOTS.map((slot) => {
    const isBooked = bookedSlots.includes(slot);
    const appt = bookedAppointments.find((a) => a.slotTime === slot);
    return {
      time: slot,
      isAvailable: !isBooked,
      bookedBy: isBooked ? appt?.patientName : null,
      appointmentId: isBooked ? appt?.id : null,
      disease: isBooked ? appt?.patientDisease : null,
    };
  });

  const bookedCount = bookedAppointments.length;
  const maxCapacity = doctor.maxPatientsPerDay; // 16
  const remainingSlots = Math.max(0, maxCapacity - bookedCount);
  const isFullyBooked = bookedCount >= maxCapacity;

  res.json({
    doctorId: doctor.id,
    doctorName: doctor.name,
    date,
    maxPatientsPerDay: maxCapacity,
    bookedCount,
    remainingSlots,
    isFullyBooked,
    slots: slotsStatus,
  });
});

// Appointments list
app.get('/api/appointments', (req: Request, res: Response) => {
  let list = [...appointments];
  const { doctorId, date, patientPhone, patientName, hospitalId } = req.query;

  if (hospitalId) {
    list = list.filter((a) => a.hospitalId === hospitalId);
  }
  if (doctorId) {
    list = list.filter((a) => a.doctorId === doctorId);
  }
  if (date) {
    list = list.filter((a) => a.appointmentDate === date);
  }
  if (patientPhone) {
    list = list.filter((a) => a.patientPhone.includes(patientPhone as string));
  }
  if (patientName) {
    list = list.filter((a) =>
      a.patientName.toLowerCase().includes((patientName as string).toLowerCase())
    );
  }

  // Sort by date, slotTime
  list.sort((a, b) => {
    if (a.appointmentDate === b.appointmentDate) {
      return a.slotTime.localeCompare(b.slotTime);
    }
    return a.appointmentDate.localeCompare(b.appointmentDate);
  });

  // Re-number SN for display consistent with screenshot #SN
  const listWithSN = list.map((item, index) => ({
    ...item,
    sn: index + 1,
  }));

  res.json(listWithSN);
});

// Get Appointment by ID (Used by "Find Record" in Screenshot 4)
app.get('/api/appointments/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const found = appointments.find((a) => a.id === id);
  if (!found) {
    return res.status(404).json({ error: 'Appointment record not found with ID ' + id });
  }
  res.json(found);
});

// Create new appointment (Image 1: New Appointment)
app.post('/api/appointments', (req: Request, res: Response) => {
  try {
    const {
      patientName,
      patientAge,
      patientPhone,
      patientDisease,
      patientAddress,
      doctorId,
      doctorName,
      appointmentDate,
      appointmentDay,
      slotTime,
      notes,
    } = req.body;

    if (!patientName || !doctorName || !slotTime) {
      return res.status(400).json({ error: 'Missing required fields: Name, Doctor, and Slot are required.' });
    }

    // Resolve doctor
    let doctor = doctors.find((d) => d.id === doctorId || d.name === doctorName);
    if (!doctor) {
      doctor = doctors.find((d) => d.name.toLowerCase() === doctorName.toLowerCase()) || doctors[0];
    }

    const apptDate = appointmentDate || new Date().toISOString().split('T')[0];

    // Enforce 16 patients per 8-hr workday rule
    const existingDoctorAppointments = appointments.filter(
      (a) => a.doctorId === doctor.id && a.appointmentDate === apptDate && a.status !== 'Cancelled'
    );

    if (existingDoctorAppointments.length >= doctor.maxPatientsPerDay) {
      return res.status(400).json({
        error: `Doctor ${doctor.name} has reached the maximum daily workload of 16 patients for ${apptDate}. Please select another date or doctor.`,
      });
    }

    // Check if slot is already occupied
    const slotTaken = existingDoctorAppointments.some((a) => a.slotTime === slotTime);
    if (slotTaken) {
      return res.status(409).json({
        error: `Time slot ${slotTime} is already booked for ${doctor.name} on ${apptDate}. Please choose another available slot.`,
      });
    }

    // Determine day if not provided
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const parsedDay = appointmentDay || days[new Date(apptDate).getDay()];

    const nextId = appointments.length > 0 ? Math.max(...appointments.map((a) => a.id)) + 1 : 1;

    const hospital = hospitals.find((h) => h.id === doctor.hospitalId) || hospitals[0];
    const dept = departments.find((d) => d.id === doctor.departmentId) || departments[0];

    const newAppointment: Appointment = {
      id: nextId,
      sn: appointments.length + 1,
      patientName: patientName.trim(),
      patientAge: Number(patientAge) || 25,
      patientPhone: patientPhone?.trim() || 'N/A',
      patientDisease: patientDisease?.trim() || 'General Consultation',
      patientAddress: patientAddress?.trim() || 'Local City',
      doctorId: doctor.id,
      doctorName: doctor.name,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      departmentName: dept.name,
      appointmentDate: apptDate,
      appointmentDay: parsedDay,
      slotTime,
      status: 'Scheduled',
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    appointments.push(newAppointment);

    // Trigger Automated SMS Reminder Simulation
    const smsMessage = `MediCare: Dear ${newAppointment.patientName}, your appointment #${newAppointment.id} with ${newAppointment.doctorName} is confirmed for ${newAppointment.appointmentDay} ${newAppointment.appointmentDate} at ${newAppointment.slotTime}. Hospital: ${newAppointment.hospitalName}. Please arrive 10 min prior.`;
    const newSMS: SMSLog = {
      id: 'sms-' + Date.now(),
      toPhone: newAppointment.patientPhone,
      patientName: newAppointment.patientName,
      message: smsMessage,
      type: 'CONFIRMATION',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Delivered',
    };
    smsLogs.unshift(newSMS);

    res.status(201).json({
      message: 'Appointment scheduled successfully!',
      appointment: newAppointment,
      smsSent: newSMS,
      remainingSlotsToday: doctor.maxPatientsPerDay - (existingDoctorAppointments.length + 1),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error creating appointment' });
  }
});

// Update appointment (Screenshot 4: Update Appointment)
app.put('/api/appointments/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const index = appointments.findIndex((a) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Appointment ID ' + id + ' not found to update.' });
  }

  const {
    patientName,
    patientAge,
    patientPhone,
    patientDisease,
    patientAddress,
    doctorName,
    doctorId,
    appointmentDate,
    appointmentDay,
    slotTime,
    status,
    notes,
  } = req.body;

  const current = appointments[index];

  // If slot or doctor or date changed, verify slot availability
  if (
    (slotTime && slotTime !== current.slotTime) ||
    (appointmentDate && appointmentDate !== current.appointmentDate) ||
    (doctorName && doctorName !== current.doctorName)
  ) {
    const targetDocName = doctorName || current.doctorName;
    const targetDoc = doctors.find((d) => d.name === targetDocName || d.id === doctorId) || doctors[0];
    const targetDate = appointmentDate || current.appointmentDate;
    const targetSlot = slotTime || current.slotTime;

    const conflict = appointments.some(
      (a) =>
        a.id !== id &&
        a.doctorId === targetDoc.id &&
        a.appointmentDate === targetDate &&
        a.slotTime === targetSlot &&
        a.status !== 'Cancelled'
    );

    if (conflict) {
      return res.status(409).json({
        error: `Slot ${targetSlot} on ${targetDate} is already booked for ${targetDoc.name}.`,
      });
    }
  }

  appointments[index] = {
    ...current,
    patientName: patientName !== undefined ? patientName : current.patientName,
    patientAge: patientAge !== undefined ? Number(patientAge) : current.patientAge,
    patientPhone: patientPhone !== undefined ? patientPhone : current.patientPhone,
    patientDisease: patientDisease !== undefined ? patientDisease : current.patientDisease,
    patientAddress: patientAddress !== undefined ? patientAddress : current.patientAddress,
    doctorName: doctorName !== undefined ? doctorName : current.doctorName,
    doctorId: doctorId !== undefined ? doctorId : current.doctorId,
    appointmentDate: appointmentDate !== undefined ? appointmentDate : current.appointmentDate,
    appointmentDay: appointmentDay !== undefined ? appointmentDay : current.appointmentDay,
    slotTime: slotTime !== undefined ? slotTime : current.slotTime,
    status: status !== undefined ? status : current.status,
    notes: notes !== undefined ? notes : current.notes,
  };

  res.json({
    message: 'Appointment ID ' + id + ' updated successfully.',
    appointment: appointments[index],
  });
});

// Delete or cancel appointment
app.delete('/api/appointments/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const index = appointments.findIndex((a) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Appointment ID not found' });
  }
  const deleted = appointments.splice(index, 1)[0];
  res.json({ message: 'Appointment deleted successfully', appointment: deleted });
});

// Prescriptions
app.get('/api/prescriptions', (req: Request, res: Response) => {
  const { patientName, appointmentId } = req.query;
  let list = [...prescriptions];
  if (patientName) {
    list = list.filter((p) =>
      p.patientName.toLowerCase().includes((patientName as string).toLowerCase())
    );
  }
  if (appointmentId) {
    list = list.filter((p) => p.appointmentId === Number(appointmentId));
  }
  res.json(list);
});

app.post('/api/prescriptions', (req: Request, res: Response) => {
  const { appointmentId, patientName, doctorName, diagnosis, symptoms, medicines, advice, followUpDate } =
    req.body;
  const newRx: Prescription = {
    id: 'rx-' + Date.now(),
    appointmentId: Number(appointmentId) || 0,
    patientName: patientName || 'Patient',
    doctorName: doctorName || 'Dr. Ramesh',
    specialization: 'Consultant Physician',
    hospitalName: 'City Care General Hospital',
    date: new Date().toISOString().split('T')[0],
    diagnosis: diagnosis || 'Under Evaluation',
    symptoms: symptoms || '',
    medicines: medicines || [],
    advice: advice || 'Rest and stay hydrated.',
    followUpDate: followUpDate || '',
  };
  prescriptions.unshift(newRx);
  res.status(201).json(newRx);
});

// Health Records / Patients (EHR & Nurse Station)
app.get('/api/patients', (req: Request, res: Response) => {
  const { name, phone } = req.query;
  let list = [...patients];
  if (name) {
    list = list.filter((p) => p.name.toLowerCase().includes((name as string).toLowerCase()));
  }
  if (phone) {
    list = list.filter((p) => p.phone.includes(phone as string));
  }
  res.json(list);
});

app.get('/api/patients/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const patient = patients.find(
    (p) => p.id === id || p.name.toLowerCase() === id.toLowerCase()
  );
  if (!patient) {
    return res.status(404).json({ error: 'Patient clinical record not found' });
  }
  res.json(patient);
});

// Nurse or Hospital Staff updates Patient Vitals, Chronic Conditions & Allergies
app.put('/api/patients/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = patients.findIndex(
    (p) => p.id === id || p.name.toLowerCase() === id.toLowerCase()
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Patient clinical record not found to update' });
  }

  const existing = patients[index];
  const { vitals, chronicConditions, allergies, healthNotes, bloodGroup, age, phone, address } = req.body;

  patients[index] = {
    ...existing,
    age: age !== undefined ? Number(age) : existing.age,
    phone: phone || existing.phone,
    address: address || existing.address,
    bloodGroup: bloodGroup || existing.bloodGroup,
    chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : existing.chronicConditions,
    allergies: Array.isArray(allergies) ? allergies : existing.allergies,
    vitals: vitals
      ? {
          ...existing.vitals,
          ...vitals,
          lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
        }
      : existing.vitals,
    healthNotes: Array.isArray(healthNotes) ? healthNotes : existing.healthNotes,
  };

  res.json({
    message: 'Patient EHR record & vitals updated successfully',
    patient: patients[index],
  });
});

// Nurse or Doctor records a new Clinical Health Note
app.post('/api/patients/:id/notes', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = patients.findIndex(
    (p) => p.id === id || p.name.toLowerCase() === id.toLowerCase()
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Patient record not found' });
  }

  const { note, recordedBy, role } = req.body;
  if (!note || !note.trim()) {
    return res.status(400).json({ error: 'Clinical note text cannot be blank' });
  }

  const newNote: HealthNote = {
    id: 'note-' + Date.now(),
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    note: note.trim(),
    recordedBy: recordedBy || 'Staff Nurse',
    role: role || 'Clinical Staff',
  };

  patients[index].healthNotes.unshift(newNote);
  res.status(201).json({
    message: 'Clinical note added to EHR timeline',
    note: newNote,
    patient: patients[index],
  });
});

// Register new patient
app.post('/api/patients', (req: Request, res: Response) => {
  const { name, age, gender, phone, email, address, bloodGroup, hospitalId, hospitalName } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Patient name and phone are required.' });
  }

  const newPatient: Patient = {
    id: 'p-' + Date.now(),
    name: name.trim(),
    age: Number(age) || 30,
    gender: gender || 'Other',
    phone: phone.trim(),
    email: email || `${name.toLowerCase().replace(/\s+/g, '')}@medicare.org`,
    address: address || 'Pune',
    bloodGroup: bloodGroup || 'O+',
    hospitalId: hospitalId || 'hosp-1',
    hospitalName: hospitalName || 'City Care General Hospital',
    vitals: {
      bp: '120/80 mmHg',
      heartRate: '72 bpm',
      spo2: '98%',
      sugar: '95 mg/dL',
      temp: '98.6 °F',
      weight: '65 kg',
      respirationRate: '16 breaths/min',
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
      recordedBy: 'Intake Staff Nurse',
    },
    chronicConditions: [],
    allergies: [],
    healthNotes: [
      {
        id: 'note-' + Date.now(),
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        note: 'Patient profile created in EHR system.',
        recordedBy: 'Registration Desk',
        role: 'Intake Nurse',
      },
    ],
  };

  patients.push(newPatient);
  res.status(201).json({ message: 'Patient registered successfully', patient: newPatient });
});

// SMS logs
app.get('/api/sms/logs', (_req: Request, res: Response) => {
  res.json(smsLogs);
});

// Trigger Instant Manual SMS Reminder
app.post('/api/sms/send', (req: Request, res: Response) => {
  const { toPhone, patientName, message, type } = req.body;
  const newSMS: SMSLog = {
    id: 'sms-' + Date.now(),
    toPhone: toPhone || '9876543210',
    patientName: patientName || 'Patient',
    message:
      message ||
      `Reminder from MediCare: You have an upcoming consultation with your specialist. Please be on time.`,
    type: type || 'REMINDER_24H',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    status: 'Delivered',
  };
  smsLogs.unshift(newSMS);
  res.json({ success: true, log: newSMS });
});

// Bills
app.get('/api/bills', (_req: Request, res: Response) => {
  res.json(bills);
});

// ==========================================
// GEMINI AI ENDPOINTS (Server-Side)
// ==========================================

// 1. Triage & Specialist Recommendation based on Symptoms
app.post('/api/gemini/triage', async (req: Request, res: Response) => {
  try {
    const { symptoms, patientAge, duration } = req.body;

    if (!symptoms || typeof symptoms !== 'string' || !symptoms.trim()) {
      return res.status(400).json({ error: 'Symptoms description is required.' });
    }

    const availableDepts = departments.map((d) => `${d.name} (${d.description})`).join('; ');
    const availableDocs = doctors.map((d) => `${d.name} - ${d.specialization}`).join('; ');

    const prompt = `You are an AI Clinical Triage System for a hospital appointment scheduling portal.
A patient has described their health condition/symptoms:
"${symptoms}"
Patient Age: ${patientAge || 'Adult'}
Duration of symptoms: ${duration || 'A few days'}

Hospital Departments available:
${availableDepts}

Doctors available:
${availableDocs}

Analyze the patient's issue and provide a structured JSON response with:
1. "recommendedDepartment": The exact best department from the available list (or closest match: Pulmonology & Respiratory Care, Cardiology, General Medicine & Infectious Diseases, Pediatrics, Orthopedics & Joint Care, Neurology & Brain Sciences, Dermatology & Skin Health).
2. "recommendedSpecialist": Title of doctor specialist (e.g., "Pulmonologist", "Cardiologist", "General Physician").
3. "matchedDoctorName": Suggested doctor name from: Dr. Ramesh, Dr. Priyanka, Dr. Rajesh Mehta, Dr. Sunita Rao, Dr. Arvind Patel, Dr. Ananya Sharma.
4. "urgencyLevel": One of "Routine", "Moderate", "Priority", "Emergency".
5. "summaryDiagnosis": A short 1-2 sentence non-diagnostic clinical summary of what condition this might relate to.
6. "keyQuestionsForDoctor": Array of 3 concise questions the patient should ask their doctor during the appointment.
7. "immediateCareAdvice": Simple safe home measures (e.g. hydration, rest) before seeing the doctor.
8. "redFlagWarnings": Symptoms that require immediate ER/ambulance call (e.g., severe chest pain radiating to arm, acute shortness of breath).

Return ONLY valid JSON matching this structure.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        recommendedDepartment: 'General Medicine & Infectious Diseases',
        recommendedSpecialist: 'General Physician',
        matchedDoctorName: 'Dr. Ramesh',
        urgencyLevel: 'Moderate',
        summaryDiagnosis: 'Symptoms require clinical assessment by a medical specialist.',
        keyQuestionsForDoctor: ['What is the expected recovery timeline?', 'Are any lab tests or scans required?'],
        immediateCareAdvice: 'Maintain hydration and rest. Avoid strenuous activity.',
        redFlagWarnings: 'Seek immediate emergency care if breathing becomes difficult or sudden chest pain occurs.',
      };
    }

    res.json(parsed);
  } catch (err: any) {
    console.error('Gemini triage error:', err);
    // Graceful fallback for offline/development if needed
    res.json({
      recommendedDepartment: 'Pulmonology & Respiratory Care',
      recommendedSpecialist: 'Pulmonologist & Physician',
      matchedDoctorName: 'Dr. Ramesh',
      urgencyLevel: 'Moderate',
      summaryDiagnosis:
        'Respiratory or viral signs indicate a thorough chest auscultation and clinical review.',
      keyQuestionsForDoctor: [
        'Could this be a viral or bacterial infection?',
        'Do I need a chest X-Ray or blood count?',
        'How should I monitor my vitals at home?',
      ],
      immediateCareAdvice: 'Drink plenty of warm liquids, steam inhalations, and monitor SpO2 levels.',
      redFlagWarnings: 'Go to ER if oxygen level drops below 93% or if severe chest tightness occurs.',
    });
  }
});

// 2. Prescription Simplifier / Explainer
app.post('/api/gemini/explain-prescription', async (req: Request, res: Response) => {
  try {
    const { prescription } = req.body;
    if (!prescription) {
      return res.status(400).json({ error: 'Prescription details missing.' });
    }

    const prompt = `You are a friendly patient health assistant.
Explain the following medical prescription to the patient in simple, non-intimidating, easy-to-understand language:
Diagnosis: ${prescription.diagnosis}
Doctor: ${prescription.doctorName}
Medicines: ${JSON.stringify(prescription.medicines)}
Doctor Advice: ${prescription.advice}

Please output a JSON with:
1. "simpleDiagnosisExplanation": Plain English explanation of what this condition is in 2 sentences.
2. "medicineGuide": Array of objects: { "name": string, "purpose": string, "howToTake": string, "importantTips": string }
3. "dietaryAndLifestyleTips": Array of 3 actionable tips (e.g. hydration, foods to avoid).
4. "reassuranceMessage": Warm, encouraging closing note.

Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Gemini prescription explain error:', err);
    res.json({
      simpleDiagnosisExplanation:
        'Your doctor identified an upper airway irritation and viral response that requires symptomatic relief and rest.',
      medicineGuide: [
        {
          name: 'Paracetamol',
          purpose: 'Reduces fever and eases headache/body pain.',
          howToTake: 'Take after eating food with a glass of water.',
          importantTips: 'Do not exceed prescribed dose.',
        },
      ],
      dietaryAndLifestyleTips: [
        'Stay well hydrated with warm water and herbal teas.',
        'Avoid cold drinks, fried items, and oily food.',
        'Get at least 8 hours of restful sleep.',
      ],
      reassuranceMessage: 'You are on the right track! Take your medications on time and feel better soon.',
    });
  }
});

// 3. Billing & Insurance Staff Chatbot
app.post('/api/gemini/billing-chat', async (req: Request, res: Response) => {
  try {
    const { message, chatHistory, patientName } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const hospitalBillingContext = `
Hospital: City Care General Hospital & Healthcare Network
Standard Consultation Fees:
- Dr. Ramesh (Senior Pulmonologist): ₹600 / $50
- Dr. Priyanka (Infectious Diseases / General): ₹550 / $45
- Dr. Rajesh Mehta (Senior Cardiologist): ₹850 / $70
- Dr. Sunita Rao (Neurologist): ₹800 / $65
- Dr. Arvind Patel (Orthopedic Surgeon): ₹750 / $60
- Dr. Ananya Sharma (Pediatrician): ₹500 / $40

Diagnostic Charges:
- Digital Chest X-Ray / Spirometry: ₹450
- Rapid Antigen / Viral Panel: ₹300
- Blood Profile (CBC, CRP, D-Dimer): ₹650
- ECG: ₹250

Accepted Insurance Providers:
- Star Health, Max Bupa, Care Health, HDFC ERGO, ICICI Lombard, MediAssist TPA, Medicare Advantage.
- Cashless claim desk available on Ground Floor, Desk 4 (open 24/7).
- Co-pay is typically 10% to 20% depending on policy tier.

Payment Methods:
- UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, Cash at Billing Desk.
- Invoices are digitally generated and downloadable in PDF format.
`;

    const prompt = `You are a polite, helpful Hospital Billing & Receptionist Desk Representative named "Sarah" at MediCare City Hospital.
Patient asking: "${message}"
Patient Name: "${patientName || 'Patient'}"
Chat history so far:
${JSON.stringify(chatHistory || [])}

Billing and Hospital Policies Context:
${hospitalBillingContext}

Respond warmly, directly answering their query with accurate fee amounts, insurance claim steps, or receipt assistance. Keep answers concise (2-4 sentences), professional, clear, and reassuring. Always offer to help them download their invoice or connect with the finance counter if needed.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ reply: response.text || 'Our billing desk is here to help you.' });
  } catch (err: any) {
    console.error('Gemini billing chat error:', err);
    res.json({
      reply:
        'Hello! Our consultation fee with Dr. Ramesh is ₹600. We accept all major insurance TPAs (Star Health, MediAssist, ICICI Lombard) with instant cashless claim processing at Desk 4. You can also view and download your invoice directly in the portal!',
    });
  }
});

// Python & MySQL Architecture source exporter
app.get('/api/source/python-mysql', (_req: Request, res: Response) => {
  const pythonCode = `"""
Mini Project 2: Doctor Appointment Scheduling System
Doctor & Patient classes with 16-patients per 8-hour workday constraint.
Backend: Python (FastAPI / Flask) + MySQL
"""

from datetime import datetime, time, timedelta
from typing import List, Optional
import mysql.connector

class Patient:
    def __init__(self, patient_id: int, name: str, age: int, phone: str, 
                 disease: str, address: str, blood_group: str = "Unknown"):
        self.patient_id = patient_id
        self.name = name
        self.age = age
        self.phone = phone
        self.disease = disease
        self.address = address
        self.blood_group = blood_group
        self.medical_history = []

    def get_details(self) -> dict:
        return {
            "id": self.patient_id,
            "name": self.name,
            "age": self.age,
            "phone": self.phone,
            "disease": self.disease,
            "address": self.address
        }


class Doctor:
    MAX_PATIENTS_PER_DAY = 16  # Requirement: 16 patients during 8 hr work day
    WORK_DAY_HOURS = 8         # 09:00 to 17:00 (30-min per slot)

    def __init__(self, doctor_id: int, name: str, department: str, 
                 qualification: str, fee: float, room: str):
        self.doctor_id = doctor_id
        self.name = name
        self.department = department
        self.qualification = qualification
        self.fee = fee
        self.room = room
        # Daily appointments map: { "YYYY-MM-DD": [appointments] }
        self.appointments_by_date = {}

    def get_time_slots(self) -> List[str]:
        """Generates the 16 30-minute time slots for the 8-hour shift"""
        slots = []
        start_time = datetime.strptime("09:00", "%H:%M")
        for _ in range(self.MAX_PATIENTS_PER_DAY):
            slots.append(start_time.strftime("%H:%M"))
            start_time += timedelta(minutes=30)
        return slots

    def book_appointment(self, appointment_date: str, slot_time: str, 
                         patient: Patient) -> dict:
        """Enforces max 16 patients rule and unique time slot"""
        if appointment_date not in self.appointments_by_date:
            self.appointments_by_date[appointment_date] = []

        day_appointments = self.appointments_by_date[appointment_date]

        # 1. Enforce 16 patients limit per 8-hour workday
        if len(day_appointments) >= self.MAX_PATIENTS_PER_DAY:
            raise ValueError(f"Doctor {self.name} has reached maximum daily capacity ({self.MAX_PATIENTS_PER_DAY} patients) for {appointment_date}.")

        # 2. Check if slot already reserved
        if any(appt["time"] == slot_time for appt in day_appointments):
            raise ValueError(f"Time slot {slot_time} is already booked for Doctor {self.name} on {appointment_date}.")

        new_appt = {
            "appointment_id": len(day_appointments) + 1,
            "patient_name": patient.name,
            "patient_age": patient.age,
            "patient_phone": patient.phone,
            "disease": patient.disease,
            "doctor_name": self.name,
            "date": appointment_date,
            "time": slot_time,
            "status": "Scheduled"
        }
        day_appointments.append(new_appt)
        return new_appt
`;

  const mysqlSchema = `-- MySQL Database Schema for Doctor Appointment System
CREATE DATABASE IF NOT EXISTS doctor_appointment_db;
USE doctor_appointment_db;

-- 1. Hospitals Table
CREATE TABLE IF NOT EXISTS hospitals (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    distance_km DECIMAL(4,1) DEFAULT 0.0,
    rating DECIMAL(3,2) DEFAULT 5.0,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Doctors Table (With 16 patients per 8hr limit)
CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(36) PRIMARY KEY,
    hospital_id VARCHAR(36),
    department_id VARCHAR(36),
    name VARCHAR(150) NOT NULL,
    specialization VARCHAR(150) NOT NULL,
    qualification VARCHAR(150),
    experience_years INT DEFAULT 1,
    consultation_fee DECIMAL(10,2) DEFAULT 500.00,
    cabin VARCHAR(50),
    max_patients_per_day INT DEFAULT 16,
    shift_start TIME DEFAULT '09:00:00',
    shift_end TIME DEFAULT '17:00:00',
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 4. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(10),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    blood_group VARCHAR(5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Appointments Table (Matches Screenshot 1, 3, 4)
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sn INT,
    patient_id VARCHAR(36),
    patient_name VARCHAR(150) NOT NULL,
    patient_age INT,
    patient_phone VARCHAR(20),
    patient_disease VARCHAR(255),
    patient_address TEXT,
    doctor_id VARCHAR(36) NOT NULL,
    doctor_name VARCHAR(150) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_day VARCHAR(20) NOT NULL,
    slot_time VARCHAR(10) NOT NULL,
    status ENUM('Scheduled', 'In Consultation', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_doctor_slot (doctor_id, appointment_date, slot_time),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- 6. Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
    id VARCHAR(36) PRIMARY KEY,
    appointment_id INT,
    patient_name VARCHAR(150),
    doctor_name VARCHAR(150),
    diagnosis TEXT,
    symptoms TEXT,
    medicines JSON,
    advice TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- Seed Data matching screenshot 3
INSERT INTO appointments (id, sn, patient_name, patient_age, patient_phone, patient_disease, patient_address, doctor_id, doctor_name, appointment_date, appointment_day, slot_time, status)
VALUES
(1, 1, 'Kamlesh', 38, '9876543210', 'COVID-19', 'Camp, Pune', 'doc-1', 'Dr. Ramesh', '2022-07-11', 'Monday', '09:00', 'Scheduled'),
(2, 2, 'Sa', 24, '7865432123', 'COVID-19', 'Pune', 'doc-1', 'Dr. Ramesh', '2022-07-11', 'Monday', '09:30', 'Scheduled');
`;

  res.json({ pythonCode, mysqlSchema });
});

// Setup Vite development middleware
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🏥 MediCare Server running on http://localhost:${PORT}`);
  });
}

startServer();

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import {
  Hospital,
  Department,
  Doctor,
  Appointment,
  PatientRecord,
  Prescription,
  BillRecord,
  SMSLog,
} from './src/types';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'hospital' | 'doctor' | 'admin';
  phone?: string;
  doctorId?: string;
  patientId?: string;
  hospitalId?: string;
  createdAt: string;
}

export interface DatabaseState {
  users: UserRecord[];
  hospitals: Hospital[];
  departments: Department[];
  doctors: Doctor[];
  appointments: Appointment[];
  patients: PatientRecord[];
  prescriptions: Prescription[];
  bills: BillRecord[];
  sms_logs: SMSLog[];
}

const DB_FILE = path.resolve(process.cwd(), 'data', 'database.json');

// Standard clinical department catalog
export const DEFAULT_DEPARTMENTS: Department[] = [
  {
    id: 'dept-1',
    name: 'Pulmonology & Respiratory Care',
    description: 'Expert care for respiratory disorders, viral pneumonia, COVID-19 & asthma.',
    icon: 'Stethoscope',
    hospitalIds: [],
  },
  {
    id: 'dept-2',
    name: 'Cardiology',
    description: 'Comprehensive heart care, coronary diagnostics, hypertension and ECG monitoring.',
    icon: 'HeartPulse',
    hospitalIds: [],
  },
  {
    id: 'dept-3',
    name: 'General Medicine & Infectious Diseases',
    description: 'Primary care, viral fever management, diabetes, infections and general wellness.',
    icon: 'Activity',
    hospitalIds: [],
  },
  {
    id: 'dept-4',
    name: 'Pediatrics',
    description: 'Specialized healthcare for infants, children, immunization and child development.',
    icon: 'Baby',
    hospitalIds: [],
  },
  {
    id: 'dept-5',
    name: 'Orthopedics & Joint Care',
    description: 'Bone fractures, arthritis, joint replacements and musculoskeletal therapy.',
    icon: 'Bone',
    hospitalIds: [],
  },
  {
    id: 'dept-6',
    name: 'Neurology & Brain Sciences',
    description: 'Diagnosis and care for chronic migraines, epilepsy, nerve disorders and stroke.',
    icon: 'Brain',
    hospitalIds: [],
  },
  {
    id: 'dept-7',
    name: 'Dermatology & Skin Health',
    description: 'Skin allergies, eczema, acne solutions, cosmetic dermatology and biopsy.',
    icon: 'Sparkles',
    hospitalIds: [],
  },
];

const INITIAL_EMPTY_STATE: DatabaseState = {
  users: [],
  hospitals: [],
  departments: DEFAULT_DEPARTMENTS,
  doctors: [],
  appointments: [],
  patients: [],
  prescriptions: [],
  bills: [],
  sms_logs: [],
};

// Global memory cache synced with disk/MySQL
let state: DatabaseState = JSON.parse(JSON.stringify(INITIAL_EMPTY_STATE));
let mysqlPool: mysql.Pool | null = null;
let useMySQL = false;

// Initialize MySQL if running locally or configured
export async function initDatabaseConnection(): Promise<void> {
  const host = process.env.MYSQL_HOST || 'localhost';
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || 'password';
  const database = process.env.MYSQL_DATABASE || 'doctor_appointment_db';
  const port = Number(process.env.MYSQL_PORT) || 3306;

  try {
    const pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 2000,
    });

    // Test ping
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    mysqlPool = pool;
    useMySQL = true;
    console.log(`[DB] Connected to MySQL database "${database}" on ${host}:${port}`);
    await setupMySQLSchema(pool);
    await loadStateFromMySQL();
    return;
  } catch (err: any) {
    console.log(`[DB] MySQL server not reachable (${err.message}). Using local persistent database (${DB_FILE})`);
    useMySQL = false;
    loadStateFromFile();
  }
}

async function setupMySQLSchema(pool: mysql.Pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'hospital', 'doctor', 'patient') NOT NULL,
        phone VARCHAR(25),
        doctor_id VARCHAR(36),
        patient_id VARCHAR(36),
        hospital_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS hospitals (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        distance_km DECIMAL(4, 1) DEFAULT 0.0,
        rating DECIMAL(3, 2) DEFAULT 4.8,
        phone VARCHAR(25) NOT NULL,
        emergency_phone VARCHAR(25) DEFAULT '108',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        icon VARCHAR(50) DEFAULT 'Stethoscope',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS hospital_departments (
        hospital_id VARCHAR(36),
        department_id VARCHAR(36),
        PRIMARY KEY (hospital_id, department_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id VARCHAR(36) PRIMARY KEY,
        hospital_id VARCHAR(36) NOT NULL,
        department_id VARCHAR(36) NOT NULL,
        name VARCHAR(150) NOT NULL,
        specialization VARCHAR(150) NOT NULL,
        qualification VARCHAR(150) NOT NULL,
        experience_years INT DEFAULT 5,
        consultation_fee DECIMAL(10, 2) DEFAULT 600.00,
        cabin VARCHAR(100) DEFAULT 'Room 101',
        phone VARCHAR(25),
        email VARCHAR(150),
        rating DECIMAL(3, 2) DEFAULT 5.0,
        bio TEXT,
        max_patients_per_day INT DEFAULT 16,
        shift_start TIME DEFAULT '09:00:00',
        shift_end TIME DEFAULT '17:00:00',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        age INT NOT NULL,
        gender VARCHAR(10) DEFAULT 'Other',
        phone VARCHAR(25) NOT NULL,
        email VARCHAR(150),
        address TEXT,
        blood_group VARCHAR(10) DEFAULT 'O+',
        bp VARCHAR(25) DEFAULT '120/80 mmHg',
        heart_rate VARCHAR(25) DEFAULT '74 bpm',
        spo2 VARCHAR(25) DEFAULT '98%',
        sugar VARCHAR(25) DEFAULT '96 mg/dL',
        temp VARCHAR(25) DEFAULT '98.4 °F',
        weight VARCHAR(25) DEFAULT '68 kg',
        respiration_rate VARCHAR(25) DEFAULT '16 breaths/min',
        vitals_recorded_by VARCHAR(150) DEFAULT 'Self Registration',
        last_vitals_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sn INT,
        patient_id VARCHAR(36),
        patient_name VARCHAR(150) NOT NULL,
        patient_age INT,
        patient_phone VARCHAR(25),
        patient_disease VARCHAR(255) NOT NULL,
        patient_address TEXT,
        doctor_id VARCHAR(36) NOT NULL,
        doctor_name VARCHAR(150) NOT NULL,
        hospital_id VARCHAR(36),
        appointment_date DATE NOT NULL,
        appointment_day VARCHAR(20) NOT NULL,
        slot_time VARCHAR(10) NOT NULL,
        status ENUM('Scheduled', 'In Consultation', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id VARCHAR(36) PRIMARY KEY,
        appointment_id INT,
        patient_name VARCHAR(150),
        doctor_name VARCHAR(150),
        specialization VARCHAR(150),
        hospital_name VARCHAR(150),
        date VARCHAR(20),
        diagnosis TEXT,
        symptoms TEXT,
        medicines JSON,
        advice TEXT,
        follow_up_date VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bills (
        id VARCHAR(36) PRIMARY KEY,
        appointment_id INT,
        patient_name VARCHAR(150),
        doctor_name VARCHAR(150),
        hospital_name VARCHAR(150),
        date VARCHAR(20),
        items JSON,
        subtotal DECIMAL(10, 2),
        tax DECIMAL(10, 2),
        insurance_discount DECIMAL(10, 2),
        total DECIMAL(10, 2),
        status VARCHAR(20) DEFAULT 'Paid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sms_logs (
        id VARCHAR(36) PRIMARY KEY,
        to_phone VARCHAR(25) NOT NULL,
        patient_name VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        sms_type VARCHAR(50) DEFAULT 'CONFIRMATION',
        status VARCHAR(20) DEFAULT 'Delivered',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.warn('[DB] MySQL schema setup check warning:', err);
  }
}

async function loadStateFromMySQL(): Promise<void> {
  if (!mysqlPool) return;
  try {
    const [userRows]: any = await mysqlPool.query('SELECT * FROM users');
    state.users = userRows.map((r: any) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      password: r.password,
      role: r.role,
      phone: r.phone,
      doctorId: r.doctor_id,
      patientId: r.patient_id,
      hospitalId: r.hospital_id,
      createdAt: r.created_at,
    }));

    const [hospRows]: any = await mysqlPool.query('SELECT * FROM hospitals');
    const [deptMapRows]: any = await mysqlPool.query('SELECT * FROM hospital_departments');
    state.hospitals = hospRows.map((h: any) => ({
      id: h.id,
      name: h.name,
      address: h.address,
      city: h.city,
      distanceKm: Number(h.distance_km) || 0,
      rating: Number(h.rating) || 4.8,
      phone: h.phone,
      emergencyPhone: h.emergency_phone || '108',
      departments: deptMapRows
        .filter((dm: any) => dm.hospital_id === h.id)
        .map((dm: any) => dm.department_id),
    }));

    const [docRows]: any = await mysqlPool.query('SELECT * FROM doctors');
    state.doctors = docRows.map((d: any) => ({
      id: d.id,
      hospitalId: d.hospital_id,
      departmentId: d.department_id,
      name: d.name,
      specialization: d.specialization,
      qualification: d.qualification,
      experienceYears: Number(d.experience_years) || 1,
      consultationFee: Number(d.consultation_fee) || 500,
      cabin: d.cabin || 'Room 101',
      phone: d.phone,
      email: d.email,
      rating: Number(d.rating) || 4.9,
      bio: d.bio,
      maxPatientsPerDay: 16,
      shiftStart: d.shift_start ? d.shift_start.slice(0, 5) : '09:00',
      shiftEnd: d.shift_end ? d.shift_end.slice(0, 5) : '17:00',
    }));

    const [apptRows]: any = await mysqlPool.query('SELECT * FROM appointments ORDER BY id ASC');
    state.appointments = apptRows.map((a: any) => ({
      id: a.id,
      sn: a.sn || a.id,
      patientId: a.patient_id,
      patientName: a.patient_name,
      patientAge: a.patient_age,
      patientPhone: a.patient_phone,
      patientDisease: a.patient_disease,
      patientAddress: a.patient_address,
      doctorId: a.doctor_id,
      doctorName: a.doctor_name,
      hospitalId: a.hospital_id,
      appointmentDate: typeof a.appointment_date === 'string' ? a.appointment_date : a.appointment_date.toISOString().split('T')[0],
      appointmentDay: a.appointment_day,
      slotTime: a.slot_time,
      status: a.status,
      notes: a.notes,
    }));

    const [patRows]: any = await mysqlPool.query('SELECT * FROM patients');
    state.patients = patRows.map((p: any) => ({
      id: p.id,
      name: p.name,
      age: p.age,
      gender: p.gender || 'Other',
      phone: p.phone,
      email: p.email,
      address: p.address,
      bloodGroup: p.blood_group || 'O+',
      vitals: {
        bp: p.bp || '120/80 mmHg',
        heartRate: p.heart_rate || '74 bpm',
        spo2: p.spo2 || '98%',
        sugar: p.sugar || '96 mg/dL',
        temp: p.temp || '98.4 °F',
        weight: p.weight || '68 kg',
        respirationRate: p.respiration_rate || '16 breaths/min',
        lastUpdated: p.last_vitals_updated ? p.last_vitals_updated.toString() : new Date().toISOString(),
        recordedBy: p.vitals_recorded_by || 'Staff Nurse',
      },
      chronicConditions: [],
      allergies: [],
      healthNotes: [],
    }));

    const [rxRows]: any = await mysqlPool.query('SELECT * FROM prescriptions ORDER BY created_at DESC');
    state.prescriptions = rxRows.map((r: any) => ({
      id: r.id,
      appointmentId: r.appointment_id,
      patientName: r.patient_name,
      doctorName: r.doctor_name,
      specialization: r.specialization,
      hospitalName: r.hospital_name,
      date: r.date,
      diagnosis: r.diagnosis,
      symptoms: r.symptoms,
      medicines: typeof r.medicines === 'string' ? JSON.parse(r.medicines) : r.medicines || [],
      advice: r.advice,
      followUpDate: r.follow_up_date,
    }));
  } catch (err) {
    console.error('[DB] Error querying MySQL data:', err);
  }
}

function loadStateFromFile(): void {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      state = {
        users: parsed.users || [],
        hospitals: parsed.hospitals || [],
        departments: parsed.departments?.length ? parsed.departments : DEFAULT_DEPARTMENTS,
        doctors: parsed.doctors || [],
        appointments: parsed.appointments || [],
        patients: parsed.patients || [],
        prescriptions: parsed.prescriptions || [],
        bills: parsed.bills || [],
        sms_logs: parsed.sms_logs || [],
      };
      console.log(`[DB] Loaded state: ${state.users.length} users, ${state.hospitals.length} hospitals, ${state.doctors.length} doctors, ${state.appointments.length} appointments`);
    } else {
      saveStateToFile();
    }
  } catch (err) {
    console.error('[DB] Error reading DB file, starting empty:', err);
    saveStateToFile();
  }
}

export function saveStateToFile(): void {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Error saving DB file:', err);
  }
}

// -------------------------------------------------------------
// GETTERS & DATA ACCESS
// -------------------------------------------------------------
export const db = {
  isMySQLConnected: () => useMySQL,

  getUsers: () => state.users,
  findUserByEmail: (email: string) =>
    state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()),
  findUserById: (id: string) => state.users.find((u) => u.id === id),

  async addUser(user: UserRecord): Promise<void> {
    state.users.push(user);
    saveStateToFile();
    if (useMySQL && mysqlPool) {
      try {
        await mysqlPool.query(
          `INSERT INTO users (id, name, email, password, role, phone, doctor_id, patient_id, hospital_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.id,
            user.name,
            user.email,
            user.password,
            user.role,
            user.phone || null,
            user.doctorId || null,
            user.patientId || null,
            user.hospitalId || null,
          ]
        );
      } catch (e) {
        console.warn('[DB] MySQL addUser error:', e);
      }
    }
  },

  getHospitals: () => state.hospitals,
  findHospitalById: (id: string) => state.hospitals.find((h) => h.id === id),

  async addHospital(hosp: Hospital): Promise<void> {
    state.hospitals.unshift(hosp);
    saveStateToFile();
    if (useMySQL && mysqlPool) {
      try {
        await mysqlPool.query(
          `INSERT INTO hospitals (id, name, address, city, distance_km, rating, phone, emergency_phone)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            hosp.id,
            hosp.name,
            hosp.address,
            hosp.city,
            hosp.distanceKm,
            hosp.rating,
            hosp.phone,
            hosp.emergencyPhone,
          ]
        );
        for (const deptId of hosp.departments || []) {
          await mysqlPool.query(
            `INSERT IGNORE INTO hospital_departments (hospital_id, department_id) VALUES (?, ?)`,
            [hosp.id, deptId]
          );
        }
      } catch (e) {
        console.warn('[DB] MySQL addHospital error:', e);
      }
    }
  },

  async updateHospital(id: string, updates: Partial<Hospital>): Promise<Hospital | null> {
    const idx = state.hospitals.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    state.hospitals[idx] = { ...state.hospitals[idx], ...updates };
    saveStateToFile();
    if (useMySQL && mysqlPool) {
      try {
        const h = state.hospitals[idx];
        await mysqlPool.query(
          `UPDATE hospitals SET name = ?, address = ?, city = ?, distance_km = ?, rating = ?, phone = ?, emergency_phone = ? WHERE id = ?`,
          [h.name, h.address, h.city, h.distanceKm, h.rating, h.phone, h.emergencyPhone, id]
        );
      } catch (e) {
        console.warn('[DB] MySQL updateHospital error:', e);
      }
    }
    return state.hospitals[idx];
  },

  async deleteHospital(id: string): Promise<boolean> {
    const idx = state.hospitals.findIndex((h) => h.id === id);
    if (idx === -1) return false;
    state.hospitals.splice(idx, 1);
    saveStateToFile();
    if (useMySQL && mysqlPool) {
      try {
        await mysqlPool.query(`DELETE FROM hospitals WHERE id = ?`, [id]);
        await mysqlPool.query(`DELETE FROM hospital_departments WHERE hospital_id = ?`, [id]);
      } catch (e) {
        console.warn('[DB] MySQL deleteHospital error:', e);
      }
    }
    return true;
  },

  getDepartments: () => state.departments,

  getDoctors: (hospitalId?: string, departmentId?: string) => {
    let list = [...state.doctors];
    if (hospitalId) list = list.filter((d) => d.hospitalId === hospitalId);
    if (departmentId) list = list.filter((d) => d.departmentId === departmentId);
    return list;
  },
  findDoctorById: (id: string) => state.doctors.find((d) => d.id === id),

  async addDoctor(doc: Doctor): Promise<void> {
    state.doctors.push(doc);
    // Link doctor department to hospital
    const hosp = state.hospitals.find((h) => h.id === doc.hospitalId);
    if (hosp && !hosp.departments.includes(doc.departmentId)) {
      hosp.departments.push(doc.departmentId);
    }
    saveStateToFile();
    if (useMySQL && mysqlPool) {
      try {
        await mysqlPool.query(
          `INSERT INTO doctors (id, hospital_id, department_id, name, specialization, qualification, experience_years, consultation_fee, cabin, phone, email, rating, max_patients_per_day, shift_start, shift_end)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 16, '09:00:00', '17:00:00')`,
          [
            doc.id,
            doc.hospitalId,
            doc.departmentId,
            doc.name,
            doc.specialization,
            doc.qualification,
            doc.experienceYears,
            doc.consultationFee,
            doc.cabin,
            doc.phone,
            doc.email,
            doc.rating,
          ]
        );
        await mysqlPool.query(
          `INSERT IGNORE INTO hospital_departments (hospital_id, department_id) VALUES (?, ?)`,
          [doc.hospitalId, doc.departmentId]
        );
      } catch (e) {
        console.warn('[DB] MySQL addDoctor error:', e);
      }
    }
  },

  getAppointments: (filters?: {
    doctorId?: string;
    date?: string;
    patientPhone?: string;
    patientName?: string;
  }) => {
    let list = [...state.appointments];
    if (filters?.doctorId) list = list.filter((a) => a.doctorId === filters.doctorId);
    if (filters?.date) list = list.filter((a) => a.appointmentDate === filters.date);
    if (filters?.patientPhone) list = list.filter((a) => a.patientPhone === filters.patientPhone);
    if (filters?.patientName) {
      list = list.filter((a) =>
        a.patientName.toLowerCase().includes(filters.patientName!.toLowerCase())
      );
    }
    return list;
  },
  findAppointmentById: (id: number) => state.appointments.find((a) => a.id === id),

  async addAppointment(appt: Appointment): Promise<Appointment> {
    state.appointments.push(appt);
    saveStateToFile();
    if (useMySQL && mysqlPool) {
      try {
        const [res]: any = await mysqlPool.query(
          `INSERT INTO appointments (sn, patient_id, patient_name, patient_age, patient_phone, patient_disease, patient_address, doctor_id, doctor_name, hospital_id, appointment_date, appointment_day, slot_time, status, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            appt.sn,
            appt.patientId || null,
            appt.patientName,
            appt.patientAge || null,
            appt.patientPhone,
            appt.patientDisease,
            appt.patientAddress || null,
            appt.doctorId,
            appt.doctorName,
            appt.hospitalId || null,
            appt.appointmentDate,
            appt.appointmentDay,
            appt.slotTime,
            appt.status,
            appt.notes || null,
          ]
        );
        if (res.insertId) {
          appt.id = res.insertId;
        }
      } catch (e) {
        console.warn('[DB] MySQL addAppointment error:', e);
      }
    }
    return appt;
  },

  async updateAppointment(id: number, updates: Partial<Appointment>): Promise<Appointment | null> {
    const idx = state.appointments.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    state.appointments[idx] = { ...state.appointments[idx], ...updates };
    saveStateToFile();
    if (useMySQL && mysqlPool) {
      try {
        const a = state.appointments[idx];
        await mysqlPool.query(
          `UPDATE appointments SET patient_name = ?, patient_age = ?, patient_phone = ?, patient_disease = ?, patient_address = ?, doctor_name = ?, appointment_date = ?, appointment_day = ?, slot_time = ?, status = ?, notes = ? WHERE id = ?`,
          [
            a.patientName,
            a.patientAge,
            a.patientPhone,
            a.patientDisease,
            a.patientAddress,
            a.doctorName,
            a.appointmentDate,
            a.appointmentDay,
            a.slotTime,
            a.status,
            a.notes,
            id,
          ]
        );
      } catch (e) {
        console.warn('[DB] MySQL updateAppointment error:', e);
      }
    }
    return state.appointments[idx];
  },

  async deleteAppointment(id: number): Promise<boolean> {
    const idx = state.appointments.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    state.appointments.splice(idx, 1);
    saveStateToFile();
    if (useMySQL && mysqlPool) {
      try {
        await mysqlPool.query(`DELETE FROM appointments WHERE id = ?`, [id]);
      } catch (e) {
        console.warn('[DB] MySQL deleteAppointment error:', e);
      }
    }
    return true;
  },

  getPatients: () => state.patients,
  findPatientById: (id: string) => state.patients.find((p) => p.id === id),

  async addPatient(pat: PatientRecord): Promise<void> {
    state.patients.push(pat);
    saveStateToFile();
    if (useMySQL && mysqlPool) {
      try {
        await mysqlPool.query(
          `INSERT INTO patients (id, name, age, gender, phone, email, address, blood_group, bp, heart_rate, spo2, sugar, temp, weight, respiration_rate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            pat.id,
            pat.name,
            pat.age,
            pat.gender || 'Other',
            pat.phone,
            pat.email || null,
            pat.address || null,
            pat.bloodGroup || 'O+',
            pat.vitals?.bp || '120/80 mmHg',
            pat.vitals?.heartRate || '74 bpm',
            pat.vitals?.spo2 || '98%',
            pat.vitals?.sugar || '96 mg/dL',
            pat.vitals?.temp || '98.4 °F',
            pat.vitals?.weight || '68 kg',
            pat.vitals?.respirationRate || '16 breaths/min',
          ]
        );
      } catch (e) {
        console.warn('[DB] MySQL addPatient error:', e);
      }
    }
  },

  async updatePatient(id: string, updates: Partial<PatientRecord>): Promise<PatientRecord | null> {
    const idx = state.patients.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    state.patients[idx] = { ...state.patients[idx], ...updates };
    saveStateToFile();
    if (useMySQL && mysqlPool) {
      try {
        const p = state.patients[idx];
        await mysqlPool.query(
          `UPDATE patients SET bp = ?, heart_rate = ?, spo2 = ?, sugar = ?, temp = ?, weight = ?, respiration_rate = ?, last_vitals_updated = CURRENT_TIMESTAMP WHERE id = ?`,
          [
            p.vitals?.bp,
            p.vitals?.heartRate,
            p.vitals?.spo2,
            p.vitals?.sugar,
            p.vitals?.temp,
            p.vitals?.weight,
            p.vitals?.respirationRate,
            id,
          ]
        );
      } catch (e) {
        console.warn('[DB] MySQL updatePatient error:', e);
      }
    }
    return state.patients[idx];
  },

  async addPatientHealthNote(patientId: string, noteData: { note: string; recordedBy: string; role: string }): Promise<any> {
    const patient = state.patients.find((p) => p.id === patientId);
    if (!patient) return null;
    if (!patient.healthNotes) patient.healthNotes = [];
    const note = {
      id: `note-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      note: noteData.note,
      recordedBy: noteData.recordedBy,
      role: noteData.role,
    };
    patient.healthNotes.unshift(note);
    saveStateToFile();
    return { note, patient };
  },

  getPrescriptions: () => state.prescriptions,
  async addPrescription(rx: Prescription): Promise<void> {
    state.prescriptions.unshift(rx);
    saveStateToFile();
    if (useMySQL && mysqlPool) {
      try {
        await mysqlPool.query(
          `INSERT INTO prescriptions (id, appointment_id, patient_name, doctor_name, specialization, hospital_name, date, diagnosis, symptoms, medicines, advice, follow_up_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            rx.id,
            rx.appointmentId,
            rx.patientName,
            rx.doctorName,
            rx.specialization,
            rx.hospitalName,
            rx.date,
            rx.diagnosis,
            rx.symptoms,
            JSON.stringify(rx.medicines || []),
            rx.advice,
            rx.followUpDate,
          ]
        );
      } catch (e) {
        console.warn('[DB] MySQL addPrescription error:', e);
      }
    }
  },

  getBills: () => state.bills,
  async addBill(bill: BillRecord): Promise<void> {
    state.bills.unshift(bill);
    saveStateToFile();
  },

  getSmsLogs: () => state.sms_logs,
  async addSmsLog(sms: SMSLog): Promise<void> {
    state.sms_logs.unshift(sms);
    saveStateToFile();
  },

  // Reset database completely (empty tables)
  async clearAllData(): Promise<void> {
    state = JSON.parse(JSON.stringify(INITIAL_EMPTY_STATE));
    saveStateToFile();
    if (useMySQL && mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM prescriptions');
        await mysqlPool.query('DELETE FROM appointments');
        await mysqlPool.query('DELETE FROM patients');
        await mysqlPool.query('DELETE FROM doctors');
        await mysqlPool.query('DELETE FROM hospital_departments');
        await mysqlPool.query('DELETE FROM hospitals');
        await mysqlPool.query('DELETE FROM users');
      } catch (e) {
        console.warn('[DB] MySQL clearAllData error:', e);
      }
    }
  },
};

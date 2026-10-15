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

const INITIAL_STATE: DatabaseState = {
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

// Global in-memory cache directly mirrored from MySQL database
let state: DatabaseState = JSON.parse(JSON.stringify(INITIAL_STATE));
let mysqlPool: mysql.Pool | null = null;
let useMySQL = false;
let lastDbError: string | null = null;

// Initialize MySQL: 100% strict connection, no JSON fallback
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
      connectTimeout: 4000,
    });

    // Test ping
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    mysqlPool = pool;
    useMySQL = true;
    lastDbError = null;
    console.log(`[DB] Connected to MySQL database "${database}" on ${host}:${port}`);

    // Create tables, seed departments into DB, and load all data from MySQL
    await setupMySQLSchema(pool);
    await loadStateFromMySQL();
  } catch (err: any) {
    useMySQL = false;
    lastDbError = err.message || 'Unable to connect to MySQL';
    console.error(`[DB] MySQL connection error: ${lastDbError}. (Host: ${host}:${port}, Database: ${database})`);
    console.error(`[DB] Database-only mode enforced: API calls requiring MySQL will return an explicit error until MySQL is running.`);
  }
}

// Ensure database connection before running any queries
function ensureDBConnected(): mysql.Pool {
  if (!useMySQL || !mysqlPool) {
    const msg = lastDbError
      ? `MySQL Database is not connected: ${lastDbError}. Please start your MySQL service and check .env database credentials.`
      : 'MySQL Database is not connected. Please verify MySQL service is running on your system.';
    throw new Error(msg);
  }
  return mysqlPool;
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

    // Pre-seed all standard departments directly into MySQL table
    for (const dept of DEFAULT_DEPARTMENTS) {
      await pool.query(
        `INSERT INTO departments (id, name, description, icon)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), icon=VALUES(icon)`,
        [dept.id, dept.name, dept.description || '', dept.icon || 'Stethoscope']
      );
    }

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
        hospital_id VARCHAR(36),
        bp VARCHAR(25) DEFAULT '120/80 mmHg',
        heart_rate VARCHAR(25) DEFAULT '74 bpm',
        spo2 VARCHAR(25) DEFAULT '98%',
        sugar VARCHAR(25) DEFAULT '96 mg/dL',
        temp VARCHAR(25) DEFAULT '98.4 °F',
        weight VARCHAR(25) DEFAULT '68 kg',
        respiration_rate VARCHAR(25) DEFAULT '16 breaths/min',
        vitals_recorded_by VARCHAR(150) DEFAULT 'Self Registration',
        chronic_conditions JSON,
        allergies JSON,
        last_vitals_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS patient_health_notes (
        id VARCHAR(36) PRIMARY KEY,
        patient_id VARCHAR(36) NOT NULL,
        note TEXT NOT NULL,
        recorded_by VARCHAR(150) NOT NULL,
        role VARCHAR(50) DEFAULT 'Staff Nurse',
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
        hospital_name VARCHAR(255),
        department_name VARCHAR(150),
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
        hospital_name VARCHAR(255),
        date VARCHAR(20),
        prescription_date DATE,
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

    // Safe column migrations in case tables were previously created without these columns
    try {
      await pool.query('ALTER TABLE patients ADD COLUMN hospital_id VARCHAR(36)');
    } catch {}
    try {
      await pool.query('ALTER TABLE patients ADD COLUMN chronic_conditions JSON');
    } catch {}
    try {
      await pool.query('ALTER TABLE patients ADD COLUMN allergies JSON');
    } catch {}
    try {
      await pool.query('ALTER TABLE appointments ADD COLUMN hospital_id VARCHAR(36)');
    } catch {}
    try {
      await pool.query('ALTER TABLE appointments ADD COLUMN hospital_name VARCHAR(255)');
    } catch {}
    try {
      await pool.query('ALTER TABLE appointments ADD COLUMN department_name VARCHAR(150)');
    } catch {}
    try {
      await pool.query('ALTER TABLE prescriptions ADD COLUMN prescription_date DATE');
    } catch {}
    try {
      await pool.query('ALTER TABLE prescriptions ADD COLUMN date VARCHAR(20)');
    } catch {}

    console.log('[DB] MySQL schema setup verified and all standard clinical departments seeded.');
  } catch (err) {
    console.error('[DB] MySQL schema setup error:', err);
    throw err;
  }
}

export async function loadStateFromMySQL(): Promise<void> {
  if (!mysqlPool) return;
  try {
    // 1. Departments from MySQL
    const [deptRows]: any = await mysqlPool.query('SELECT * FROM departments ORDER BY id ASC');
    const [deptMapRows]: any = await mysqlPool.query('SELECT * FROM hospital_departments');

    const loadedDepts: Department[] = deptRows.map((d: any) => ({
      id: d.id,
      name: d.name,
      description: d.description || '',
      icon: d.icon || 'Stethoscope',
      hospitalIds: deptMapRows
        .filter((dm: any) => dm.department_id === d.id)
        .map((dm: any) => dm.hospital_id),
    }));

    state.departments = loadedDepts.length > 0 ? loadedDepts : DEFAULT_DEPARTMENTS;

    // 2. Hospitals from MySQL
    const [hospRows]: any = await mysqlPool.query('SELECT * FROM hospitals ORDER BY created_at DESC');
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

    // 3. Doctors from MySQL
    const [docRows]: any = await mysqlPool.query('SELECT * FROM doctors ORDER BY created_at DESC');
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
      phone: d.phone || '',
      email: d.email || '',
      rating: Number(d.rating) || 5.0,
      bio: d.bio || '',
      maxPatientsPerDay: Number(d.max_patients_per_day) || 16,
      shiftStart: d.shift_start ? String(d.shift_start).slice(0, 5) : '09:00',
      shiftEnd: d.shift_end ? String(d.shift_end).slice(0, 5) : '17:00',
    }));

    // 4. Users from MySQL
    const [userRows]: any = await mysqlPool.query('SELECT * FROM users ORDER BY created_at DESC');
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

    // 5. Appointments from MySQL
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
      hospitalName: a.hospital_name || (state.hospitals.find((h) => h.id === a.hospital_id)?.name) || 'Hospital Facility',
      departmentName: a.department_name || '',
      appointmentDate:
        typeof a.appointment_date === 'string'
          ? a.appointment_date
          : a.appointment_date ? new Date(a.appointment_date).toISOString().split('T')[0] : '',
      appointmentDay: a.appointment_day,
      slotTime: a.slot_time,
      status: a.status,
      notes: a.notes,
      createdAt: a.created_at ? a.created_at.toString() : new Date().toISOString(),
    }));

    // 6. Patients from MySQL (With full EHR Vitals, Chronic Conditions, and Health Notes)
    let noteRows: any[] = [];
    try {
      const [nRows]: any = await mysqlPool.query('SELECT * FROM patient_health_notes ORDER BY created_at ASC');
      noteRows = nRows || [];
    } catch {}

    const [patRows]: any = await mysqlPool.query('SELECT * FROM patients ORDER BY created_at DESC');
    state.patients = patRows.map((p: any) => {
      let conds: string[] = [];
      let allgs: string[] = [];
      try {
        conds = typeof p.chronic_conditions === 'string' ? JSON.parse(p.chronic_conditions) : p.chronic_conditions || [];
      } catch {}
      try {
        allgs = typeof p.allergies === 'string' ? JSON.parse(p.allergies) : p.allergies || [];
      } catch {}

      const pNotes = noteRows
        .filter((n: any) => n.patient_id === p.id)
        .map((n: any) => ({
          id: n.id,
          date: n.created_at ? new Date(n.created_at).toLocaleString() : new Date().toLocaleString(),
          note: n.note,
          recordedBy: n.recorded_by,
          role: n.role || 'Staff Nurse',
        }));

      const hospObj = p.hospital_id ? state.hospitals.find((h) => h.id === p.hospital_id) : undefined;

      return {
        id: p.id,
        name: p.name,
        age: p.age,
        gender: p.gender || 'Other',
        phone: p.phone,
        email: p.email,
        address: p.address,
        bloodGroup: p.blood_group || 'O+',
        hospitalId: p.hospital_id || undefined,
        hospitalName: hospObj?.name,
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
        chronicConditions: Array.isArray(conds) ? conds : [],
        allergies: Array.isArray(allgs) ? allgs : [],
        healthNotes: pNotes,
      };
    });

    // 7. Prescriptions from MySQL
    const [rxRows]: any = await mysqlPool.query('SELECT * FROM prescriptions ORDER BY created_at DESC');
    state.prescriptions = rxRows.map((r: any) => ({
      id: r.id,
      appointmentId: r.appointment_id,
      patientName: r.patient_name,
      doctorName: r.doctor_name,
      specialization: r.specialization || 'Consultant Physician',
      hospitalName: r.hospital_name || 'Hospital Facility',
      date: r.date || (r.prescription_date ? new Date(r.prescription_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      diagnosis: r.diagnosis,
      symptoms: r.symptoms || '',
      medicines: typeof r.medicines === 'string' ? JSON.parse(r.medicines) : r.medicines || [],
      advice: r.advice || '',
      followUpDate: r.follow_up_date ? (typeof r.follow_up_date === 'string' ? r.follow_up_date : new Date(r.follow_up_date).toISOString().split('T')[0]) : '',
    }));

    // 8. Bills from MySQL
    const [billRows]: any = await mysqlPool.query('SELECT * FROM bills ORDER BY created_at DESC');
    state.bills = billRows.map((b: any) => ({
      id: b.id,
      appointmentId: b.appointment_id,
      patientName: b.patient_name,
      doctorName: b.doctor_name,
      hospitalName: b.hospital_name,
      date: b.date,
      items: typeof b.items === 'string' ? JSON.parse(b.items) : b.items || [],
      subtotal: Number(b.subtotal) || 0,
      tax: Number(b.tax) || 0,
      insuranceDiscount: Number(b.insurance_discount) || 0,
      total: Number(b.total) || 0,
      status: b.status,
      createdAt: b.created_at,
    }));

    // 9. SMS Logs from MySQL
    const [smsRows]: any = await mysqlPool.query('SELECT * FROM sms_logs ORDER BY created_at DESC');
    state.sms_logs = smsRows.map((s: any) => ({
      id: s.id,
      toPhone: s.to_phone,
      patientName: s.patient_name,
      message: s.message,
      type: s.sms_type || 'CONFIRMATION',
      status: s.status,
      timestamp: s.created_at ? s.created_at.toString() : new Date().toISOString(),
    }));

    console.log(
      `[DB] Live state synced from MySQL: ${state.users.length} users, ${state.hospitals.length} hospitals, ${state.departments.length} departments, ${state.doctors.length} doctors, ${state.appointments.length} appointments.`
    );
  } catch (err: any) {
    console.error('[DB] Error syncing state from MySQL:', err);
    throw err;
  }
}

// -------------------------------------------------------------
// STRICT DATABASE ACCESS (100% MySQL PERSISTENT)
// -------------------------------------------------------------
export const db = {
  isMySQLConnected: () => useMySQL,
  getLastError: () => lastDbError,

  async getDatabaseStatus(): Promise<any> {
    if (!useMySQL || !mysqlPool) {
      return {
        connected: false,
        error: lastDbError || 'MySQL service not connected',
      };
    }
    const [uCount]: any = await mysqlPool.query('SELECT COUNT(*) as cnt FROM users');
    const [hCount]: any = await mysqlPool.query('SELECT COUNT(*) as cnt FROM hospitals');
    const [dCount]: any = await mysqlPool.query('SELECT COUNT(*) as cnt FROM departments');
    const [hdCount]: any = await mysqlPool.query('SELECT COUNT(*) as cnt FROM hospital_departments');
    const [docCount]: any = await mysqlPool.query('SELECT COUNT(*) as cnt FROM doctors');
    const [aCount]: any = await mysqlPool.query('SELECT COUNT(*) as cnt FROM appointments');
    const [pCount]: any = await mysqlPool.query('SELECT COUNT(*) as cnt FROM patients');
    const [rxCount]: any = await mysqlPool.query('SELECT COUNT(*) as cnt FROM prescriptions');

    return {
      connected: true,
      database: process.env.MYSQL_DATABASE || 'doctor_appointment_db',
      host: process.env.MYSQL_HOST || 'localhost',
      tables: {
        users: uCount[0]?.cnt || 0,
        hospitals: hCount[0]?.cnt || 0,
        departments: dCount[0]?.cnt || 0,
        hospital_departments: hdCount[0]?.cnt || 0,
        doctors: docCount[0]?.cnt || 0,
        appointments: aCount[0]?.cnt || 0,
        patients: pCount[0]?.cnt || 0,
        prescriptions: rxCount[0]?.cnt || 0,
      },
    };
  },

  getUsers: () => state.users,
  findUserByEmail: (email: string) =>
    state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()),
  findUserById: (id: string) => state.users.find((u) => u.id === id),

  async addUser(user: UserRecord): Promise<void> {
    const pool = ensureDBConnected();
    await pool.query(
      `INSERT INTO users (id, name, email, password, role, phone, doctor_id, patient_id, hospital_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), phone=VALUES(phone)`,
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
    await loadStateFromMySQL();
  },

  getHospitals: () => state.hospitals,
  findHospitalById: (id: string) => state.hospitals.find((h) => h.id === id),

  async addHospital(hosp: Hospital): Promise<void> {
    const pool = ensureDBConnected();

    // 1. Ensure all associated departments exist in departments table first
    for (const deptId of hosp.departments || []) {
      const deptObj =
        state.departments.find((d) => d.id === deptId) ||
        DEFAULT_DEPARTMENTS.find((d) => d.id === deptId);
      const deptName = deptObj?.name || deptId;
      const deptDesc = deptObj?.description || '';
      const deptIcon = deptObj?.icon || 'Stethoscope';

      await pool.query(
        `INSERT INTO departments (id, name, description, icon)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), icon=VALUES(icon)`,
        [deptId, deptName, deptDesc, deptIcon]
      );
    }

    // 2. Insert Hospital
    await pool.query(
      `INSERT INTO hospitals (id, name, address, city, distance_km, rating, phone, emergency_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), address=VALUES(address), city=VALUES(city), distance_km=VALUES(distance_km), rating=VALUES(rating), phone=VALUES(phone), emergency_phone=VALUES(emergency_phone)`,
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

    // 3. Insert mappings into hospital_departments
    for (const deptId of hosp.departments || []) {
      await pool.query(
        `INSERT INTO hospital_departments (hospital_id, department_id)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE hospital_id=VALUES(hospital_id)`,
        [hosp.id, deptId]
      );
    }

    await loadStateFromMySQL();
  },

  async updateHospital(id: string, updates: Partial<Hospital>): Promise<Hospital | null> {
    const pool = ensureDBConnected();
    const existing = state.hospitals.find((h) => h.id === id);
    if (!existing) return null;

    const merged = { ...existing, ...updates };
    await pool.query(
      `UPDATE hospitals
       SET name = ?, address = ?, city = ?, distance_km = ?, rating = ?, phone = ?, emergency_phone = ?
       WHERE id = ?`,
      [
        merged.name,
        merged.address,
        merged.city,
        merged.distanceKm,
        merged.rating,
        merged.phone,
        merged.emergencyPhone,
        id,
      ]
    );

    if (updates.departments && Array.isArray(updates.departments)) {
      await pool.query('DELETE FROM hospital_departments WHERE hospital_id = ?', [id]);
      for (const deptId of updates.departments) {
        await pool.query(
          `INSERT INTO hospital_departments (hospital_id, department_id) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE hospital_id=VALUES(hospital_id)`,
          [id, deptId]
        );
      }
    }

    await loadStateFromMySQL();
    return state.hospitals.find((h) => h.id === id) || null;
  },

  async deleteHospital(id: string): Promise<boolean> {
    const pool = ensureDBConnected();
    await pool.query('DELETE FROM hospital_departments WHERE hospital_id = ?', [id]);
    await pool.query('DELETE FROM hospitals WHERE id = ?', [id]);
    await loadStateFromMySQL();
    return true;
  },

  getDepartments: () => state.departments,

  async addDepartment(dept: Department): Promise<void> {
    const pool = ensureDBConnected();
    await pool.query(
      `INSERT INTO departments (id, name, description, icon)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), icon=VALUES(icon)`,
      [dept.id, dept.name, dept.description || '', dept.icon || 'Stethoscope']
    );
    await loadStateFromMySQL();
  },

  getDoctors: (hospitalId?: string, departmentId?: string) => {
    let list = [...state.doctors];
    if (hospitalId) list = list.filter((d) => d.hospitalId === hospitalId);
    if (departmentId) list = list.filter((d) => d.departmentId === departmentId);
    return list;
  },
  findDoctorById: (id: string) => state.doctors.find((d) => d.id === id),

  async addDoctor(doc: Doctor): Promise<void> {
    const pool = ensureDBConnected();

    if (!doc.hospitalId || !doc.departmentId) {
      throw new Error('Both hospital ID and department ID are required to add a doctor record.');
    }

    // 1. Verify hospital exists in hospitals table
    const [hRows]: any = await pool.query('SELECT id FROM hospitals WHERE id = ?', [doc.hospitalId]);
    if (hRows.length === 0) {
      throw new Error(`Hospital with ID "${doc.hospitalId}" not found in MySQL. Please register the hospital first.`);
    }

    // 2. Ensure department exists in departments table
    const deptObj =
      state.departments.find((d) => d.id === doc.departmentId) ||
      DEFAULT_DEPARTMENTS.find((d) => d.id === doc.departmentId);
    const deptName = deptObj?.name || doc.departmentId;
    const deptDesc = deptObj?.description || '';
    const deptIcon = deptObj?.icon || 'Stethoscope';

    await pool.query(
      `INSERT INTO departments (id, name, description, icon)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), icon=VALUES(icon)`,
      [doc.departmentId, deptName, deptDesc, deptIcon]
    );

    // 3. Insert Doctor into doctors table
    await pool.query(
      `INSERT INTO doctors (id, hospital_id, department_id, name, specialization, qualification, experience_years, consultation_fee, cabin, phone, email, rating, max_patients_per_day, shift_start, shift_end)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 16, '09:00:00', '17:00:00')
       ON DUPLICATE KEY UPDATE name=VALUES(name), specialization=VALUES(specialization), qualification=VALUES(qualification), consultation_fee=VALUES(consultation_fee), phone=VALUES(phone), email=VALUES(email)`,
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

    // 4. Insert mapping into hospital_departments table
    await pool.query(
      `INSERT INTO hospital_departments (hospital_id, department_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE hospital_id=VALUES(hospital_id)`,
      [doc.hospitalId, doc.departmentId]
    );

    await loadStateFromMySQL();
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
    const pool = ensureDBConnected();

    // 1. Guarantee patient record exists in MySQL patients table
    let linkedPatId = appt.patientId;
    if (!linkedPatId) {
      const existingPat = state.patients.find(
        (p) =>
          (appt.patientPhone && p.phone === appt.patientPhone) ||
          (p.name.toLowerCase() === appt.patientName.toLowerCase() && p.phone === appt.patientPhone)
      );
      if (existingPat) {
        linkedPatId = existingPat.id;
      } else {
        linkedPatId = `pat-${Date.now()}`;
        const newPatRecord: PatientRecord = {
          id: linkedPatId,
          name: appt.patientName,
          age: appt.patientAge || 30,
          gender: 'Other',
          phone: appt.patientPhone,
          email: '',
          address: appt.patientAddress || '',
          bloodGroup: 'O+',
          hospitalId: appt.hospitalId || undefined,
          vitals: {
            bp: '120/80 mmHg',
            heartRate: '74 bpm',
            spo2: '98%',
            sugar: '96 mg/dL',
            temp: '98.4 °F',
            weight: '68 kg',
            respirationRate: '16 breaths/min',
            lastUpdated: new Date().toISOString(),
            recordedBy: 'OPD Reception Desk',
          },
          chronicConditions: [],
          allergies: [],
          healthNotes: [],
        };

        const hospId = appt.hospitalId && appt.hospitalId.trim() ? appt.hospitalId.trim() : null;
        await pool.query(
          `INSERT INTO patients (id, name, age, gender, phone, email, address, blood_group, hospital_id, bp, heart_rate, spo2, sugar, temp, weight, respiration_rate, vitals_recorded_by, chronic_conditions, allergies)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone)`,
          [
            newPatRecord.id,
            newPatRecord.name,
            newPatRecord.age,
            newPatRecord.gender,
            newPatRecord.phone,
            null,
            newPatRecord.address,
            newPatRecord.bloodGroup,
            hospId,
            newPatRecord.vitals.bp,
            newPatRecord.vitals.heartRate,
            newPatRecord.vitals.spo2,
            newPatRecord.vitals.sugar,
            newPatRecord.vitals.temp,
            newPatRecord.vitals.weight,
            newPatRecord.vitals.respirationRate,
            newPatRecord.vitals.recordedBy,
            JSON.stringify([]),
            JSON.stringify([]),
          ]
        );
      }
    }
    appt.patientId = linkedPatId;

    const hospObj = appt.hospitalId ? state.hospitals.find((h) => h.id === appt.hospitalId) : undefined;
    const docObj = appt.doctorId ? state.doctors.find((d) => d.id === appt.doctorId) : undefined;
    const deptObj = docObj ? state.departments.find((d) => d.id === docObj.departmentId) : undefined;

    const [res]: any = await pool.query(
      `INSERT INTO appointments (sn, patient_id, patient_name, patient_age, patient_phone, patient_disease, patient_address, doctor_id, doctor_name, hospital_id, hospital_name, department_name, appointment_date, appointment_day, slot_time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        appt.hospitalName || hospObj?.name || 'Hospital Facility',
        appt.departmentName || deptObj?.name || 'Clinical Care',
        appt.appointmentDate,
        appt.appointmentDay,
        appt.slotTime,
        appt.status || 'Scheduled',
        appt.notes || null,
      ]
    );

    if (res.insertId) {
      appt.id = res.insertId;
    }

    await loadStateFromMySQL();
    return appt;
  },

  async updateAppointment(id: number, updates: Partial<Appointment>): Promise<Appointment | null> {
    const pool = ensureDBConnected();
    const existing = state.appointments.find((a) => a.id === id);
    if (!existing) return null;

    const merged = { ...existing, ...updates };
    await pool.query(
      `UPDATE appointments
       SET patient_name = ?, patient_age = ?, patient_phone = ?, patient_disease = ?, patient_address = ?, doctor_name = ?, appointment_date = ?, appointment_day = ?, slot_time = ?, status = ?, notes = ?
       WHERE id = ?`,
      [
        merged.patientName,
        merged.patientAge,
        merged.patientPhone,
        merged.patientDisease,
        merged.patientAddress,
        merged.doctorName,
        merged.appointmentDate,
        merged.appointmentDay,
        merged.slotTime,
        merged.status,
        merged.notes,
        id,
      ]
    );

    await loadStateFromMySQL();
    return state.appointments.find((a) => a.id === id) || null;
  },

  getPatients: () => state.patients,
  findPatientById: (id: string) => state.patients.find((p) => p.id === id),

  async addPatient(pat: PatientRecord): Promise<void> {
    const pool = ensureDBConnected();
    const hospId = pat.hospitalId && pat.hospitalId.trim() ? pat.hospitalId.trim() : null;

    await pool.query(
      `INSERT INTO patients (id, name, age, gender, phone, email, address, blood_group, hospital_id, bp, heart_rate, spo2, sugar, temp, weight, respiration_rate, vitals_recorded_by, chronic_conditions, allergies)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         name=VALUES(name),
         age=VALUES(age),
         gender=VALUES(gender),
         phone=VALUES(phone),
         email=VALUES(email),
         address=VALUES(address),
         blood_group=VALUES(blood_group),
         hospital_id=COALESCE(VALUES(hospital_id), hospital_id),
         bp=VALUES(bp),
         heart_rate=VALUES(heart_rate),
         spo2=VALUES(spo2),
         sugar=VALUES(sugar),
         temp=VALUES(temp),
         weight=VALUES(weight),
         respiration_rate=VALUES(respiration_rate),
         vitals_recorded_by=VALUES(vitals_recorded_by),
         chronic_conditions=VALUES(chronic_conditions),
         allergies=VALUES(allergies),
         last_vitals_updated=CURRENT_TIMESTAMP`,
      [
        pat.id,
        pat.name,
        pat.age,
        pat.gender || 'Other',
        pat.phone,
        pat.email || null,
        pat.address || null,
        pat.bloodGroup || 'O+',
        hospId,
        pat.vitals?.bp || '120/80 mmHg',
        pat.vitals?.heartRate || '74 bpm',
        pat.vitals?.spo2 || '98%',
        pat.vitals?.sugar || '96 mg/dL',
        pat.vitals?.temp || '98.4 °F',
        pat.vitals?.weight || '68 kg',
        pat.vitals?.respirationRate || '16 breaths/min',
        pat.vitals?.recordedBy || 'Staff Nurse',
        JSON.stringify(pat.chronicConditions || []),
        JSON.stringify(pat.allergies || []),
      ]
    );
    await loadStateFromMySQL();
  },

  async updatePatient(id: string, updates: Partial<PatientRecord>): Promise<PatientRecord | null> {
    const pool = ensureDBConnected();
    const existing = state.patients.find((p) => p.id === id);
    if (!existing) return null;

    const merged = { ...existing, ...updates };
    const hospId = merged.hospitalId && merged.hospitalId.trim() ? merged.hospitalId.trim() : null;

    await pool.query(
      `UPDATE patients
       SET name = ?, age = ?, gender = ?, phone = ?, email = ?, address = ?, blood_group = ?, hospital_id = ?,
           bp = ?, heart_rate = ?, spo2 = ?, sugar = ?, temp = ?, weight = ?, respiration_rate = ?, 
           vitals_recorded_by = ?, chronic_conditions = ?, allergies = ?, last_vitals_updated = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        merged.name,
        merged.age,
        merged.gender,
        merged.phone,
        merged.email || null,
        merged.address || null,
        merged.bloodGroup || 'O+',
        hospId,
        merged.vitals?.bp || '120/80 mmHg',
        merged.vitals?.heartRate || '74 bpm',
        merged.vitals?.spo2 || '98%',
        merged.vitals?.sugar || '96 mg/dL',
        merged.vitals?.temp || '98.4 °F',
        merged.vitals?.weight || '68 kg',
        merged.vitals?.respirationRate || '16 breaths/min',
        merged.vitals?.recordedBy || 'Staff Nurse',
        JSON.stringify(merged.chronicConditions || []),
        JSON.stringify(merged.allergies || []),
        id,
      ]
    );
    await loadStateFromMySQL();
    return state.patients.find((p) => p.id === id) || null;
  },

  async addPatientNote(
    patientId: string,
    noteData: { note: string; recordedBy: string; role?: string }
  ): Promise<void> {
    const pool = ensureDBConnected();
    const noteId = `note-${Date.now()}`;
    await pool.query(
      `INSERT INTO patient_health_notes (id, patient_id, note, recorded_by, role)
       VALUES (?, ?, ?, ?, ?)`,
      [noteId, patientId, noteData.note, noteData.recordedBy, noteData.role || 'Staff Nurse']
    );
    await loadStateFromMySQL();
  },

  getPrescriptions: () => state.prescriptions,
  async addPrescription(rx: Prescription): Promise<void> {
    const pool = ensureDBConnected();
    const rxDate = rx.date || new Date().toISOString().split('T')[0];

    await pool.query(
      `INSERT INTO prescriptions (id, appointment_id, patient_name, doctor_name, specialization, hospital_name, date, prescription_date, diagnosis, symptoms, medicines, advice, follow_up_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rx.id,
        rx.appointmentId || null,
        rx.patientName,
        rx.doctorName,
        rx.specialization || 'Consultant Physician',
        rx.hospitalName || 'Hospital Facility',
        rxDate,
        rxDate,
        rx.diagnosis,
        rx.symptoms || '',
        JSON.stringify(rx.medicines || []),
        rx.advice || '',
        rx.followUpDate || null,
      ]
    );

    // Update appointment status to Completed in MySQL
    if (rx.appointmentId) {
      await pool.query("UPDATE appointments SET status = 'Completed' WHERE id = ?", [rx.appointmentId]);
    }

    await loadStateFromMySQL();
  },

  getBills: () => state.bills,
  async addBill(bill: BillRecord): Promise<void> {
    const pool = ensureDBConnected();
    await pool.query(
      `INSERT INTO bills (id, appointment_id, patient_name, doctor_name, hospital_name, date, items, subtotal, tax, insurance_discount, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bill.id,
        bill.appointmentId || null,
        bill.patientName,
        bill.doctorName,
        bill.hospitalName,
        bill.date,
        JSON.stringify(bill.items || []),
        bill.subtotal,
        bill.tax,
        bill.insuranceDiscount || 0,
        bill.total,
        bill.status || 'Paid',
      ]
    );
    await loadStateFromMySQL();
  },

  getSmsLogs: () => state.sms_logs,
  async addSmsLog(sms: SMSLog): Promise<void> {
    const pool = ensureDBConnected();
    await pool.query(
      `INSERT INTO sms_logs (id, to_phone, patient_name, message, sms_type, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        sms.id,
        sms.toPhone,
        sms.patientName,
        sms.message,
        sms.type || 'CONFIRMATION',
        sms.status || 'Delivered',
      ]
    );
    await loadStateFromMySQL();
  },

  // Reset database completely
  async clearAllData(): Promise<void> {
    const pool = ensureDBConnected();
    await pool.query('DELETE FROM prescriptions');
    await pool.query('DELETE FROM bills');
    await pool.query('DELETE FROM sms_logs');
    await pool.query('DELETE FROM appointments');
    await pool.query('DELETE FROM patients');
    await pool.query('DELETE FROM doctors');
    await pool.query('DELETE FROM hospital_departments');
    await pool.query('DELETE FROM hospitals');
    await pool.query('DELETE FROM users');
    await loadStateFromMySQL();
  },
};

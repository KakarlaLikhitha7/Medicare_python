import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { db, initDatabaseConnection, UserRecord } from './dbStorage';
import {
  Hospital,
  Doctor,
  Appointment,
  PatientRecord,
  Prescription,
  SMSLog,
} from './src/types';

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

const STANDARD_SLOTS = [
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

// ==========================================
// AUTHENTICATION ROUTES (100% Verified DB Check)
// ==========================================

// 1. User Registration (Admin, Hospital Desk, Doctor, Patient)
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const {
      role,
      name,
      email,
      password,
      phone,
      hospitalId,
      departmentId,
      specialization,
      qualification,
      experienceYears,
      fee,
      cabin,
      age,
      bloodGroup,
      address,
    } = req.body;

    if (!role || !name || !email || !password) {
      return res.status(400).json({ error: 'Role, Full Name, Email, and Password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({
        error: 'An account with this email address is already registered. Please sign in.',
      });
    }

    const userId = `usr-${Date.now()}`;
    let doctorId: string | undefined;
    let patientId: string | undefined;
    let linkedHospitalId = hospitalId;

    // Doctor Registration: creates unique Doctor Record in DB
    if (role === 'doctor') {
      doctorId = `doc-${Date.now()}`;
      const docName = name.trim().startsWith('Dr. ') ? name.trim() : `Dr. ${name.trim()}`;
      const newDoc: Doctor = {
        id: doctorId,
        hospitalId: hospitalId || '',
        departmentId: departmentId || '',
        name: docName,
        specialization: specialization?.trim() || 'General Specialist',
        qualification: qualification?.trim() || 'MBBS',
        experienceYears: Number(experienceYears) || 5,
        consultationFee: Number(fee) || 500,
        cabin: cabin?.trim() || 'Room 101',
        phone: phone?.trim() || '',
        email: cleanEmail,
        rating: 5.0,
        bio: 'Consulting clinical practitioner',
        maxPatientsPerDay: 16,
        shiftStart: '09:00',
        shiftEnd: '17:00',
      };
      await db.addDoctor(newDoc);
    }

    // Patient Registration: creates unique Patient Record in DB
    if (role === 'patient') {
      patientId = `pat-${Date.now()}`;
      const newPatient: PatientRecord = {
        id: patientId,
        name: name.trim(),
        age: Number(age) || 30,
        gender: 'Other',
        phone: phone?.trim() || '',
        email: cleanEmail,
        address: address?.trim() || '',
        bloodGroup: bloodGroup || 'O+',
        vitals: {
          bp: '120/80 mmHg',
          heartRate: '74 bpm',
          spo2: '98%',
          sugar: '96 mg/dL',
          temp: '98.4 °F',
          weight: '68 kg',
          respirationRate: '16 breaths/min',
          lastUpdated: new Date().toISOString(),
          recordedBy: 'Self Registration',
        },
        chronicConditions: [],
        allergies: [],
        healthNotes: [],
      };
      await db.addPatient(newPatient);
    }

    const newUser: UserRecord = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      password,
      role,
      phone: phone?.trim() || '',
      doctorId,
      patientId,
      hospitalId: linkedHospitalId,
      createdAt: new Date().toISOString(),
    };

    await db.addUser(newUser);

    const hospObj = linkedHospitalId ? db.findHospitalById(linkedHospitalId) : undefined;
    const docObj = doctorId ? db.findDoctorById(doctorId) : undefined;
    const deptObj = docObj ? db.getDepartments().find((d) => d.id === docObj.departmentId) : undefined;

    res.status(201).json({
      message: 'Account registered successfully!',
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        doctorId: newUser.doctorId,
        patientId: newUser.patientId,
        hospitalId: newUser.hospitalId,
        hospitalName: hospObj?.name,
        department: deptObj?.name,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Error registering user' });
  }
});

// 2. User Login (Verifies email & password from DB)
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.findUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({
        error: 'No registered account found with this email. Please register your account first.',
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        error: 'Incorrect password. Please verify and try again.',
      });
    }

    if (role && user.role !== role) {
      return res.status(401).json({
        error: `This account is registered as "${user.role.toUpperCase()}". Please switch to the ${user.role} login tab or register a new account.`,
      });
    }

    const hospObj = user.hospitalId ? db.findHospitalById(user.hospitalId) : undefined;
    const docObj = user.doctorId ? db.findDoctorById(user.doctorId) : undefined;
    const deptObj = docObj ? db.getDepartments().find((d) => d.id === docObj.departmentId) : undefined;

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        doctorId: user.doctorId,
        patientId: user.patientId,
        hospitalId: user.hospitalId,
        hospitalName: hospObj?.name,
        department: deptObj?.name,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Error logging in' });
  }
});

// ==========================================
// CLINICAL API ROUTES (100% DB-DRIVEN)
// ==========================================

// Hospitals
app.get('/api/hospitals', (_req: Request, res: Response) => {
  res.json(db.getHospitals());
});

app.post('/api/hospitals', async (req: Request, res: Response) => {
  try {
    const { name, address, city, distanceKm, rating, phone, emergencyPhone, departments: deptList } =
      req.body;
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
      phone: phone?.trim() || '',
      emergencyPhone: emergencyPhone?.trim() || '108',
      departments: Array.isArray(deptList) && deptList.length > 0 ? deptList : [],
    };

    await db.addHospital(newHosp);
    res.status(201).json({ message: 'Hospital added successfully', hospital: newHosp });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error adding hospital' });
  }
});

app.put('/api/hospitals/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await db.updateHospital(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Hospital not found' });
  }
  res.json({ message: 'Hospital updated successfully', hospital: updated });
});

app.delete('/api/hospitals/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const success = await db.deleteHospital(id);
  if (!success) {
    return res.status(404).json({ error: 'Hospital not found' });
  }
  res.json({ message: 'Hospital removed successfully' });
});

// Departments
app.get('/api/departments', (_req: Request, res: Response) => {
  res.json(db.getDepartments());
});

// Doctors
app.get('/api/doctors', (req: Request, res: Response) => {
  const { hospitalId, departmentId } = req.query;
  const list = db.getDoctors(
    hospitalId ? String(hospitalId) : undefined,
    departmentId ? String(departmentId) : undefined
  );
  res.json(list);
});

app.post('/api/doctors', async (req: Request, res: Response) => {
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
      consultationFee: Number(consultationFee) || 500,
      cabin: cabin || 'Room 101',
      phone: phone || '',
      email: email || `${docId}@medicare.org`,
      rating: 5.0,
      bio: bio || 'Compassionate clinical practitioner.',
      maxPatientsPerDay: 16,
      shiftStart: '09:00',
      shiftEnd: '17:00',
    };

    await db.addDoctor(newDoc);
    res.status(201).json({ message: 'Doctor registered successfully', doctor: newDoc });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error registering doctor' });
  }
});

// Doctor Daily 16-Slots Workday Status
app.get('/api/doctors/:doctorId/slots', (req: Request, res: Response) => {
  const { doctorId } = req.params;
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const doc = db.findDoctorById(doctorId);
  if (!doc) {
    return res.status(404).json({ error: 'Doctor not found in database' });
  }

  const existingAppts = db
    .getAppointments({ doctorId, date })
    .filter((a) => a.status !== 'Cancelled');

  const bookedSlotsMap: { [time: string]: Appointment } = {};
  existingAppts.forEach((a) => {
    bookedSlotsMap[a.slotTime] = a;
  });

  const slots = STANDARD_SLOTS.map((time) => {
    const isBooked = !!bookedSlotsMap[time];
    return {
      time,
      isAvailable: !isBooked,
      bookedBy: isBooked ? bookedSlotsMap[time].patientName : null,
      appointmentId: isBooked ? bookedSlotsMap[time].id : null,
    };
  });

  const bookedCount = existingAppts.length;
  const maxPatientsPerDay = doc.maxPatientsPerDay || 16;

  res.json({
    doctorId,
    doctorName: doc.name,
    specialization: doc.specialization,
    date,
    bookedCount,
    maxPatientsPerDay,
    remainingSlots: Math.max(0, maxPatientsPerDay - bookedCount),
    isFull: bookedCount >= maxPatientsPerDay,
    slots,
  });
});

// Appointments
app.get('/api/appointments', (req: Request, res: Response) => {
  const { doctorId, date, patientPhone, patientName } = req.query;
  const list = db.getAppointments({
    doctorId: doctorId ? String(doctorId) : undefined,
    date: date ? String(date) : undefined,
    patientPhone: patientPhone ? String(patientPhone) : undefined,
    patientName: patientName ? String(patientName) : undefined,
  });
  res.json(list);
});

app.get('/api/appointments/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const appt = db.findAppointmentById(id);
  if (!appt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  res.json(appt);
});

app.post('/api/appointments', async (req: Request, res: Response) => {
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
      patientId,
      hospitalId,
      notes,
    } = req.body;

    if (!patientName || !patientPhone || !doctorId || !appointmentDate || !slotTime) {
      return res.status(400).json({ error: 'Missing required appointment fields.' });
    }

    const doc = db.findDoctorById(doctorId);
    if (!doc) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    const dayAppts = db
      .getAppointments({ doctorId, date: appointmentDate })
      .filter((a) => a.status !== 'Cancelled');

    // Rule 1: Max 16 appointments per workday
    if (dayAppts.length >= (doc.maxPatientsPerDay || 16)) {
      return res.status(400).json({
        error: `Dr. ${doc.name} has already reached maximum daily capacity (16 patients) on ${appointmentDate}.`,
      });
    }

    // Rule 2: Slot already reserved
    const slotCollision = dayAppts.some((a) => a.slotTime === slotTime);
    if (slotCollision) {
      return res.status(400).json({
        error: `Time slot ${slotTime} is already reserved for this doctor on ${appointmentDate}.`,
      });
    }

    const allAppts = db.getAppointments();
    const newSn = allAppts.length + 1;
    const hospObj = db.findHospitalById(hospitalId || doc.hospitalId);
    const deptObj = db.getDepartments().find((d) => d.id === doc.departmentId);

    const newAppt: Appointment = {
      id: Date.now(),
      sn: newSn,
      patientId: patientId || undefined,
      patientName: patientName.trim(),
      patientAge: Number(patientAge) || 30,
      patientPhone: patientPhone.trim(),
      patientDisease: patientDisease?.trim() || 'General Consultation',
      patientAddress: patientAddress?.trim() || '',
      doctorId,
      doctorName: doc.name,
      hospitalId: hospitalId || doc.hospitalId,
      hospitalName: hospObj?.name || 'Hospital Facility',
      departmentName: deptObj?.name || 'General Medicine',
      appointmentDate,
      appointmentDay:
        appointmentDay ||
        new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long' }),
      slotTime,
      status: 'Scheduled',
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };

    const saved = await db.addAppointment(newAppt);

    // Send automated SMS log
    const hosp = db.findHospitalById(newAppt.hospitalId || doc.hospitalId);
    const smsText = `MediCare Alert: Your appointment #${saved.id} with ${doc.name} is CONFIRMED for ${saved.appointmentDay} ${saved.appointmentDate} at ${saved.slotTime} at ${hosp?.name || 'Clinic'}.`;
    await db.addSmsLog({
      id: `sms-${Date.now()}`,
      toPhone: newAppt.patientPhone,
      patientName: newAppt.patientName,
      message: smsText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'CONFIRMATION',
      status: 'Delivered',
    });

    res.status(201).json({
      message: 'Appointment scheduled successfully!',
      appointment: saved,
      smsDeliveryNotice: smsText,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error booking appointment' });
  }
});

app.put('/api/appointments/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const updated = await db.updateAppointment(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  res.json({ message: 'Appointment updated successfully', appointment: updated });
});

// Patients
app.get('/api/patients', (_req: Request, res: Response) => {
  res.json(db.getPatients());
});

app.get('/api/patients/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const p = db.findPatientById(id);
  if (!p) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  res.json(p);
});

app.post('/api/patients', async (req: Request, res: Response) => {
  try {
    const { name, age, gender, phone, email, address, bloodGroup, hospitalId } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Patient Name and Phone are required.' });
    }

    const newPat: PatientRecord = {
      id: `pat-${Date.now()}`,
      name: name.trim(),
      age: Number(age) || 30,
      gender: gender || 'Other',
      phone: phone.trim(),
      email: email?.trim(),
      address: address?.trim(),
      bloodGroup: bloodGroup || 'O+',
      hospitalId,
      vitals: {
        bp: '120/80 mmHg',
        heartRate: '74 bpm',
        spo2: '98%',
        sugar: '96 mg/dL',
        temp: '98.4 °F',
        weight: '68 kg',
        respirationRate: '16 breaths/min',
        lastUpdated: new Date().toISOString(),
        recordedBy: 'Staff Nurse',
      },
      chronicConditions: [],
      allergies: [],
      healthNotes: [],
    };

    await db.addPatient(newPat);
    res.status(201).json({ message: 'Patient registered successfully', patient: newPat });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error creating patient' });
  }
});

app.put('/api/patients/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await db.updatePatient(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  res.json({ message: 'Patient updated successfully', patient: updated });
});

// Prescriptions
app.get('/api/prescriptions', (req: Request, res: Response) => {
  const { patientName } = req.query;
  let list = db.getPrescriptions();
  if (patientName) {
    list = list.filter((p) =>
      p.patientName.toLowerCase().includes(String(patientName).toLowerCase())
    );
  }
  res.json(list);
});

app.post('/api/prescriptions', async (req: Request, res: Response) => {
  try {
    const { appointmentId, patientName, doctorName, diagnosis, symptoms, medicines, advice, followUpDate } =
      req.body;

    const newRx: Prescription = {
      id: 'rx-' + Date.now(),
      appointmentId: Number(appointmentId) || 0,
      patientName: patientName || 'Patient',
      doctorName: doctorName || 'Attending Physician',
      specialization: 'Consultant Physician',
      hospitalName: 'Hospital Facility',
      date: new Date().toISOString().split('T')[0],
      diagnosis: diagnosis || 'Under Evaluation',
      symptoms: symptoms || '',
      medicines: medicines || [],
      advice: advice || 'Rest and stay hydrated.',
      followUpDate: followUpDate || '',
    };

    await db.addPrescription(newRx);
    res.status(201).json(newRx);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error issuing prescription' });
  }
});

// Bills
app.get('/api/bills', (_req: Request, res: Response) => {
  res.json(db.getBills());
});

// SMS Logs
app.get('/api/sms/logs', (_req: Request, res: Response) => {
  res.json(db.getSmsLogs());
});

app.post('/api/sms/send', async (req: Request, res: Response) => {
  const { toPhone, patientName, message, type } = req.body;
  if (!toPhone || !message) {
    return res.status(400).json({ error: 'toPhone and message are required.' });
  }
  const newSMS: SMSLog = {
    id: `sms-${Date.now()}`,
    toPhone,
    patientName: patientName || 'Patient',
    message,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: type || 'CONFIRMATION',
    status: 'Delivered',
  };
  await db.addSmsLog(newSMS);
  res.status(201).json(newSMS);
});

// System Status (Shows whether connected to MySQL or Local DB)
app.get('/api/system/status', (_req: Request, res: Response) => {
  res.json({
    databaseType: db.isMySQLConnected() ? 'MySQL (Live Connection)' : 'Persistent Database Storage',
    hospitalsCount: db.getHospitals().length,
    doctorsCount: db.getDoctors().length,
    appointmentsCount: db.getAppointments().length,
    patientsCount: db.getPatients().length,
    usersCount: db.getUsers().length,
  });
});

// Clear DB (Reset to 100% empty state)
app.post('/api/admin/clear-db', async (_req: Request, res: Response) => {
  await db.clearAllData();
  res.json({ message: 'Database reset to empty state successfully' });
});

// Gemini AI Symptom Triage (Dynamic doctor matching from DB)
app.post('/api/gemini/triage', async (req: Request, res: Response) => {
  try {
    const { symptoms, patientAge, duration } = req.body;
    if (!symptoms) {
      return res.status(400).json({ error: 'Symptoms description is required.' });
    }

    const docs = db.getDoctors();
    const availableDocs = docs.length > 0
      ? docs.map((d) => `- ${d.name} (${d.specialization}) at hospital ${d.hospitalId}`).join('\n')
      : 'No doctors currently registered in the database';

    const prompt = `You are a clinical decision support system assisting patient intake for appointment scheduling.
Patient reported symptoms: "${symptoms}"
Patient age: ${patientAge || 'Adult'}
Duration: ${duration || 'Recent'}

Doctors currently available in the database:
${availableDocs}

Analyze the patient's issue and provide a structured JSON response with:
1. "recommendedDepartment": The exact best department from: Pulmonology & Respiratory Care, Cardiology, General Medicine & Infectious Diseases, Pediatrics, Orthopedics & Joint Care, Neurology & Brain Sciences, Dermatology & Skin Health.
2. "recommendedSpecialist": Title of doctor specialist (e.g., "Pulmonologist", "Cardiologist", "General Physician").
3. "matchedDoctorName": Suggested doctor name from available doctors list (${docs.map((d) => d.name).join(', ') || 'Attending Specialist'}).
4. "urgencyLevel": One of "Routine", "Moderate", "Priority", "Emergency".
5. "summaryDiagnosis": A short 1-2 sentence non-diagnostic clinical summary.
6. "keyQuestionsForDoctor": Array of 3 concise questions the patient should ask.
7. "immediateCareAdvice": Simple safe home measures before seeing doctor.
8. "redFlagWarnings": Symptoms that require immediate ER/ambulance call.

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
        matchedDoctorName: docs[0]?.name || 'Attending Specialist',
        urgencyLevel: 'Moderate',
        summaryDiagnosis: 'Symptoms require clinical assessment by a medical specialist.',
        keyQuestionsForDoctor: ['What is the expected recovery timeline?', 'Are any lab tests required?'],
        immediateCareAdvice: 'Maintain hydration and rest. Avoid strenuous activity.',
        redFlagWarnings: 'Seek immediate emergency care if breathing becomes difficult or sudden chest pain occurs.',
      };
    }

    res.json(parsed);
  } catch (err: any) {
    console.error('Gemini triage error:', err);
    const docs = db.getDoctors();
    res.json({
      recommendedDepartment: 'General Medicine & Infectious Diseases',
      recommendedSpecialist: 'Consultant Physician',
      matchedDoctorName: docs[0]?.name || 'Attending Specialist',
      urgencyLevel: 'Moderate',
      summaryDiagnosis: 'Symptoms indicate a clinical consultation is advised.',
      keyQuestionsForDoctor: [
        'Could this be a viral or bacterial infection?',
        'Do I need diagnostic blood work?',
        'How should I monitor my vitals at home?',
      ],
      immediateCareAdvice: 'Drink plenty of warm liquids, rest, and monitor vitals.',
      redFlagWarnings: 'Go to ER if oxygen level drops or severe chest tightness occurs.',
    });
  }
});

// Gemini AI Billing Desk
app.post('/api/gemini/billing-chat', async (req: Request, res: Response) => {
  try {
    const { message, chatHistory, patientName } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const docs = db.getDoctors();
    const docFees = docs.length > 0
      ? docs.map((d) => `- ${d.name} (${d.specialization}): ₹${d.consultationFee}`).join('\n')
      : 'Standard consultation fee varies by attending specialist.';

    const hospitalBillingContext = `
Hospital Network: MediCare Clinical Operations Network
Standard Doctor Consultation Fees:
${docFees}

Payment Methods:
- UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, Cash at Billing Desk.
- Invoices are digitally generated in the Patient Portal.
`;

    const prompt = `You are a polite, helpful Hospital Billing & Receptionist Desk Representative named "Sarah" at MediCare Clinical Operations.
Patient asking: "${message}"
Patient Name: "${patientName || 'Patient'}"
Chat history so far:
${JSON.stringify(chatHistory || [])}

Billing Context:
${hospitalBillingContext}

Respond warmly, directly answering their query with accurate fee amounts, insurance claim steps, or receipt assistance. Keep answers concise (2-4 sentences), professional, clear, and reassuring.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ reply: response.text || 'Our billing desk is here to help you.' });
  } catch (err: any) {
    console.error('Gemini billing chat error:', err);
    res.json({
      reply:
        'Hello! Our billing desk accepts all major insurance TPAs with direct cashless claim processing at the hospital billing counter. You can also view and download your invoice directly in the portal!',
    });
  }
});

// Setup Vite development middleware & Start Server
async function startServer() {
  await initDatabaseConnection();

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

import {
  Hospital,
  Department,
  Doctor,
  DoctorSlotsData,
  Appointment,
  Prescription,
  SMSLog,
  Bill,
  TriageResult,
} from '../types';

export const api = {
  async getHospitals(): Promise<Hospital[]> {
    const res = await fetch('/api/hospitals');
    return res.json();
  },

  async createHospital(data: Partial<Hospital>): Promise<{ message: string; hospital: Hospital }> {
    const res = await fetch('/api/hospitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to add hospital');
    return json;
  },

  async updateHospital(id: string, data: Partial<Hospital>): Promise<{ message: string; hospital: Hospital }> {
    const res = await fetch(`/api/hospitals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteHospital(id: string): Promise<{ message: string }> {
    const res = await fetch(`/api/hospitals/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async getDepartments(): Promise<Department[]> {
    const res = await fetch('/api/departments');
    return res.json();
  },

  async getDoctors(hospitalId?: string, departmentId?: string): Promise<Doctor[]> {
    const params = new URLSearchParams();
    if (hospitalId) params.append('hospitalId', hospitalId);
    if (departmentId) params.append('departmentId', departmentId);
    const res = await fetch(`/api/doctors?${params.toString()}`);
    return res.json();
  },

  async createDoctor(data: Partial<Doctor>): Promise<{ message: string; doctor: Doctor }> {
    const res = await fetch('/api/doctors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to register doctor');
    return json;
  },

  async getDoctorSlots(doctorId: string, date?: string): Promise<DoctorSlotsData> {
    const url = `/api/doctors/${doctorId}/slots${date ? `?date=${date}` : ''}`;
    const res = await fetch(url);
    return res.json();
  },

  async getAppointments(filters?: {
    doctorId?: string;
    date?: string;
    patientPhone?: string;
    patientName?: string;
  }): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (filters?.doctorId) params.append('doctorId', filters.doctorId);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.patientPhone) params.append('patientPhone', filters.patientPhone);
    if (filters?.patientName) params.append('patientName', filters.patientName);
    const res = await fetch(`/api/appointments?${params.toString()}`);
    return res.json();
  },

  async getAppointmentById(id: number): Promise<Appointment> {
    const res = await fetch(`/api/appointments/${id}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Appointment record not found');
    }
    return res.json();
  },

  async createAppointment(data: Partial<Appointment>): Promise<{
    message: string;
    appointment: Appointment;
    smsSent?: SMSLog;
    remainingSlotsToday: number;
  }> {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to book appointment');
    }
    return json;
  },

  async updateAppointment(
    id: number,
    data: Partial<Appointment>
  ): Promise<{ message: string; appointment: Appointment }> {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to update appointment');
    }
    return json;
  },

  async deleteAppointment(id: number): Promise<{ message: string }> {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async getPrescriptions(patientName?: string, appointmentId?: number): Promise<Prescription[]> {
    const params = new URLSearchParams();
    if (patientName) params.append('patientName', patientName);
    if (appointmentId) params.append('appointmentId', appointmentId.toString());
    const res = await fetch(`/api/prescriptions?${params.toString()}`);
    return res.json();
  },

  async createPrescription(data: Partial<Prescription>): Promise<Prescription> {
    const res = await fetch('/api/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getSMSLogs(): Promise<SMSLog[]> {
    const res = await fetch('/api/sms/logs');
    return res.json();
  },

  async sendSMS(data: {
    toPhone: string;
    patientName: string;
    message?: string;
    type?: string;
  }): Promise<{ success: boolean; log: SMSLog }> {
    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getBills(): Promise<Bill[]> {
    const res = await fetch('/api/bills');
    return res.json();
  },

  // Health Records & Patient Vitals (Nurse & Hospital Staff EHR)
  async getPatients(): Promise<import('../types').PatientRecord[]> {
    const res = await fetch('/api/patients');
    return res.json();
  },

  async getPatientById(id: string): Promise<import('../types').PatientRecord> {
    const res = await fetch(`/api/patients/${id}`);
    if (!res.ok) throw new Error('Patient record not found');
    return res.json();
  },

  async updatePatient(
    id: string,
    data: Partial<import('../types').PatientRecord>
  ): Promise<{ message: string; patient: import('../types').PatientRecord }> {
    const res = await fetch(`/api/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update patient vitals');
    return json;
  },

  async updatePatientVitals(
    id: string,
    data: Partial<import('../types').PatientRecord>
  ): Promise<import('../types').PatientRecord> {
    const res = await this.updatePatient(id, data);
    return res.patient;
  },

  async addPatientHealthNote(
    id: string,
    noteData: { note: string; recordedBy: string; role: string }
  ): Promise<{ message: string; note: import('../types').HealthNote; patient: import('../types').PatientRecord }> {
    const res = await fetch(`/api/patients/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to add clinical health note');
    return json;
  },

  // Gemini AI calls
  async triageSymptoms(payload: {
    symptoms: string;
    patientAge?: number | string;
    duration?: string;
  }): Promise<TriageResult> {
    const res = await fetch('/api/gemini/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error('AI Triage service temporarily unavailable');
    }
    return res.json();
  },

  async explainPrescription(prescription: Prescription): Promise<any> {
    const res = await fetch('/api/gemini/explain-prescription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prescription }),
    });
    return res.json();
  },

  async sendBillingMessage(payload: {
    message: string;
    chatHistory: any[];
    patientName?: string;
  }): Promise<{ reply: string }> {
    const res = await fetch('/api/gemini/billing-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};

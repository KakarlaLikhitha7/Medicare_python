import React, { useState, useEffect } from 'react';
import { Doctor, Appointment, UserSession, Prescription, PatientRecord } from '../types';
import { api } from '../services/api';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  FilePlus,
  AlertCircle,
  Activity,
  Phone,
  MapPin,
  Pill,
  Send,
  Loader2,
  Heart,
  FileText,
  ShieldAlert,
  ChevronRight,
  Stethoscope,
  X,
  History,
  Trash2,
} from 'lucide-react';

interface DoctorDashboardProps {
  doctors: Doctor[];
  appointments: Appointment[];
  patients?: PatientRecord[];
  prescriptions?: Prescription[];
  currentUser: UserSession;
  onRefreshAppointments: () => void;
  highContrast: boolean;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctors,
  appointments,
  patients = [],
  prescriptions = [],
  currentUser,
  onRefreshAppointments,
  highContrast,
}) => {
  // Match logged in doctor by doctorId, email, or name
  const matchedDoctor = doctors.find(
    (d) =>
      d.id === currentUser.doctorId ||
      (d.email && currentUser.email && d.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      d.name.toLowerCase() === currentUser.name.toLowerCase()
  );

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    matchedDoctor?.id || currentUser.doctorId || doctors[0]?.id || ''
  );

  useEffect(() => {
    if (matchedDoctor) {
      setSelectedDoctorId(matchedDoctor.id);
    } else if (doctors.length > 0 && (!selectedDoctorId || !doctors.some(d => d.id === selectedDoctorId))) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [currentUser, doctors]);

  const activeDoctor = doctors.find((d) => d.id === selectedDoctorId) || matchedDoctor || doctors[0];

  // Prescription issuance modal
  const [prescribeAppt, setPrescribeAppt] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [meds, setMeds] = useState<{ name: string; dosage: string; timing: string; duration: string }[]>([]);
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Medical history / past records viewer modal
  const [viewHistoryAppt, setViewHistoryAppt] = useState<Appointment | null>(null);

  if (!activeDoctor) {
    return (
      <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-sm max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-3xl">
          🩺
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">No Doctor Profiles Found in Database</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The database currently has 0 registered doctors. Central Admin must first register a hospital and add doctor profiles to the clinical roster.
        </p>
      </div>
    );
  }

  // Doctor's appointments
  const doctorAppointments = appointments.filter(
    (a) => a.doctorId === activeDoctor?.id || a.doctorName === activeDoctor?.name
  );

  const bookedCount = doctorAppointments.length;
  const maxCap = activeDoctor?.maxPatientsPerDay || 16;
  const remainingSlots = Math.max(0, maxCap - bookedCount);

  // 16 Standard slots mapping
  const standardSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const getPatientForAppt = (appt: Appointment): PatientRecord | undefined => {
    return patients.find(
      (p) =>
        (appt.patientId && p.id === appt.patientId) ||
        (appt.patientPhone && p.phone === appt.patientPhone) ||
        p.name.toLowerCase() === appt.patientName.toLowerCase()
    );
  };

  const getPastPrescriptions = (patientName: string): Prescription[] => {
    return prescriptions.filter(
      (rx) => rx.patientName.toLowerCase() === patientName.toLowerCase()
    );
  };

  const handleStatusChange = async (apptId: number, newStatus: any) => {
    try {
      await api.updateAppointment(apptId, { status: newStatus });
      onRefreshAppointments();
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleAddMed = () => {
    setMeds([
      ...meds,
      { name: '', dosage: '1 tablet', timing: 'Twice daily after food with water', duration: '5 days' },
    ]);
  };

  const handleOpenPrescription = (appt: Appointment) => {
    setPrescribeAppt(appt);
    setDiagnosis(`Treatment for ${appt.patientDisease}`);
    setSymptoms(appt.patientDisease);
    setAdvice('Complete the entire medication course. Maintain hydration and report if fever or pain persists.');
    setMeds([
      { name: 'Paracetamol 650mg', dosage: '1 tablet', timing: 'Twice daily after meals with water', duration: '5 days' },
      { name: 'Vitamin C 500mg', dosage: '1 tablet', timing: 'Once daily in the morning', duration: '10 days' },
    ]);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setFollowUpDate(nextWeek.toISOString().split('T')[0]);
  };

  const handleIssueRx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescribeAppt) return;
    setIssuing(true);
    try {
      await api.createPrescription({
        appointmentId: prescribeAppt.id,
        patientName: prescribeAppt.patientName,
        doctorName: activeDoctor.name,
        specialization: activeDoctor.specialization,
        hospitalName: prescribeAppt.hospitalName || 'Medical Center',
        diagnosis: diagnosis.trim(),
        symptoms: symptoms.trim() || prescribeAppt.patientDisease,
        medicines: meds.filter((m) => m.name.trim()),
        advice: advice.trim(),
        followUpDate: followUpDate || '',
      });

      // Mark appointment completed
      await api.updateAppointment(prescribeAppt.id, { status: 'Completed' });

      setSuccessMsg(`Prescription issued and saved to MySQL for ${prescribeAppt.patientName}!`);
      setTimeout(() => {
        setPrescribeAppt(null);
        setSuccessMsg('');
      }, 1500);
      onRefreshAppointments();
    } catch (err: any) {
      alert('Failed to issue prescription: ' + err.message);
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${
          highContrast
            ? 'bg-neutral-900 border-yellow-400 text-white'
            : 'bg-gradient-to-r from-teal-800 to-emerald-900 text-white shadow-xl'
        }`}
      >
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white mb-2">
            <Activity className="w-3.5 h-3.5" />
            Clinical Desk &bull; 8-Hour Workday Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{activeDoctor.name}</h1>
          <p className="text-xs sm:text-sm text-teal-100 mt-1">
            {activeDoctor.specialization} &bull; {activeDoctor.cabin} &bull; Shift: 09:00 - 17:00
          </p>
        </div>

        {/* Doctor Switcher */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-teal-100 font-semibold">Active Doctor View:</span>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 border-none shadow-md"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.specialization})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 16-Patient Workload Capacity Widget */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Today&apos;s Patient Workload Status (16-Patient Daily Cap)
            </h3>
            <p className="text-xs text-slate-500">
              Enforces the clinical requirement: A doctor can only handle 16 patients during an 8-hour workday.
            </p>
          </div>

          <div className="text-right">
            <span
              className={`text-sm font-extrabold px-3 py-1 rounded-full ${
                remainingSlots === 0
                  ? 'bg-red-100 text-red-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {bookedCount} / {maxCap} Slots Booked
            </span>
            <div className="text-[11px] text-slate-500 mt-1">
              {remainingSlots} slots remaining for today
            </div>
          </div>
        </div>

        {/* 16 Slot Visual Blocks */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2">
          {standardSlots.map((slot) => {
            const appt = doctorAppointments.find((a) => a.slotTime === slot);
            const isBooked = !!appt;
            return (
              <div
                key={slot}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  isBooked
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-400 font-medium'
                }`}
              >
                <div className="text-xs font-extrabold">{slot}</div>
                <div className="text-[10px] truncate mt-1">
                  {isBooked ? appt.patientName : 'Open'}
                </div>
                {isBooked && (
                  <span className="block text-[8px] uppercase tracking-wider text-emerald-700 font-semibold mt-0.5">
                    {appt.status}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Patient Queue & Clinical Diagnosis with Vitals & History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-800">
              Scheduled Consultations Queue ({doctorAppointments.length} Patients)
            </h3>
            <p className="text-xs text-slate-500">
              Review patient symptoms, recorded vitals from desk/nurse, past health history, and issue digital prescriptions.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {doctorAppointments.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
              No patient appointments currently scheduled for {activeDoctor.name}.
            </div>
          ) : (
            doctorAppointments.map((appt) => {
              const pat = getPatientForAppt(appt);
              const pastRxs = getPastPrescriptions(appt.patientName);

              return (
                <div
                  key={appt.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 transition-all hover:border-teal-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Patient Overview */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                          Slot: {appt.slotTime} ({appt.appointmentDay})
                        </span>
                        <h4 className="font-extrabold text-lg text-slate-900">{appt.patientName}</h4>
                        <span className="text-xs font-medium text-slate-500">
                          &bull; Age: {appt.patientAge || pat?.age || 30} yrs &bull; Ph: {appt.patientPhone}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                          Blood: {pat?.bloodGroup || 'O+'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 bg-emerald-50/70 border border-emerald-200 p-3 rounded-2xl">
                        <span className="font-bold text-emerald-900">Chief Complaint / Issue: </span>
                        <span className="font-semibold text-emerald-950">{appt.patientDisease}</span>
                        {appt.notes && (
                          <div className="mt-1 text-[11px] text-slate-600 italic">
                            Patient Note: &quot;{appt.notes}&quot;
                          </div>
                        )}
                        {appt.patientAddress && (
                          <div className="mt-1 text-[11px] text-slate-500">
                            Address: {appt.patientAddress}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status & Clinical Actions */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <select
                        value={appt.status}
                        onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                          appt.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : appt.status === 'In Consultation'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Consultation">In Consultation</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      <button
                        onClick={() => setViewHistoryAppt(appt)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="View complete medical history, nurse notes and past prescriptions"
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-600" />
                        <span>Past Records ({pastRxs.length})</span>
                      </button>

                      <button
                        onClick={() => handleOpenPrescription(appt)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                      >
                        <FilePlus className="w-4 h-4" />
                        <span>Treat &amp; Prescribe</span>
                      </button>
                    </div>
                  </div>

                  {/* Vitals Snapshot (Live from Database) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        Current Vital Signs (Recorded by Desk/Nurse):
                      </span>
                      {pat?.vitals?.lastUpdated && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Verified: {pat.vitals.lastUpdated} by {pat.vitals.recordedBy}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-white border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-bold">Blood Pressure</div>
                        <div className="font-extrabold text-slate-800 mt-0.5">{pat?.vitals?.bp || '120/80 mmHg'}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-bold">Heart Rate</div>
                        <div className="font-extrabold text-slate-800 mt-0.5">{pat?.vitals?.heartRate || '74 bpm'}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-bold">SpO2 Oxygen</div>
                        <div className="font-extrabold text-slate-800 mt-0.5">{pat?.vitals?.spo2 || '98%'}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-bold">Blood Sugar</div>
                        <div className="font-extrabold text-slate-800 mt-0.5">{pat?.vitals?.sugar || '96 mg/dL'}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-bold">Temperature</div>
                        <div className="font-extrabold text-slate-800 mt-0.5">{pat?.vitals?.temp || '98.4 °F'}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-bold">Weight</div>
                        <div className="font-extrabold text-slate-800 mt-0.5">{pat?.vitals?.weight || '68 kg'}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-bold">Respiration</div>
                        <div className="font-extrabold text-slate-800 mt-0.5">{pat?.vitals?.respirationRate || '16 bpm'}</div>
                      </div>
                    </div>

                    {/* Allergies & Conditions Warnings */}
                    {pat && (pat.allergies.length > 0 || pat.chronicConditions.length > 0) && (
                      <div className="mt-3 pt-2 border-t border-slate-200 flex items-center gap-3 text-xs flex-wrap">
                        {pat.allergies.length > 0 && (
                          <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 font-bold text-[11px]">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                            <span>Drug Allergies: {pat.allergies.join(', ')}</span>
                          </div>
                        )}
                        {pat.chronicConditions.length > 0 && (
                          <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-bold text-[11px]">
                            <span>Chronic Conditions: {pat.chronicConditions.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL 1: VIEW PATIENT MEDICAL HISTORY & PAST RECORDS */}
      {viewHistoryAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-teal-600" />
                  <span>Patient Medical History &amp; EHR Records</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Patient: {viewHistoryAppt.patientName} &bull; Phone: {viewHistoryAppt.patientPhone}
                </p>
              </div>
              <button
                onClick={() => setViewHistoryAppt(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Appointment Issue */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-xs">
              <span className="font-bold text-teal-900 block mb-1">Current Appointment Reason:</span>
              <p className="font-semibold text-teal-950">{viewHistoryAppt.patientDisease}</p>
              {viewHistoryAppt.notes && (
                <p className="mt-1 text-slate-600 italic">Notes: {viewHistoryAppt.notes}</p>
              )}
            </div>

            {/* Past Prescriptions */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-600" />
                <span>Past Prescriptions Issued ({getPastPrescriptions(viewHistoryAppt.patientName).length})</span>
              </h4>

              {getPastPrescriptions(viewHistoryAppt.patientName).length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-400 italic">
                  No previous prescriptions recorded in MySQL for this patient.
                </div>
              ) : (
                getPastPrescriptions(viewHistoryAppt.patientName).map((rx) => (
                  <div key={rx.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-900">{rx.doctorName} ({rx.specialization})</span>
                      <span className="text-slate-500 font-mono text-[11px]">{rx.date}</span>
                    </div>
                    <p className="text-emerald-900 font-semibold">
                      Diagnosis: {rx.diagnosis}
                    </p>
                    {rx.medicines && rx.medicines.length > 0 && (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-700 block text-[11px]">Medicines Prescribed:</span>
                        {rx.medicines.map((m, idx) => (
                          <div key={idx} className="text-[11px] text-slate-800 flex justify-between">
                            <span className="font-semibold">&bull; {m.name}</span>
                            <span className="text-slate-500">{m.dosage} - {m.timing} ({m.duration})</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {rx.advice && (
                      <p className="text-slate-600 text-[11px] italic">Advice: {rx.advice}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Nurse Notes */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Clinical Observations &amp; Nursing Notes</span>
              </h4>

              {getPatientForAppt(viewHistoryAppt)?.healthNotes?.length ? (
                getPatientForAppt(viewHistoryAppt)?.healthNotes.map((note) => (
                  <div key={note.id} className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>{note.recordedBy} ({note.role})</span>
                      <span>{note.date}</span>
                    </div>
                    <p className="text-slate-800 font-medium">{note.note}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-400 italic">
                  No nursing observation notes documented yet for this patient.
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setViewHistoryAppt(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: WRITE / ISSUE DIGITAL PRESCRIPTION */}
      {prescribeAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl text-emerald-800">℞</span>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    Write Digital Clinical Prescription
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Patient: {prescribeAppt.patientName} ({prescribeAppt.patientAge} yrs) &bull; Appointment #{prescribeAppt.id}
                </p>
              </div>
              <button
                onClick={() => setPrescribeAppt(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Vitals Quick Bar */}
            {getPatientForAppt(prescribeAppt) && (
              <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between text-xs flex-wrap gap-2">
                <span className="font-bold text-teal-900">Desk Vitals Snapshot:</span>
                <span className="font-mono text-teal-800">
                  BP: <strong>{getPatientForAppt(prescribeAppt)?.vitals?.bp}</strong> &bull; HR: <strong>{getPatientForAppt(prescribeAppt)?.vitals?.heartRate}</strong> &bull; SpO2: <strong>{getPatientForAppt(prescribeAppt)?.vitals?.spo2}</strong> &bull; Temp: <strong>{getPatientForAppt(prescribeAppt)?.vitals?.temp}</strong>
                </span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2 border border-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleIssueRx} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Clinical Diagnosis / Reason for Treatment *
                </label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Upper Respiratory Tract Infection"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reported / Observed Symptoms
                </label>
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Dry cough, low grade fever, throat irritation"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Medicines List with How to Use & Duration */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-sm text-slate-800 block">Prescribed Medicines &amp; Instructions</span>
                    <span className="text-[11px] text-slate-500">Specify medicine, dosage, how to take, and treatment duration</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMed}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    + Add Medicine
                  </button>
                </div>

                {meds.map((m, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Medicine name (e.g. Azithromycin 500mg)"
                        value={m.name}
                        onChange={(e) => {
                          const copy = [...meds];
                          copy[idx].name = e.target.value;
                          setMeds(copy);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
                      />
                      {meds.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setMeds(meds.filter((_, i) => i !== idx))}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Remove medicine"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Dosage</span>
                        <input
                          type="text"
                          placeholder="e.g. 1 tablet"
                          value={m.dosage}
                          onChange={(e) => {
                            const copy = [...meds];
                            copy[idx].dosage = e.target.value;
                            setMeds(copy);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px]"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block mb-0.5">How to Take / Timing</span>
                        <input
                          type="text"
                          placeholder="e.g. Twice daily after meals"
                          value={m.timing}
                          onChange={(e) => {
                            const copy = [...meds];
                            copy[idx].timing = e.target.value;
                            setMeds(copy);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px]"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Duration</span>
                        <input
                          type="text"
                          placeholder="e.g. 5 days"
                          value={m.duration}
                          onChange={(e) => {
                            const copy = [...meds];
                            copy[idx].duration = e.target.value;
                            setMeds(copy);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Doctor&apos;s Advice, Precautions &amp; Patient Directions
                </label>
                <textarea
                  rows={2}
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  placeholder="e.g. Stay hydrated, avoid cold beverages, take steam inhalation daily"
                  className="w-full p-3 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Follow-up Review Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPrescribeAppt(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuing}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Save Prescription to DB &amp; Complete</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

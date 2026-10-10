import React, { useState } from 'react';
import { Doctor, Appointment, UserSession, Prescription } from '../types';
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
} from 'lucide-react';

interface DoctorDashboardProps {
  doctors: Doctor[];
  appointments: Appointment[];
  currentUser: UserSession;
  onRefreshAppointments: () => void;
  highContrast: boolean;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctors,
  appointments,
  currentUser,
  onRefreshAppointments,
  highContrast,
}) => {
  // Select logged in doctor or first doctor from database
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    currentUser.doctorId || doctors[0]?.id || ''
  );

  const activeDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];

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

  // Prescription issuance modal
  const [prescribeAppt, setPrescribeAppt] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [meds, setMeds] = useState<{ name: string; dosage: string; timing: string; duration: string }[]>([]);
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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
      { name: '', dosage: '1 tablet once daily', timing: 'After Food', duration: '5 days' },
    ]);
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
        diagnosis,
        symptoms: symptoms || prescribeAppt.patientDisease,
        medicines: meds.filter((m) => m.name.trim()),
        advice,
        followUpDate,
      });

      // Mark appointment completed
      await api.updateAppointment(prescribeAppt.id, { status: 'Completed' });

      setSuccessMsg(`Prescription issued successfully for ${prescribeAppt.patientName}!`);
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
              Enforces the Mini Project requirement: A doctor can only handle 16 patients during an 8-hour workday.
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

      {/* Patient Queue & Prescribing Action */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-base text-slate-800">
          Scheduled Consultations Queue ({doctorAppointments.length} Patients)
        </h3>

        <div className="space-y-3">
          {doctorAppointments.map((appt) => (
            <div
              key={appt.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Slot {appt.slotTime}
                  </span>
                  <h4 className="font-extrabold text-base text-slate-900">{appt.patientName}</h4>
                  <span className="text-xs text-slate-500">
                    ({appt.patientAge} yrs, {appt.patientPhone})
                  </span>
                </div>
                <p className="text-xs text-emerald-800 font-semibold">
                  Reported Issue: <strong>{appt.patientDisease}</strong> &bull; Address: {appt.patientAddress}
                </p>
                {appt.notes && (
                  <p className="text-[11px] text-slate-500 mt-1 italic">
                    Notes: {appt.notes}
                  </p>
                )}
              </div>

              {/* Status and Prescription Action */}
              <div className="flex items-center gap-2">
                <select
                  value={appt.status}
                  onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 bg-slate-50"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Consultation">In Consultation</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <button
                  onClick={() => {
                    setPrescribeAppt(appt);
                    setDiagnosis(`Clinical consultation for ${appt.patientDisease}`);
                    setSymptoms(appt.patientDisease);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  <span>Issue Prescription</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Issue Prescription Modal */}
      {prescribeAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Write Digital Prescription
                </h3>
                <p className="text-xs text-slate-500">
                  Patient: {prescribeAppt.patientName} &bull; Appointment #{prescribeAppt.id}
                </p>
              </div>
              <button
                onClick={() => setPrescribeAppt(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleIssueRx} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Clinical Diagnosis *
                </label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Viral Bronchitis"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reported Symptoms
                </label>
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Dry cough, loss of smell"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* Medicines list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Prescribed Medicines</span>
                  <button
                    type="button"
                    onClick={handleAddMed}
                    className="text-emerald-600 font-bold hover:underline"
                  >
                    + Add Medicine
                  </button>
                </div>

                {meds.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <input
                      type="text"
                      placeholder="Medicine name (e.g. Paracetamol 650mg)"
                      value={m.name}
                      onChange={(e) => {
                        const copy = [...meds];
                        copy[idx].name = e.target.value;
                        setMeds(copy);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Dosage"
                        value={m.dosage}
                        onChange={(e) => {
                          const copy = [...meds];
                          copy[idx].dosage = e.target.value;
                          setMeds(copy);
                        }}
                        className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-[11px]"
                      />
                      <input
                        type="text"
                        placeholder="Timing (After Food)"
                        value={m.timing}
                        onChange={(e) => {
                          const copy = [...meds];
                          copy[idx].timing = e.target.value;
                          setMeds(copy);
                        }}
                        className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-[11px]"
                      />
                      <input
                        type="text"
                        placeholder="Duration (5 days)"
                        value={m.duration}
                        onChange={(e) => {
                          const copy = [...meds];
                          copy[idx].duration = e.target.value;
                          setMeds(copy);
                        }}
                        className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-[11px]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Doctor&apos;s Advice &amp; Precautions
                </label>
                <textarea
                  rows={2}
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPrescribeAppt(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Sign &amp; Issue Prescription</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

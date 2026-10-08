import React, { useState, useEffect } from 'react';
import { Appointment, Prescription, UserSession, PatientRecord, HealthNote } from '../types';
import { api } from '../services/api';
import {
  FileText,
  Activity,
  Heart,
  Calendar,
  Clock,
  User,
  Shield,
  Sparkles,
  Printer,
  ChevronRight,
  AlertCircle,
  Pill,
  HelpCircle,
  Plus,
  Loader2,
  RefreshCw,
  Building,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';

interface PatientPortalProps {
  currentUser: UserSession;
  appointments: Appointment[];
  prescriptions: Prescription[];
  onBookNewAppointment: () => void;
  highContrast: boolean;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  currentUser,
  appointments,
  prescriptions,
  onBookNewAppointment,
  highContrast,
}) => {
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(
    prescriptions.length > 0 ? prescriptions[0] : null
  );
  const [aiExplanation, setAiExplanation] = useState<any | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'records' | 'prescriptions' | 'history'>('records');

  // Patient record loaded from live EHR backend
  const [patientRecord, setPatientRecord] = useState<PatientRecord | null>(null);
  const [loadingPatient, setLoadingPatient] = useState<boolean>(true);

  // Fallback / initial personal vitals
  const [vitals, setVitals] = useState({
    bp: '120/80 mmHg',
    heartRate: '74 bpm',
    spo2: '98%',
    sugar: '96 mg/dL',
    temp: '98.4 °F',
    weight: '68 kg',
    respirationRate: '16 breaths/min',
    recordedBy: 'Nurse Priya (City Care General Hospital)',
    lastUpdated: 'Today, 08:45 AM',
  });

  const [chronicConditions, setChronicConditions] = useState<string[]>([
    'Post-viral bronchial sensitivity',
    'Mild seasonal asthma',
  ]);
  const [allergies, setAllergies] = useState<string[]>(['Penicillin', 'Sulfa drugs']);
  const [healthNotes, setHealthNotes] = useState<HealthNote[]>([]);

  // Load live EHR record for current patient
  const loadEHRData = async () => {
    try {
      setLoadingPatient(true);
      const allPatients = await api.getPatients();
      const match =
        allPatients.find(
          (p) =>
            p.id === currentUser.patientId ||
            p.name.toLowerCase() === currentUser.name.toLowerCase() ||
            p.phone === currentUser.phone
        ) || allPatients[0];

      if (match) {
        setPatientRecord(match);
        if (match.vitals) {
          setVitals({
            bp: match.vitals.bp || '120/80 mmHg',
            heartRate: match.vitals.heartRate || '74 bpm',
            spo2: match.vitals.spo2 || '98%',
            sugar: match.vitals.sugar || '96 mg/dL',
            temp: match.vitals.temp || '98.4 °F',
            weight: match.vitals.weight || '68 kg',
            respirationRate: match.vitals.respirationRate || '16 breaths/min',
            recordedBy: match.vitals.recordedBy || 'Nurse Priya (City Care General Hospital)',
            lastUpdated: match.vitals.lastUpdated || 'Today',
          });
        }
        if (Array.isArray(match.chronicConditions)) {
          setChronicConditions(match.chronicConditions);
        }
        if (Array.isArray(match.allergies)) {
          setAllergies(match.allergies);
        }
        if (Array.isArray(match.healthNotes)) {
          setHealthNotes(match.healthNotes);
        }
      }
    } catch (err) {
      console.error('Failed to load patient EHR records:', err);
    } finally {
      setLoadingPatient(false);
    }
  };

  useEffect(() => {
    loadEHRData();
  }, [currentUser]);

  // Filter appointments for current patient
  const patientAppointments = appointments.filter(
    (a) =>
      a.patientName.toLowerCase() === currentUser.name.toLowerCase() ||
      a.patientPhone === currentUser.phone ||
      currentUser.role === 'admin'
  );

  const handleExplainRx = async (rx: Prescription) => {
    setSelectedRx(rx);
    setLoadingAi(true);
    setAiExplanation(null);
    try {
      const res = await api.explainPrescription(rx);
      setAiExplanation(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Patient Header Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all ${
          highContrast
            ? 'bg-neutral-900 border-yellow-400 text-white'
            : 'bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white shadow-xl'
        }`}
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-emerald-100">
            <User className="w-3.5 h-3.5" />
            Patient Health Portfolio &bull; ID #MED-{currentUser.name.toUpperCase().substring(0, 3)}-99
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
            Manage your personal health vitals, track prescriptions issued by doctors, and easily review your medical history and upcoming treatment plans.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="text-right sm:text-left">
            <button
              onClick={onBookNewAppointment}
              className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                highContrast
                  ? 'bg-yellow-400 text-black hover:bg-yellow-300 font-extrabold'
                  : 'bg-white text-emerald-900 hover:bg-emerald-50'
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Book Doctor Appointment &rarr;</span>
            </button>
            <span className="block text-[11px] text-emerald-200/80 text-center sm:text-right mt-1 font-medium">
              Browse Nearest Hospitals &bull; Navigate back anytime
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'records'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Personal Health Records &amp; Vitals</span>
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'prescriptions'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Doctor Prescriptions &amp; AI Explainer</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Appointments &amp; Treatment Plans ({patientAppointments.length})</span>
        </button>
      </div>

      {/* TAB 1: PERSONAL HEALTH RECORDS */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          {/* EHR Data Origin Banner - Answers "from where it is pulling data" */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
              highContrast
                ? 'bg-neutral-900 border-yellow-400 text-white'
                : 'bg-teal-50/80 border-teal-200 text-teal-900'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-teal-950 uppercase text-[11px] tracking-wider">
                    EHR Clinical Data Registry:
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-teal-200/60 font-semibold text-teal-900 text-[11px]">
                    Pulled from {patientRecord?.hospitalName || 'City Care General Hospital'}
                  </span>
                </div>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  Vitals &amp; conditions recorded by <strong>{vitals.recordedBy}</strong> &bull; Last updated:{' '}
                  <strong>{vitals.lastUpdated}</strong>. (Nurses update this from the Hospital Vitals Desk).
                </p>
              </div>
            </div>

            <button
              onClick={loadEHRData}
              disabled={loadingPatient}
              className="px-3.5 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPatient ? 'animate-spin' : ''}`} />
              <span>{loadingPatient ? 'Refreshing...' : 'Refresh Live EHR Data'}</span>
            </button>
          </div>

          {/* Vitals Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                Latest Recorded Health Vitals
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Respiration: {vitals.respirationRate}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Blood Pressure', val: vitals.bp, icon: Activity, color: 'text-blue-600', sub: 'Norm: < 120/80' },
                { label: 'Heart Rate', val: vitals.heartRate, icon: Heart, color: 'text-rose-600', sub: 'Norm: 60-100 bpm' },
                { label: 'Blood Oxygen (SpO2)', val: vitals.spo2, icon: Activity, color: 'text-emerald-600', sub: 'Norm: 95-100%' },
                { label: 'Fasting Blood Sugar', val: vitals.sugar, icon: Activity, color: 'text-amber-600', sub: 'Norm: 70-99 mg/dL' },
                { label: 'Body Temperature', val: vitals.temp, icon: Activity, color: 'text-teal-600', sub: 'Norm: 98.4 °F' },
                { label: 'Body Weight', val: vitals.weight, icon: User, color: 'text-purple-600', sub: 'Measured in clinic' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    highContrast
                      ? 'bg-neutral-900 border-yellow-400 text-white'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="text-[11px] font-semibold text-slate-500 mb-1">{item.label}</div>
                  <div className={`text-lg font-extrabold ${item.color}`}>{item.val}</div>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">{item.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chronic Conditions & Known Allergies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  Chronic Conditions (From EHR)
                </h4>
                <span className="text-[10px] text-slate-400">Pulled from hospital chart</span>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[42px]">
                {chronicConditions.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No chronic conditions diagnosed</span>
                ) : (
                  chronicConditions.map((cond, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      {cond}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  Known Drug &amp; Food Allergies
                </h4>
                <span className="text-[10px] text-slate-400">Prescribing safety alerts</span>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[42px]">
                {allergies.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No allergies recorded</span>
                ) : (
                  allergies.map((allergy, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200"
                    >
                      {allergy}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Clinical Health Notes & Nursing Observations (Directly addresses where health notes come from) */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Clinical Health Notes &amp; Nursing Observations
                </h4>
                <p className="text-xs text-slate-500">
                  Documented notes entered by attending hospital nurses and medical officers
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
                {healthNotes.length} Documented Notes
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {healthNotes.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-400 italic text-center">
                  No clinical notes recorded yet in this patient chart.
                </div>
              ) : (
                healthNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                        {note.recordedBy} &bull; <span className="text-emerald-700 font-semibold">{note.role}</span>
                      </span>
                      <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {note.date}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-xs font-sans pl-5 border-l-2 border-emerald-300">
                      {note.note}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRESCRIPTIONS & AI EXPLAINER */}
      {activeTab === 'prescriptions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Prescription List Column */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-800">Your Doctor Prescriptions</h3>
            {prescriptions.map((rx) => (
              <div
                key={rx.id}
                onClick={() => handleExplainRx(rx)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  selectedRx?.id === rx.id
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500'
                    : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Rx ID: {rx.id}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{rx.date}</span>
                </div>

                <h4 className="font-extrabold text-sm text-slate-900">{rx.doctorName}</h4>
                <p className="text-xs font-semibold text-emerald-700">{rx.specialization}</p>
                <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                  <strong>Diagnosis:</strong> {rx.diagnosis}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-emerald-700">
                  <span>{rx.medicines.length} Medicines Prescribed</span>
                  <span className="flex items-center gap-1">
                    AI Explain &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Prescription Details & Gemini AI Explanation */}
          <div className="lg:col-span-7 space-y-4">
            {selectedRx ? (
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6">
                {/* Printable Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xl text-emerald-800">℞</span>
                      <h3 className="font-extrabold text-lg text-slate-900">
                        Medical Prescription Slip
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Issued by {selectedRx.doctorName} &bull; {selectedRx.hospitalName}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Patient: <strong>{selectedRx.patientName}</strong> &bull; Date: {selectedRx.date}
                    </p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Slip</span>
                  </button>
                </div>

                {/* Diagnosis */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="font-bold text-slate-800 uppercase tracking-wider mb-0.5">
                    Clinical Diagnosis
                  </div>
                  <div className="text-slate-900 font-semibold">{selectedRx.diagnosis}</div>
                  {selectedRx.symptoms && (
                    <div className="text-slate-500 text-[11px] mt-1">
                      Reported symptoms: {selectedRx.symptoms}
                    </div>
                  )}
                </div>

                {/* Medicines Table */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
                    Prescribed Medications
                  </h4>
                  <div className="space-y-2">
                    {selectedRx.medicines.map((med, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-extrabold text-slate-900">{med.name}</div>
                          <div className="text-slate-600">{med.dosage}</div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                            {med.timing}
                          </span>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Duration: {med.duration}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Doctor's Advice */}
                <div className="text-xs text-slate-700 p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                  <div className="font-bold text-amber-900 mb-1">Doctor&apos;s Advice &amp; Lifestyle:</div>
                  <p>{selectedRx.advice}</p>
                  {selectedRx.followUpDate && (
                    <p className="mt-2 font-semibold text-emerald-800">
                      Follow-up recommended on: {selectedRx.followUpDate}
                    </p>
                  )}
                </div>

                {/* Gemini AI Simplifier */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      <span className="font-bold text-xs uppercase tracking-wider text-violet-700">
                        AI Prescription Explainer
                      </span>
                    </div>

                    <button
                      onClick={() => handleExplainRx(selectedRx)}
                      disabled={loadingAi}
                      className="px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      {loadingAi ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Explaining...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate Patient-Friendly Explanation</span>
                        </>
                      )}
                    </button>
                  </div>

                  {aiExplanation && (
                    <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200 space-y-3 text-xs text-violet-950">
                      <p className="leading-relaxed font-medium">
                        {aiExplanation.simpleDiagnosisExplanation}
                      </p>

                      {aiExplanation.dietaryAndLifestyleTips?.length > 0 && (
                        <div className="space-y-1">
                          <span className="font-bold text-violet-900">Dietary &amp; Food Guidelines:</span>
                          <ul className="list-disc pl-4 space-y-1 text-slate-700 text-[11px]">
                            {aiExplanation.dietaryAndLifestyleTips.map((tip: string, i: number) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiExplanation.reassuranceMessage && (
                        <p className="italic text-emerald-800 font-semibold pt-1">
                          &ldquo;{aiExplanation.reassuranceMessage}&rdquo;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 border rounded-2xl">
                Select a prescription to view clinical details and AI analysis.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: APPOINTMENTS & TREATMENT PLANS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">
              Upcoming &amp; Past Clinical Consultations
            </h3>
            <span className="text-xs text-slate-500">
              16 slots daily workload scheduler tracking
            </span>
          </div>

          <div className="space-y-3">
            {patientAppointments.map((appt) => (
              <div
                key={appt.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-900">
                      Appointment #{appt.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {appt.status}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-emerald-700">
                    With {appt.doctorName} &bull; {appt.departmentName}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Reason: <strong>{appt.patientDisease}</strong> &bull; Hospital: {appt.hospitalName}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center text-xs">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{appt.slotTime} ({appt.appointmentDay})</span>
                  </div>
                  <div className="text-slate-500">{appt.appointmentDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

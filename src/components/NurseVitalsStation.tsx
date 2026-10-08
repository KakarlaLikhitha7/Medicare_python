import React, { useState, useEffect } from 'react';
import { PatientRecord, Hospital, UserSession } from '../types';
import { api } from '../services/api';
import {
  Activity,
  Heart,
  User,
  Building,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  Search,
  FileText,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Stethoscope,
} from 'lucide-react';

interface NurseVitalsStationProps {
  currentUser: UserSession;
  hospitals: Hospital[];
  onRefreshData?: () => void;
  highContrast: boolean;
}

export const NurseVitalsStation: React.FC<NurseVitalsStationProps> = ({
  currentUser,
  hospitals,
  onRefreshData,
  highContrast,
}) => {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('p-1');
  const [loading, setLoading] = useState<boolean>(true);
  const [savingVitals, setSavingVitals] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected hospital for the nurse
  const [activeHospitalId, setActiveHospitalId] = useState<string>(
    currentUser.hospitalId || (hospitals[0]?.id ?? 'hosp-1')
  );

  // Form states for the selected patient
  const [bp, setBp] = useState<string>('120/80 mmHg');
  const [heartRate, setHeartRate] = useState<string>('74 bpm');
  const [spo2, setSpo2] = useState<string>('98%');
  const [sugar, setSugar] = useState<string>('96 mg/dL');
  const [temp, setTemp] = useState<string>('98.4 °F');
  const [weight, setWeight] = useState<string>('68 kg');
  const [respirationRate, setRespirationRate] = useState<string>('16 breaths/min');

  // Chronic conditions & Allergies
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState<string>('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState<string>('');

  // Health Note Form
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [addingNote, setAddingNote] = useState<boolean>(false);

  const activeHospital = hospitals.find((h) => h.id === activeHospitalId) || hospitals[0];

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await api.getPatients();
      setPatients(data);
      if (data.length > 0 && !selectedPatientId) {
        setSelectedPatientId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  // Sync state whenever selected patient changes
  useEffect(() => {
    if (selectedPatient) {
      setBp(selectedPatient.vitals?.bp || '120/80 mmHg');
      setHeartRate(selectedPatient.vitals?.heartRate || '74 bpm');
      setSpo2(selectedPatient.vitals?.spo2 || '98%');
      setSugar(selectedPatient.vitals?.sugar || '96 mg/dL');
      setTemp(selectedPatient.vitals?.temp || '98.4 °F');
      setWeight(selectedPatient.vitals?.weight || '68 kg');
      setRespirationRate(selectedPatient.vitals?.respirationRate || '16 breaths/min');
      setChronicConditions(selectedPatient.chronicConditions || []);
      setAllergies(selectedPatient.allergies || []);
    }
  }, [selectedPatientId, patients]);

  const handleSaveVitalsAndConditions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    setSavingVitals(true);
    setSuccessToast(null);

    const nurseName = currentUser.name.startsWith('Nurse') ? currentUser.name : `Nurse ${currentUser.name}`;

    try {
      const updatedVitals = {
        bp,
        heartRate,
        spo2,
        sugar,
        temp,
        weight,
        respirationRate,
        lastUpdated: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        recordedBy: `${nurseName} (${activeHospital?.name || 'MediCare Hospital'})`,
      };

      const res = await api.updatePatient(selectedPatient.id, {
        vitals: updatedVitals,
        chronicConditions,
        allergies,
        hospitalId: activeHospitalId,
        hospitalName: activeHospital?.name,
      });

      setSuccessToast(
        `Vitals & clinical conditions for ${selectedPatient.name} updated successfully! Data is now live in the Patient Portal.`
      );
      setTimeout(() => setSuccessToast(null), 5000);

      // Refresh list
      await fetchPatients();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error updating vitals');
    } finally {
      setSavingVitals(false);
    }
  };

  const handleAddCondition = (conditionToAdd?: string) => {
    const val = conditionToAdd || newCondition.trim();
    if (val && !chronicConditions.includes(val)) {
      setChronicConditions([...chronicConditions, val]);
      setNewCondition('');
    }
  };

  const handleRemoveCondition = (index: number) => {
    setChronicConditions(chronicConditions.filter((_, i) => i !== index));
  };

  const handleAddAllergy = (allergyToAdd?: string) => {
    const val = allergyToAdd || newAllergy.trim();
    if (val && !allergies.includes(val)) {
      setAllergies([...allergies, val]);
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const handleAddHealthNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedPatient) return;

    setAddingNote(true);
    const nurseName = currentUser.name.startsWith('Nurse') ? currentUser.name : `Nurse ${currentUser.name}`;

    try {
      await api.addPatientHealthNote(selectedPatient.id, {
        note: newNoteText.trim(),
        recordedBy: `${nurseName} (${activeHospital?.name || 'MediCare Staff'})`,
        role: 'Hospital Staff / Staff Nurse',
      });

      setNewNoteText('');
      setSuccessToast(`Clinical note appended to ${selectedPatient.name}'s medical chart.`);
      setTimeout(() => setSuccessToast(null), 5000);

      await fetchPatients();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error adding clinical note');
    } finally {
      setAddingNote(false);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border transition-all ${
          highContrast
            ? 'bg-neutral-900 border-yellow-400 text-white'
            : 'bg-gradient-to-r from-teal-900 via-emerald-800 to-cyan-900 text-white shadow-xl'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-emerald-100">
              <Stethoscope className="w-3.5 h-3.5" />
              Hospital EHR &bull; Nurse Clinical Vitals Desk
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hospital Staff &amp; Nurse Station
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              Record and update real-time patient health vitals (BP, SpO2, Glucose, Temperature), manage chronic
              conditions &amp; allergies, and document nursing observations. All updates sync instantly to the
              Patient Portal.
            </p>
          </div>

          {/* Hospital Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="p-3 rounded-2xl bg-black/30 border border-white/20 backdrop-blur-xs text-xs space-y-1">
              <span className="text-[11px] uppercase font-bold text-emerald-200 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                Affiliated Hospital:
              </span>
              <select
                value={activeHospitalId}
                onChange={(e) => setActiveHospitalId(e.target.value)}
                className="bg-emerald-950 text-white px-2.5 py-1.5 rounded-lg border border-emerald-400 font-semibold text-xs outline-none cursor-pointer"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-2xl bg-black/30 border border-white/20 text-xs">
              <span className="text-[11px] text-emerald-200 block font-semibold">Active Practitioner:</span>
              <span className="font-extrabold text-sm text-white">
                {currentUser.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notice Toast */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-700 text-white shadow-xl border-2 border-emerald-400 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <p className="text-xs font-bold font-mono">{successToast}</p>
        </div>
      )}

      {/* Grid: Patient Selection + Clinical Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient Directory (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div
            className={`p-4 rounded-2xl border ${
              highContrast ? 'bg-neutral-900 border-yellow-400 text-white' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span>Select Patient</span>
              </h2>
              <button
                onClick={fetchPatients}
                className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                title="Refresh patient list"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient name, phone, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border outline-none ${
                  highContrast
                    ? 'bg-black border-yellow-400 text-white'
                    : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500'
                }`}
              />
            </div>

            {/* Patient Cards List */}
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500 font-semibold">
                Loading clinical registry...
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No patients matched search.</div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredPatients.map((pat) => {
                  const isSelected = pat.id === selectedPatient?.id;
                  return (
                    <div
                      key={pat.id}
                      onClick={() => setSelectedPatientId(pat.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? highContrast
                            ? 'bg-yellow-400 text-black border-yellow-400 font-bold'
                            : 'bg-emerald-50/80 border-emerald-500 shadow-xs'
                          : highContrast
                          ? 'bg-neutral-800 border-neutral-700 hover:border-yellow-400'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{pat.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {pat.bloodGroup} &bull; {pat.age} yrs
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span>Ph: {pat.phone}</span>
                        <span className="font-mono text-[10px]">{pat.id}</span>
                      </div>
                      {pat.vitals?.lastUpdated && (
                        <div className="text-[10px] text-emerald-700/80 mt-1 flex items-center gap-1 font-mono">
                          <Activity className="w-2.5 h-2.5" />
                          <span>Last vitals: {pat.vitals.bp} ({pat.vitals.spo2})</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Vitals Form, Chronic Conditions, and Health Notes (8 cols) */}
        {selectedPatient && (
          <div className="lg:col-span-8 space-y-6">
            {/* Patient Header Card */}
            <div
              className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                highContrast ? 'bg-neutral-900 border-yellow-400 text-white' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-800">{selectedPatient.name}</h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono">
                    ID: {selectedPatient.id}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold font-mono">
                    Blood Group: {selectedPatient.bloodGroup}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Age: {selectedPatient.age} &bull; Gender: {selectedPatient.gender} &bull; Phone: {selectedPatient.phone} &bull; Address: {selectedPatient.address}
                </p>
              </div>

              <div className="text-right text-xs text-slate-400">
                <span className="block font-semibold text-slate-600">Last Recorded By:</span>
                <span className="font-mono text-[11px] text-emerald-700 font-medium">
                  {selectedPatient.vitals?.recordedBy || 'Nurse Staff'}
                </span>
                <span className="block text-[10px] text-slate-400">{selectedPatient.vitals?.lastUpdated || 'Pending'}</span>
              </div>
            </div>

            {/* Form: Vitals & Chronic Conditions */}
            <form onSubmit={handleSaveVitalsAndConditions} className="space-y-6">
              {/* 1. Vital Signs Entry */}
              <div
                className={`p-6 rounded-2xl border ${
                  highContrast ? 'bg-neutral-900 border-yellow-400 text-white' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>1. Record Clinical Vitals</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Updated live into Patient Portal
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* BP */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Blood Pressure (mmHg)
                    </label>
                    <input
                      type="text"
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      placeholder="e.g. 120/80 mmHg"
                      required
                      className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                        highContrast
                          ? 'bg-black border-yellow-400 text-white'
                          : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400">Normal: &lt; 120/80 mmHg</span>
                  </div>

                  {/* Heart Rate */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Pulse / Heart Rate (bpm)
                    </label>
                    <input
                      type="text"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      placeholder="e.g. 74 bpm"
                      required
                      className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                        highContrast
                          ? 'bg-black border-yellow-400 text-white'
                          : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400">Normal: 60 - 100 bpm</span>
                  </div>

                  {/* SpO2 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Oxygen Saturation SpO2 (%)
                    </label>
                    <input
                      type="text"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      placeholder="e.g. 98%"
                      required
                      className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                        highContrast
                          ? 'bg-black border-yellow-400 text-white'
                          : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400">Normal: 95% - 100%</span>
                  </div>

                  {/* Blood Sugar */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Blood Glucose / Sugar
                    </label>
                    <input
                      type="text"
                      value={sugar}
                      onChange={(e) => setSugar(e.target.value)}
                      placeholder="e.g. 96 mg/dL"
                      required
                      className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                        highContrast
                          ? 'bg-black border-yellow-400 text-white'
                          : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400">Fasting: 70 - 99 mg/dL</span>
                  </div>

                  {/* Temperature */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Body Temperature
                    </label>
                    <input
                      type="text"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      placeholder="e.g. 98.4 °F"
                      required
                      className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                        highContrast
                          ? 'bg-black border-yellow-400 text-white'
                          : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400">Normal: 97.8 - 99.1 °F</span>
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="text"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="e.g. 68 kg"
                      required
                      className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                        highContrast
                          ? 'bg-black border-yellow-400 text-white'
                          : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400">Standard body mass check</span>
                  </div>
                </div>
              </div>

              {/* 2. Chronic Conditions & Allergies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chronic Conditions */}
                <div
                  className={`p-5 rounded-2xl border ${
                    highContrast ? 'bg-neutral-900 border-yellow-400 text-white' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Chronic Conditions (EHR Record)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Conditions tracked by attending clinical staff
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3 min-h-[40px]">
                    {chronicConditions.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No chronic conditions recorded</span>
                    ) : (
                      chronicConditions.map((cond, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200"
                        >
                          {cond}
                          <button
                            type="button"
                            onClick={() => handleRemoveCondition(idx)}
                            className="hover:text-rose-950 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Add Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add condition (e.g. Asthma, Diabetes)..."
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCondition();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCondition()}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Quick Suggestions */}
                  <div className="mt-2.5 flex items-center flex-wrap gap-1 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-400">Quick:</span>
                    {['Mild Asthma', 'Hypertension', 'Type 2 Diabetes', 'Hypothyroidism'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddCondition(tag)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Allergies */}
                <div
                  className={`p-5 rounded-2xl border ${
                    highContrast ? 'bg-neutral-900 border-yellow-400 text-white' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Known Drug &amp; Food Allergies</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Safety-critical alerts for prescribing physicians
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3 min-h-[40px]">
                    {allergies.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No allergies recorded</span>
                    ) : (
                      allergies.map((allg, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
                        >
                          {allg}
                          <button
                            type="button"
                            onClick={() => handleRemoveAllergy(idx)}
                            className="hover:text-amber-950 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Add Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add allergy (e.g. Penicillin, Sulfa)..."
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAllergy();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddAllergy()}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Quick Suggestions */}
                  <div className="mt-2.5 flex items-center flex-wrap gap-1 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-400">Quick:</span>
                    {['Penicillin', 'Sulfa drugs', 'NSAIDs / Ibuprofen', 'Latex'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddAllergy(tag)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingVitals}
                  className={`px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                    highContrast
                      ? 'bg-yellow-400 text-black hover:bg-yellow-300 font-extrabold'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{savingVitals ? 'Saving to Clinical EHR...' : 'Save & Sync Vitals to Patient Portal'}</span>
                </button>
              </div>
            </form>

            {/* 3. Nurse Clinical Health Notes & Observations */}
            <div
              className={`p-6 rounded-2xl border ${
                highContrast ? 'bg-neutral-900 border-yellow-400 text-white' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Clinical Health Notes &amp; Observations Log</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pulling directly from {activeHospital?.name || 'MediCare Hospital'} EHR records
                  </p>
                </div>
              </div>

              {/* Add New Note Box */}
              <form onSubmit={handleAddHealthNote} className="mb-6 space-y-3">
                <textarea
                  rows={2}
                  placeholder={`Write nursing intake or clinical progress note for ${selectedPatient.name}...`}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className={`w-full p-3 text-xs rounded-xl border outline-none ${
                    highContrast
                      ? 'bg-black border-yellow-400 text-white'
                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500'
                  }`}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Signing as: <strong className="text-slate-700">{currentUser.name}</strong> ({activeHospital?.name})
                  </span>
                  <button
                    type="submit"
                    disabled={addingNote || !newNoteText.trim()}
                    className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{addingNote ? 'Appending Note...' : 'Record Clinical Note in EHR'}</span>
                  </button>
                </div>
              </form>

              {/* Existing Notes Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Documented Notes History ({selectedPatient.healthNotes?.length || 0})
                </h4>

                {(!selectedPatient.healthNotes || selectedPatient.healthNotes.length === 0) ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-400 italic">
                    No clinical observations recorded yet.
                  </div>
                ) : (
                  selectedPatient.healthNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {note.recordedBy} &bull; <span className="text-slate-400">{note.role}</span>
                        </span>
                        <span className="text-slate-400 font-mono text-[10px] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {note.date}
                        </span>
                      </div>
                      <p className="text-slate-800 leading-relaxed font-sans">{note.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

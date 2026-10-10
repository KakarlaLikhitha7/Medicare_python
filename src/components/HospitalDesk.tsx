import React, { useState, useEffect } from 'react';
import {
  Hospital,
  Doctor,
  Appointment,
  Department,
  PatientRecord,
  UserSession,
} from '../types';
import { api } from '../services/api';
import {
  Building2,
  Calendar,
  Clock,
  User,
  Activity,
  Heart,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  FileText,
  Save,
  Phone,
  MapPin,
  Stethoscope,
  Trash2,
  Check,
  Edit,
  RotateCcw,
  Sparkles,
  Printer,
  ChevronRight,
} from 'lucide-react';

interface HospitalDeskProps {
  currentUser: UserSession;
  hospitals: Hospital[];
  doctors: Doctor[];
  departments: Department[];
  appointments: Appointment[];
  onRefreshAll: () => void;
  highContrast: boolean;
}

export const HospitalDesk: React.FC<HospitalDeskProps> = ({
  currentUser,
  hospitals,
  doctors,
  departments,
  appointments,
  onRefreshAll,
  highContrast,
}) => {
  // Current hospital context (defaults to user's assigned hospital or first hospital)
  const [activeHospitalId, setActiveHospitalId] = useState<string>(
    currentUser.hospitalId || hospitals[0]?.id || 'hosp-1'
  );

  // Active Operating View
  // 1: scheduled = "Scheduled Appointments & Queue"
  // 2: new = "Schedule New Walk-in / Reception Appointment"
  // 3: vitals = "Patient Records & Health Vitals (Nurse & Clinical Desk)"
  // 4: find_update = "Find & Update Appointment Record"
  const [activeTab, setActiveTab] = useState<'scheduled' | 'new' | 'vitals' | 'find_update'>('scheduled');

  const activeHospital = hospitals.find((h) => h.id === activeHospitalId) || hospitals[0];

  if (!activeHospital || hospitals.length === 0) {
    return (
      <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-sm max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto text-3xl">
          🏥
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">No Hospital Facilities in Database</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The database currently has 0 registered hospitals. Central Admin must first register a hospital facility before OPD reception and nursing desks can manage walk-ins and patient vitals.
        </p>
      </div>
    );
  }

  // Doctors belonging to this hospital
  const hospitalDoctors = doctors.filter((doc) => doc.hospitalId === activeHospitalId);

  // Departments available in this hospital
  const hospitalDepartments = departments.filter((dept) =>
    dept.hospitalIds.includes(activeHospitalId)
  );

  // Appointments for this hospital
  const hospitalAppointments = appointments.filter(
    (a) => a.hospitalId === activeHospitalId
  );

  // ==========================================
  // TAB 1: SCHEDULED APPOINTMENTS STATE
  // ==========================================
  const [filterDoctorId, setFilterDoctorId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingApptId, setUpdatingApptId] = useState<number | null>(null);
  const [statusActionNotice, setStatusActionNotice] = useState<string | null>(null);

  // Filtered appointment list
  const filteredAppointments = hospitalAppointments.filter((appt) => {
    const matchDoctor = filterDoctorId === 'all' || appt.doctorId === filterDoctorId;
    const matchStatus = filterStatus === 'all' || appt.status === filterStatus;
    const matchSearch =
      searchQuery === '' ||
      appt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.patientPhone.includes(searchQuery) ||
      appt.patientDisease.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(appt.id).includes(searchQuery);
    return matchDoctor && matchStatus && matchSearch;
  });

  const handleUpdateStatus = async (
    apptId: number,
    newStatus: 'Scheduled' | 'In Consultation' | 'Completed' | 'Cancelled'
  ) => {
    try {
      setUpdatingApptId(apptId);
      await api.updateAppointment(apptId, { status: newStatus });
      setStatusActionNotice(`Appointment #${apptId} status changed to "${newStatus}"`);
      setTimeout(() => setStatusActionNotice(null), 4000);
      onRefreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingApptId(null);
    }
  };

  // ==========================================
  // TAB 2: SCHEDULE NEW APPOINTMENT (RECEPTION DESK)
  // ==========================================
  const todayISO = new Date().toISOString().split('T')[0];
  const [newDeptId, setNewDeptId] = useState<string>(hospitalDepartments[0]?.id || 'dept-1');
  const [newDoctorId, setNewDoctorId] = useState<string>(hospitalDoctors[0]?.id || 'doc-1');
  const [newDate, setNewDate] = useState<string>(todayISO);
  const [newSlot, setNewSlot] = useState<string>('09:00');
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [newPatientAge, setNewPatientAge] = useState<string>('30');
  const [newPatientPhone, setNewPatientPhone] = useState<string>('');
  const [newPatientDisease, setNewPatientDisease] = useState<string>('General Consultation');
  const [newPatientAddress, setNewPatientAddress] = useState<string>('Pune');
  const [newNotes, setNewNotes] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);
  const [bookingSuccessNotice, setBookingSuccessNotice] = useState<string | null>(null);

  // Update doctors when department changes in new appointment form
  const deptDoctors = hospitalDoctors.filter(
    (doc) => !newDeptId || doc.departmentId === newDeptId
  );

  useEffect(() => {
    if (deptDoctors.length > 0 && !deptDoctors.some((d) => d.id === newDoctorId)) {
      setNewDoctorId(deptDoctors[0].id);
    }
  }, [newDeptId, deptDoctors]);

  // Fetch available slots for chosen doctor & date
  useEffect(() => {
    const fetchSlots = async () => {
      if (!newDoctorId) return;
      try {
        const data = await api.getDoctorSlots(newDoctorId, newDate);
        const free = data.slots.filter((s) => s.isAvailable).map((s) => s.time);
        setAvailableSlots(free);
        if (free.length > 0 && !free.includes(newSlot)) {
          setNewSlot(free[0]);
        }
      } catch (err) {
        console.error('Error fetching slots:', err);
      }
    };
    fetchSlots();
  }, [newDoctorId, newDate]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccessNotice(null);

    if (!newPatientName.trim() || !newPatientPhone.trim() || !newSlot) {
      alert('Please fill in patient name, phone number, and select an available time slot.');
      return;
    }

    try {
      setSubmittingBooking(true);
      const chosenDoc = doctors.find((d) => d.id === newDoctorId) || hospitalDoctors[0];
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const chosenDay = days[new Date(newDate).getDay()];

      const res = await api.createAppointment({
        patientName: newPatientName.trim(),
        patientAge: parseInt(newPatientAge, 10) || 30,
        patientPhone: newPatientPhone.trim(),
        patientDisease: newPatientDisease.trim() || 'General Consultation',
        patientAddress: newPatientAddress.trim() || 'Pune',
        doctorId: chosenDoc.id,
        doctorName: chosenDoc.name,
        appointmentDate: newDate,
        appointmentDay: chosenDay,
        slotTime: newSlot,
        notes: newNotes.trim() ? `[Hospital Desk] ${newNotes.trim()}` : undefined,
      });

      setBookingSuccessNotice(
        `Appointment #${res.appointment.id} successfully scheduled for ${newPatientName} with ${chosenDoc.name} at ${newSlot}! SMS confirmed to ${newPatientPhone}.`
      );

      // Reset form
      setNewPatientName('');
      setNewPatientPhone('');
      setNewNotes('');

      onRefreshAll();
    } catch (err: any) {
      alert(err.message || 'Error scheduling appointment');
    } finally {
      setSubmittingBooking(false);
    }
  };

  // ==========================================
  // TAB 3: PATIENT RECORDS & HEALTH VITALS (NURSE / EHR DESK)
  // ==========================================
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('p-1');
  const [loadingPatients, setLoadingPatients] = useState<boolean>(true);
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [savingVitals, setSavingVitals] = useState<boolean>(false);
  const [vitalsNotice, setVitalsNotice] = useState<string | null>(null);

  // Vitals form
  const [bp, setBp] = useState<string>('120/80 mmHg');
  const [heartRate, setHeartRate] = useState<string>('74 bpm');
  const [spo2, setSpo2] = useState<string>('98%');
  const [sugar, setSugar] = useState<string>('96 mg/dL');
  const [temp, setTemp] = useState<string>('98.4 °F');
  const [weight, setWeight] = useState<string>('68 kg');
  const [respirationRate, setRespirationRate] = useState<string>('16 breaths/min');

  // Conditions & Allergies
  const [conditions, setConditions] = useState<string[]>([]);
  const [newConditionInput, setNewConditionInput] = useState<string>('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergyInput, setNewAllergyInput] = useState<string>('');

  // Clinical note
  const [clinicalNoteText, setClinicalNoteText] = useState<string>('');
  const [savingNote, setSavingNote] = useState<boolean>(false);

  const loadPatients = async () => {
    try {
      setLoadingPatients(true);
      const data = await api.getPatients();
      setPatients(data);
      if (data.length > 0 && !selectedPatientId) {
        setSelectedPatientId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  useEffect(() => {
    if (selectedPatient) {
      setBp(selectedPatient.vitals?.bp || '120/80 mmHg');
      setHeartRate(selectedPatient.vitals?.heartRate || '74 bpm');
      setSpo2(selectedPatient.vitals?.spo2 || '98%');
      setSugar(selectedPatient.vitals?.sugar || '96 mg/dL');
      setTemp(selectedPatient.vitals?.temp || '98.4 °F');
      setWeight(selectedPatient.vitals?.weight || '68 kg');
      setRespirationRate(selectedPatient.vitals?.respirationRate || '16 breaths/min');
      setConditions(selectedPatient.chronicConditions || []);
      setAllergies(selectedPatient.allergies || []);
    }
  }, [selectedPatientId, patients]);

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      setSavingVitals(true);
      const recorderTag = `${currentUser.name || 'Hospital Desk Staff'} (${activeHospital.name})`;
      const nowFormatted = new Date().toLocaleString();
      const updated = await api.updatePatientVitals(selectedPatient.id, {
        vitals: {
          bp,
          heartRate,
          spo2,
          sugar,
          temp,
          weight,
          respirationRate,
          lastUpdated: nowFormatted,
          recordedBy: recorderTag,
        },
        chronicConditions: conditions,
        allergies,
        hospitalId: activeHospitalId,
        hospitalName: activeHospital.name,
      });

      setVitalsNotice(
        `Health vitals & conditions for ${updated.name} updated and synced with EHR! Recorded by ${recorderTag}.`
      );
      setTimeout(() => setVitalsNotice(null), 5000);

      // Refresh patients list
      loadPatients();
      onRefreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to save vitals');
    } finally {
      setSavingVitals(false);
    }
  };

  const handleAddClinicalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !clinicalNoteText.trim()) return;

    try {
      setSavingNote(true);
      const recorderTag = currentUser.name || 'Hospital Desk Staff';
      await api.addPatientHealthNote(selectedPatient.id, {
        note: clinicalNoteText.trim(),
        recordedBy: `${recorderTag} - ${activeHospital.name}`,
        role: 'Hospital Staff / Nurse',
      });

      setClinicalNoteText('');
      setVitalsNotice(`Clinical note appended to ${selectedPatient.name}'s medical chart.`);
      setTimeout(() => setVitalsNotice(null), 4000);

      loadPatients();
    } catch (err: any) {
      alert(err.message || 'Failed to add clinical note');
    } finally {
      setSavingNote(false);
    }
  };

  // ==========================================
  // TAB 4: FIND & UPDATE APPOINTMENT RECORD
  // ==========================================
  const [searchApptQuery, setSearchApptQuery] = useState<string>('1');
  const [foundAppt, setFoundAppt] = useState<Appointment | null>(null);
  const [upName, setUpName] = useState<string>('');
  const [upAge, setUpAge] = useState<string>('');
  const [upPhone, setUpPhone] = useState<string>('');
  const [upDisease, setUpDisease] = useState<string>('');
  const [upAddress, setUpAddress] = useState<string>('');
  const [upDate, setUpDate] = useState<string>('');
  const [upSlot, setUpSlot] = useState<string>('');
  const [upStatus, setUpStatus] = useState<string>('Scheduled');
  const [upNotes, setUpNotes] = useState<string>('');
  const [savingApptEdit, setSavingApptEdit] = useState<boolean>(false);
  const [editNotice, setEditNotice] = useState<string | null>(null);

  const handleFindAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditNotice(null);
    setFoundAppt(null);

    const query = searchApptQuery.trim();
    if (!query) return;

    // Search by ID or phone in current hospital appointments or all appointments
    const idNum = parseInt(query, 10);
    let match = !isNaN(idNum) ? appointments.find((a) => a.id === idNum) : null;
    if (!match) {
      match = appointments.find((a) => a.patientPhone.includes(query) || a.patientName.toLowerCase().includes(query.toLowerCase())) || null;
    }

    if (!match) {
      alert(`No appointment record found matching "${query}". Please check the ID or phone number.`);
      return;
    }

    setFoundAppt(match);
    setUpName(match.patientName);
    setUpAge(String(match.patientAge));
    setUpPhone(match.patientPhone);
    setUpDisease(match.patientDisease);
    setUpAddress(match.patientAddress);
    setUpDate(match.appointmentDate);
    setUpSlot(match.slotTime);
    setUpStatus(match.status);
    setUpNotes(match.notes || '');
  };

  const handleSaveAppointmentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundAppt) return;

    try {
      setSavingApptEdit(true);
      await api.updateAppointment(foundAppt.id, {
        patientName: upName.trim(),
        patientAge: parseInt(upAge, 10) || foundAppt.patientAge,
        patientPhone: upPhone.trim(),
        patientDisease: upDisease.trim(),
        patientAddress: upAddress.trim(),
        appointmentDate: upDate,
        slotTime: upSlot,
        status: upStatus as any,
        notes: upNotes.trim(),
      });

      setEditNotice(`Appointment #${foundAppt.id} successfully updated! Changes saved to hospital system.`);
      setTimeout(() => setEditNotice(null), 5000);
      onRefreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to update appointment record');
    } finally {
      setSavingApptEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hospital Desk Header & Active Facility Control */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-xl transition-all ${
          highContrast
            ? 'bg-neutral-900 border-yellow-400 text-white'
            : 'bg-gradient-to-r from-teal-800 via-emerald-800 to-cyan-900 text-white'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-emerald-100 border border-white/20">
                <Building2 className="w-3.5 h-3.5" />
                Hospital Operations &amp; Reception Desk
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                <User className="w-3.5 h-3.5" />
                Staff: {currentUser.name} ({currentUser.role.toUpperCase()})
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <span>{activeHospital?.name}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-100/90 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                {activeHospital?.address}, {activeHospital?.city}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-300" />
                {activeHospital?.phone} &bull; Emergency: {activeHospital?.emergencyPhone}
              </span>
            </div>
          </div>

          {/* Hospital Switcher dropdown for multi-hospital desk staff */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold text-emerald-200 uppercase tracking-wider mb-1">
                Active Hospital Facility:
              </label>
              <select
                value={activeHospitalId}
                onChange={(e) => setActiveHospitalId(e.target.value)}
                className="bg-white text-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-emerald-300 focus:outline-hidden cursor-pointer"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.city})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onRefreshAll}
              className="mt-4 sm:mt-0 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Refresh Hospital Feed"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* Live Facility KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20 text-xs">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-emerald-200 block text-[11px]">Today&apos;s Appointments</span>
            <span className="text-xl font-extrabold">{hospitalAppointments.length} Bookings</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-emerald-200 block text-[11px]">Doctors on Duty</span>
            <span className="text-xl font-extrabold">{hospitalDoctors.length} Specialists</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-emerald-200 block text-[11px]">Specialty Departments</span>
            <span className="text-xl font-extrabold">{hospitalDepartments.length} Active</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-emerald-200 block text-[11px]">Patient Records EHR</span>
            <span className="text-xl font-extrabold">{patients.length} Registered</span>
          </div>
        </div>
      </div>

      {/* Main Hospital Desk Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'scheduled'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Scheduled Appointments ({hospitalAppointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('new')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'new'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Appointment</span>
        </button>

        <button
          onClick={() => setActiveTab('vitals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'vitals'
              ? 'bg-teal-700 text-white shadow-md'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Patient Records &amp; Health Vitals</span>
        </button>

        <button
          onClick={() => setActiveTab('find_update')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'find_update'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Find &amp; Update Record</span>
        </button>
      </div>

      {/* Notices */}
      {statusActionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-700 text-white flex items-center gap-3 shadow-md border border-emerald-400 animate-fade-in text-xs font-bold font-mono">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{statusActionNotice}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: SCHEDULED APPOINTMENTS (HOSPITAL QUEUE & MONITOR) */}
      {/* ========================================================= */}
      {activeTab === 'scheduled' && (
        <div
          className={`p-6 rounded-3xl border shadow-md space-y-6 transition-all ${
            highContrast ? 'bg-neutral-900 border-yellow-400 text-white' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>Hospital Appointment Queue &amp; Patient Check-in</span>
              </h2>
              <p className="text-xs text-slate-500">
                Real-time appointment schedule for {activeHospital?.name}. Desk staff can check-in patients, update status, and manage the doctor consultation flow.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Queue</span>
              </button>
              <button
                onClick={onRefreshAll}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient name, phone, symptom or ID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            {/* Doctor Filter */}
            <div>
              <select
                value={filterDoctorId}
                onChange={(e) => setFilterDoctorId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs bg-white cursor-pointer"
              >
                <option value="all">All Doctors at {activeHospital?.name}</option>
                {hospitalDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialization} &bull; {doc.cabin})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs bg-white cursor-pointer"
              >
                <option value="all">All Statuses (Scheduled, In Consultation, Completed, Cancelled)</option>
                <option value="Scheduled">Scheduled (Waiting)</option>
                <option value="In Consultation">In Consultation (With Doctor)</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Appointments Table */}
          {filteredAppointments.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
              <Calendar className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">
                No scheduled appointments match the current filter.
              </p>
              <button
                onClick={() => setActiveTab('new')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
              >
                + Schedule New Walk-in Appointment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-extrabold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">#ID</th>
                    <th className="py-3 px-4">Patient Info</th>
                    <th className="py-3 px-4">Assigned Doctor &amp; Cabin</th>
                    <th className="py-3 px-4">Date &amp; Slot</th>
                    <th className="py-3 px-4">Chief Complaint / Disease</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Desk Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredAppointments.map((appt) => {
                    const isUpdating = updatingApptId === appt.id;
                    return (
                      <tr
                        key={appt.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          appt.status === 'In Consultation' ? 'bg-amber-50/60' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                          #{appt.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{appt.patientName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {appt.patientPhone} &bull; {appt.patientAge} yrs &bull; {appt.patientAddress}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{appt.doctorName}</div>
                          <div className="text-[11px] text-slate-500">
                            {appt.departmentName}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold font-mono text-slate-800">
                            {appt.slotTime}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {appt.appointmentDate} ({appt.appointmentDay})
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            {appt.patientDisease}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                              appt.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : appt.status === 'In Consultation'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                                : appt.status === 'Cancelled'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}
                          >
                            {appt.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {appt.status === 'Scheduled' && (
                              <button
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(appt.id, 'In Consultation')}
                                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] cursor-pointer shadow-xs transition-all"
                                title="Check-in patient into doctor cabin"
                              >
                                Check-in
                              </button>
                            )}

                            {appt.status === 'In Consultation' && (
                              <button
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(appt.id, 'Completed')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer shadow-xs transition-all"
                                title="Mark consultation completed"
                              >
                                Complete
                              </button>
                            )}

                            {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                              <button
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(appt.id, 'Cancelled')}
                                className="px-2 py-1 rounded-lg border border-slate-300 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-semibold text-[11px] cursor-pointer"
                                title="Cancel appointment"
                              >
                                Cancel
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSearchApptQuery(String(appt.id));
                                setFoundAppt(appt);
                                setUpName(appt.patientName);
                                setUpAge(String(appt.patientAge));
                                setUpPhone(appt.patientPhone);
                                setUpDisease(appt.patientDisease);
                                setUpAddress(appt.patientAddress);
                                setUpDate(appt.appointmentDate);
                                setUpSlot(appt.slotTime);
                                setUpStatus(appt.status);
                                setUpNotes(appt.notes || '');
                                setActiveTab('find_update');
                              }}
                              className="px-2 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] cursor-pointer"
                              title="Edit appointment details"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SCHEDULE NEW WALK-IN / RECEPTION APPOINTMENT      */}
      {/* ========================================================= */}
      {activeTab === 'new' && (
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-md space-y-6 transition-all ${
            highContrast ? 'bg-neutral-900 border-yellow-400 text-white' : 'bg-white border-slate-200'
          }`}
        >
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              <span>Schedule Walk-in / Reception Appointment</span>
            </h2>
            <p className="text-xs text-slate-500">
              Hospital desk staff can instantly book an appointment for in-person walk-in patients or telephone calls at {activeHospital?.name}.
            </p>
          </div>

          {bookingSuccessNotice && (
            <div className="p-4 rounded-2xl bg-emerald-700 text-white flex items-center gap-3 shadow-md border border-emerald-400 text-xs font-bold font-mono animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
              <span>{bookingSuccessNotice}</span>
            </div>
          )}

          <form onSubmit={handleCreateAppointment} className="space-y-6 text-xs">
            {/* Step 1: Hospital Facility & Doctor Selection */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <span>1. Select Medical Department &amp; Doctor</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Specialty Department *
                  </label>
                  <select
                    value={newDeptId}
                    onChange={(e) => setNewDeptId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {hospitalDepartments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Doctor on Duty * (16-Slot Limit)
                  </label>
                  <select
                    value={newDoctorId}
                    onChange={(e) => setNewDoctorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {deptDoctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.specialization} &bull; Cabin: {doc.cabin})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Appointment Date *
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Available Slots */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Available 30-Minute Consultation Slots ({availableSlots.length} Remaining for today):
                </label>
                {availableSlots.length === 0 ? (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>This doctor is fully booked (16/16 patients) for {newDate}. Please choose another date or doctor.</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setNewSlot(slot)}
                        className={`px-3 py-1.5 rounded-xl font-bold font-mono text-xs transition-all cursor-pointer ${
                          newSlot === slot
                            ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                            : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Patient Registration Info */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span>2. Patient Information (Walk-in Desk)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    placeholder="Enter Patient Full Name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone (SMS confirmation) *</label>
                  <input
                    type="tel"
                    required
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age (Years) *</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(e.target.value)}
                    placeholder="Age"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chief Complaint / Disease</label>
                  <input
                    type="text"
                    value={newPatientDisease}
                    onChange={(e) => setNewPatientDisease(e.target.value)}
                    placeholder="Chief symptoms or complaints"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Residential Address / City</label>
                  <input
                    type="text"
                    value={newPatientAddress}
                    onChange={(e) => setNewPatientAddress(e.target.value)}
                    placeholder="Patient address"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Desk Reception Notes (Optional)</label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Reception notes (optional)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setNewPatientName('');
                  setNewPatientPhone('');
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Clear Form
              </button>

              <button
                type="submit"
                disabled={submittingBooking || availableSlots.length === 0}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{submittingBooking ? 'Booking...' : 'Confirm & Schedule Appointment'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PATIENT RECORDS & HEALTH VITALS (NURSE / EHR DESK) */}
      {/* ========================================================= */}
      {activeTab === 'vitals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Search & Selector Column */}
          <div
            className={`p-5 rounded-3xl border shadow-md space-y-4 ${
              highContrast ? 'bg-neutral-900 border-yellow-400 text-white' : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" />
                <span>Hospital Patients Registry</span>
              </h3>
              <p className="text-xs text-slate-500">
                Search and select patient to update vital signs &amp; EHR notes.
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Find by name, phone or ID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Patient Cards List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {patients
                .filter(
                  (p) =>
                    patientSearch === '' ||
                    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                    p.phone.includes(patientSearch) ||
                    p.id.includes(patientSearch)
                )
                .map((patient) => {
                  const isSelected = selectedPatientId === patient.id;
                  return (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={`p-3.5 rounded-2xl cursor-pointer border transition-all text-xs ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-500 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-900">{patient.name}</span>
                        <span className="font-mono text-[11px] text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md font-bold">
                          {patient.bloodGroup || 'O+'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Age: {patient.age} yrs &bull; {patient.gender} &bull; Ph: {patient.phone}
                      </div>
                      {patient.vitals?.lastUpdated && (
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          Last Vitals: {patient.vitals.lastUpdated}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Vitals Form & Clinical Notes Column */}
          <div className="lg:col-span-2 space-y-6">
            {vitalsNotice && (
              <div className="p-4 rounded-2xl bg-teal-700 text-white flex items-center gap-3 shadow-md border border-teal-400 text-xs font-bold font-mono animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-teal-200 shrink-0" />
                <span>{vitalsNotice}</span>
              </div>
            )}

            {selectedPatient && (
              <div
                className={`p-6 rounded-3xl border shadow-md space-y-6 ${
                  highContrast ? 'bg-neutral-900 border-yellow-400 text-white' : 'bg-white border-slate-200'
                }`}
              >
                {/* Active Patient Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                      Editing EHR Vitals For:
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <span>{selectedPatient.name}</span>
                      <span className="text-xs font-mono font-normal text-slate-500">
                        (Patient ID: #{selectedPatient.id})
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Address: {selectedPatient.address} &bull; Phone: {selectedPatient.phone} &bull; Email: {selectedPatient.email}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-mono">
                      Last Verified:
                    </span>
                    <span className="text-xs font-bold text-slate-700 font-mono">
                      {selectedPatient.vitals?.lastUpdated || 'Never'}
                    </span>
                  </div>
                </div>

                {/* Vitals Input Grid */}
                <form onSubmit={handleSaveVitals} className="space-y-6 text-xs">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 mb-3 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>Clinical Vital Signs (Recorded by Nurse / Hospital Desk)</span>
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {/* Blood Pressure */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <label className="block font-bold text-slate-700">Blood Pressure (BP)</label>
                        <input
                          type="text"
                          value={bp}
                          onChange={(e) => setBp(e.target.value)}
                          placeholder="e.g. 120/80 mmHg"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold font-mono text-xs bg-white"
                        />
                        <div className="flex gap-1 pt-1">
                          <button
                            type="button"
                            onClick={() => setBp('120/80 mmHg')}
                            className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-sm hover:bg-slate-300"
                          >
                            120/80
                          </button>
                          <button
                            type="button"
                            onClick={() => setBp('130/85 mmHg')}
                            className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-sm hover:bg-slate-300"
                          >
                            130/85
                          </button>
                          <button
                            type="button"
                            onClick={() => setBp('140/90 mmHg')}
                            className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-sm hover:bg-slate-300"
                          >
                            140/90
                          </button>
                        </div>
                      </div>

                      {/* Heart Rate */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <label className="block font-bold text-slate-700">Heart Rate (Pulse)</label>
                        <input
                          type="text"
                          value={heartRate}
                          onChange={(e) => setHeartRate(e.target.value)}
                          placeholder="e.g. 74 bpm"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold font-mono text-xs bg-white"
                        />
                        <span className="text-[10px] text-slate-400 block">Normal: 60 - 100 bpm</span>
                      </div>

                      {/* SpO2 */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <label className="block font-bold text-slate-700">Oxygen Saturation (SpO2)</label>
                        <input
                          type="text"
                          value={spo2}
                          onChange={(e) => setSpo2(e.target.value)}
                          placeholder="e.g. 98%"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold font-mono text-xs bg-white"
                        />
                        <span className="text-[10px] text-slate-400 block">Normal: 95% - 100%</span>
                      </div>

                      {/* Blood Sugar */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <label className="block font-bold text-slate-700">Blood Glucose (Sugar)</label>
                        <input
                          type="text"
                          value={sugar}
                          onChange={(e) => setSugar(e.target.value)}
                          placeholder="e.g. 96 mg/dL"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold font-mono text-xs bg-white"
                        />
                        <span className="text-[10px] text-slate-400 block">Fasting: 70 - 100 mg/dL</span>
                      </div>

                      {/* Body Temp */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <label className="block font-bold text-slate-700">Temperature</label>
                        <input
                          type="text"
                          value={temp}
                          onChange={(e) => setTemp(e.target.value)}
                          placeholder="e.g. 98.6 °F"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold font-mono text-xs bg-white"
                        />
                        <span className="text-[10px] text-slate-400 block">Normal: 97°F - 99°F</span>
                      </div>

                      {/* Weight */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <label className="block font-bold text-slate-700">Body Weight</label>
                        <input
                          type="text"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="e.g. 68 kg"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold font-mono text-xs bg-white"
                        />
                        <span className="text-[10px] text-slate-400 block">In kilograms (kg)</span>
                      </div>
                    </div>
                  </div>

                  {/* Chronic Conditions & Allergies */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Conditions */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <label className="block font-bold text-slate-800">
                        Chronic Medical Conditions:
                      </label>
                      <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                        {conditions.map((cond, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-100 text-teal-900 font-bold text-xs"
                          >
                            <span>{cond}</span>
                            <button
                              type="button"
                              onClick={() => setConditions(conditions.filter((_, i) => i !== idx))}
                              className="hover:text-rose-600"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newConditionInput}
                          onChange={(e) => setNewConditionInput(e.target.value)}
                          placeholder="Add condition (e.g. Hypertension)..."
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newConditionInput.trim()) {
                              setConditions([...conditions, newConditionInput.trim()]);
                              setNewConditionInput('');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-bold"
                        >
                          + Add
                        </button>
                      </div>
                    </div>

                    {/* Allergies */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <label className="block font-bold text-slate-800">
                        Known Drug &amp; Food Allergies:
                      </label>
                      <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                        {allergies.map((allergy, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 font-bold text-xs"
                          >
                            <span>{allergy}</span>
                            <button
                              type="button"
                              onClick={() => setAllergies(allergies.filter((_, i) => i !== idx))}
                              className="hover:text-rose-600"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newAllergyInput}
                          onChange={(e) => setNewAllergyInput(e.target.value)}
                          placeholder="Add allergy (e.g. Penicillin)..."
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newAllergyInput.trim()) {
                              setAllergies([...allergies, newAllergyInput.trim()]);
                              setNewAllergyInput('');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Save Vitals Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingVitals}
                      className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingVitals ? 'Saving Vitals...' : 'Save & Sync Health Vitals'}</span>
                    </button>
                  </div>
                </form>

                {/* Nursing & Clinical Notes Timeline */}
                <div className="pt-6 border-t border-slate-200 space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>Clinical Notes History (Hospital Nursing Station)</span>
                  </h3>

                  {selectedPatient.healthNotes?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No notes recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedPatient.healthNotes?.map((note) => (
                        <div
                          key={note.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-700">
                            <span>{note.recordedBy} ({note.role})</span>
                            <span className="font-mono text-[10px] text-slate-400">{note.date}</span>
                          </div>
                          <p className="text-slate-800">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Append Note Form */}
                  <form onSubmit={handleAddClinicalNote} className="space-y-2 pt-2">
                    <label className="block font-bold text-slate-700 text-xs">
                      Append New Nursing / Clinical Observation Note:
                    </label>
                    <textarea
                      rows={2}
                      value={clinicalNoteText}
                      onChange={(e) => setClinicalNoteText(e.target.value)}
                      placeholder="e.g. Patient visited triage with mild breathing discomfort. Administered nebulization; vitals stabilized."
                      className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingNote || !clinicalNoteText.trim()}
                        className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{savingNote ? 'Adding...' : 'Add Clinical Note'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: FIND & UPDATE APPOINTMENT RECORD                   */}
      {/* ========================================================= */}
      {activeTab === 'find_update' && (
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-md space-y-6 transition-all ${
            highContrast ? 'bg-neutral-900 border-yellow-400 text-white' : 'bg-white border-slate-200'
          }`}
        >
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-600" />
              <span>Find &amp; Update Appointment Record</span>
            </h2>
            <p className="text-xs text-slate-500">
              Lookup any existing appointment record by Appointment ID or Patient Phone to update symptoms, dates, slots, or consultation notes.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleFindAppointment} className="flex gap-3 max-w-lg">
            <input
              type="text"
              value={searchApptQuery}
              onChange={(e) => setSearchApptQuery(e.target.value)}
              placeholder="Enter Appointment ID (e.g. 1, 2) or Phone..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Search className="w-4 h-4" />
              <span>Find Record</span>
            </button>
          </form>

          {editNotice && (
            <div className="p-4 rounded-2xl bg-emerald-700 text-white flex items-center gap-3 shadow-md border border-emerald-400 text-xs font-bold font-mono animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
              <span>{editNotice}</span>
            </div>
          )}

          {foundAppt ? (
            <form onSubmit={handleSaveAppointmentUpdate} className="space-y-4 pt-2 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-sm text-emerald-950">
                    Record Found: Appointment #{foundAppt.id}
                  </span>
                  <p className="text-xs text-emerald-800">
                    Hospital: {foundAppt.hospitalName} &bull; Doctor: {foundAppt.doctorName}
                  </p>
                </div>
                <span className="font-bold text-xs px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900">
                  Current Status: {foundAppt.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={upName}
                    onChange={(e) => setUpName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Patient Age</label>
                  <input
                    type="number"
                    value={upAge}
                    onChange={(e) => setUpAge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={upPhone}
                    onChange={(e) => setUpPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Disease / Symptoms</label>
                  <input
                    type="text"
                    value={upDisease}
                    onChange={(e) => setUpDisease(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Appointment Date</label>
                  <input
                    type="date"
                    value={upDate}
                    onChange={(e) => setUpDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Consultation Time Slot</label>
                  <input
                    type="text"
                    value={upSlot}
                    onChange={(e) => setUpSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={upStatus}
                    onChange={(e) => setUpStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Consultation">In Consultation</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Hospital Desk Notes</label>
                  <input
                    type="text"
                    value={upNotes}
                    onChange={(e) => setUpNotes(e.target.value)}
                    placeholder="Desk notes or special instructions..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="submit"
                  disabled={savingApptEdit}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingApptEdit ? 'Saving...' : 'Save Updated Record'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
              Enter an Appointment ID (such as #1 or #2) above and click &quot;Find Record&quot; to inspect and update.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

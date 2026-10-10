import React, { useState, useEffect } from 'react';
import { Appointment, Doctor, Hospital, Department } from '../types';
import { api } from '../services/api';
import {
  Search,
  RotateCcw,
  Save,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Printer,
  Building,
  Plus,
  MapPin,
  Phone,
} from 'lucide-react';

interface ClassicConsoleProps {
  doctors: Doctor[];
  appointments: Appointment[];
  hospitals?: Hospital[];
  departments?: Department[];
  onRefreshAppointments: () => void;
  onRefreshAll?: () => void;
  highContrast: boolean;
}

export const ClassicConsole: React.FC<ClassicConsoleProps> = ({
  doctors,
  appointments,
  hospitals = [],
  departments = [],
  onRefreshAppointments,
  onRefreshAll,
  highContrast,
}) => {
  // Sub-tabs matching the desktop app screens:
  // 1: "New Appointment" (Screenshot 1)
  // 2: "Scheduled Appointment" (Screenshot 3)
  // 3: "Update Appointment" (Screenshot 4)
  // 4: "Hospital Management (Admin)"
  const [activeScreen, setActiveScreen] = useState<'new' | 'scheduled' | 'update' | 'hospitals'>('scheduled');

  // Today's dynamic date/day formatted like Screenshot 1 ("Monday", "11 July 2022")
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateFormatted = today.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const todayISO = today.toISOString().split('T')[0];

  // Screen 1: New Appointment State
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState<string>('');
  const [newPhone, setNewPhone] = useState('');
  const [newDisease, setNewDisease] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newDoctorName, setNewDoctorName] = useState(doctors[0]?.name || '');
  const [newSlot, setNewSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [formMsg, setFormMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Screen 4: Update Appointment State
  const [searchApptId, setSearchApptId] = useState('');
  const [foundRecord, setFoundRecord] = useState<Appointment | null>(null);
  const [upName, setUpName] = useState('');
  const [upAge, setUpAge] = useState<string>('');
  const [upPhone, setUpPhone] = useState('');
  const [upDisease, setUpDisease] = useState('');
  const [upAddress, setUpAddress] = useState('');
  const [upDate, setUpDate] = useState('');
  const [upDay, setUpDay] = useState('');
  const [upDoctorName, setUpDoctorName] = useState('');
  const [upSlot, setUpSlot] = useState('');
  const [updateMsg, setUpdateMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  // Hospital Management State (Admin)
  const [hospName, setHospName] = useState('');
  const [hospAddress, setHospAddress] = useState('');
  const [hospCity, setHospCity] = useState('Pune');
  const [hospDistance, setHospDistance] = useState('2.0');
  const [hospPhone, setHospPhone] = useState('+91 20 2000 1111');
  const [hospEmergency, setHospEmergency] = useState('108');
  const [hospRating, setHospRating] = useState('4.8');
  const [hospDepts, setHospDepts] = useState<string[]>(['dept-1', 'dept-3']);
  const [hospMsg, setHospMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [submittingHosp, setSubmittingHosp] = useState(false);

  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setHospMsg(null);
    if (!hospName.trim() || !hospAddress.trim()) {
      setHospMsg({ text: 'Hospital Name and Address are required.', type: 'error' });
      return;
    }

    try {
      setSubmittingHosp(true);
      await api.createHospital({
        name: hospName.trim(),
        address: hospAddress.trim(),
        city: hospCity.trim() || 'Pune',
        distanceKm: Number(hospDistance) || 1.5,
        rating: Number(hospRating) || 4.8,
        phone: hospPhone.trim() || '+91 20 2000 1111',
        emergencyPhone: hospEmergency.trim() || '108',
        departments: hospDepts.length > 0 ? hospDepts : ['dept-1', 'dept-3'],
      });

      setHospMsg({
        text: `Hospital "${hospName}" registered successfully! Doctors can now affiliate with it upon signup.`,
        type: 'success',
      });
      setHospName('');
      setHospAddress('');
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      setHospMsg({ text: err.message || 'Failed to add hospital', type: 'error' });
    } finally {
      setSubmittingHosp(false);
    }
  };

  // Load Doctor Slots for Screen 1
  useEffect(() => {
    const fetchDocSlots = async () => {
      const doc = doctors.find((d) => d.name === newDoctorName) || doctors[0];
      if (!doc) return;
      try {
        const data = await api.getDoctorSlots(doc.id, todayISO);
        const open = data.slots.filter((s) => s.isAvailable).map((s) => s.time);
        setAvailableSlots(open);
        if (open.length > 0 && !open.includes(newSlot)) {
          setNewSlot(open[0]);
        }
      } catch {
        setAvailableSlots(['09:00', '09:30', '10:00', '10:30', '11:00']);
      }
    };
    fetchDocSlots();
  }, [newDoctorName, doctors, todayISO]);

  // Handle Reset in Screen 1
  const handleResetNew = () => {
    setNewName('');
    setNewAge('30');
    setNewPhone('');
    setNewDisease('');
    setNewAddress('');
    setFormMsg(null);
  };

  // Handle Save in Screen 1 (Screenshot 1)
  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!newName.trim() || !newPhone.trim()) {
      setFormMsg({ text: 'Patient Name and Phone are required.', type: 'error' });
      return;
    }

    try {
      const doc = doctors.find((d) => d.name === newDoctorName) || doctors[0];
      const res = await api.createAppointment({
        patientName: newName.trim(),
        patientAge: Number(newAge) || 25,
        patientPhone: newPhone.trim(),
        patientDisease: newDisease.trim() || 'General Illness',
        patientAddress: newAddress.trim() || 'Pune',
        doctorId: doc.id,
        doctorName: doc.name,
        appointmentDate: todayISO,
        appointmentDay: dayName,
        slotTime: newSlot,
      });

      setFormMsg({
        text: `Success! Saved Appointment ID #${res.appointment.id}. SMS sent to ${res.appointment.patientPhone}`,
        type: 'success',
      });
      onRefreshAppointments();
      handleResetNew();
    } catch (err: any) {
      setFormMsg({ text: err.message || 'Error saving appointment', type: 'error' });
    }
  };

  // Screen 4: Find Record (Screenshot 4)
  const handleFindRecord = async () => {
    setUpdateMsg(null);
    const id = parseInt(searchApptId, 10);
    if (isNaN(id) || id <= 0) {
      setUpdateMsg({ text: 'Please enter a valid numeric Appointment ID.', type: 'error' });
      return;
    }

    try {
      const record = await api.getAppointmentById(id);
      setFoundRecord(record);
      setUpName(record.patientName);
      setUpAge(record.patientAge.toString());
      setUpPhone(record.patientPhone);
      setUpDisease(record.patientDisease);
      setUpAddress(record.patientAddress);
      setUpDate(record.appointmentDate);
      setUpDay(record.appointmentDay);
      setUpDoctorName(record.doctorName);
      setUpSlot(record.slotTime);
      setUpdateMsg({ text: `Record #${id} found for ${record.patientName}.`, type: 'success' });
    } catch (err: any) {
      setFoundRecord(null);
      setUpdateMsg({ text: err.message || `No record found with ID #${id}`, type: 'error' });
    }
  };

  // Screen 4: Update Appointment (Screenshot 4)
  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundRecord) return;
    setUpdateMsg(null);

    try {
      const doc = doctors.find((d) => d.name === upDoctorName) || doctors[0];
      const res = await api.updateAppointment(foundRecord.id, {
        patientName: upName,
        patientAge: Number(upAge),
        patientPhone: upPhone,
        patientDisease: upDisease,
        patientAddress: upAddress,
        doctorId: doc.id,
        doctorName: upDoctorName,
        appointmentDate: upDate,
        appointmentDay: upDay,
        slotTime: upSlot,
      });

      setUpdateMsg({
        text: `Appointment #${foundRecord.id} updated successfully!`,
        type: 'success',
      });
      setFoundRecord(res.appointment);
      onRefreshAppointments();
    } catch (err: any) {
      setUpdateMsg({ text: err.message || 'Update failed', type: 'error' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Window Container (Styled with window controls as in clinical desktop application) */}
      <div
        className={`rounded-2xl border-2 shadow-2xl overflow-hidden font-sans ${
          highContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-slate-100 border-slate-400 text-slate-900'
        }`}
      >
        {/* Desktop Window Title Bar */}
        <div className="bg-slate-200 border-b border-slate-300 px-4 py-2 flex items-center justify-between select-none text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <span className="text-emerald-700 font-bold">🩺 Doctor Appointment Scheduling System</span>
          </div>
          {/* Windows-style minimize, maximize, close buttons */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
            <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
            <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
          </div>
        </div>

        {/* Menu Bar (Appointment, Doctor, Patient, Help) */}
        <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 flex items-center justify-between text-xs text-slate-700 select-none">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveScreen('new')}
              className={`hover:text-emerald-800 hover:underline cursor-pointer ${
                activeScreen === 'new' ? 'font-bold text-emerald-800 underline' : 'font-medium'
              }`}
            >
              New Appointment
            </button>
            <button
              onClick={() => setActiveScreen('scheduled')}
              className={`hover:text-emerald-800 hover:underline cursor-pointer ${
                activeScreen === 'scheduled' ? 'font-bold text-emerald-800 underline' : 'font-medium'
              }`}
            >
              Scheduled Appointments
            </button>
            <button
              onClick={() => setActiveScreen('update')}
              className={`hover:text-emerald-800 hover:underline cursor-pointer ${
                activeScreen === 'update' ? 'font-bold text-emerald-800 underline' : 'font-medium'
              }`}
            >
              Update / Find Record
            </button>
            <button
              onClick={() => setActiveScreen('hospitals')}
              className={`hover:text-emerald-800 hover:underline cursor-pointer flex items-center gap-1 ${
                activeScreen === 'hospitals' ? 'font-bold text-emerald-800 underline' : 'font-medium'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Hospitals (Admin)</span>
            </button>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">Help</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Workload Cap: 16 Patients / 8-hr Shift
            </span>
          </div>
        </div>

        {/* Emerald Header Banner (As in Screenshot 1, 3, 4: Monday | Title | 11 July 2022) */}
        <div className="bg-[#1e7e34] text-white px-6 py-3.5 flex items-center justify-between font-bold text-sm sm:text-base border-b-2 border-emerald-900 shadow-inner">
          <div className="w-1/4 text-left">{dayName}</div>
          <div className="w-2/4 text-center text-lg sm:text-xl tracking-wide font-extrabold">
            {activeScreen === 'new' && 'New Appointment'}
            {activeScreen === 'scheduled' && 'Scheduled Appointment'}
            {activeScreen === 'update' && 'Update Appointment'}
            {activeScreen === 'hospitals' && 'Hospital Management Registry (Admin)'}
          </div>
          <div className="w-1/4 text-right">{dateFormatted}</div>
        </div>

        {/* ========================================================================= */}
        {/* SCREEN 1: NEW APPOINTMENT (Faithful to Screenshot 1) */}
        {/* ========================================================================= */}
        {activeScreen === 'new' && (
          <div className="p-8 sm:p-12 max-w-3xl mx-auto">
            {formMsg && (
              <div
                className={`mb-6 p-4 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                  formMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-red-50 text-red-800 border-red-300'
                }`}
              >
                {formMsg.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <span>{formMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveNew} className="space-y-5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {/* Left Column: Patient Details */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <label className="w-32 font-bold text-slate-700">Patient Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Patient Name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-400 bg-white rounded-none focus:outline-emerald-600"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label className="w-32 font-bold text-slate-700">Patient Age</label>
                    <input
                      type="number"
                      placeholder="Age"
                      value={newAge}
                      onChange={(e) => setNewAge(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-400 bg-white rounded-none focus:outline-emerald-600"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label className="w-32 font-bold text-slate-700">Patient Phone</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter phone number"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-400 bg-white rounded-none focus:outline-emerald-600"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label className="w-32 font-bold text-slate-700">Patient Disease</label>
                    <input
                      type="text"
                      value={newDisease}
                      onChange={(e) => setNewDisease(e.target.value)}
                      placeholder="Enter symptoms or disease"
                      className="flex-1 px-3 py-1.5 border border-slate-400 bg-white rounded-none focus:outline-emerald-600"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label className="w-32 font-bold text-slate-700">Patient Address</label>
                    <input
                      type="text"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="Enter address"
                      className="flex-1 px-3 py-1.5 border border-slate-400 bg-white rounded-none focus:outline-emerald-600"
                    />
                  </div>
                </div>

                {/* Right Column: Doctor & Slot */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <label className="w-32 font-bold text-slate-700">Doctor Name</label>
                    <select
                      value={newDoctorName}
                      onChange={(e) => setNewDoctorName(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-400 bg-white rounded-none focus:outline-emerald-600 font-medium"
                    >
                      {doctors.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name} ({d.specialization})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label className="w-32 font-bold text-slate-700">Available Slot</label>
                    <select
                      value={newSlot}
                      onChange={(e) => setNewSlot(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-400 bg-white rounded-none focus:outline-emerald-600 font-medium"
                    >
                      {availableSlots.length > 0 ? (
                        availableSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))
                      ) : (
                        <option value="None">None (Fully Booked - 16/16 Cap)</option>
                      )}
                    </select>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-300 text-[11px] text-emerald-900 rounded-sm">
                    <strong>Workload Rule:</strong> Doctor shift is 8 hours (09:00 - 17:00). Max 16 patients per day (30 mins per consultation).
                  </div>
                </div>
              </div>

              {/* Exact Buttons matching Screenshot 1 (Reset Appointment / Save Appointment) */}
              <div className="pt-8 flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={handleResetNew}
                  className="px-6 py-2 bg-[#d4a017] hover:bg-[#b8860b] text-black font-bold border border-amber-600 shadow-sm cursor-pointer"
                >
                  Reset Appointment
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#1e7e34] hover:bg-[#155d27] text-white font-bold border border-emerald-800 shadow-sm cursor-pointer"
                >
                  Save Appointment
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 3: SCHEDULED APPOINTMENT (Faithful to Screenshot 3 Table) */}
        {/* ========================================================================= */}
        {activeScreen === 'scheduled' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">
                  Total Scheduled Appointments: {appointments.length}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Live Database
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onRefreshAppointments}
                  className="px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 flex items-center gap-1 font-bold text-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh List
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 flex items-center gap-1 font-bold text-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Table
                </button>
              </div>
            </div>

            {/* Table exact columns matching Screenshot 3: #SN, ID, Patient, Disease, Doctor, Date, Time, Day */}
            <div className="overflow-x-auto border-2 border-emerald-800 bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-emerald-100 border-b-2 border-emerald-700 text-emerald-950 font-extrabold">
                    <th className="py-2.5 px-3 border-r border-emerald-300 text-center w-12">#SN</th>
                    <th className="py-2.5 px-3 border-r border-emerald-300 text-center w-12">ID</th>
                    <th className="py-2.5 px-4 border-r border-emerald-300">Patient</th>
                    <th className="py-2.5 px-4 border-r border-emerald-300">Disease</th>
                    <th className="py-2.5 px-4 border-r border-emerald-300">Doctor</th>
                    <th className="py-2.5 px-3 border-r border-emerald-300">Date</th>
                    <th className="py-2.5 px-3 border-r border-emerald-300 text-center">Time</th>
                    <th className="py-2.5 px-3">Day</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-200 font-medium">
                  {appointments.map((appt, idx) => (
                    <tr
                      key={appt.id}
                      className={`hover:bg-emerald-50 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/40'
                      }`}
                    >
                      <td className="py-2 px-3 border-r border-emerald-200 text-center text-slate-600 font-bold">
                        {appt.sn || idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-emerald-200 text-center text-emerald-800 font-bold">
                        {appt.id}
                      </td>
                      <td className="py-2 px-4 border-r border-emerald-200 font-bold text-slate-900">
                        {appt.patientName}
                      </td>
                      <td className="py-2 px-4 border-r border-emerald-200 text-emerald-900 font-semibold">
                        {appt.patientDisease}
                      </td>
                      <td className="py-2 px-4 border-r border-emerald-200 text-slate-800">
                        {appt.doctorName}
                      </td>
                      <td className="py-2 px-3 border-r border-emerald-200 text-slate-700 whitespace-nowrap">
                        {appt.appointmentDate}
                      </td>
                      <td className="py-2 px-3 border-r border-emerald-200 text-center font-bold text-emerald-700">
                        {appt.slotTime}
                      </td>
                      <td className="py-2 px-3 text-slate-700 font-semibold">
                        {appt.appointmentDay}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 4: UPDATE APPOINTMENT (Faithful to Screenshot 4 with Find Record) */}
        {/* ========================================================================= */}
        {activeScreen === 'update' && (
          <div className="p-8 sm:p-12 max-w-3xl mx-auto space-y-6">
            {/* Search Box: Appointment ID + Find Record */}
            <div className="p-6 bg-slate-200/70 border border-slate-300 rounded-sm text-center space-y-3">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                Appointment ID
              </label>
              <div className="flex items-center justify-center gap-3">
                <input
                  type="text"
                  value={searchApptId}
                  onChange={(e) => setSearchApptId(e.target.value)}
                  placeholder="Enter ID"
                  className="w-48 px-3 py-1.5 border border-slate-400 bg-white text-center font-bold text-sm focus:outline-emerald-600"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleFindRecord}
                  className="px-6 py-1.5 bg-[#1e7e34] hover:bg-[#155d27] text-white font-bold border border-emerald-800 shadow-sm cursor-pointer text-xs sm:text-sm"
                >
                  Find Record
                </button>
              </div>
            </div>

            {updateMsg && (
              <div
                className={`p-3 rounded-lg text-xs font-bold border flex items-center gap-2 ${
                  updateMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-red-50 text-red-800 border-red-300'
                }`}
              >
                {updateMsg.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <span>{updateMsg.text}</span>
              </div>
            )}

            {/* Editable Form after record found */}
            <form onSubmit={handleUpdateRecord} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {/* Left fields */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <label className="w-32 font-bold text-slate-700">Patient Name</label>
                    <input
                      type="text"
                      value={upName}
                      onChange={(e) => setUpName(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-400 bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label className="w-32 font-bold text-slate-700">Patient Age</label>
                    <input
                      type="number"
                      value={upAge}
                      onChange={(e) => setUpAge(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-400 bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label className="w-32 font-bold text-slate-700">Patient Phone</label>
                    <input
                      type="text"
                      value={upPhone}
                      onChange={(e) => setUpPhone(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-400 bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label className="w-32 font-bold text-slate-700">Patient Disease</label>
                    <input
                      type="text"
                      value={upDisease}
                      onChange={(e) => setUpDisease(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-400 bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label className="w-32 font-bold text-slate-700">Patient Address</label>
                    <input
                      type="text"
                      value={upAddress}
                      onChange={(e) => setUpAddress(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-400 bg-white"
                    />
                  </div>
                </div>

                {/* Right fields */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <label className="w-32 font-bold text-slate-700">Appointment Date</label>
                    <input
                      type="date"
                      value={upDate}
                      onChange={(e) => setUpDate(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-400 bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label className="w-32 font-bold text-slate-700">Appointment Day</label>
                    <input
                      type="text"
                      value={upDay}
                      onChange={(e) => setUpDay(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-400 bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label className="w-32 font-bold text-slate-700">Doctor Name</label>
                    <select
                      value={upDoctorName}
                      onChange={(e) => setUpDoctorName(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-400 bg-white font-medium"
                    >
                      {doctors.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label className="w-32 font-bold text-slate-700">Available Slot</label>
                    <input
                      type="text"
                      value={upSlot}
                      onChange={(e) => setUpSlot(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-400 bg-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Update Appointment Button (Screenshot 4) */}
              <div className="pt-6 text-right">
                <button
                  type="submit"
                  disabled={!foundRecord}
                  className="px-6 py-2 bg-[#1e7e34] hover:bg-[#155d27] text-white font-bold border border-emerald-800 shadow-sm cursor-pointer disabled:opacity-40 text-xs sm:text-sm"
                >
                  Update Appointment
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 5: HOSPITAL REGISTRY & MANAGEMENT (Admin Feature) */}
        {/* ========================================================================= */}
        {activeScreen === 'hospitals' && (
          <div className="p-6 sm:p-8 space-y-6">
            {hospMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                  hospMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-red-50 text-red-800 border-red-300'
                }`}
              >
                {hospMsg.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <span>{hospMsg.text}</span>
              </div>
            )}

            {/* Admin Add Hospital Form */}
            <div className="p-6 bg-white border border-slate-300 rounded-xl shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Add New Hospital to System Registry
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Admin Master Control
                </span>
              </div>

              <form onSubmit={handleAddHospital} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Hospital Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ruby Hall Speciality Hospital"
                      value={hospName}
                      onChange={(e) => setHospName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Pune"
                      value={hospCity}
                      onChange={(e) => setHospCity(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 40 Sassoon Road, Sangamvadi"
                      value={hospAddress}
                      onChange={(e) => setHospAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Distance from City Center (km) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="1.8"
                      value={hospDistance}
                      onChange={(e) => setHospDistance(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 20 6645 5100"
                      value={hospPhone}
                      onChange={(e) => setHospPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Emergency Hotline *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="108"
                      value={hospEmergency}
                      onChange={(e) => setHospEmergency(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Quality Rating (out of 5.0)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      value={hospRating}
                      onChange={(e) => setHospRating(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                    />
                  </div>
                </div>

                {/* Available Departments Checkboxes */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Affiliated Medical Departments in this Hospital:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {departments.map((dept) => {
                      const isChecked = hospDepts.includes(dept.id);
                      return (
                        <label
                          key={dept.id}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all ${
                            isChecked
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setHospDepts([...hospDepts, dept.id]);
                              } else {
                                setHospDepts(hospDepts.filter((id) => id !== dept.id));
                              }
                            }}
                            className="rounded text-emerald-600"
                          />
                          <span>{dept.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 text-right">
                  <button
                    type="submit"
                    disabled={submittingHosp}
                    className="px-6 py-2 bg-[#1e7e34] hover:bg-[#155d27] text-white font-bold border border-emerald-800 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {submittingHosp ? 'Adding Hospital...' : '+ Save & Register Hospital'}
                  </button>
                </div>
              </form>
            </div>

            {/* List of Registered Hospitals */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Existing Hospitals in Network ({hospitals.length})</span>
                <span className="text-slate-500 font-normal">
                  Doctors choose from this list when signing up
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-300 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Hospital Name</th>
                      <th className="py-2.5 px-3">Address &amp; City</th>
                      <th className="py-2.5 px-3">Distance</th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3">Hotline</th>
                      <th className="py-2.5 px-3">Rating</th>
                      <th className="py-2.5 px-3">Depts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {hospitals.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-emerald-900">{h.name}</td>
                        <td className="py-2 px-3 text-slate-600">
                          {h.address}, {h.city}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-700">
                          {h.distanceKm} km
                        </td>
                        <td className="py-2 px-3 text-slate-600">{h.phone}</td>
                        <td className="py-2 px-3 font-bold text-red-600">{h.emergencyPhone}</td>
                        <td className="py-2 px-3 font-bold text-amber-600">★ {h.rating}</td>
                        <td className="py-2 px-3 font-bold text-slate-700">
                          {h.departments?.length || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

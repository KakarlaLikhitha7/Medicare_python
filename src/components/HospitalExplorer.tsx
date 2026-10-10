import React, { useState } from 'react';
import {
  Hospital,
  Department,
  Doctor,
  Appointment,
} from '../types';
import {
  MapPin,
  Building,
  Phone,
  Star,
  Clock,
  User,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Plus,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { UserSession } from '../types';

interface HospitalExplorerProps {
  hospitals: Hospital[];
  departments: Department[];
  doctors: Doctor[];
  appointments?: Appointment[];
  selectedHospitalId: string | null;
  setSelectedHospitalId: (id: string | null) => void;
  selectedDepartmentId: string | null;
  setSelectedDepartmentId: (id: string | null) => void;
  onSelectDoctorToBook: (doctor: Doctor) => void;
  onOpenTriage: () => void;
  onBackToPortal?: () => void;
  onHospitalAdded?: () => void;
  currentUser?: UserSession | null;
  highContrast: boolean;
}

export const HospitalExplorer: React.FC<HospitalExplorerProps> = ({
  hospitals,
  departments,
  doctors,
  appointments = [],
  selectedHospitalId,
  setSelectedHospitalId,
  selectedDepartmentId,
  setSelectedDepartmentId,
  onSelectDoctorToBook,
  onOpenTriage,
  onBackToPortal,
  onHospitalAdded,
  currentUser,
  highContrast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRadius, setFilterRadius] = useState<number>(10); // km

  // Add Hospital Modal (Admin)
  const [showAddHospModal, setShowAddHospModal] = useState(false);
  const [newHospName, setNewHospName] = useState('');
  const [newHospAddress, setNewHospAddress] = useState('');
  const [newHospCity, setNewHospCity] = useState('Pune');
  const [newHospDistance, setNewHospDistance] = useState('2.5');
  const [newHospRating, setNewHospRating] = useState('4.8');
  const [newHospPhone, setNewHospPhone] = useState('+91 20 2800 1122');
  const [newHospEmergency, setNewHospEmergency] = useState('108');
  const [newHospDepts, setNewHospDepts] = useState<string[]>(['dept-1', 'dept-3']);
  const [submittingHosp, setSubmittingHosp] = useState(false);
  const [hospNotice, setHospNotice] = useState<string | null>(null);

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHospName.trim() || !newHospAddress.trim()) return;

    try {
      setSubmittingHosp(true);
      const res = await api.createHospital({
        name: newHospName.trim(),
        address: newHospAddress.trim(),
        city: newHospCity.trim() || 'Pune',
        distanceKm: Number(newHospDistance) || 2.0,
        rating: Number(newHospRating) || 4.8,
        phone: newHospPhone.trim() || '+91 20 2000 0000',
        emergencyPhone: newHospEmergency.trim() || '108',
        departments: newHospDepts,
      });

      setHospNotice(`Hospital "${res.hospital.name}" added successfully! Doctors can now choose this hospital when signing up.`);
      setTimeout(() => setHospNotice(null), 6000);
      setShowAddHospModal(false);

      // Reset form
      setNewHospName('');
      setNewHospAddress('');

      if (onHospitalAdded) onHospitalAdded();
    } catch (err: any) {
      alert(err.message || 'Error adding hospital');
    } finally {
      setSubmittingHosp(false);
    }
  };

  // Current selected entities
  const activeHospital = hospitals.find((h) => h.id === selectedHospitalId);
  const activeDepartment = departments.find((d) => d.id === selectedDepartmentId);

  // Departments available in selected hospital
  const availableDepartments = selectedHospitalId
    ? departments.filter((d) => d.hospitalIds.includes(selectedHospitalId))
    : departments;

  // Doctors in selected department and hospital
  const filteredDoctors = doctors.filter((doc) => {
    const matchHospital = selectedHospitalId ? doc.hospitalId === selectedHospitalId : true;
    const matchDept = selectedDepartmentId ? doc.departmentId === selectedDepartmentId : true;
    const matchSearch =
      searchQuery === '' ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.qualification.toLowerCase().includes(searchQuery.toLowerCase());
    return matchHospital && matchDept && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Prominent Sticky Navigation Header - Seamless Back to Patient Portal & Step Back Navigation */}
      <div className="sticky top-16 z-20 bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-4 py-3 rounded-2xl shadow-xl border-2 border-emerald-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className="px-4 py-2 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-700" />
              <span>Back to Patient Portal</span>
            </button>
          )}
          <span className="text-xs text-emerald-100 hidden md:inline font-medium">
            (Personal Health Vitals, Prescriptions &amp; Treatment History)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedHospitalId && (
            <button
              onClick={() => {
                setSelectedHospitalId(null);
                setSelectedDepartmentId(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer border border-emerald-500"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Hospitals</span>
            </button>
          )}

          {selectedDepartmentId && (
            <button
              onClick={() => setSelectedDepartmentId(null)}
              className="px-3 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer border border-emerald-500"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Depts</span>
            </button>
          )}

          {/* Only show Add Hospital to Administrators */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setShowAddHospModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 border border-emerald-300 cursor-pointer shadow-md"
              title="Admin can add new hospital to registry"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Hospital (Admin)</span>
            </button>
          )}
        </div>
      </div>

      {/* Hospital Added Notice Toast */}
      {hospNotice && (
        <div className="p-4 rounded-2xl bg-emerald-800 text-white shadow-xl border-2 border-emerald-400 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <p className="text-xs font-bold font-mono">{hospNotice}</p>
        </div>
      )}

      {/* Hero Header with AI Symptom Match Banner */}
      <div
        className={`rounded-2xl p-6 sm:p-8 transition-all border ${
          highContrast
            ? 'bg-neutral-900 text-white border-yellow-400'
            : 'bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white shadow-xl'
        }`}
      >
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
            <ShieldCheck className="w-4 h-4" />
            Hospital Hierarchy & 16-Patient Shift Engine
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Find Nearest Medical Care & Book Verified Specialists
          </h1>
          <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
            Navigate through nearest hospitals, specialized medical departments, and available doctors.
            Each doctor manages a structured 16-slot 8-hour workday for dedicated patient care.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenTriage}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md ${
                highContrast
                  ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                  : 'bg-white text-emerald-900 hover:bg-emerald-50'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-600" />
              Not sure which specialist? Describe Symptoms with AI
            </button>

            <div className="text-xs text-emerald-200/80 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              30-min precision consultation slots (09:00 - 17:00)
            </div>
          </div>
        </div>
      </div>

      {/* Structured Hierarchy Breadcrumbs Navigation */}
      <div
        className={`flex items-center flex-wrap gap-2 p-3.5 rounded-xl border text-sm font-medium ${
          highContrast
            ? 'bg-neutral-900 border-yellow-400 text-white'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Hierarchy:</span>

        {/* Step 1: Hospital */}
        <button
          onClick={() => {
            setSelectedHospitalId(null);
            setSelectedDepartmentId(null);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            !selectedHospitalId
              ? highContrast
                ? 'bg-yellow-400 text-black font-bold'
                : 'bg-emerald-600 text-white font-semibold'
              : 'hover:bg-slate-200 text-slate-600'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>All Hospitals</span>
        </button>

        <ChevronRight className="w-4 h-4 text-slate-400" />

        {/* Step 2: Department */}
        <button
          disabled={!selectedHospitalId}
          onClick={() => setSelectedDepartmentId(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            selectedHospitalId && !selectedDepartmentId
              ? highContrast
                ? 'bg-yellow-400 text-black font-bold'
                : 'bg-emerald-600 text-white font-semibold'
              : selectedHospitalId
              ? 'hover:bg-slate-200 text-slate-600'
              : 'opacity-40 cursor-not-allowed text-slate-400'
          }`}
        >
          <span>{activeHospital ? activeHospital.name : 'Select Hospital First'}</span>
        </button>

        <ChevronRight className="w-4 h-4 text-slate-400" />

        {/* Step 3: Doctor */}
        <div
          className={`px-3 py-1.5 rounded-lg font-semibold ${
            selectedDepartmentId
              ? highContrast
                ? 'bg-yellow-400 text-black'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'text-slate-400'
          }`}
        >
          <span>{activeDepartment ? activeDepartment.name : 'Select Department'}</span>
        </div>
      </div>

      {/* SECTION 1: NEAREST HOSPITALS */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              1. Select Nearest Hospital
            </h2>
            <p className="text-xs text-slate-500">
              Sorted by proximity to your current location (Pune City Center)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Distance radius:</span>
            {[2, 5, 10].map((km) => (
              <button
                key={km}
                onClick={() => setFilterRadius(km)}
                className={`px-2.5 py-1 rounded-md font-semibold border transition-all ${
                  filterRadius === km
                    ? highContrast
                      ? 'bg-yellow-400 text-black border-yellow-400'
                      : 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                &le; {km} km
              </button>
            ))}
          </div>
        </div>

        {hospitals.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
              🏥
            </div>
            <h3 className="text-lg font-extrabold text-slate-800">No Hospitals Registered Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Your database currently has 0 hospital records. Please register your healthcare facility as Central Admin.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowAddHospModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 shadow-sm cursor-pointer"
              >
                + Register First Hospital (Admin)
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {hospitals
              .filter((h) => h.distanceKm <= filterRadius)
              .map((hospital) => {
                const isSelected = selectedHospitalId === hospital.id;
                return (
                  <div
                    key={hospital.id}
                    onClick={() => {
                      setSelectedHospitalId(hospital.id);
                      setSelectedDepartmentId(null);
                    }}
                    className={`p-5 rounded-2xl cursor-pointer transition-all border relative flex flex-col justify-between ${
                      isSelected
                        ? highContrast
                          ? 'border-yellow-400 bg-neutral-900 ring-2 ring-yellow-400 text-white'
                          : 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500'
                        : highContrast
                        ? 'border-neutral-700 bg-neutral-900 hover:border-yellow-400 text-white'
                        : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white p-1 rounded-full">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          {hospital.distanceKm} km away
                        </span>
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{hospital.rating}</span>
                        </div>
                      </div>

                      <h3 className="font-extrabold text-base mb-1 leading-snug">{hospital.name}</h3>
                      <p className="text-xs text-slate-500 mb-3">{hospital.address}, {hospital.city}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-xs flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {hospital.phone}
                      </span>
                      <span className="font-semibold text-emerald-600">
                        {hospital.departments.length} Depts &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* SECTION 2: DEPARTMENTS (Shows when Hospital Selected or All) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              2. Select Department {activeHospital && `at ${activeHospital.name}`}
            </h2>
            <p className="text-xs text-slate-500">
              Pick the relevant medical specialty to view assigned consulting doctors
            </p>
          </div>

          {selectedDepartmentId && (
            <button
              onClick={() => setSelectedDepartmentId(null)}
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              Clear Department Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {availableDepartments.map((dept) => {
            const isSelected = selectedDepartmentId === dept.id;
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedDepartmentId(dept.id)}
                className={`p-4 rounded-xl text-left transition-all border flex flex-col justify-between ${
                  isSelected
                    ? highContrast
                      ? 'border-yellow-400 bg-neutral-900 ring-2 ring-yellow-400 text-white'
                      : 'border-emerald-600 bg-emerald-600 text-white shadow-md'
                    : highContrast
                    ? 'border-neutral-700 bg-neutral-900 hover:border-yellow-400 text-white'
                    : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <Activity className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm leading-tight mb-1">{dept.name}</h4>
                  <p
                    className={`text-[11px] line-clamp-2 ${
                      isSelected ? 'text-emerald-100' : 'text-slate-500'
                    }`}
                  >
                    {dept.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 text-[11px] font-semibold flex items-center justify-between border-t border-current/10">
                  <span>View Doctors</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: DOCTORS LIST */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              3. Available Doctors & 16-Patient Workload Capacity
            </h2>
            <p className="text-xs text-slate-500">
              Doctors handle 16 slots during their 8-hour shift (09:00 - 17:00, 30 min per patient)
            </p>
          </div>

          {/* Search box */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search doctor by name, specialty, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border transition-all ${
                highContrast
                  ? 'bg-neutral-900 text-white border-yellow-400 focus:ring-yellow-400'
                  : 'bg-white border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              }`}
            />
          </div>
        </div>

        {filteredDoctors.length === 0 ? (
          <div className="p-12 text-center border rounded-2xl bg-slate-50 text-slate-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="font-semibold text-sm">No doctors found for this filter combination.</p>
            <p className="text-xs mt-1">Try resetting the hospital or department filter.</p>
            <button
              onClick={() => {
                setSelectedHospitalId(null);
                setSelectedDepartmentId(null);
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDoctors.map((doc) => {
              const docHospital = hospitals.find((h) => h.id === doc.hospitalId);
              const docDept = departments.find((d) => d.id === doc.departmentId);

              // Calculate real booked count dynamically from appointments
              const bookedSlotsCount = appointments.filter(
                (a) => (a.doctorId === doc.id || a.doctorName.toLowerCase().includes(doc.name.toLowerCase())) && a.status !== 'Cancelled'
              ).length;
              const remainingSlots = Math.max(0, doc.maxPatientsPerDay - bookedSlotsCount);

              return (
                <div
                  key={doc.id}
                  className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                    highContrast
                      ? 'border-yellow-400 bg-neutral-900 text-white'
                      : 'border-slate-200 bg-white hover:border-emerald-400 hover:shadow-lg'
                  }`}
                >
                  <div>
                    {/* Header: Photo placeholder & Meta */}
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-sm shrink-0 ${
                          highContrast ? 'bg-yellow-400 text-black' : 'bg-emerald-700'
                        }`}
                      >
                        {doc.name.replace('Dr. ', '').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-lg truncate">{doc.name}</h3>
                          <span className="text-amber-500 text-xs font-bold flex items-center">
                            ★ {doc.rating}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-emerald-600 truncate">
                          {doc.specialization}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{doc.qualification}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                      {doc.bio}
                    </p>

                    {/* Hospital & Cabin */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 text-xs mb-4 text-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Hospital:</span>
                        <span className="font-semibold truncate max-w-[170px]">
                          {docHospital?.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Department:</span>
                        <span className="font-semibold truncate max-w-[170px]">
                          {docDept?.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Cabin / Room:</span>
                        <span className="font-semibold">{doc.cabin}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Consultation Fee:</span>
                        <span className="font-bold text-emerald-700">₹{doc.consultationFee}</span>
                      </div>
                    </div>

                    {/* 16-slot Capacity Meter */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">
                          Today&apos;s 8-hr Shift Load:
                        </span>
                        <span
                          className={`font-bold ${
                            remainingSlots <= 2 ? 'text-amber-600' : 'text-emerald-700'
                          }`}
                        >
                          {bookedSlotsCount} / {doc.maxPatientsPerDay} Booked
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            remainingSlots <= 2 ? 'bg-amber-500' : 'bg-emerald-600'
                          }`}
                          style={{
                            width: `${(bookedSlotsCount / doc.maxPatientsPerDay) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {remainingSlots > 0 ? (
                          <span className="text-emerald-600 font-semibold">
                            &bull; {remainingSlots} slots still open today
                          </span>
                        ) : (
                          <span className="text-red-600 font-bold">
                            &bull; Fully booked (16/16 cap reached)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => onSelectDoctorToBook(doc)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                        highContrast
                          ? 'bg-yellow-400 text-black hover:bg-yellow-300 font-extrabold'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <span>Check Slots &amp; Book Appointment</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* ADMIN MODAL: Add New Hospital to the System */}
      {showAddHospModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 transition-all ${
              highContrast ? 'bg-neutral-900 border-yellow-400 text-white' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base">Add New Hospital (Admin Registry)</h3>
              </div>
              <button
                onClick={() => setShowAddHospModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Register a new hospital facility. Once added, doctors can select this hospital when signing up, and patients can browse its medical departments.
            </p>

            <form onSubmit={handleCreateHospital} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hospital Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Jupiter Lifeline & Multispeciality Hospital"
                  value={newHospName}
                  onChange={(e) => setNewHospName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    placeholder="e.g. Baner High Street"
                    value={newHospAddress}
                    onChange={(e) => setNewHospAddress(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newHospCity}
                    onChange={(e) => setNewHospCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newHospDistance}
                    onChange={(e) => setNewHospDistance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rating (★)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={newHospRating}
                    onChange={(e) => setNewHospRating(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Emergency Ph</label>
                  <input
                    type="text"
                    value={newHospEmergency}
                    onChange={(e) => setNewHospEmergency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Direct Contact Phone</label>
                <input
                  type="text"
                  value={newHospPhone}
                  onChange={(e) => setNewHospPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Available Departments (Specialties offered)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-50 border border-slate-200">
                  {departments.map((dept) => {
                    const checked = newHospDepts.includes(dept.id);
                    return (
                      <label key={dept.id} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewHospDepts([...newHospDepts, dept.id]);
                            } else {
                              setNewHospDepts(newHospDepts.filter((id) => id !== dept.id));
                            }
                          }}
                          className="rounded text-emerald-600 cursor-pointer"
                        />
                        <span className="truncate">{dept.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddHospModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingHosp}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {submittingHosp ? 'Adding Hospital...' : 'Save & Register Hospital'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

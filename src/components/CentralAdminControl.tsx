import React, { useState } from 'react';
import {
  Hospital,
  Doctor,
  Department,
  Appointment,
  UserSession,
} from '../types';
import { api } from '../services/api';
import {
  Building2,
  Shield,
  Plus,
  Search,
  CheckCircle2,
  Phone,
  MapPin,
  Star,
  Users,
  Calendar,
  Stethoscope,
  Activity,
  ArrowRight,
  Eye,
  X,
  RefreshCw,
  Bell,
  Sparkles,
} from 'lucide-react';

interface CentralAdminControlProps {
  currentUser: UserSession;
  hospitals: Hospital[];
  doctors: Doctor[];
  departments: Department[];
  appointments: Appointment[];
  onRefreshAll: () => void;
  highContrast: boolean;
}

export const CentralAdminControl: React.FC<CentralAdminControlProps> = ({
  currentUser,
  hospitals,
  doctors,
  departments,
  appointments,
  onRefreshAll,
  highContrast,
}) => {
  // Primary sub-tabs for Admin:
  // 1: all_hospitals = "Check Details for All Hospitals"
  // 2: add_hospital = "Add New Hospital to System"
  // 3: all_doctors = "Network Doctors & Distribution"
  // 4: network_overview = "Network Analytics & Audit Logs"
  const [activeTab, setActiveTab] = useState<'all_hospitals' | 'add_hospital' | 'all_doctors' | 'network_overview'>('all_hospitals');

  // Search & Filter for Hospitals
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHospitalForModal, setSelectedHospitalForModal] = useState<Hospital | null>(null);

  // Form State for Adding Hospital
  const [hospName, setHospName] = useState('');
  const [hospAddress, setHospAddress] = useState('');
  const [hospCity, setHospCity] = useState('Pune');
  const [hospDistance, setHospDistance] = useState('1.5');
  const [hospPhone, setHospPhone] = useState('+91 20 2888 9900');
  const [hospEmergency, setHospEmergency] = useState('108');
  const [hospRating, setHospRating] = useState('4.8');
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['dept-1', 'dept-3']);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleAddHospitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    if (!hospName.trim() || !hospAddress.trim()) {
      alert('Please enter hospital name and street address.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createHospital({
        name: hospName.trim(),
        address: hospAddress.trim(),
        city: hospCity.trim() || 'Pune',
        distanceKm: parseFloat(hospDistance) || 1.5,
        rating: parseFloat(hospRating) || 4.8,
        phone: hospPhone.trim() || '+91 20 2000 0000',
        emergencyPhone: hospEmergency.trim() || '108',
        departments: selectedDepts.length > 0 ? selectedDepts : ['dept-1', 'dept-3'],
      });

      setNotice(
        `Hospital facility "${res.hospital.name}" added to centralized network! Doctors can now select this hospital when signing up, and patients can browse its medical services.`
      );
      setTimeout(() => setNotice(null), 6000);

      // Reset form
      setHospName('');
      setHospAddress('');
      onRefreshAll();
      setActiveTab('all_hospitals');
    } catch (err: any) {
      alert(err.message || 'Error adding hospital');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDept = (deptId: string) => {
    if (selectedDepts.includes(deptId)) {
      setSelectedDepts(selectedDepts.filter((id) => id !== deptId));
    } else {
      setSelectedDepts([...selectedDepts, deptId]);
    }
  };

  // Filtered Hospitals
  const filteredHospitals = hospitals.filter(
    (h) =>
      searchQuery === '' ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Centralized Admin Header */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-xl transition-all ${
          highContrast
            ? 'bg-neutral-900 border-yellow-400 text-white'
            : 'bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 text-white'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                <Shield className="w-3.5 h-3.5" />
                Centralized Multi-Hospital Administration
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-emerald-200">
                <span>Hierarchy:</span>
                <span className="font-extrabold text-white">Admin &rarr; Hospital &rarr; Doctor &rarr; Patient</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hospital Network Central Control Desk
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              Super-Administrator command center: Register new hospital facilities into the healthcare network, monitor live doctor rosters, audit hospital appointments, and oversee global multi-hospital operations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('add_hospital')}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Hospital</span>
            </button>
            <button
              onClick={onRefreshAll}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all"
              title="Refresh Central Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Multi-Hospital Network KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20 text-xs">
          <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
            <span className="text-emerald-200 block text-[11px] font-medium">Hospitals in Network</span>
            <span className="text-2xl font-black">{hospitals.length} Facilities</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
            <span className="text-emerald-200 block text-[11px] font-medium">Network Doctors</span>
            <span className="text-2xl font-black">{doctors.length} Doctors</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
            <span className="text-emerald-200 block text-[11px] font-medium">Total Appointments</span>
            <span className="text-2xl font-black">{appointments.length} Scheduled</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
            <span className="text-emerald-200 block text-[11px] font-medium">System Health</span>
            <span className="text-2xl font-black text-emerald-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              Operational
            </span>
          </div>
        </div>
      </div>

      {/* Admin Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('all_hospitals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'all_hospitals'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Check Details for All Hospitals ({hospitals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('add_hospital')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'add_hospital'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Add New Hospital</span>
        </button>

        <button
          onClick={() => setActiveTab('all_doctors')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'all_doctors'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Network Doctor Directory ({doctors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('network_overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'network_overview'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Network Audit &amp; SMS Logs</span>
        </button>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-800 text-white flex items-center gap-3 shadow-md border border-emerald-400 text-xs font-bold font-mono animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: CHECK DETAILS FOR ALL HOSPITALS                     */}
      {/* ========================================================= */}
      {activeTab === 'all_hospitals' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hospital name, address, or city..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>

            <span className="text-xs font-bold text-slate-500">
              Showing {filteredHospitals.length} of {hospitals.length} registered facilities
            </span>
          </div>

          {/* Hospitals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHospitals.map((hospital) => {
              const hospDocs = doctors.filter((d) => d.hospitalId === hospital.id);
              const hospAppts = appointments.filter((a) => a.hospitalId === hospital.id);
              const hospDepts = departments.filter((d) => d.hospitalIds.includes(hospital.id));

              return (
                <div
                  key={hospital.id}
                  className={`p-6 rounded-3xl border shadow-md flex flex-col justify-between transition-all hover:shadow-lg ${
                    highContrast
                      ? 'bg-neutral-900 border-yellow-400 text-white'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {hospital.id}
                        </span>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                          {hospital.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-xl border border-amber-200 text-xs font-bold shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{hospital.rating}</span>
                      </div>
                    </div>

                    {/* Address & Contacts */}
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{hospital.address}, {hospital.city} ({hospital.distanceKm} km)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{hospital.phone} &bull; Hotline: {hospital.emergencyPhone}</span>
                      </div>
                    </div>

                    {/* Stats metrics */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-medium">Doctors</span>
                        <span className="font-extrabold text-sm text-slate-900">{hospDocs.length}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-medium">Appointments</span>
                        <span className="font-extrabold text-sm text-slate-900">{hospAppts.length}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-medium">Departments</span>
                        <span className="font-extrabold text-sm text-slate-900">{hospDepts.length}</span>
                      </div>
                    </div>

                    {/* Departments chips */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Active Departments:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {hospDepts.map((d) => (
                          <span
                            key={d.id}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                          >
                            {d.name.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedHospitalForModal(hospital)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Check Hospital Details &amp; Doctors</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredHospitals.length === 0 && (
              <div className="col-span-full p-12 text-center rounded-3xl bg-slate-50 border-2 border-dashed border-slate-300 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-3xl">
                  🏥
                </div>
                <h3 className="text-lg font-extrabold text-slate-800">No Hospitals Found in Database</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  There are currently 0 hospitals registered in your database. Register your first healthcare facility now to begin onboarding doctors and departments.
                </p>
                <button
                  onClick={() => setActiveTab('add_hospital')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  + Register First Hospital
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ADD NEW HOSPITAL (CENTRALIZED ADMIN REGISTRY)      */}
      {/* ========================================================= */}
      {activeTab === 'add_hospital' && (
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-md space-y-6 max-w-3xl transition-all ${
            highContrast ? 'bg-neutral-900 border-yellow-400 text-white' : 'bg-white border-slate-200'
          }`}
        >
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-xl font-extrabold flex items-center gap-2 text-slate-900">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>Register New Hospital Facility into Network</span>
            </h2>
            <p className="text-xs text-slate-500">
              As a Central Administrator, adding a hospital here makes it immediately visible in the multi-hospital directory, enables doctors to select it during signup, and equips hospital staff to manage their desk operations.
            </p>
          </div>

          <form onSubmit={handleAddHospitalSubmit} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Hospital Facility Name *</label>
                <input
                  type="text"
                  required
                  value={hospName}
                  onChange={(e) => setHospName(e.target.value)}
                  placeholder="e.g. Ruby Hall Super Specialty Medical Institute"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={hospAddress}
                  onChange={(e) => setHospAddress(e.target.value)}
                  placeholder="e.g. 40 Sassoon Road, Sangamvadi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">City / Region</label>
                <input
                  type="text"
                  value={hospCity}
                  onChange={(e) => setHospCity(e.target.value)}
                  placeholder="Pune"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Proximity Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={hospDistance}
                  onChange={(e) => setHospDistance(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">General Contact Phone</label>
                <input
                  type="tel"
                  value={hospPhone}
                  onChange={(e) => setHospPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Emergency Hotline (e.g. 108)</label>
                <input
                  type="text"
                  value={hospEmergency}
                  onChange={(e) => setHospEmergency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Accredited Quality Rating</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={hospRating}
                  onChange={(e) => setHospRating(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            {/* Department Assignment */}
            <div className="space-y-2 pt-2">
              <label className="block font-bold text-slate-700">
                Assign Medical Specialty Departments to this Hospital:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {departments.map((dept) => {
                  const isChecked = selectedDepts.includes(dept.id);
                  return (
                    <div
                      key={dept.id}
                      onClick={() => toggleDept(dept.id)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{dept.name}</span>
                      <span className="text-xs font-mono">{isChecked ? '✓' : '+'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('all_hospitals')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Building2 className="w-4 h-4" />
                <span>{submitting ? 'Registering...' : 'Register Hospital Facility'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: NETWORK DOCTOR DIRECTORY                           */}
      {/* ========================================================= */}
      {activeTab === 'all_doctors' && (
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-md space-y-6 transition-all ${
            highContrast ? 'bg-neutral-900 border-yellow-400 text-white' : 'bg-white border-slate-200'
          }`}
        >
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-xl font-extrabold flex items-center gap-2 text-slate-900">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Network Doctors Directory &amp; Hospital Affiliations</span>
            </h2>
            <p className="text-xs text-slate-500">
              Centralized view of all doctors registered across all hospitals, their assigned departments, 16-slot workday status, and consultation cabins.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-extrabold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Doctor Name</th>
                  <th className="py-3 px-4">Affiliated Hospital</th>
                  <th className="py-3 px-4">Specialization &amp; Cabin</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Consultation Fee</th>
                  <th className="py-3 px-4">Workday Shift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {doctors.map((doc) => {
                  const docHosp = hospitals.find((h) => h.id === doc.hospitalId);
                  const docDept = departments.find((d) => d.id === doc.departmentId);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900">{doc.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{doc.qualification} &bull; {doc.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {docHosp?.name || 'City Care General Hospital'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{doc.specialization}</div>
                        <div className="text-[11px] text-slate-500">{docDept?.name} &bull; Cabin: {doc.cabin}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-700">{doc.experienceYears} Years</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900">₹{doc.consultationFee}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-bold text-slate-700 font-mono">
                          {doc.shiftStart} - {doc.shiftEnd} (16 Slots)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: NETWORK AUDIT & SMS LOGS                           */}
      {/* ========================================================= */}
      {activeTab === 'network_overview' && (
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-md space-y-6 transition-all ${
            highContrast ? 'bg-neutral-900 border-yellow-400 text-white' : 'bg-white border-slate-200'
          }`}
        >
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-xl font-extrabold flex items-center gap-2 text-slate-900">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span>Network Audit &amp; Automated SMS Delivery Logs</span>
            </h2>
            <p className="text-xs text-slate-500">
              Audit trails of patient appointment confirmations and automated reminder dispatches across all facilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="font-bold text-sm text-slate-800">Healthcare Network Topology</h3>
              <ul className="text-xs space-y-1.5 text-slate-600">
                <li>&bull; Total Managed Hospitals: <strong>{hospitals.length}</strong></li>
                <li>&bull; Medical Specialties: <strong>{departments.length}</strong></li>
                <li>&bull; Active Duty Doctors: <strong>{doctors.length}</strong></li>
                <li>&bull; Daily Slot Capacity: <strong>{doctors.length * 16} slots / day</strong></li>
                <li>&bull; Network Central Control: <strong>{currentUser.name} (Admin)</strong></li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <h3 className="font-bold text-sm text-emerald-950">Automated Notification Gateway</h3>
              <p className="text-xs text-emerald-800">
                Every booking made at any hospital desk or through the patient portal triggers instant SMS confirmation and automated 24h/2h clinical appointment reminders.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DETAILED HOSPITAL PROFILE & DOCTOR ROSTER          */}
      {/* ========================================================= */}
      {selectedHospitalForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={`w-full max-w-2xl rounded-3xl border shadow-2xl p-6 transition-all space-y-6 ${
              highContrast ? 'bg-neutral-900 border-yellow-400 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {selectedHospitalForModal.id}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  {selectedHospitalForModal.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedHospitalForModal.address}, {selectedHospitalForModal.city} &bull; Ph: {selectedHospitalForModal.phone} &bull; Emergency: {selectedHospitalForModal.emergencyPhone}
                </p>
              </div>

              <button
                onClick={() => setSelectedHospitalForModal(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Doctors in this hospital */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Doctors Working at this Facility ({doctors.filter((d) => d.hospitalId === selectedHospitalForModal.id).length})</span>
              </h3>

              {doctors.filter((d) => d.hospitalId === selectedHospitalForModal.id).length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
                  No doctors currently registered to this hospital. When doctors signup, they can select &quot;{selectedHospitalForModal.name}&quot; from the hospital dropdown.
                </div>
              ) : (
                <div className="space-y-2">
                  {doctors
                    .filter((d) => d.hospitalId === selectedHospitalForModal.id)
                    .map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-extrabold text-slate-900">{doc.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {doc.specialization} &bull; Cabin: {doc.cabin} &bull; Ph: {doc.phone}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900">₹{doc.consultationFee}</span>
                          <span className="block text-[10px] text-emerald-700 font-bold font-mono">
                            {doc.shiftStart} - {doc.shiftEnd}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Appointments in this hospital */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Active Appointments ({appointments.filter((a) => a.hospitalId === selectedHospitalForModal.id).length})</span>
              </h3>

              <div className="flex flex-wrap gap-2 text-xs">
                {appointments
                  .filter((a) => a.hospitalId === selectedHospitalForModal.id)
                  .map((a) => (
                    <div
                      key={a.id}
                      className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-medium"
                    >
                      <span className="font-bold">#{a.id} {a.patientName}</span> &bull; {a.slotTime} ({a.status})
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedHospitalForModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

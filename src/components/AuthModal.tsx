import React, { useState } from 'react';
import { UserSession, Department, Hospital, Doctor } from '../types';
import { api } from '../services/api';
import {
  User,
  Stethoscope,
  Shield,
  LogIn,
  UserPlus,
  Check,
  X,
  Phone,
  Mail,
  MapPin,
  Lock,
  Building,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  hospitals: Hospital[];
  onLoginSuccess: (user: UserSession) => void;
  onDoctorRegistered?: () => void;
  highContrast: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  departments,
  hospitals,
  onLoginSuccess,
  onDoctorRegistered,
  highContrast,
}) => {
  const [role, setRole] = useState<'patient' | 'hospital' | 'doctor' | 'admin'>('patient');
  const [isSignUp, setIsSignUp] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('password123');
  const [hospitalId, setHospitalId] = useState(hospitals[0]?.id || 'hosp-1');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'dept-1');
  const [specialization, setSpecialization] = useState('Consultant Specialist');
  const [qualification, setQualification] = useState('MBBS, MD');
  const [cabin, setCabin] = useState('Room 205');
  const [fee, setFee] = useState(600);
  const [age, setAge] = useState(30);
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [address, setAddress] = useState('Pune');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const selectedHospObj = hospitals.find((h) => h.id === hospitalId) || hospitals[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      setLoading(true);
      let registeredDocId = 'doc-1';

      if (isSignUp && role === 'doctor') {
        const res = await api.createDoctor({
          name: name.trim() || 'Dr. New Specialist',
          hospitalId,
          departmentId,
          specialization: specialization || 'Consultant Specialist',
          qualification: qualification || 'MBBS, MD',
          consultationFee: Number(fee) || 600,
          cabin: cabin || 'Room 101',
          phone: phone || '+91 98000 00000',
          email: email || 'doctor@medicare.org',
        });
        registeredDocId = res.doctor.id;
        if (onDoctorRegistered) onDoctorRegistered();
      }

      const selectedDeptObj = departments.find((d) => d.id === departmentId);

      const session: UserSession = {
        role,
        name:
          name.trim() ||
          (role === 'doctor'
            ? 'Dr. Ramesh'
            : role === 'hospital'
            ? 'Hospital Desk & Nursing Team'
            : role === 'admin'
            ? 'Central Network Admin'
            : 'Kamlesh'),
        email: email.trim() || `${role}@medicare.org`,
        phone: phone.trim() || '9876543210',
        doctorId: role === 'doctor' ? registeredDocId : undefined,
        patientId: role === 'patient' ? 'p-1' : undefined,
        department: role === 'doctor' ? selectedDeptObj?.name || 'Pulmonology' : undefined,
        hospitalId: role === 'hospital' || role === 'doctor' ? hospitalId : undefined,
        hospitalName: role === 'hospital' || role === 'doctor' ? selectedHospObj?.name : undefined,
      };

      onLoginSuccess(session);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Logins
  const handleQuickLogin = (
    demoRole: 'patient' | 'hospital' | 'doctor' | 'admin',
    demoName: string,
    docId?: string,
    demoHospitalId?: string,
    demoHospitalName?: string
  ) => {
    const session: UserSession = {
      role: demoRole,
      name: demoName,
      email: `${demoName.toLowerCase().replace(/[^a-z]/g, '')}@medicare.org`,
      phone: '9876543210',
      doctorId: docId,
      patientId: demoRole === 'patient' ? 'p-1' : undefined,
      department: docId ? 'Pulmonology' : undefined,
      hospitalId: demoHospitalId || 'hosp-1',
      hospitalName: demoHospitalName || 'City Care General Hospital',
    };
    onLoginSuccess(session);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl transition-all my-8 overflow-hidden ${
          highContrast
            ? 'bg-black text-white border-yellow-400'
            : 'bg-white text-slate-800 border-slate-200'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 px-6 border-b flex items-center justify-between ${
            highContrast
              ? 'bg-neutral-900 border-yellow-400'
              : 'bg-emerald-800 text-white'
          }`}
        >
          <div>
            <h2 className="font-extrabold text-xl">
              {isSignUp ? 'Create MediCare Account' : 'Login to Clinical Portal'}
            </h2>
            <p className="text-xs text-emerald-100">
              Doctors, Patients, &amp; Administrative Staff
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Quick Demo Switcher */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                ⚡ Instant 1-Click Role Switcher:
              </span>
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                Admin &rarr; Hospital &rarr; Doctor &rarr; Patient
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleQuickLogin('patient', 'Kamlesh')}
                className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-xs font-bold text-slate-800 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                👤 Kamlesh (Patient)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('hospital', 'City Care Hospital Desk', undefined, 'hosp-1', 'City Care General Hospital')}
                className="px-3 py-1.5 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors cursor-pointer shadow-xs"
              >
                🏥 City Care Hospital Desk (Reception &amp; Vitals)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('doctor', 'Dr. Ramesh', 'doc-1', 'hosp-1', 'City Care General Hospital')}
                className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer shadow-xs"
              >
                🩺 Dr. Ramesh (Doctor - 16 Slots)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'Central Network Admin')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer shadow-xs"
              >
                🏢 Central Admin (Multi-Hospital Control)
              </button>
            </div>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                role === 'patient'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Patient</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('hospital')}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                role === 'hospital'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Hospital Desk</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                role === 'doctor'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                role === 'admin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Central Admin</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Hospital Desk Facility Selection */}
            {role === 'hospital' && (
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-2">
                <span className="font-extrabold text-[11px] text-teal-900 uppercase tracking-wider block">
                  Hospital Facility &amp; Operations Desk
                </span>
                <label className="block font-semibold text-slate-700">
                  Select Hospital Facility *
                </label>
                <select
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-teal-300 bg-white font-semibold text-slate-800 outline-none"
                >
                  {hospitals.map((hosp) => (
                    <option key={hosp.id} value={hosp.id}>
                      {hosp.name} &bull; {hosp.address}, {hosp.city}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-teal-800 leading-relaxed">
                  Hospital login enables the hospital desk &amp; nursing team to schedule walk-in appointments, monitor scheduled patient queues, and update patient health vitals (BP, SpO2, sugar, temp) &amp; clinical notes.
                </p>
              </div>
            )}

            {/* Central Admin Information */}
            {role === 'admin' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider block">
                  Centralized Multi-Hospital Control (Super Admin)
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Central Administrator privileges: Register new hospitals into the healthcare network, audit doctor rosters across all facilities, and inspect live appointments and capacity across all hospitals.
                </p>
              </div>
            )}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder={role === 'doctor' ? 'Dr. Ramesh' : 'Kamlesh'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@medicare.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            {/* Doctor specific fields as requested by user */}
            {role === 'doctor' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-extrabold text-[11px] text-slate-700 uppercase tracking-wider">
                  Doctor Professional Credentials, Hospital Affiliation &amp; Department
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-emerald-600" />
                      Hospital You Are Working With *
                    </label>
                    <select
                      value={hospitalId}
                      onChange={(e) => setHospitalId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                    >
                      {hospitals.map((hosp) => (
                        <option key={hosp.id} value={hosp.id}>
                          {hosp.name} &bull; {hosp.address}, {hosp.city} ({hosp.distanceKm} km)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Assigned Department *
                    </label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Specialization Area *
                    </label>
                    <input
                      type="text"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Senior Pulmonologist & Critical Care"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Medical Qualification *
                    </label>
                    <input
                      type="text"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="MBBS, MD (Pulmonary Medicine)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Cabin / Room Number
                    </label>
                    <input
                      type="text"
                      value={cabin}
                      onChange={(e) => setCabin(e.target.value)}
                      placeholder="Room 204, 2nd Floor"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Consultation Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={fee}
                      onChange={(e) => setFee(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-emerald-800 font-medium">
                  &bull; Registered doctors automatically get the 16-slot 8-hour workday scheduler (09:00 - 17:00).
                </p>
              </div>
            )}

            {/* Patient specific fields */}
            {role === 'patient' && isSignUp && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="O+">O+</option>
                    <option value="AB+">AB+</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                {isSignUp ? 'Already have an account? Sign In' : 'New here? Register Account'}
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
              >
                {isSignUp ? 'Complete Registration' : 'Sign In to Portal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

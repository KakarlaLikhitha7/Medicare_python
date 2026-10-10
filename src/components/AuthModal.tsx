import React, { useState, useEffect } from 'react';
import { UserSession, Department, Hospital } from '../types';
import { api } from '../services/api';
import {
  User,
  Stethoscope,
  Shield,
  LogIn,
  UserPlus,
  X,
  AlertCircle,
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
  initialRole?: 'patient' | 'hospital' | 'doctor' | 'admin';
  initialIsSignUp?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  departments,
  hospitals,
  onLoginSuccess,
  onDoctorRegistered,
  highContrast,
  initialRole,
  initialIsSignUp,
}) => {
  const [role, setRole] = useState<'patient' | 'hospital' | 'doctor' | 'admin'>(
    initialRole || 'patient'
  );
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp || false);

  useEffect(() => {
    if (initialRole) setRole(initialRole);
    if (initialIsSignUp !== undefined) setIsSignUp(initialIsSignUp);
    setErrorMsg('');
  }, [initialRole, initialIsSignUp, isOpen]);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [hospitalId, setHospitalId] = useState(hospitals[0]?.id || '');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [cabin, setCabin] = useState('');
  const [fee, setFee] = useState<number | ''>('');
  const [age, setAge] = useState<number | ''>('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Keep hospital and department synced if options load
  useEffect(() => {
    if (!hospitalId && hospitals.length > 0) {
      setHospitalId(hospitals[0].id);
    }
  }, [hospitals, hospitalId]);

  useEffect(() => {
    if (!departmentId && departments.length > 0) {
      setDepartmentId(departments[0].id);
    }
  }, [departments, departmentId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Email Address is required.');
      return;
    }

    if (!password) {
      setErrorMsg('Password is required.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Registration Flow
        if (!name.trim()) {
          setErrorMsg('Full Name is required for registration.');
          setLoading(false);
          return;
        }

        const payload = {
          role,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          hospitalId: role === 'doctor' || role === 'hospital' ? hospitalId : undefined,
          departmentId: role === 'doctor' ? departmentId : undefined,
          specialization: role === 'doctor' ? specialization.trim() : undefined,
          qualification: role === 'doctor' ? qualification.trim() : undefined,
          fee: role === 'doctor' && fee ? Number(fee) : undefined,
          cabin: role === 'doctor' ? cabin.trim() : undefined,
          age: role === 'patient' && age ? Number(age) : undefined,
          bloodGroup: role === 'patient' ? bloodGroup : undefined,
          address: role === 'patient' ? address.trim() : undefined,
        };

        const res = await api.register(payload);
        if (role === 'doctor' && onDoctorRegistered) {
          onDoctorRegistered();
        }
        onLoginSuccess(res.user);
        onClose();
      } else {
        // Login Flow (Strict DB Verification)
        const res = await api.login({
          email: email.trim().toLowerCase(),
          password,
          role,
        });
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl transition-all my-8 overflow-hidden ${
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
            <h2 className="font-extrabold text-lg flex items-center gap-2">
              {isSignUp ? <UserPlus className="w-5 h-5 text-emerald-300" /> : <LogIn className="w-5 h-5 text-emerald-300" />}
              <span>{isSignUp ? `Register as ${role.toUpperCase()}` : `${role.toUpperCase()} Sign In`}</span>
            </h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              {isSignUp
                ? 'Create a new account with your role credentials'
                : 'Enter your registered email & password to access workspace'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Role Tabs */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Your Authorized Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setRole('patient');
                  setErrorMsg('');
                }}
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
                onClick={() => {
                  setRole('hospital');
                  setErrorMsg('');
                }}
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
                onClick={() => {
                  setRole('doctor');
                  setErrorMsg('');
                }}
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
                onClick={() => {
                  setRole('admin');
                  setErrorMsg('');
                }}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{errorMsg}</p>
                {!isSignUp && errorMsg.includes('register') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setErrorMsg('');
                    }}
                    className="text-red-900 underline font-bold mt-1 block cursor-pointer"
                  >
                    Click here to Register New Account &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* If Registering: Name & Phone */}
            {isSignUp && (
              <>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={role === 'doctor' ? 'Doctor Full Name' : 'Full Name'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            {/* Role specific Registration details */}
            {isSignUp && role === 'doctor' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-extrabold text-[11px] text-slate-700 uppercase tracking-wider block">
                  Doctor Profile &amp; Hospital Affiliation
                </span>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Affiliated Hospital *
                  </label>
                  {hospitals.length === 0 ? (
                    <p className="text-[11px] text-amber-700 italic">
                      No hospitals registered yet. Admin must first register a hospital facility.
                    </p>
                  ) : (
                    <select
                      value={hospitalId}
                      onChange={(e) => setHospitalId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                    >
                      {hospitals.map((hosp) => (
                        <option key={hosp.id} value={hosp.id}>
                          {hosp.name} &bull; {hosp.city}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Medical Department *
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Specialization</label>
                    <input
                      type="text"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="Specialization Area"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Qualification</label>
                    <input
                      type="text"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="Medical Degree (MBBS, MD)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cabin / Room</label>
                    <input
                      type="text"
                      value={cabin}
                      onChange={(e) => setCabin(e.target.value)}
                      placeholder="Room number"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      value={fee}
                      onChange={(e) => setFee(Number(e.target.value))}
                      placeholder="Fee in ₹"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {isSignUp && role === 'hospital' && (
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-2">
                <span className="font-extrabold text-[11px] text-teal-900 uppercase tracking-wider block">
                  Hospital Facility Selection
                </span>
                {hospitals.length === 0 ? (
                  <p className="text-[11px] text-amber-800">
                    No hospital registered yet in the database. Please register as Admin first to add hospitals.
                  </p>
                ) : (
                  <select
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-teal-300 bg-white font-semibold text-slate-800"
                  >
                    {hospitals.map((hosp) => (
                      <option key={hosp.id} value={hosp.id}>
                        {hosp.name} &bull; {hosp.city}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {isSignUp && role === 'patient' && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    placeholder="Age"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
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
                    <option value="A-">A-</option>
                    <option value="B-">B-</option>
                    <option value="O-">O-</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="City"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Submit & Toggle */}
            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg('');
                }}
                className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
              >
                {isSignUp ? 'Already registered? Sign In' : 'New user? Register Account'}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading
                  ? 'Verifying...'
                  : isSignUp
                  ? 'Complete Registration'
                  : 'Sign In to Portal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

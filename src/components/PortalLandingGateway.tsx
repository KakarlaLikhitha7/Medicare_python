import React from 'react';
import {
  Shield,
  Building2,
  UserCheck,
  User,
  Stethoscope,
  ArrowRight,
  Activity,
  HeartPulse,
  Sparkles,
  LogIn,
  UserPlus,
  Lock,
} from 'lucide-react';
import { UserSession } from '../types';

interface PortalLandingGatewayProps {
  onSelectRole: (role: 'admin' | 'hospital' | 'doctor' | 'patient', isSignUp: boolean) => void;
  onExplorePublic: () => void;
  hospitalsCount: number;
  doctorsCount: number;
  highContrast: boolean;
}

export const PortalLandingGateway: React.FC<PortalLandingGatewayProps> = ({
  onSelectRole,
  onExplorePublic,
  hospitalsCount,
  doctorsCount,
  highContrast,
}) => {
  return (
    <div className="space-y-10 py-4 max-w-6xl mx-auto">
      {/* Hero Welcome Banner */}
      <div
        className={`p-8 sm:p-12 rounded-3xl border text-center space-y-4 relative overflow-hidden transition-all ${
          highContrast
            ? 'bg-neutral-900 border-yellow-400 text-white'
            : 'bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white shadow-2xl border-slate-800'
        }`}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/10 text-emerald-300 border border-emerald-500/30">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Role-Based Access Hierarchy: Admin &rarr; Hospital &rarr; Doctor &rarr; Patient</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight max-w-3xl mx-auto">
          MediCare Clinical Operations Portal
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Please select your authorized portal to sign in or register a new account.
          Each user logs into exactly one dedicated workspace at a time.
        </p>

        {/* Database Status Pill */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
          <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Database Status: {hospitalsCount} Hospitals &bull; {doctorsCount} Doctors
          </span>
          <button
            onClick={onExplorePublic}
            className="px-3.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>Public Hospital Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Role Selection Grid (One Role Login at a Time) */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800">
            Select Your Role to Sign In or Register
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sign in with your role credentials or create a new profile to access your workspace
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. CENTRAL ADMIN */}
          <div
            className={`p-6 rounded-3xl border flex flex-col justify-between transition-all hover:scale-[1.02] shadow-lg ${
              highContrast
                ? 'bg-neutral-900 border-yellow-400 text-white'
                : 'bg-white border-slate-200 hover:border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-md">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  Level 1: HQ
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-1">Central Admin</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Centralized network command desk. Register new hospital facilities, oversee cross-hospital departments, and manage global doctor rosters.
              </p>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                  <span>Register &amp; Add Hospitals</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                  <span>Check All Hospitals Details</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                  <span>Multi-Hospital Central Control</span>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <button
                onClick={() => onSelectRole('admin', false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Admin Sign In &rarr;</span>
              </button>
              <button
                onClick={() => onSelectRole('admin', true)}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <UserPlus className="w-3 h-3 text-slate-500" />
                <span>Register Admin</span>
              </button>
            </div>
          </div>

          {/* 2. HOSPITAL DESK (OPD & NURSES) */}
          <div
            className={`p-6 rounded-3xl border flex flex-col justify-between transition-all hover:scale-[1.02] shadow-lg ${
              highContrast
                ? 'bg-neutral-900 border-yellow-400 text-white'
                : 'bg-white border-slate-200 hover:border-teal-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-700 text-teal-100 flex items-center justify-center shadow-md">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-800">
                  Level 2: Hospital
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-1">Hospital Desk</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Hospital reception desk &amp; nursing station. Schedule walk-ins, update patient vitals (BP, SpO2, Heart Rate), and monitor OPD queues.
              </p>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-600"></div>
                  <span>Schedule Walk-in Patients</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-600"></div>
                  <span>Record &amp; Update Patient Vitals</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-600"></div>
                  <span>Find &amp; Update Appointment Record</span>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <button
                onClick={() => onSelectRole('hospital', false)}
                className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Hospital Desk Sign In &rarr;</span>
              </button>
              <button
                onClick={() => onSelectRole('hospital', true)}
                className="w-full py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <UserPlus className="w-3 h-3 text-teal-600" />
                <span>Register Desk Staff / Nurse</span>
              </button>
            </div>
          </div>

          {/* 3. DOCTOR PORTAL */}
          <div
            className={`p-6 rounded-3xl border flex flex-col justify-between transition-all hover:scale-[1.02] shadow-lg ${
              highContrast
                ? 'bg-neutral-900 border-yellow-400 text-white'
                : 'bg-white border-slate-200 hover:border-emerald-600'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-emerald-100 flex items-center justify-center shadow-md">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800">
                  Level 3: Doctor
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-1">Doctor Console</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Consulting specialist console. Strict 16-slot workday patient schedule (09:00 - 17:00), review patient EHR history, and issue e-prescriptions.
              </p>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                  <span>Strict 16-Patient Workday Queue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                  <span>Conduct Live Consultations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                  <span>Issue Electronic Prescriptions</span>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <button
                onClick={() => onSelectRole('doctor', false)}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Doctor Sign In &rarr;</span>
              </button>
              <button
                onClick={() => onSelectRole('doctor', true)}
                className="w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <UserPlus className="w-3 h-3 text-emerald-600" />
                <span>Register Doctor Profile</span>
              </button>
            </div>
          </div>

          {/* 4. PATIENT PORTAL */}
          <div
            className={`p-6 rounded-3xl border flex flex-col justify-between transition-all hover:scale-[1.02] shadow-lg ${
              highContrast
                ? 'bg-neutral-900 border-yellow-400 text-white'
                : 'bg-white border-slate-200 hover:border-blue-600'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-700 text-blue-100 flex items-center justify-center shadow-md">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-800">
                  Level 4: Patient
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-1">Patient Portal</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Patient self-service portal. Find nearby hospitals &amp; consulting doctors, book appointment slots, and view personal health records.
              </p>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                  <span>Find Hospitals &amp; Doctors</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                  <span>Book Doctor Consultations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                  <span>View Vitals &amp; Prescriptions</span>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <button
                onClick={() => onSelectRole('patient', false)}
                className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Patient Sign In &rarr;</span>
              </button>
              <button
                onClick={() => onSelectRole('patient', true)}
                className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <UserPlus className="w-3 h-3 text-blue-600" />
                <span>Register New Patient</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

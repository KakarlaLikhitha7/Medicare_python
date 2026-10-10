import React from 'react';
import {
  Stethoscope,
  Building2,
  Brain,
  FileText,
  UserCheck,
  MessageSquare,
  Bell,
  Sun,
  Moon,
  LogIn,
  LogOut,
  Shield,
} from 'lucide-react';
import { UserSession } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: UserSession | null;
  onOpenAuth: () => void;
  onLogout?: () => void;
  onOpenTriage: () => void;
  onOpenBillingChat: () => void;
  onOpenSMSDrawer: () => void;
  smsCount: number;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenTriage,
  onOpenBillingChat,
  onOpenSMSDrawer,
  smsCount,
  highContrast,
  setHighContrast,
}) => {
  return (
    <header
      className={`sticky top-0 z-40 transition-colors border-b ${
        highContrast
          ? 'bg-black text-white border-yellow-400'
          : 'bg-white/95 backdrop-blur-md text-slate-800 border-slate-200 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => {
              if (currentUser?.role === 'doctor') {
                setCurrentTab('doctor');
              } else if (currentUser?.role === 'hospital' || currentUser?.role === 'nurse') {
                setCurrentTab('hospital');
              } else if (currentUser?.role === 'admin') {
                setCurrentTab('admin');
              } else if (currentUser?.role === 'patient') {
                setCurrentTab('patient');
              } else {
                setCurrentTab('landing');
              }
            }}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
                highContrast ? 'bg-yellow-400 text-black' : 'bg-emerald-600'
              }`}
            >
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight">MediCare</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    highContrast
                      ? 'bg-yellow-400 text-black'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  Clinical System
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none">
                Admin &bull; Hospital &bull; Doctor &bull; Patient
              </p>
            </div>
          </div>

          {/* Navigation Items - Clean & Role-Specific (No Clutter!) */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* GUEST (Not Logged In) */}
            {!currentUser && (
              <>
                <button
                  onClick={() => setCurrentTab('landing')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    currentTab === 'landing'
                      ? highContrast
                        ? 'bg-yellow-400 text-black font-bold'
                        : 'bg-emerald-50 text-emerald-700 shadow-xs font-bold'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Role Access Portals</span>
                </button>

                <button
                  onClick={() => setCurrentTab('hierarchy')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    currentTab === 'hierarchy'
                      ? highContrast
                        ? 'bg-yellow-400 text-black font-bold'
                        : 'bg-emerald-50 text-emerald-700 shadow-xs'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Public Hospital Directory</span>
                </button>

                <button
                  onClick={onOpenTriage}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    highContrast
                      ? 'border border-yellow-400 hover:bg-yellow-400 hover:text-black'
                      : 'text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200'
                  }`}
                >
                  <Brain className="w-4 h-4 text-violet-600" />
                  <span>AI Symptom Triage</span>
                </button>
              </>
            )}

            {/* PATIENT ROLE */}
            {currentUser?.role === 'patient' && (
              <>
                <button
                  onClick={() => setCurrentTab('hierarchy')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    currentTab === 'hierarchy'
                      ? highContrast
                        ? 'bg-yellow-400 text-black font-bold'
                        : 'bg-emerald-50 text-emerald-700 shadow-xs font-bold'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Find Hospitals &amp; Doctors</span>
                </button>

                <button
                  onClick={() => setCurrentTab('patient')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    currentTab === 'patient'
                      ? highContrast
                        ? 'bg-yellow-400 text-black font-bold'
                        : 'bg-emerald-50 text-emerald-700 shadow-xs font-bold'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>My Health Record &amp; Appointments</span>
                </button>

                <button
                  onClick={onOpenTriage}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    highContrast
                      ? 'border border-yellow-400 hover:bg-yellow-400 hover:text-black'
                      : 'text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200'
                  }`}
                >
                  <Brain className="w-4 h-4 text-violet-600" />
                  <span>AI Symptom Triage</span>
                </button>

                <button
                  onClick={onOpenBillingChat}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    highContrast
                      ? 'border border-white hover:bg-white hover:text-black'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                  title="Chat with Hospital Staff regarding Billing"
                >
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>Billing Help</span>
                </button>
              </>
            )}

            {/* HOSPITAL DESK ROLE (Desk Staff & Nurses) */}
            {(currentUser?.role === 'hospital' || currentUser?.role === 'nurse') && (
              <>
                <button
                  onClick={() => setCurrentTab('hospital')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all ${
                    currentTab === 'hospital' || currentTab === 'nurse'
                      ? highContrast
                        ? 'bg-yellow-400 text-black font-bold'
                        : 'bg-teal-700 text-white shadow-md'
                      : 'hover:bg-teal-50 text-teal-800 border border-teal-200'
                  }`}
                  title="Hospital Operations Desk: Schedule walk-ins, monitor appointments, and record patient vitals"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Hospital Operations Desk (OPD &amp; Vitals)</span>
                </button>

                <button
                  onClick={() => setCurrentTab('hierarchy')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    currentTab === 'hierarchy'
                      ? highContrast
                        ? 'bg-yellow-400 text-black font-bold'
                        : 'bg-emerald-50 text-emerald-700 shadow-xs'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>Hospital Directory</span>
                </button>
              </>
            )}

            {/* DOCTOR ROLE */}
            {currentUser?.role === 'doctor' && (
              <>
                <button
                  onClick={() => setCurrentTab('doctor')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all ${
                    currentTab === 'doctor'
                      ? highContrast
                        ? 'bg-yellow-400 text-black font-bold'
                        : 'bg-emerald-700 text-white shadow-md'
                      : 'hover:bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Doctor Consultation Console (16-Slot Schedule)</span>
                </button>

                <button
                  onClick={onOpenTriage}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    highContrast
                      ? 'border border-yellow-400 hover:bg-yellow-400 hover:text-black'
                      : 'text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200'
                  }`}
                >
                  <Brain className="w-4 h-4 text-violet-600" />
                  <span>Clinical AI Triage</span>
                </button>
              </>
            )}

            {/* CENTRAL ADMIN ROLE */}
            {currentUser?.role === 'admin' && (
              <>
                <button
                  onClick={() => setCurrentTab('admin')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all ${
                    currentTab === 'admin' || currentTab === 'classic'
                      ? highContrast
                        ? 'bg-yellow-400 text-black font-bold ring-2 ring-yellow-300'
                        : 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-800/10 text-slate-800 hover:bg-slate-800/20'
                  }`}
                  title="Centralized Multi-Hospital Governance & Administration"
                >
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Central Admin (Multi-Hospital HQ)</span>
                </button>

                <button
                  onClick={() => setCurrentTab('hierarchy')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    currentTab === 'hierarchy'
                      ? highContrast
                        ? 'bg-yellow-400 text-black font-bold'
                        : 'bg-emerald-50 text-emerald-700 shadow-xs'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Facilities Directory</span>
                </button>
              </>
            )}
          </nav>

          {/* Quick Utility Tools & User Session Controls */}
          <div className="flex items-center gap-2">
            {/* SMS Reminders Drawer */}
            <button
              onClick={onOpenSMSDrawer}
              className={`relative p-2 rounded-lg transition-all ${
                highContrast ? 'border border-yellow-400 hover:bg-yellow-400/20' : 'hover:bg-slate-100 text-slate-700'
              }`}
              title="Automated SMS Delivery & Reminders"
            >
              <Bell className="w-5 h-5" />
              {smsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {smsCount}
                </span>
              )}
            </button>

            {/* High Contrast Toggle */}
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`p-2 rounded-lg transition-all ${
                highContrast
                  ? 'bg-yellow-400 text-black font-bold'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
              title="Toggle High Contrast Mode (Accessibility)"
              aria-label="Toggle High Contrast"
            >
              {highContrast ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Session / Login / Logout */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                    highContrast
                      ? 'border-yellow-400 bg-neutral-900 text-white'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="text-left">
                    <div className="text-xs font-bold leading-none">{currentUser.name}</div>
                    <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                      {currentUser.role === 'admin'
                        ? 'Central Admin'
                        : currentUser.role === 'hospital' || currentUser.role === 'nurse'
                        ? 'Hospital Desk'
                        : currentUser.role === 'doctor'
                        ? 'Doctor'
                        : 'Patient'}
                    </div>
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
                    title="Sign Out of MediCare"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden xl:inline text-[11px]">Logout</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                  highContrast
                    ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

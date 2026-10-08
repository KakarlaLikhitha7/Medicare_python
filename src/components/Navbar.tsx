import React from 'react';
import {
  Stethoscope,
  Building2,
  Brain,
  FileText,
  UserCheck,
  Monitor,
  MessageSquare,
  Bell,
  Sun,
  Moon,
  LogIn,
  Activity,
  Shield,
} from 'lucide-react';
import { UserSession } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: UserSession;
  onOpenAuth: () => void;
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
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('hierarchy')}>
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

          {/* Navigation Items */}
          <nav className="hidden lg:flex items-center gap-1">
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
              <span>Hospitals &amp; Doctors</span>
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
              onClick={() => setCurrentTab('patient')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'patient'
                  ? highContrast
                    ? 'bg-yellow-400 text-black font-bold'
                    : 'bg-emerald-50 text-emerald-700 shadow-xs'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Patient Portal</span>
            </button>

            <button
              onClick={() => setCurrentTab('hospital')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'hospital' || currentTab === 'nurse'
                  ? highContrast
                    ? 'bg-yellow-400 text-black font-bold'
                    : 'bg-teal-50 text-teal-800 shadow-xs font-bold ring-1 ring-teal-300'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
              title="Hospital Operations Desk: Schedule walk-ins, monitor appointments, and record patient vitals"
            >
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>Hospital Desk</span>
            </button>

            <button
              onClick={() => setCurrentTab('doctor')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'doctor'
                  ? highContrast
                    ? 'bg-yellow-400 text-black font-bold'
                    : 'bg-emerald-50 text-emerald-700 shadow-xs'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Doctor Console</span>
            </button>

            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'admin' || currentTab === 'classic'
                  ? highContrast
                    ? 'bg-yellow-400 text-black font-bold ring-2 ring-yellow-300'
                    : 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-800/10 text-slate-800 hover:bg-slate-800/20'
              }`}
              title="Centralized Multi-Hospital Governance &amp; Administration"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="font-bold">Central Admin</span>
            </button>
          </nav>

          {/* Quick Utility Tools */}
          <div className="flex items-center gap-2">
            {/* Billing Chat */}
            <button
              onClick={onOpenBillingChat}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                highContrast
                  ? 'border border-white hover:bg-white hover:text-black'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
              title="Chat with Hospital Staff regarding Billing & Insurance"
            >
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Billing Desk</span>
            </button>

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

            {/* User Session / Switch Role */}
            <div
              onClick={onOpenAuth}
              className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl cursor-pointer border transition-all ${
                highContrast
                  ? 'border-yellow-400 bg-neutral-900 text-white hover:bg-neutral-800'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="text-left">
                <div className="text-xs font-bold leading-none">{currentUser.name}</div>
                <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                  {currentUser.role === 'admin'
                    ? 'Central Admin'
                    : currentUser.role === 'hospital' || currentUser.role === 'nurse'
                    ? 'Hospital Desk'
                    : currentUser.role}
                </div>
              </div>
              <LogIn className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

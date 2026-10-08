/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Hospital,
  Department,
  Doctor,
  Appointment,
  Prescription,
  SMSLog,
  UserSession,
} from './types';
import { api } from './services/api';

import { Navbar } from './components/Navbar';
import { HospitalExplorer } from './components/HospitalExplorer';
import { BookingModal } from './components/BookingModal';
import { GeminiTriageModal } from './components/GeminiTriageModal';
import { PatientPortal } from './components/PatientPortal';
import { DoctorDashboard } from './components/DoctorDashboard';
import { BillingChatModal } from './components/BillingChatModal';
import { SMSDrawer } from './components/SMSDrawer';
import { AuthModal } from './components/AuthModal';
import { HospitalDesk } from './components/HospitalDesk';
import { CentralAdminControl } from './components/CentralAdminControl';

import {
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Navigation & View state
  const [currentTab, setCurrentTab] = useState<string>('hierarchy');
  const [highContrast, setHighContrast] = useState<boolean>(false);

  // Core Data
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Hierarchy Selection state
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);

  // Active User Session (Defaults to Kamlesh for instant interactive demo, can be logged out or switched anytime)
  const [currentUser, setCurrentUser] = useState<UserSession | null>({
    role: 'patient',
    name: 'Kamlesh',
    email: 'kamlesh.p@gmail.com',
    phone: '9876543210',
    patientId: 'p-1',
  });

  // Modals
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [bookingDisease, setBookingDisease] = useState<string>('COVID-19');
  const [isTriageOpen, setIsTriageOpen] = useState<boolean>(false);
  const [isBillingChatOpen, setIsBillingChatOpen] = useState<boolean>(false);
  const [isSMSDrawerOpen, setIsSMSDrawerOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Booking Success Toast
  const [toastNotice, setToastNotice] = useState<{ title: string; desc: string } | null>(null);

  // Initial Data Fetching
  const loadAllData = async () => {
    try {
      const [hospData, deptData, docData, apptData, rxData, smsData] = await Promise.all([
        api.getHospitals(),
        api.getDepartments(),
        api.getDoctors(),
        api.getAppointments(),
        api.getPrescriptions(),
        api.getSMSLogs(),
      ]);

      setHospitals(hospData);
      setDepartments(deptData);
      setDoctors(docData);
      setAppointments(apptData);
      setPrescriptions(rxData);
      setSmsLogs(smsData);
    } catch (err) {
      console.error('Failed to load clinical data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleBookingSuccess = (newAppt: Appointment, smsText?: string) => {
    setBookingDoctor(null);
    setToastNotice({
      title: `Appointment #${newAppt.id} Confirmed with ${newAppt.doctorName}!`,
      desc: smsText || `Slot reserved for ${newAppt.slotTime} on ${newAppt.appointmentDate}. Automated SMS sent to ${newAppt.patientPhone}.`,
    });
    setTimeout(() => setToastNotice(null), 6000);
    if (currentUser?.role === 'patient') {
      setCurrentTab('patient');
    }
    loadAllData();
  };

  const handleSelectDoctorFromTriage = (doctorName: string, disease: string) => {
    const doc = doctors.find((d) => d.name.toLowerCase().includes(doctorName.toLowerCase())) || doctors[0];
    setBookingDisease(disease || 'Clinical Consultation');
    setBookingDoctor(doc);
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        highContrast
          ? 'bg-black text-white'
          : 'bg-slate-100/70 text-slate-900'
      }`}
    >
      {/* Main Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={() => {
          setCurrentUser(null);
          setCurrentTab('hierarchy');
        }}
        onOpenTriage={() => setIsTriageOpen(true)}
        onOpenBillingChat={() => setIsBillingChatOpen(true)}
        onOpenSMSDrawer={() => setIsSMSDrawerOpen(true)}
        smsCount={smsLogs.length}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
      />

      {/* Booking Toast Alert */}
      {toastNotice && (
        <div className="fixed top-20 right-4 z-50 max-w-md animate-bounce">
          <div className="p-4 rounded-2xl bg-emerald-800 text-white shadow-2xl border-2 border-emerald-400 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-extrabold text-sm">{toastNotice.title}</h4>
              <p className="text-xs text-emerald-100 mt-0.5 leading-relaxed font-mono">
                {toastNotice.desc}
              </p>
              <div className="mt-2 pt-2 border-t border-emerald-700/60 flex items-center justify-between">
                <button
                  onClick={() => {
                    setCurrentTab('patient');
                    setToastNotice(null);
                  }}
                  className="text-xs font-bold underline text-white hover:text-emerald-200 cursor-pointer"
                >
                  View in Patient Portal &rarr;
                </button>
                <button
                  onClick={() => setToastNotice(null)}
                  className="text-[11px] text-emerald-200 hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-600">
              Connecting to MediCare Database &amp; Initializing 16-Slot Scheduler...
            </p>
          </div>
        ) : (
          <>
            {/* 1. Structured Hierarchy: Nearest Hospitals -> Departments -> Doctors */}
            {currentTab === 'hierarchy' && (
              <HospitalExplorer
                hospitals={hospitals}
                departments={departments}
                doctors={doctors}
                selectedHospitalId={selectedHospitalId}
                setSelectedHospitalId={setSelectedHospitalId}
                selectedDepartmentId={selectedDepartmentId}
                setSelectedDepartmentId={setSelectedDepartmentId}
                onSelectDoctorToBook={(doc) => {
                  setBookingDisease('General Consultation');
                  setBookingDoctor(doc);
                }}
                onOpenTriage={() => setIsTriageOpen(true)}
                onBackToPortal={() => setCurrentTab('patient')}
                onHospitalAdded={loadAllData}
                currentUser={currentUser}
                highContrast={highContrast}
              />
            )}

            {/* Sign-in Gatekeeper for unauthenticated visitors trying to access role workspaces */}
            {!currentUser && currentTab !== 'hierarchy' && (
              <div className="max-w-md mx-auto text-center p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4 my-12">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-3xl font-bold">
                  🔐
                </div>
                <h2 className="text-xl font-extrabold text-slate-800">
                  {currentTab === 'patient' && 'Patient Sign In Required'}
                  {(currentTab === 'hospital' || currentTab === 'nurse') && 'Hospital Desk Sign In Required'}
                  {currentTab === 'doctor' && 'Doctor Portal Sign In Required'}
                  {(currentTab === 'admin' || currentTab === 'classic') && 'Central Admin Sign In Required'}
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Please sign in or register a new account to access this role workspace.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                  >
                    Sign In / Register Account &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* 2. Patient Portal: Health records, Prescriptions, AI explainer */}
            {currentTab === 'patient' && currentUser && (
              <PatientPortal
                currentUser={currentUser}
                appointments={appointments}
                prescriptions={prescriptions}
                onBookNewAppointment={() => setCurrentTab('hierarchy')}
                highContrast={highContrast}
              />
            )}

            {/* 3. Hospital Operations & Reception Desk (Schedule walk-ins, monitor appointments, update patient vitals & EHR) */}
            {(currentTab === 'hospital' || currentTab === 'nurse') && currentUser && (
              <HospitalDesk
                currentUser={currentUser}
                hospitals={hospitals}
                doctors={doctors}
                departments={departments}
                appointments={appointments}
                onRefreshAll={loadAllData}
                highContrast={highContrast}
              />
            )}

            {/* 4. Doctor Dashboard: 16-slot queue, conduct consultations, prescribe medicine */}
            {currentTab === 'doctor' && currentUser && (
              <DoctorDashboard
                doctors={doctors}
                appointments={appointments}
                currentUser={currentUser}
                onRefreshAppointments={loadAllData}
                highContrast={highContrast}
              />
            )}

            {/* 5. Centralized Multi-Hospital Administration (Check Details for All Hospitals, Add Hospitals, Multi-Facility Governance) */}
            {(currentTab === 'admin' || currentTab === 'classic') && currentUser && (
              <CentralAdminControl
                currentUser={currentUser}
                hospitals={hospitals}
                doctors={doctors}
                departments={departments}
                appointments={appointments}
                onRefreshAll={loadAllData}
                highContrast={highContrast}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Action Quick Triggers */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-3">
        {/* Quick Triage Trigger */}
        <button
          onClick={() => setIsTriageOpen(true)}
          className="p-3.5 rounded-2xl bg-violet-700 hover:bg-violet-800 text-white shadow-xl hover:scale-105 transition-all flex items-center gap-2 text-xs font-bold"
          title="Analyze Symptoms with Gemini AI"
        >
          <Sparkles className="w-5 h-5 text-violet-300" />
          <span className="hidden md:inline">AI Symptom Triage</span>
        </button>
      </div>

      {/* ALL MODALS */}
      {/* 1. Booking Modal */}
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          currentUser={currentUser}
          onClose={() => setBookingDoctor(null)}
          onSuccess={handleBookingSuccess}
          highContrast={highContrast}
          prefilledDisease={bookingDisease}
        />
      )}

      {/* 2. Gemini AI Symptom Triage Modal */}
      <GeminiTriageModal
        isOpen={isTriageOpen}
        onClose={() => setIsTriageOpen(false)}
        onSelectDoctorForBooking={handleSelectDoctorFromTriage}
        highContrast={highContrast}
      />

      {/* 3. Patient Billing Chat Modal */}
      <BillingChatModal
        isOpen={isBillingChatOpen}
        onClose={() => setIsBillingChatOpen(false)}
        patientName={currentUser?.name || 'Patient'}
        highContrast={highContrast}
      />

      {/* 4. Automated SMS Reminders Drawer */}
      <SMSDrawer
        isOpen={isSMSDrawerOpen}
        onClose={() => setIsSMSDrawerOpen(false)}
        logs={smsLogs}
        onRefreshLogs={loadAllData}
        highContrast={highContrast}
      />

      {/* 5. Auth Modal (Doctors choose hospital on signup) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        departments={departments}
        hospitals={hospitals}
        onDoctorRegistered={loadAllData}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'admin') {
            setCurrentTab('admin');
          } else if (user.role === 'hospital' || user.role === 'nurse') {
            setCurrentTab('hospital');
          } else if (user.role === 'doctor') {
            setCurrentTab('doctor');
          } else {
            setCurrentTab('patient');
          }
        }}
        highContrast={highContrast}
      />
    </div>
  );
}

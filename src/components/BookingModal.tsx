import React, { useState, useEffect } from 'react';
import { Doctor, DoctorSlotsData, Appointment, UserSession } from '../types';
import { api } from '../services/api';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle,
  FileText,
  Send,
  Loader2,
} from 'lucide-react';

interface BookingModalProps {
  doctor: Doctor | null;
  currentUser: UserSession | null;
  onClose: () => void;
  onSuccess: (newAppointment: Appointment, smsMessage?: string) => void;
  highContrast: boolean;
  prefilledDisease?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  doctor,
  currentUser,
  onClose,
  onSuccess,
  highContrast,
  prefilledDisease,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [slotsData, setSlotsData] = useState<DoctorSlotsData | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Patient form fields
  const [patientName, setPatientName] = useState<string>(
    currentUser?.role === 'patient' ? currentUser.name : ''
  );
  const [patientAge, setPatientAge] = useState<number | ''>('');
  const [patientPhone, setPatientPhone] = useState<string>(
    currentUser?.phone || ''
  );
  const [patientDisease, setPatientDisease] = useState<string>(
    prefilledDisease || 'General Consultation'
  );
  const [patientAddress, setPatientAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Fetch slots whenever doctor or selectedDate changes
  useEffect(() => {
    if (!doctor) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setErrorMsg('');
      try {
        const data = await api.getDoctorSlots(doctor.id, selectedDate);
        setSlotsData(data);
        // Auto-select first available slot if current selected is invalid
        const firstAvail = data.slots.find((s) => s.isAvailable);
        if (firstAvail) {
          setSelectedSlot(firstAvail.time);
        } else {
          setSelectedSlot('');
        }
      } catch (err: any) {
        setErrorMsg('Failed to load doctor slots: ' + err.message);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [doctor, selectedDate]);

  if (!doctor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!patientName.trim()) {
      setErrorMsg('Patient Name is required.');
      return;
    }
    if (!selectedSlot) {
      setErrorMsg('Please select a valid time slot.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createAppointment({
        patientName: patientName.trim(),
        patientAge: Number(patientAge),
        patientPhone: patientPhone.trim(),
        patientDisease: patientDisease.trim(),
        patientAddress: patientAddress.trim(),
        doctorId: doctor.id,
        doctorName: doctor.name,
        hospitalId: doctor.hospitalId,
        appointmentDate: selectedDate,
        slotTime: selectedSlot,
        notes,
      });

      onSuccess(res.appointment, res.smsSent?.message);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error booking appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl transition-all my-8 overflow-hidden ${
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
              : 'bg-emerald-800 text-white border-emerald-900'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-xl">Book Appointment</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-white/20 text-white">
                16 Slots / 8-hr Shift
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              Scheduling with {doctor.name} &bull; {doctor.specialization}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Doctor Brief Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-sm text-slate-900">{doctor.name}</div>
              <div className="text-slate-600 font-medium">{doctor.cabin}</div>
              <div className="text-emerald-700 font-semibold mt-0.5">
                Fee: ₹{doctor.consultationFee} (Includes 30-min consultation)
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-500 font-medium">Workday Hours</div>
              <div className="font-bold text-slate-800">09:00 - 17:00</div>
              <div className="text-[11px] text-slate-500">Max 16 Patients Cap</div>
            </div>
          </div>

          {/* Date Picker & 16-slot Workload Status */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Select Appointment Date
              </label>

              {slotsData && (
                <div className="text-xs font-semibold">
                  {slotsData.isFullyBooked ? (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> 16/16 Cap Reached - Fully Booked!
                    </span>
                  ) : (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />{' '}
                      {slotsData.remainingSlots} of 16 slots available today
                    </span>
                  )}
                </div>
              )}
            </div>

            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-sm font-semibold transition-all ${
                highContrast
                  ? 'bg-neutral-900 border-yellow-400 text-white'
                  : 'bg-white border-slate-300 focus:ring-emerald-500'
              }`}
            />
          </div>

          {/* The 16 Time Slots Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                Available 30-min Slots (8-Hour Day)
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                Green = Open &bull; Gray = Booked
              </span>
            </div>

            {loadingSlots ? (
              <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                <span className="text-xs">Checking real-time doctor availability...</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {slotsData?.slots.map((slot) => {
                  const isSelected = selectedSlot === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`p-2 rounded-xl text-center text-xs font-bold transition-all border relative ${
                        isSelected
                          ? highContrast
                            ? 'bg-yellow-400 text-black border-yellow-400 ring-2 ring-yellow-400 font-extrabold'
                            : 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : slot.isAvailable
                          ? highContrast
                            ? 'bg-neutral-900 text-white border-neutral-700 hover:border-yellow-400'
                            : 'bg-white text-emerald-800 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50'
                          : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                      }`}
                      title={
                        slot.isAvailable
                          ? `Slot ${slot.time} is Available`
                          : `Booked by ${slot.bookedBy || 'Patient'}`
                      }
                    >
                      {slot.time}
                      {!slot.isAvailable && (
                        <span className="block text-[8px] font-normal tracking-tight">Booked</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Patient Particulars (Matches Screenshot 1 New Appointment fields) */}
          <div className="space-y-4 pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Patient Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter patient full name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Age
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  placeholder="Age"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Phone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit phone number"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Disease / Symptoms *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. COVID-19 / Cough / Fever"
                  value={patientDisease}
                  onChange={(e) => setPatientDisease(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Camp, Pune"
                    value={patientAddress}
                    onChange={(e) => setPatientAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Notes / History (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Any prior medical history or existing medications..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Automated SMS Reminder Notice */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
            <Send className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Automated SMS Reminder will be triggered</p>
              <p className="text-[11px] text-emerald-700">
                A booking confirmation and 24h SMS reminder will be dispatched to {patientPhone || 'your mobile'}.
              </p>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || slotsData?.isFullyBooked}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
                highContrast
                  ? 'bg-yellow-400 text-black hover:bg-yellow-300 font-extrabold'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Confirming Booking...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm &amp; Schedule ({selectedSlot || 'Select Slot'})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

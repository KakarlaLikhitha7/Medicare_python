import React, { useState } from 'react';
import { SMSLog } from '../types';
import { api } from '../services/api';
import {
  Bell,
  X,
  Send,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface SMSDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: SMSLog[];
  onRefreshLogs: () => void;
  highContrast: boolean;
}

export const SMSDrawer: React.FC<SMSDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onRefreshLogs,
  highContrast,
}) => {
  const [testPhone, setTestPhone] = useState('9876543210');
  const [testPatient, setTestPatient] = useState('Kamlesh');
  const [testType, setTestType] = useState('REMINDER_24H');
  const [sentNotice, setSentNotice] = useState(false);

  if (!isOpen) return null;

  const handleSendTestSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const msg =
        testType === 'REMINDER_24H'
          ? `MediCare Reminder: Dear ${testPatient}, your consultation with Dr. Ramesh is scheduled for tomorrow at 09:00 AM at City Care General Hospital. Reply CONFIRM or call 108 for emergency.`
          : `MediCare Urgent Alert: Your appointment is in 2 hours with Dr. Ramesh at Cabin 204. Please arrive 15 mins prior.`;

      await api.sendSMS({
        toPhone: testPhone,
        patientName: testPatient,
        message: msg,
        type: testType,
      });

      setSentNotice(true);
      setTimeout(() => setSentNotice(false), 2000);
      onRefreshLogs();
    } catch (err: any) {
      alert('Error sending SMS: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div
        className={`w-full max-w-md h-full shadow-2xl flex flex-col transition-all overflow-hidden ${
          highContrast
            ? 'bg-black text-white border-l-2 border-yellow-400'
            : 'bg-white text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Automated SMS Notifications Hub
              </h3>
              <p className="text-[11px] text-slate-500">
                Real-time appointment alerts &amp; reminders
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test SMS Sender Accordion */}
        <div className="p-4 bg-emerald-50/50 border-b border-emerald-200 space-y-3 text-xs">
          <div className="font-bold text-emerald-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Simulate / Send Automated SMS Reminder</span>
          </div>

          <form onSubmit={handleSendTestSMS} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Patient Name"
                value={testPatient}
                onChange={(e) => setTestPatient(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px]"
              >
                <option value="CONFIRMATION">Booking Confirmation SMS</option>
                <option value="REMINDER_24H">24 Hours Prior Reminder</option>
                <option value="REMINDER_2H">2 Hours Prior Urgent Alert</option>
              </select>

              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1 text-[11px] shadow-xs"
              >
                <Send className="w-3 h-3" />
                <span>Send SMS</span>
              </button>
            </div>

            {sentNotice && (
              <p className="text-[11px] font-bold text-emerald-700">
                &bull; SMS dispatched to mobile network simulator!
              </p>
            )}
          </form>
        </div>

        {/* SMS List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Delivered SMS History ({logs.length})
          </div>

          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  {log.toPhone} ({log.patientName})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {log.status}
                </span>
              </div>

              <p className="text-slate-700 leading-relaxed font-mono text-[11px] p-2 bg-slate-50 rounded-xl border border-slate-100">
                {log.message}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="uppercase font-semibold tracking-wider text-slate-500">
                  {log.type}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {log.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

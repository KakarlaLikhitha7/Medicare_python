import React, { useState } from 'react';
import { TriageResult, Doctor } from '../types';
import { api } from '../services/api';
import {
  Brain,
  X,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Loader2,
  Calendar,
} from 'lucide-react';

interface GeminiTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoctorForBooking: (doctorName: string, diseaseSymptoms: string) => void;
  highContrast: boolean;
}

export const GeminiTriageModal: React.FC<GeminiTriageModalProps> = ({
  isOpen,
  onClose,
  onSelectDoctorForBooking,
  highContrast,
}) => {
  const [symptomsInput, setSymptomsInput] = useState<string>('');
  const [patientAge, setPatientAge] = useState<number>(35);
  const [duration, setDuration] = useState<string>('3 days');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomsInput.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const data = await api.triageSymptoms({
        symptoms: symptomsInput.trim(),
        patientAge,
        duration,
      });
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing symptoms');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'emergency':
        return 'bg-red-600 text-white border-red-700 font-extrabold animate-pulse';
      case 'priority':
        return 'bg-amber-500 text-white border-amber-600 font-bold';
      case 'moderate':
        return 'bg-blue-600 text-white border-blue-700 font-bold';
      default:
        return 'bg-emerald-600 text-white border-emerald-700 font-semibold';
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
              : 'bg-gradient-to-r from-violet-800 to-indigo-900 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 text-white">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-lg sm:text-xl">AI Clinical Symptom Triage</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-400/30 text-violet-200 border border-violet-400/40">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-violet-200">
                Describe your symptoms &bull; Recommends the right department &amp; doctor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {/* Input Form */}
          <form onSubmit={handleTriage} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Describe your symptoms or condition *</span>
                <span className="text-[11px] font-normal text-slate-500">
                  Be as descriptive as you like
                </span>
              </label>
              <textarea
                rows={3}
                required
                value={symptomsInput}
                onChange={(e) => setSymptomsInput(e.target.value)}
                placeholder="e.g. Persistent dry cough, low grade fever, and shortness of breath for 3 days; feeling chest heaviness when climbing stairs."
                className={`w-full p-3.5 rounded-2xl border text-xs leading-relaxed transition-all ${
                  highContrast
                    ? 'bg-neutral-900 text-white border-yellow-400 focus:ring-yellow-400'
                    : 'bg-slate-50 border-slate-300 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Age
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={patientAge}
                  onChange={(e) => setPatientAge(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration of Symptoms
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                >
                  <option value="Since today">Since today</option>
                  <option value="2-3 days">2 - 3 days</option>
                  <option value="1 week">About 1 week</option>
                  <option value="More than 2 weeks">More than 2 weeks (Chronic)</option>
                </select>
              </div>
            </div>

            {/* Quick Sample Prompts */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 mr-1 self-center">Try:</span>
              {[
                'Severe dry cough, fever and loss of taste',
                'Sharp chest pain radiating to left arm',
                'Throbbing migraine headache with sensitivity to light',
                'Knee joint swelling and stiffness when standing',
              ].map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSymptomsInput(sample)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-600 transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || !symptomsInput.trim()}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                highContrast
                  ? 'bg-yellow-400 text-black hover:bg-yellow-300 font-extrabold'
                  : 'bg-violet-700 hover:bg-violet-800 text-white disabled:opacity-50'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini is analyzing symptoms &amp; matching specialists...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Symptoms &amp; Recommend Specialist</span>
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div
              className={`p-5 rounded-2xl border space-y-4 transition-all ${
                highContrast
                  ? 'bg-neutral-900 border-yellow-400 text-white'
                  : 'bg-slate-50 border-violet-200'
              }`}
            >
              {/* Specialist & Urgency Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-violet-700">
                    Recommended Specialty
                  </div>
                  <div className="text-lg font-extrabold text-slate-900">
                    {result.recommendedDepartment}
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    Specialist: {result.recommendedSpecialist}
                  </div>
                </div>

                <div className="self-start sm:self-auto">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs uppercase tracking-wide border shadow-xs ${getUrgencyBadge(
                      result.urgencyLevel
                    )}`}
                  >
                    Urgency: {result.urgencyLevel}
                  </span>
                </div>
              </div>

              {/* Matched Doctor Recommendation */}
              <div className="p-4 rounded-xl bg-white border border-emerald-300 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    Recommended Doctor In-Network
                  </div>
                  <div className="text-base font-bold text-slate-900">
                    {result.matchedDoctorName}
                  </div>
                  <div className="text-xs text-slate-500">
                    30-min slot availability (Max 16 patients/day limit)
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectDoctorForBooking(result.matchedDoctorName, symptomsInput);
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all ${
                    highContrast
                      ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book with {result.matchedDoctorName}</span>
                </button>
              </div>

              {/* Clinical summary */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-1">
                  Clinical Assessment Summary
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {result.summaryDiagnosis}
                </p>
              </div>

              {/* Questions to ask Doctor */}
              {result.keyQuestionsForDoctor?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-violet-600" />
                    Recommended Questions to Ask Your Doctor
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {result.keyQuestionsForDoctor.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-bold text-violet-600">&bull;</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Immediate home care & Red flags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <div className="font-bold mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Immediate Care Advice
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-800">
                    {result.immediateCareAdvice}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900">
                  <div className="font-bold mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    Emergency Red Flags
                  </div>
                  <p className="text-[11px] leading-relaxed text-red-800">
                    {result.redFlagWarnings}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

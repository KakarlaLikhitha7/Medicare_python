import React, { useState, useEffect, useRef } from 'react';
import { Bill } from '../types';
import { api } from '../services/api';
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Receipt,
  Download,
  ShieldCheck,
  CreditCard,
  Building,
} from 'lucide-react';

interface BillingChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  highContrast: boolean;
}

interface ChatMessage {
  sender: 'user' | 'staff';
  text: string;
  time: string;
}

export const BillingChatModal: React.FC<BillingChatModalProps> = ({
  isOpen,
  onClose,
  patientName,
  highContrast,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'staff',
      text: `Hello ${patientName || 'there'}! I am Sarah from MediCare Billing & Patient Accounts. How can I assist you with your consultation charges, insurance claims, or invoices today?`,
      time: 'Just now',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [sending, setSending] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [showBillsList, setShowBillsList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      api.getBills().then(setBills).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim() || sending) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setSending(true);

    try {
      const res = await api.sendBillingMessage({
        message: text.trim(),
        chatHistory: messages.map((m) => ({ role: m.sender, content: m.text })),
        patientName,
      });

      const staffMsg: ChatMessage = {
        sender: 'staff',
        text: res.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, staffMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'staff',
          text: 'Our billing desk is available at the reception counter. We support direct cashless insurance claims with instant claim processing.',
          time: 'Just now',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl transition-all my-8 overflow-hidden flex flex-col h-[650px] max-h-[90vh] ${
          highContrast
            ? 'bg-black text-white border-yellow-400'
            : 'bg-white text-slate-800 border-slate-200'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 px-6 border-b flex items-center justify-between shrink-0 ${
            highContrast
              ? 'bg-neutral-900 border-yellow-400'
              : 'bg-gradient-to-r from-blue-800 to-indigo-900 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base">Billing &amp; Financial Desk</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-blue-100">
                Sarah &bull; Patient Accounts &amp; Insurance Claims
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBillsList(!showBillsList)}
              className="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Invoices ({bills.length})</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Itemized Bills Drawer inside Chat */}
        {showBillsList && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 max-h-48 overflow-y-auto space-y-2 text-xs">
            <div className="font-bold text-slate-700 flex items-center justify-between">
              <span>Your Hospital Bills &amp; Receipts</span>
              <button
                onClick={() => setShowBillsList(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-800">
                    {bill.id} &bull; {bill.doctorName}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Total: ₹{bill.total} &bull; Status: <span className="text-emerald-700 font-bold">{bill.status}</span>
                  </div>
                </div>
                <button
                  onClick={() => alert(`Downloaded receipt PDF for invoice ${bill.id}`)}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 flex items-center gap-1 text-[11px]"
                >
                  <Download className="w-3 h-3" />
                  <span>Receipt</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                }`}
              >
                <p>{m.text}</p>
                <div
                  className={`text-[9px] mt-1 text-right ${
                    m.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Sarah is typing billing reply...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-slate-200 bg-white flex flex-wrap gap-1.5 shrink-0">
          {[
            'How much is the specialist consultation fee?',
            'Do you accept cashless health insurance TPAs?',
            'Can I get an itemized invoice for my visit?',
            'What payment modes are accepted?',
          ].map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(prompt)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            placeholder="Type your billing or insurance question..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={sending || !inputVal.trim()}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

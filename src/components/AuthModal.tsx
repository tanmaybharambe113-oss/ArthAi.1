import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { ShieldCheck, Phone, Mail, User, Sparkles, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onSuccess }) => {
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dailyLimit, setDailyLimit] = useState('130');
  const [currency, setCurrency] = useState('₹');

  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string[]>(['', '', '', '', '', '']);
  const [otpNotification, setOtpNotification] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(45);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setError(null);
    setIsSending(true);

    setTimeout(() => {
      // Generate random 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setIsSending(false);
      setStep('otp');
      setCountdown(45);
      setOtpNotification(`💬 SMS to +91 ${phone.slice(-10)}: "Your ArthAI OTP is ${code}. Valid for 10 minutes. Do not share with anyone."`);
    }, 600);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newArr = [...otpInput];
    newArr[index] = val.slice(-1);
    setOtpInput(newArr);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const autoFillOtp = () => {
    if (!generatedOtp) return;
    const digits = generatedOtp.split('');
    setOtpInput(digits);
    setError(null);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otpInput.join('');
    if (entered.length < 6) {
      setError('Please enter all 6 digits of the OTP');
      return;
    }

    if (entered !== generatedOtp) {
      setError('Incorrect OTP. Please check the simulated SMS banner above.');
      return;
    }

    const newUser: UserProfile = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      dailyLimit: parseFloat(dailyLimit) || 130,
      currency,
      isLoggedIn: true,
      joinedAt: new Date().toISOString(),
      dateOfBirth: dateOfBirth || undefined,
      isWeeklyScheduleEnabled: false,
      daySpecificLimits: {
        0: 500, // Sunday Special
        1: parseFloat(dailyLimit) || 130,
        2: parseFloat(dailyLimit) || 130,
        3: parseFloat(dailyLimit) || 130,
        4: parseFloat(dailyLimit) || 130,
        5: parseFloat(dailyLimit) || 130,
        6: parseFloat(dailyLimit) || 130,
      },
    };

    onSuccess(newUser);
  };

  const quickFillDemo = () => {
    setName('Tanmay Bharambe');
    setEmail('tanmay@example.com');
    setPhone('9876543210');
    setDateOfBirth('2001-10-07');
    setDailyLimit('130');
    setCurrency('₹');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header / Branding */}
        <div className="relative p-6 bg-gradient-to-br from-emerald-600/30 via-slate-900 to-slate-900 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-xl">
                ₹
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">
                  ArthAI
                </h1>
                <p className="text-xs text-slate-400 font-medium">Your Own Finance Tracker</p>
              </div>
            </div>
          </div>
        </div>

        {/* Simulated SMS Alert Banner */}
        {otpNotification && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex items-start gap-3 text-xs text-emerald-200 animate-in slide-in-from-top duration-300">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-emerald-300">Simulated OTP SMS Received:</div>
              <p className="mt-0.5 text-slate-300 font-mono text-[11px] leading-relaxed">{otpNotification}</p>
              <button
                type="button"
                onClick={autoFillOtp}
                className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors text-[11px]"
              >
                <Sparkles className="w-3.5 h-3.5" /> Auto-fill {generatedOtp}
              </button>
            </div>
          </div>
        )}

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {step === 'info' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-lg font-semibold text-white">Welcome! First Time Setup</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your details to track daily, weekly, monthly &amp; yearly expenses. You will stay signed in.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Tanmay Sharma"
                    className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Phone Number <span className="text-slate-400 font-normal">(for OTP verification)</span>
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-700/80 bg-slate-800 text-xs font-semibold text-slate-400">
                    +91
                  </span>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      className="w-full bg-slate-800/80 border border-slate-700/80 rounded-r-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>🎂</span> Date of Birth (with year)
                  </span>
                  <span className="text-[10px] text-amber-400 font-normal">Spend freely on your birthday!</span>
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  On your birthday, ArthAI unlocks unlimited spending with zero limit alerts!
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Daily Expense Limit ({currency})
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={dailyLimit}
                    onChange={e => setDailyLimit(e.target.value)}
                    placeholder="e.g. 135 or any amount"
                    className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Set any custom amount (e.g. 135)</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Currency</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="₹">₹ (INR - Rupee)</option>
                    <option value="$">$ (USD - Dollar)</option>
                    <option value="€">€ (EUR - Euro)</option>
                    <option value="£">£ (GBP - Pound)</option>
                    <option value="AED">AED (Dirham)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-[0.99]"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Sending OTP...
                  </>
                ) : (
                  <>
                    Get Verification OTP <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={quickFillDemo}
                className="w-full py-2 text-center text-xs text-slate-400 hover:text-emerald-400 transition-colors"
              >
                Fill with Sample Demo Data
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-semibold text-white">Enter OTP Verification Code</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Sent to <span className="text-white font-medium">+91 {phone}</span>
                </p>
              </div>

              {/* 6 Digit OTP Input Grid */}
              <div className="flex justify-center gap-2.5 my-4">
                {otpInput.map((val, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-xl font-bold bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:bg-slate-800/90 transition-all font-mono"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>
                  {countdown > 0 ? (
                    `Resend code in ${countdown}s`
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const code = Math.floor(100000 + Math.random() * 900000).toString();
                        setGeneratedOtp(code);
                        setCountdown(45);
                        setOtpNotification(`💬 New SMS to +91 ${phone}: "Your OTP code is ${code}"`);
                      }}
                      className="text-emerald-400 hover:underline font-medium"
                    >
                      Resend OTP now
                    </button>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setStep('info')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Change details
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
              >
                <CheckCircle2 className="w-4 h-4" /> Verify &amp; Launch Tracker
              </button>

              <div className="text-center text-[11px] text-slate-500">
                You will stay logged in permanently on this device.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

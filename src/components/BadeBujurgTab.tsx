import React, { useState, useMemo } from 'react';
import { ParticleGoal, Expense, BankAccountLink } from '../types';
import {
  formatCurrency,
  calculateDailyLimitStatus,
  getSavedBankAccounts,
  saveCustomBankAccount,
} from '../utils/storage';
import {
  Sparkles,
  Heart,
  TrendingUp,
  Shield,
  Laptop,
  Target,
  Plus,
  Coins,
  CheckCircle2,
  X,
  Send,
  Building,
  CreditCard,
  Landmark,
  Volume2,
  VolumeX,
  Check,
  Link as LinkIcon,
  HelpCircle,
  Clock,
  ArrowRight,
  ArrowDownLeft,
  Wallet,
  Info,
} from 'lucide-react';

interface BadeBujurgTabProps {
  particleGoals: ParticleGoal[];
  onAddGoal: (goal: Omit<ParticleGoal, 'id' | 'createdAt'>) => void;
  onDepositToGoal: (goalId: string, amount: number) => void;
  onWithdrawFromGoal?: (goalId: string, amount: number) => void;
  onDeleteGoal: (goalId: string) => void;
  onLinkBankToGoal?: (goalId: string, bankDetails: BankAccountLink) => void;
  currency: string;
  expenses: Expense[];
  dailyLimit: number;
  userName: string;
}

const SUPPORTED_BANKS = [
  'HDFC Bank',
  'State Bank of India (SBI)',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'UPI Autopay (NPCI / BHIM)',
];

export const BadeBujurgTab: React.FC<BadeBujurgTabProps> = ({
  particleGoals,
  onAddGoal,
  onDepositToGoal,
  onWithdrawFromGoal,
  onDeleteGoal,
  onLinkBankToGoal,
  currency,
  expenses,
  dailyLimit,
  userName,
}) => {
  const [bujurgQuestion, setBujurgQuestion] = useState('');
  const [bujurgResponse, setBujurgResponse] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Saved Bank Accounts Pool
  const savedBanks = useMemo(() => getSavedBankAccounts(particleGoals), [particleGoals]);
  const [bankLinkMode, setBankLinkMode] = useState<'saved' | 'new'>('saved');
  const [selectedSavedBankIndex, setSelectedSavedBankIndex] = useState(0);

  // Particle Goal modals
  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isBankLinkOpen, setIsBankLinkOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPaymentSource, setDepositPaymentSource] = useState<'bank' | 'cash' | 'upi'>('bank');

  // Bank Link Form States
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<'Savings' | 'Current'>('Savings');
  const [ifsc, setIfsc] = useState('HDFC0001234');
  const [mandateAmount, setMandateAmount] = useState('100');
  const [isMandateActive, setIsMandateActive] = useState(true);

  // Withdraw Money States
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawDestination, setWithdrawDestination] = useState<'bank' | 'upi' | 'cash'>('bank');
  const [customWithdrawUPI, setCustomWithdrawUPI] = useState('');

  // New Goal form states
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalSaved, setGoalSaved] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalCategory, setGoalCategory] = useState('Desires & Dreams');
  const [newGoalEnableBank, setNewGoalEnableBank] = useState(false);
  const [newGoalBankChoice, setNewGoalBankChoice] = useState<'saved' | 'new'>('saved');
  const [newGoalSavedBankIndex, setNewGoalSavedBankIndex] = useState(0);
  const [newGoalBankName, setNewGoalBankName] = useState('HDFC Bank');
  const [newGoalAccountNum, setNewGoalAccountNum] = useState('');
  const [newGoalDailyMandate, setNewGoalDailyMandate] = useState('100');

  // Real-time Action / Transaction notice
  const [transactionNotice, setTransactionNotice] = useState<{
    title: string;
    message: string;
    type: 'success' | 'info';
  } | null>(null);

  const selectedGoal = particleGoals.find(g => g.id === selectedGoalId);

  // Text-to-speech for Elder's Voice
  const handleToggleSpeech = () => {
    if (!bujurgResponse) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(bujurgResponse.replace(/[*#_]/g, ''));
      utterance.rate = 0.95;
      utterance.pitch = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  // Ask Bade Bujurg
  const handleAskBujurg = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const query = customQ || bujurgQuestion;
    if (!query.trim() || isAsking) return;

    setIsAsking(true);
    setBujurgResponse(null);
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    const status = calculateDailyLimitStatus(expenses, dailyLimit);

    try {
      const res = await fetch('/api/bade-bujurg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          context: {
            userName,
            dailyLimit,
            todaySpent: status.todayTotal,
            isOverLimit: status.isOverLimit,
            percentage: status.percentage,
            activeGoalsCount: particleGoals.length,
          },
        }),
      });
      const data = await res.json();
      setBujurgResponse(data.advice);
    } catch {
      setBujurgResponse(
        `Jeete raho ${userName || 'Beta'}! Bade Bujurg ka aashirwaad hamesha tumhare saath hai.\n\nPurani kahavat yaad rakhna: "Jitni lambi chaadar ho, utne hi paanv phailaane chahiye."\n\n1. Pehle 20% bachao, baaki 80% me ghar chalao.\n2. Kam se kam 6 mahine ka Emergency fund rakho.\n3. Jis cheez ko tum do baar cash me nahi kharid sakte, usko EMI par mat lena!`
      );
    } finally {
      setIsAsking(false);
    }
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(goalTarget);
    if (!goalTitle.trim() || isNaN(targetVal) || targetVal <= 0) return;

    let linkedBank: BankAccountLink | undefined = undefined;
    if (newGoalEnableBank) {
      if (newGoalBankChoice === 'saved' && savedBanks.length > 0) {
        linkedBank = savedBanks[newGoalSavedBankIndex] || savedBanks[0];
      } else if (newGoalAccountNum.trim()) {
        const masked = `•••• ${newGoalAccountNum.trim().slice(-4) || '1234'}`;
        linkedBank = {
          bankName: newGoalBankName,
          accountNumberMasked: masked,
          accountType: 'Savings',
          mandateDailyAmount: parseFloat(newGoalDailyMandate) || 100,
          isMandateActive: true,
          linkedAt: new Date().toISOString(),
        };
        saveCustomBankAccount(linkedBank);
      }
    }

    onAddGoal({
      title: goalTitle.trim(),
      targetAmount: targetVal,
      currentSaved: parseFloat(goalSaved) || 0,
      deadline: goalDeadline || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      category: goalCategory,
      icon: 'Target',
      color: '#10b981',
      linkedBank,
    });

    setTransactionNotice({
      title: 'Particle Goal Created!',
      message: `Created "${goalTitle.trim()}"${
        linkedBank ? ` linked with ${linkedBank.bankName} (${linkedBank.accountNumberMasked})` : ''
      }. You can deposit or withdraw money anytime.`,
      type: 'success',
    });

    setGoalTitle('');
    setGoalTarget('');
    setGoalSaved('');
    setGoalDeadline('');
    setNewGoalEnableBank(false);
    setNewGoalAccountNum('');
    setIsNewGoalOpen(false);
  };

  const handleConfirmWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const withVal = parseFloat(withdrawAmount);
    if (isNaN(withVal) || withVal <= 0) {
      setWithdrawError('Please enter a valid withdrawal amount');
      return;
    }
    if (withVal > selectedGoal.currentSaved) {
      setWithdrawError(
        `Cannot withdraw more than saved balance (${formatCurrency(selectedGoal.currentSaved, currency)})`
      );
      return;
    }

    if (onWithdrawFromGoal) {
      onWithdrawFromGoal(selectedGoal.id, withVal);
    }

    const destName = selectedGoal.linkedBank
      ? `${selectedGoal.linkedBank.bankName} (${selectedGoal.linkedBank.accountNumberMasked})`
      : withdrawDestination === 'upi'
      ? customWithdrawUPI.trim() || 'UPI ID'
      : withdrawDestination === 'cash'
      ? 'Cash Piggy Bank'
      : savedBanks[0]?.bankName || 'Verified Bank Account';

    setTransactionNotice({
      title: 'Withdrawal Successful! 💸',
      message: `Transferred ${formatCurrency(withVal, currency)} from "${selectedGoal.title}" to ${destName}. Balance updated instantly.`,
      type: 'success',
    });

    setWithdrawAmount('');
    setWithdrawError(null);
    setIsWithdrawOpen(false);
  };

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const depVal = parseFloat(depositAmount);
    if (selectedGoal && !isNaN(depVal) && depVal > 0) {
      onDepositToGoal(selectedGoal.id, depVal);

      const sourceName = selectedGoal.linkedBank
        ? `${selectedGoal.linkedBank.bankName} (${selectedGoal.linkedBank.accountNumberMasked})`
        : depositPaymentSource === 'upi'
        ? 'UPI Transfer'
        : depositPaymentSource === 'cash'
        ? 'Cash Piggy Bank'
        : 'Bank Account';

      setTransactionNotice({
        title: 'Money Added Successfully! 🪙',
        message: `Deposited ${formatCurrency(depVal, currency)} into "${selectedGoal.title}" via ${sourceName}.`,
        type: 'success',
      });

      setDepositAmount('');
      setIsDepositOpen(false);
    }
  };

  const handleSaveBankLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId) return;

    let bankDetails: BankAccountLink;
    if (bankLinkMode === 'saved' && savedBanks.length > 0) {
      bankDetails = savedBanks[selectedSavedBankIndex] || savedBanks[0];
    } else {
      if (!accountNumber.trim()) return;
      const masked = `•••• ${accountNumber.trim().slice(-4) || '1234'}`;
      bankDetails = {
        bankName: selectedBank,
        accountNumberMasked: masked,
        accountType,
        ifscCode: ifsc.trim() || undefined,
        mandateDailyAmount: parseFloat(mandateAmount) || 100,
        isMandateActive,
        linkedAt: new Date().toISOString(),
      };
      saveCustomBankAccount(bankDetails);
    }

    if (onLinkBankToGoal) {
      onLinkBankToGoal(selectedGoalId, bankDetails);
    }

    setTransactionNotice({
      title: 'Bank Account Linked! 🏦',
      message: `Connected ${bankDetails.bankName} (${bankDetails.accountNumberMasked}) to "${selectedGoal?.title || 'goal'}".`,
      type: 'success',
    });

    setIsBankLinkOpen(false);
  };

  const calculateDailyRequired = (goal: ParticleGoal) => {
    const remaining = Math.max(goal.targetAmount - goal.currentSaved, 0);
    if (remaining === 0) return 0;
    const today = new Date();
    const deadline = new Date(goal.deadline);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
    return Math.ceil(remaining / diffDays);
  };

  return (
    <div className="space-y-8">
      {/* Real-time Feedback Notice */}
      {transactionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">{transactionNotice.title}</p>
              <p className="text-slate-300 text-xs mt-0.5">{transactionNotice.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTransactionNotice(null)}
            className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bade Bujurg Banner & Persona */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-900 border border-amber-500/30 p-6 md:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/25 shrink-0">
              👴🏽
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Timeless Wealth Mentor
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                  बड़े बुज़ुर्ग
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">
                Bade Bujurg: Words of Wisdom &amp; Guidance
              </h2>
              <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                &ldquo;Ayushmaan bhava {userName || 'beta'}! Modern apps track numbers, but ancient wisdom builds real generational wealth.
                A single drop saved daily fills an entire lake.&rdquo;
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleAskBujurg(undefined, 'Bade Bujurg, please bless me and give me your top 3 golden money rules for my financial future.')}
            disabled={isAsking}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs md:text-sm shadow-lg shadow-amber-500/25 flex items-center gap-2 shrink-0 transition-transform active:scale-95"
          >
            <Sparkles className="w-4 h-4" /> Seek Aashirwaad (Blessing)
          </button>
        </div>

        {/* 5 Anmol Niyam (5 Priceless Principles) */}
        <div className="mt-8 pt-6 border-t border-amber-500/20">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3 flex items-center gap-2">
            <span>📜</span> 5 Golden Principles of True Wealth (बड़े बुज़ुर्ग के अनमोल नियम)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              {
                title: '1. Chaadar & Paanv',
                desc: 'Never spend money you haven’t earned yet. Avoid buy-now-pay-later rules.',
                icon: '📏',
              },
              {
                title: '2. Pehle Bachat',
                desc: 'When income arrives, save 20% first. Live comfortably on what remains.',
                icon: '💰',
              },
              {
                title: '3. Aapatkaalin Kosh',
                desc: 'Keep 6 months of living expenses in an emergency fund before stock market bets.',
                icon: '🛡️',
              },
              {
                title: '4. Chakravriddhi (SIP)',
                desc: 'Compounding works like a banyan tree. Invest steadily every month in solid index funds.',
                icon: '🌳',
              },
              {
                title: '5. Particle Savings',
                desc: 'Break every dream into tiny daily particles. No loans needed for gadgets.',
                icon: '✨',
              },
            ].map((rule, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{rule.icon}</span>
                    <h4 className="text-xs font-bold text-white">{rule.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Dialogue Box */}
        <div className="mt-6 pt-6 border-t border-amber-500/20">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2 flex items-center gap-2">
            <span>💬</span> Poocho Bade Bujurg Se (Ask for Counsel)
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Contemplating a big purchase, iPhone on EMI, credit card dilemma, or investment doubt? Ask the elder:
          </p>

          {/* Quick Consultation Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
            {[
              '📱 Should I buy an iPhone on No-Cost EMI?',
              '🪙 Is Gold SIP better than Stock Market?',
              '🛡️ How big should my Emergency Fund be?',
              '🛑 72-Hour rule before buying clothes/gadgets',
              '☕ How small ₹50 daily spends secretly drain wealth',
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setBujurgQuestion(chip);
                  handleAskBujurg(undefined, chip);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/80 shrink-0 text-[11px] transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          <form onSubmit={e => handleAskBujurg(e)} className="flex items-center gap-2 mt-2">
            <input
              type="text"
              placeholder="e.g. 'Bujurg ji, I want to buy a ₹1,20,000 laptop on EMI, is it wise?'"
              value={bujurgQuestion}
              onChange={e => setBujurgQuestion(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={isAsking || !bujurgQuestion.trim()}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs md:text-sm shadow-md transition-colors flex items-center gap-1.5 shrink-0"
            >
              {isAsking ? 'Thinking...' : 'Poocho'} <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Bujurg Response with Top-Right Close Button ('X') to easily cut it down! */}
          {bujurgResponse && (
            <div className="relative mt-4 p-5 rounded-2xl bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-500/40 text-amber-200 text-sm animate-in fade-in duration-300 shadow-xl">
              {/* TOP RIGHT CLOSE BUTTON TO CUT IT DOWN */}
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                  }
                  setBujurgResponse(null);
                }}
                title="Cut / Dismiss blessing & continue"
                className="absolute top-3 right-3 p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pr-8 mb-2">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                  <span>👴🏽 Bade Bujurg ka Aashirwaad &amp; Vachan:</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSpeech}
                  title={isSpeaking ? 'Stop speech' : 'Listen to Elder voice'}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isSpeaking ? 'Mute' : 'Listen'}</span>
                </button>
              </div>

              <div className="whitespace-pre-wrap leading-relaxed text-xs md:text-sm text-slate-200 pr-6">
                {bujurgResponse}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PARTICLE FEATURE: Goal-Based Savings Engine */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                ✨
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                &ldquo;Particle&rdquo; — Goal-Based Savings Engine
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Desires &amp; Goals
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Save money for your particular desires without taking loans. Link bank accounts to auto-debit daily particles!
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsNewGoalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" /> Add Particle Goal
          </button>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {particleGoals.map(goal => {
            const percent = Math.min(Math.round((goal.currentSaved / (goal.targetAmount || 1)) * 100), 100);
            const remaining = Math.max(goal.targetAmount - goal.currentSaved, 0);
            const dailyReq = calculateDailyRequired(goal);
            const isCompleted = goal.currentSaved >= goal.targetAmount;

            return (
              <div
                key={goal.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shadow-sm">
                        {goal.category.includes('Safety') ? (
                          <Shield className="w-5 h-5 text-emerald-400" />
                        ) : goal.category.includes('Family') ? (
                          <Heart className="w-5 h-5 text-rose-400" />
                        ) : (
                          <Laptop className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">
                          {goal.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                          {goal.category}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteGoal(goal.id)}
                      title="Remove goal"
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Bank Link Status Badge */}
                  <div className="mt-3">
                    {goal.linkedBank ? (
                      <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-indigo-300 font-semibold truncate">
                          <Building className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">{goal.linkedBank.bankName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({goal.linkedBank.accountNumberMasked})</span>
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                            {formatCurrency(goal.linkedBank.mandateDailyAmount || 100, currency)}/day
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGoalId(goal.id);
                              setIsBankLinkOpen(true);
                            }}
                            title="Manage Bank Connection"
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          >
                            <LinkIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGoalId(goal.id);
                          setIsBankLinkOpen(true);
                        }}
                        className="w-full p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-indigo-500/40 text-slate-400 hover:text-indigo-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Building className="w-3.5 h-3.5 text-indigo-400" /> Link Bank Account for Auto-Debit &amp; Withdrawals
                      </button>
                    )}
                  </div>

                  {/* Amounts & Progress */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <div className="text-xl font-black text-white font-mono">
                        {formatCurrency(goal.currentSaved, currency)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Target: {formatCurrency(goal.targetAmount, currency)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-sm font-bold font-mono ${
                          isCompleted ? 'text-emerald-400' : 'text-slate-300'
                        }`}
                      >
                        {percent}%
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {isCompleted ? 'Achieved! 🎉' : `Needs ${formatCurrency(remaining, currency)}`}
                      </div>
                    </div>
                  </div>

                  {/* Progress Ring / Bar */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-2.5 border border-slate-700/60 p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-300 shadow-sm shadow-emerald-400/50'
                          : 'bg-gradient-to-r from-teal-500 to-emerald-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Daily Saving Tip from Bade Bujurg */}
                  {!isCompleted && dailyReq > 0 && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        Daily discipline:
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        Save {formatCurrency(dailyReq, currency)}/day
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Action: Deposit Money & Withdraw Money */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">Target: {goal.deadline}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGoalId(goal.id);
                        setDepositAmount('');
                        setIsDepositOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Deposit money into this particle goal"
                    >
                      <Coins className="w-3.5 h-3.5" /> Add Money
                    </button>
                    {goal.currentSaved > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGoalId(goal.id);
                          setWithdrawAmount('');
                          setWithdrawError(null);
                          setIsWithdrawOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                        title="Withdraw money anytime back to your bank account"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" /> Withdraw
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800/40 text-slate-600 border border-slate-800/60 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed opacity-50"
                        title="Add money first to enable withdrawals"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" /> Withdraw
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Link Bank Account for Particle Goal */}
      {isBankLinkOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-400" />
                Link Bank Account to &quot;{selectedGoal.title}&quot;
              </h3>
              <button
                type="button"
                onClick={() => setIsBankLinkOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {savedBanks.length > 0 && (
              <div className="flex rounded-xl bg-slate-800 p-1 mb-4 text-xs">
                <button
                  type="button"
                  onClick={() => setBankLinkMode('saved')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                    bankLinkMode === 'saved'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Choose Saved Bank ({savedBanks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBankLinkMode('new')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                    bankLinkMode === 'new'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Link New Bank
                </button>
              </div>
            )}

            <form onSubmit={handleSaveBankLink} className="space-y-4">
              {bankLinkMode === 'saved' && savedBanks.length > 0 ? (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Select a verified bank account:
                  </label>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {savedBanks.map((b, idx) => (
                      <label
                        key={idx}
                        className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          selectedSavedBankIndex === idx
                            ? 'bg-indigo-500/15 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="savedBankLinkRadio"
                            checked={selectedSavedBankIndex === idx}
                            onChange={() => setSelectedSavedBankIndex(idx)}
                            className="text-indigo-500"
                          />
                          <div>
                            <div className="font-bold text-xs flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-indigo-400" />
                              {b.bankName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {b.accountNumberMasked} • {b.accountType}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                          {formatCurrency(b.mandateDailyAmount || 100, currency)}/day
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Select Bank</label>
                    <select
                      value={selectedBank}
                      onChange={e => setSelectedBank(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {SUPPORTED_BANKS.map(b => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Bank Account Number / UPI ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 501004819283 or yourname@okhdfcbank"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Account Type</label>
                      <select
                        value={accountType}
                        onChange={e => setAccountType(e.target.value as any)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Savings">Savings Account</option>
                        <option value="Current">Current Account</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        placeholder="HDFC0001234"
                        value={ifsc}
                        onChange={e => setIfsc(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-white">Daily Auto-Deposit Mandate</span>
                        <p className="text-[10px] text-slate-400">Automate recurring daily particle transfer</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isMandateActive}
                        onChange={e => setIsMandateActive(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-500"
                      />
                    </div>

                    {isMandateActive && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-slate-400">Mandate: {currency}</span>
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={mandateAmount}
                          onChange={e => setMandateAmount(e.target.value)}
                          placeholder="100"
                          className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                        />
                        <span className="text-[10px] text-slate-400">per day</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-indigo-500/20"
              >
                {bankLinkMode === 'saved' && savedBanks.length > 0
                  ? `Link ${savedBanks[selectedSavedBankIndex]?.bankName || 'Bank'} to Goal`
                  : 'Confirm & Link Bank Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Money / Deposit Particle into Goal */}
      {isDepositOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-400" />
                Add Money to &quot;{selectedGoal.title}&quot;
              </h3>
              <button
                type="button"
                onClick={() => setIsDepositOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Deposit Source
                </label>
                {selectedGoal.linkedBank ? (
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-indigo-300 font-semibold">
                      <Building className="w-4 h-4" />
                      {selectedGoal.linkedBank.bankName} ({selectedGoal.linkedBank.accountNumberMasked})
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">Verified Bank</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <select
                      value={depositPaymentSource}
                      onChange={e => setDepositPaymentSource(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="bank">Net Banking / Direct Bank</option>
                      <option value="upi">UPI Transfer</option>
                      <option value="cash">Cash Piggy Bank</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Amount to Add ({currency})
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  autoFocus
                  placeholder={`e.g. ${calculateDailyRequired(selectedGoal) || 100}`}
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  calculateDailyRequired(selectedGoal) || 50,
                  100,
                  500,
                  1000,
                  2000,
                ].map((val, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDepositAmount(val.toString())}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                  >
                    +{formatCurrency(val, currency)}
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 text-[11px] text-slate-400">
                New balance after deposit:{' '}
                <strong className="text-emerald-400 font-mono">
                  {formatCurrency(
                    selectedGoal.currentSaved + (parseFloat(depositAmount) || 0),
                    currency
                  )}
                </strong>{' '}
                of {formatCurrency(selectedGoal.targetAmount, currency)}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20"
              >
                Confirm Deposit of {formatCurrency(parseFloat(depositAmount) || 0, currency)}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Withdraw Money from Particle Goal */}
      {isWithdrawOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Withdraw Money</h3>
                  <p className="text-[11px] text-slate-400">From &quot;{selectedGoal.title}&quot;</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsWithdrawOpen(false);
                  setWithdrawError(null);
                  setWithdrawAmount('');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmWithdraw} className="space-y-4">
              {withdrawError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {/* Available Saved Balance Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900 border border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Available in Goal
                  </span>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {formatCurrency(selectedGoal.currentSaved, currency)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
                    Instant Payout
                  </span>
                </div>
              </div>

              {/* Destination Account Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Transfer Payout Destination
                </label>
                {selectedGoal.linkedBank ? (
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-indigo-300 font-bold">
                        <Building className="w-4 h-4 text-indigo-400" />
                        {selectedGoal.linkedBank.bankName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        Linked Bank
                      </span>
                    </div>
                    <div className="text-slate-300 font-mono text-[11px] flex items-center justify-between">
                      <span>Account: {selectedGoal.linkedBank.accountNumberMasked}</span>
                      <span className="text-slate-400">{selectedGoal.linkedBank.accountType}</span>
                    </div>
                    <p className="text-[10px] text-indigo-300/80 pt-0.5">
                      ✓ Instant NEFT/IMPS transfer directly back to your verified bank account
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={withdrawDestination}
                      onChange={e => setWithdrawDestination(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {savedBanks.length > 0 && (
                        <option value="bank">
                          Transfer to {savedBanks[0].bankName} ({savedBanks[0].accountNumberMasked})
                        </option>
                      )}
                      <option value="upi">Instant UPI Refund</option>
                      <option value="cash">Cash Piggy Bank Refund</option>
                    </select>

                    {withdrawDestination === 'upi' && (
                      <input
                        type="text"
                        placeholder="Enter your UPI ID (e.g. name@okhdfcbank)"
                        value={customWithdrawUPI}
                        onChange={e => setCustomWithdrawUPI(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Amount to Withdraw */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Amount to Withdraw ({currency})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawAmount(selectedGoal.currentSaved.toString());
                      setWithdrawError(null);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline"
                  >
                    Withdraw All ({formatCurrency(selectedGoal.currentSaved, currency)})
                  </button>
                </div>
                <input
                  type="number"
                  min="1"
                  max={selectedGoal.currentSaved}
                  step="any"
                  required
                  autoFocus
                  placeholder={`e.g. ${Math.min(500, selectedGoal.currentSaved)}`}
                  value={withdrawAmount}
                  onChange={e => {
                    setWithdrawAmount(e.target.value);
                    setWithdrawError(null);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Quick Percentage Chips */}
              <div className="grid grid-cols-4 gap-1.5">
                {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                  const val = Math.floor(selectedGoal.currentSaved * frac);
                  const label = frac === 1.0 ? '100% (All)' : `${frac * 100}%`;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={val <= 0}
                      onClick={() => {
                        setWithdrawAmount(val.toString());
                        setWithdrawError(null);
                      }}
                      className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-mono text-center transition-colors"
                    >
                      <span className="block font-bold">{label}</span>
                      <span className="text-[10px] text-slate-400">
                        {formatCurrency(val, currency)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Calculation Preview */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Saved:</span>
                  <span className="font-mono">{formatCurrency(selectedGoal.currentSaved, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-amber-300 font-semibold">
                  <span>Withdrawing:</span>
                  <span className="font-mono">
                    -{formatCurrency(parseFloat(withdrawAmount) || 0, currency)}
                  </span>
                </div>
                <div className="border-t border-slate-700/60 pt-1 flex items-center justify-between font-bold">
                  <span className="text-slate-400">Remaining Balance:</span>
                  <span className="font-mono text-emerald-400">
                    {formatCurrency(
                      Math.max(0, selectedGoal.currentSaved - (parseFloat(withdrawAmount) || 0)),
                      currency
                    )}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  !withdrawAmount ||
                  (parseFloat(withdrawAmount) || 0) <= 0 ||
                  (parseFloat(withdrawAmount) || 0) > selectedGoal.currentSaved
                }
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <ArrowDownLeft className="w-4 h-4" />
                Confirm Withdrawal of {formatCurrency(parseFloat(withdrawAmount) || 0, currency)}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Goal Modal */}
      {isNewGoalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Add New Particle Goal
              </h3>
              <button
                type="button"
                onClick={() => setIsNewGoalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Desire / Goal Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MacBook Pro, Emergency Fund, Ladakh Trip"
                  value={goalTitle}
                  onChange={e => setGoalTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Amount ({currency})
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="50000"
                    value={goalTarget}
                    onChange={e => setGoalTarget(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Already Saved ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={goalSaved}
                    onChange={e => setGoalSaved(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={goalCategory}
                    onChange={e => setGoalCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Desires & Dreams">Desires &amp; Gadgets</option>
                    <option value="Suraksha (Safety)">Emergency Fund</option>
                    <option value="Family Blessings">Family &amp; Parents</option>
                    <option value="Investments">Gold &amp; Real Wealth</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Date</label>
                  <input
                    type="date"
                    required
                    value={goalDeadline}
                    onChange={e => setGoalDeadline(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Bank Account Connection for Particle Goal */}
              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="text-xs font-semibold text-white">Connect Bank Account</span>
                      <p className="text-[10px] text-slate-400">For daily auto-deposit and instant withdrawals</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newGoalEnableBank}
                    onChange={e => setNewGoalEnableBank(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-500 cursor-pointer"
                  />
                </div>

                {newGoalEnableBank && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-3">
                    {savedBanks.length > 0 && (
                      <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
                        <button
                          type="button"
                          onClick={() => setNewGoalBankChoice('saved')}
                          className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                            newGoalBankChoice === 'saved'
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Use Saved Bank ({savedBanks.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewGoalBankChoice('new')}
                          className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                            newGoalBankChoice === 'new'
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Link New Bank
                        </button>
                      </div>
                    )}

                    {newGoalBankChoice === 'saved' && savedBanks.length > 0 ? (
                      <div className="space-y-2">
                        <label className="block text-[11px] text-slate-300 font-medium">
                          Select from your saved bank accounts:
                        </label>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {savedBanks.map((b, idx) => (
                            <label
                              key={idx}
                              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                newGoalSavedBankIndex === idx
                                  ? 'bg-indigo-500/15 border-indigo-500 text-white shadow-sm'
                                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="savedBankPick"
                                  checked={newGoalSavedBankIndex === idx}
                                  onChange={() => setNewGoalSavedBankIndex(idx)}
                                  className="text-indigo-500"
                                />
                                <div>
                                  <span className="font-semibold text-xs block">{b.bankName}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {b.accountNumberMasked} • {b.accountType}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                                {formatCurrency(b.mandateDailyAmount || 100, currency)}/day
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">Select Bank</label>
                          <select
                            value={newGoalBankName}
                            onChange={e => setNewGoalBankName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                          >
                            {SUPPORTED_BANKS.map(b => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            Account Number / UPI ID
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 501004819283 or yourname@okhdfc"
                            value={newGoalAccountNum}
                            onChange={e => setNewGoalAccountNum(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            Daily Auto-Deposit Mandate ({currency})
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={newGoalDailyMandate}
                            onChange={e => setNewGoalDailyMandate(e.target.value)}
                            placeholder="100"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20"
              >
                Create Particle Goal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

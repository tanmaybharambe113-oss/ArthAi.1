/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  Expense,
  ParticleGoal,
  RecurringExpense,
  TimeHorizon,
  BankAccountLink,
} from './types';
import {
  loadUserProfile,
  saveUserProfile,
  loadExpenses,
  saveExpenses,
  loadParticleGoals,
  saveParticleGoals,
  loadRecurringExpenses,
  saveRecurringExpenses,
  formatCurrency,
  calculateDailyLimitStatus,
  getTodayString,
} from './utils/storage';
import { AuthModal } from './components/AuthModal';
import { DailyLimitCard } from './components/DailyLimitCard';
import { AddExpenseModal } from './components/AddExpenseModal';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { RecurringExpensesTab } from './components/RecurringExpensesTab';
import { RecordedHistoryTab } from './components/RecordedHistoryTab';
import { MoneyAITab } from './components/MoneyAITab';
import { BadeBujurgTab } from './components/BadeBujurgTab';
import { ExpenseList } from './components/ExpenseList';
import { ExportCodeModal } from './components/ExportCodeModal';
import { CSVManagerModal } from './components/CSVManagerModal';
import { AIHealthAuditModal } from './components/AIHealthAuditModal';
import {
  LayoutDashboard,
  History,
  PieChart,
  Bot,
  Repeat,
  LogOut,
  Plus,
  Code,
  ShieldCheck,
  Bell,
  ChevronDown,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Gift,
  Calendar,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile>(loadUserProfile());
  const [expenses, setExpenses] = useState<Expense[]>(loadExpenses());
  const [particleGoals, setParticleGoals] = useState<ParticleGoal[]>(loadParticleGoals());
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(loadRecurringExpenses());

  // UI Navigation states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'analytics' | 'recurring' | 'money-ai' | 'bade-bujurg'>('dashboard');
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('daily');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isCSVManagerOpen, setIsCSVManagerOpen] = useState(false);
  const [isAIHealthAuditOpen, setIsAIHealthAuditOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    saveUserProfile(user);
  }, [user]);

  useEffect(() => {
    saveExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    saveParticleGoals(particleGoals);
  }, [particleGoals]);

  useEffect(() => {
    saveRecurringExpenses(recurringExpenses);
  }, [recurringExpenses]);

  // Auth handler
  const handleAuthSuccess = (newUser: UserProfile) => {
    setUser(newUser);
  };

  const handleLogout = () => {
    const updated: UserProfile = { ...user, isLoggedIn: false };
    setUser(updated);
    setIsProfileMenuOpen(false);
  };

  // Limit change - allows any custom amount without restrictions
  const handleUpdateLimit = (newLimit: number) => {
    setUser(prev => ({ ...prev, dailyLimit: newLimit }));
  };

  // Update schedule for days of week
  const handleUpdateSchedule = (dayLimits: Record<number, number>, isWeeklyEnabled: boolean) => {
    setUser(prev => ({
      ...prev,
      daySpecificLimits: dayLimits,
      isWeeklyScheduleEnabled: isWeeklyEnabled,
    }));
  };

  // Update birthday with year
  const handleUpdateBirthday = (birthday: string) => {
    setUser(prev => ({
      ...prev,
      dateOfBirth: birthday,
    }));
  };

  // Expense CRUD
  const handleSaveExpense = (expenseData: Omit<Expense, 'id'>, editId?: string) => {
    if (editId) {
      setExpenses(prev =>
        prev.map(e => (e.id === editId ? { ...expenseData, id: editId } : e))
      );
    } else {
      const newEntry: Expense = {
        ...expenseData,
        id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        isReconciled: false,
      };
      setExpenses(prev => [newEntry, ...prev]);
    }
    setExpenseToEdit(null);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleEditExpense = (exp: Expense) => {
    setExpenseToEdit(exp);
    setIsAddExpenseOpen(true);
  };

  const handleImportExpenses = (newExpenses: Expense[]) => {
    setExpenses(prev => [...newExpenses, ...prev]);
  };

  // Tally Reconciliation Handlers
  const handleToggleReconciled = (id: string) => {
    setExpenses(prev =>
      prev.map(e => (e.id === id ? { ...e, isReconciled: !e.isReconciled } : e))
    );
  };

  const handleBatchReconcile = (ids: string[], isReconciled: boolean) => {
    const idSet = new Set(ids);
    setExpenses(prev =>
      prev.map(e => (idSet.has(e.id) ? { ...e, isReconciled } : e))
    );
  };

  // Particle Goal CRUD
  const handleAddParticleGoal = (goalData: Omit<ParticleGoal, 'id' | 'createdAt'>) => {
    const newGoal: ParticleGoal = {
      ...goalData,
      id: `part-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setParticleGoals(prev => [...prev, newGoal]);
  };

  const handleDepositToGoal = (goalId: string, amount: number) => {
    setParticleGoals(prev =>
      prev.map(g =>
        g.id === goalId ? { ...g, currentSaved: g.currentSaved + amount } : g
      )
    );
  };

  const handleWithdrawFromGoal = (goalId: string, amount: number) => {
    setParticleGoals(prev =>
      prev.map(g =>
        g.id === goalId
          ? { ...g, currentSaved: Math.max(0, g.currentSaved - amount) }
          : g
      )
    );
  };

  const handleDeleteGoal = (goalId: string) => {
    setParticleGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const handleLinkBankToGoal = (goalId: string, bankDetails: BankAccountLink) => {
    setParticleGoals(prev =>
      prev.map(g => (g.id === goalId ? { ...g, linkedBank: bankDetails } : g))
    );
  };

  // Recurring Expenses CRUD
  const handleAddRecurring = (item: Omit<RecurringExpense, 'id'>) => {
    const newRec: RecurringExpense = {
      ...item,
      id: `rec-${Date.now()}`,
    };
    setRecurringExpenses(prev => [...prev, newRec]);
  };

  const handleToggleRecurringActive = (id: string) => {
    setRecurringExpenses(prev =>
      prev.map(r => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const handleDeleteRecurring = (id: string) => {
    setRecurringExpenses(prev => prev.filter(r => r.id !== id));
  };

  const handleLogRecurringNow = (item: RecurringExpense) => {
    const now = new Date();
    const newExpense: Expense = {
      id: `exp-rec-${Date.now()}`,
      amount: item.amount,
      category: item.category,
      description: `${item.title} (Recurring Bill)`,
      date: getTodayString(),
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      paymentMode: item.paymentMode,
      notes: `Logged from recurring bill on ${getTodayString()}`,
      isReconciled: false,
    };
    setExpenses(prev => [newExpense, ...prev]);
    setActiveTab('dashboard');
  };

  // Calculation for notification bell & pending tally count
  const dailyStatus = calculateDailyLimitStatus(expenses, user);
  const pendingTallyCount = expenses.filter(e => !e.isReconciled).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* First-time login / OTP modal (opens when not logged in) */}
      <AuthModal isOpen={!user.isLoggedIn} onSuccess={handleAuthSuccess} />

      {/* Add / Edit Expense Modal (with AI NLP Quick-Fill) */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setExpenseToEdit(null);
        }}
        onSave={handleSaveExpense}
        expenseToEdit={expenseToEdit}
        currency={user.currency}
      />

      {/* Python & GitHub Code Export Modal */}
      <ExportCodeModal isOpen={isCodeModalOpen} onClose={() => setIsCodeModalOpen(false)} />

      {/* CSV Ledger Manager Modal */}
      <CSVManagerModal
        isOpen={isCSVManagerOpen}
        onClose={() => setIsCSVManagerOpen(false)}
        expenses={expenses}
        onImportExpenses={handleImportExpenses}
        currency={user.currency}
      />

      {/* AI Financial Health Audit Modal */}
      <AIHealthAuditModal
        isOpen={isAIHealthAuditOpen}
        onClose={() => setIsAIHealthAuditOpen(false)}
        expenses={expenses}
        dailyLimit={user.dailyLimit}
        currency={user.currency}
        particleGoals={particleGoals}
        recurringExpenses={recurringExpenses}
      />

      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Clean Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/20">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white tracking-tight">
                  ArthAI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Your Own Finance Tracker
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop) */}
          <nav className="hidden lg:flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500 text-slate-950 shadow font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'history'
                  ? 'bg-emerald-500 text-slate-950 shadow font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" /> History &amp; Tally
              {pendingTallyCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                  {pendingTallyCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500 text-slate-950 shadow font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" /> Analytics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recurring')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'recurring'
                  ? 'bg-indigo-500 text-white shadow font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" /> Recurring
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('money-ai')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'money-ai'
                  ? 'bg-cyan-500 text-slate-950 shadow font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> Money AI
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bade-bujurg')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'bade-bujurg'
                  ? 'bg-amber-500 text-slate-950 shadow font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>👴🏽</span> Bade Bujurg
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* AI Health Audit button */}
            <button
              type="button"
              onClick={() => setIsAIHealthAuditOpen(true)}
              className="px-2.5 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/25 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Run Gemini AI Financial Health Audit"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">AI Audit</span>
            </button>

            {/* CSV Manager */}
            <button
              type="button"
              onClick={() => setIsCSVManagerOpen(true)}
              className="px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="CSV Export & Import"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">CSV</span>
            </button>

            {/* Quick Add Expense button */}
            <button
              type="button"
              onClick={() => {
                setExpenseToEdit(null);
                setIsAddExpenseOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-transform active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Expense</span>
            </button>

            {/* Python / GitHub Code Export Button */}
            <button
              type="button"
              onClick={() => setIsCodeModalOpen(true)}
              title="View Python backend code and GitHub deployment guide"
              className="px-2 py-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Code className="w-4 h-4" />
            </button>

            {/* User Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-semibold text-slate-200 hidden sm:inline max-w-[80px] truncate">
                  {user.name || 'User'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in space-y-2">
                  <div className="pb-2.5 border-b border-slate-800">
                    <div className="font-bold text-white text-xs truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">+91 {user.phone}</div>
                  </div>

                  {/* Birthday field in Profile */}
                  <div className="p-2.5 rounded-xl bg-slate-800/50 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span className="flex items-center gap-1">
                        <Gift className="w-3 h-3 text-amber-400" /> Birthday (with Year)
                      </span>
                    </div>
                    <input
                      type="date"
                      value={user.dateOfBirth || ''}
                      onChange={e => handleUpdateBirthday(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Daily limit unrestricted editor */}
                  <div className="p-2.5 rounded-xl bg-slate-800/50 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>Daily Limit</span>
                      <span className="text-emerald-400 font-semibold">Any Amount</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-mono">{user.currency}</span>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        placeholder="e.g. 135"
                        defaultValue={user.dailyLimit}
                        onBlur={e => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            handleUpdateLimit(val);
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const val = parseFloat((e.target as HTMLInputElement).value);
                            if (!isNaN(val) && val > 0) {
                              handleUpdateLimit(val);
                            }
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out / Switch User
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex items-center justify-around bg-slate-900/90 border-t border-slate-800/80 px-2 py-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 ${
              activeTab === 'dashboard' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Home
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 ${
              activeTab === 'history' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Tally
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 ${
              activeTab === 'analytics' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" /> Stats
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recurring')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 ${
              activeTab === 'recurring' ? 'bg-indigo-500 text-white font-bold' : 'text-slate-400'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" /> Recurring
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('money-ai')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 ${
              activeTab === 'money-ai' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> AI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bade-bujurg')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 ${
              activeTab === 'bade-bujurg' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            <span>👴🏽</span> Bujurg
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Dynamic Birthday Greeting Strip */}
        {dailyStatus.isBirthday && (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-xl animate-in slide-in-from-top">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-bounce">🎂</span>
              <div>
                <span className="text-sm font-bold text-white block">
                  Happy Birthday, {user.name || 'Friend'}!
                </span>
                <span className="text-amber-300">
                  It&apos;s your day! Enjoy unrestricted spending without any daily limit alerts or penalties.
                </span>
              </div>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black">
              Unlimited Mode
            </span>
          </div>
        )}

        {/* Dynamic Alert Strip if over daily limit (Only if not Birthday) */}
        {!dailyStatus.isBirthday && dailyStatus.isOverLimit && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                <Bell className="w-4 h-4 animate-bounce" />
              </span>
              <span>
                <strong>Attention:</strong> You spent <span className="font-bold underline">{dailyStatus.percentage}% extra</span> over your daily limit of {formatCurrency(dailyStatus.limit, user.currency)} today.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="px-2.5 py-1 rounded-lg bg-rose-500 text-slate-950 font-bold text-[11px] shrink-0 hover:bg-rose-400"
            >
              Review Spend
            </button>
          </div>
        )}

        {/* TAB 1: DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Daily Expense Limit Card (with day-of-week schedule & birthday integration) */}
            <DailyLimitCard
              expenses={expenses}
              user={user}
              currency={user.currency}
              onUpdateLimit={handleUpdateLimit}
              onUpdateSchedule={handleUpdateSchedule}
              onUpdateBirthday={handleUpdateBirthday}
            />

            {/* Quick Callout to Recorded History Tally */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-400 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Bank &amp; Cash Reconciliation Tally
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {pendingTallyCount} unverified
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Verify cash in hand and UPI statements with your recorded history ledger.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="px-4 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                Open Tally Ledger <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Analytics & Charts Preview */}
            <AnalyticsCharts
              expenses={expenses}
              currency={user.currency}
              dailyLimit={user.dailyLimit}
              timeHorizon={timeHorizon}
              onHorizonChange={setTimeHorizon}
            />

            {/* Expense Ledger */}
            <ExpenseList
              expenses={expenses}
              currency={user.currency}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
              onAddNew={() => {
                setExpenseToEdit(null);
                setIsAddExpenseOpen(true);
              }}
              onOpenCSVManager={() => setIsCSVManagerOpen(true)}
            />
          </div>
        )}

        {/* TAB 2: RECORDED HISTORY & TALLY LEDGER */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <RecordedHistoryTab
              expenses={expenses}
              dailyLimit={user.dailyLimit}
              currency={user.currency}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
              onToggleReconciled={handleToggleReconciled}
              onBatchReconcile={handleBatchReconcile}
              onOpenCSVManager={() => setIsCSVManagerOpen(true)}
            />
          </div>
        )}

        {/* TAB 3: DETAILED ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <AnalyticsCharts
              expenses={expenses}
              currency={user.currency}
              dailyLimit={user.dailyLimit}
              timeHorizon={timeHorizon}
              onHorizonChange={setTimeHorizon}
            />

            <ExpenseList
              expenses={expenses}
              currency={user.currency}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
              onAddNew={() => {
                setExpenseToEdit(null);
                setIsAddExpenseOpen(true);
              }}
              onOpenCSVManager={() => setIsCSVManagerOpen(true)}
            />
          </div>
        )}

        {/* TAB 4: RECURRING EXPENSES & SUBSCRIPTIONS */}
        {activeTab === 'recurring' && (
          <div className="space-y-6">
            <RecurringExpensesTab
              recurringExpenses={recurringExpenses}
              onAddRecurring={handleAddRecurring}
              onToggleActive={handleToggleRecurringActive}
              onDeleteRecurring={handleDeleteRecurring}
              onLogNow={handleLogRecurringNow}
              currency={user.currency}
              dailyLimit={user.dailyLimit}
            />
          </div>
        )}

        {/* TAB 5: MONEY AI CHATBOT */}
        {activeTab === 'money-ai' && (
          <div className="space-y-4">
            <MoneyAITab
              expenses={expenses}
              dailyLimit={user.dailyLimit}
              currency={user.currency}
              userName={user.name}
              particleGoals={particleGoals}
            />
          </div>
        )}

        {/* TAB 6: BADE BUJURG & PARTICLE SAVINGS */}
        {activeTab === 'bade-bujurg' && (
          <div className="space-y-6">
            <BadeBujurgTab
              particleGoals={particleGoals}
              onAddGoal={handleAddParticleGoal}
              onDepositToGoal={handleDepositToGoal}
              onWithdrawFromGoal={handleWithdrawFromGoal}
              onDeleteGoal={handleDeleteGoal}
              onLinkBankToGoal={handleLinkBankToGoal}
              currency={user.currency}
              expenses={expenses}
              dailyLimit={user.dailyLimit}
              userName={user.name}
            />
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ArthAI - Your Own Finance Tracker • Track, Tally &amp; Master Your Money</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className="hover:text-teal-400 transition-colors flex items-center gap-1"
            >
              <History className="w-3.5 h-3.5" /> Tally Ledger
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsCSVManagerOpen(true)}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> CSV Manager
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsAIHealthAuditOpen(true)}
              className="hover:text-indigo-400 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Health Audit
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsCodeModalOpen(true)}
              className="hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <Code className="w-3.5 h-3.5" /> Python Backend Code
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

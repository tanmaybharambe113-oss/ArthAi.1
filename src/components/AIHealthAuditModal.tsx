import React, { useState } from 'react';
import { Expense, ParticleGoal, RecurringExpense, AIHealthReport } from '../types';
import { calculateDailyLimitStatus, formatCurrency } from '../utils/storage';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  X,
  Target,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface AIHealthAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  dailyLimit: number;
  currency: string;
  particleGoals: ParticleGoal[];
  recurringExpenses: RecurringExpense[];
}

export const AIHealthAuditModal: React.FC<AIHealthAuditModalProps> = ({
  isOpen,
  onClose,
  expenses,
  dailyLimit,
  currency,
  particleGoals,
  recurringExpenses,
}) => {
  const [report, setReport] = useState<AIHealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const runAudit = async () => {
    setIsLoading(true);
    const status = calculateDailyLimitStatus(expenses, dailyLimit);
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

    const telemetry = {
      dailyLimit,
      todaySpent: status.todayTotal,
      isOverLimit: status.isOverLimit,
      percentageVariance: status.percentage,
      totalExpensesLogged: expenses.length,
      totalSpentAllTime: totalSpent,
      activeGoalsCount: particleGoals.length,
      goalsTargetTotal: particleGoals.reduce((s, g) => s + g.targetAmount, 0),
      goalsSavedTotal: particleGoals.reduce((s, g) => s + g.currentSaved, 0),
      recurringCount: recurringExpenses.length,
      recurringActiveCount: recurringExpenses.filter(r => r.isActive).length,
    };

    try {
      const res = await fetch('/api/ai/health-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telemetry }),
      });
      const data = await res.json();
      if (data.audit) {
        setReport(data.audit);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial auto-run if report is null
  if (!report && !isLoading) {
    runAudit();
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Excellent':
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
      case 'Good':
        return 'text-teal-300 bg-teal-500/20 border-teal-500/40';
      case 'Fair':
        return 'text-amber-400 bg-amber-500/20 border-amber-500/40';
      default:
        return 'text-rose-400 bg-rose-500/20 border-rose-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Gemini Financial Health Audit
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI Diagnostic
                </span>
              </h2>
              <p className="text-xs text-slate-400">Deep telemetry audit of spending, limit compliance &amp; goals</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-indigo-400" />
              <div className="text-sm font-semibold text-white">Analyzing Financial Signals...</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Auditing daily limit consistency, category concentrations, subscription commitments, and goal velocities.
              </p>
            </div>
          ) : report ? (
            <>
              {/* Scorecard row */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/50 to-slate-900 border border-indigo-500/30 flex items-center justify-between gap-4">
                <div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusColor(report.status)}`}>
                    {report.status.toUpperCase()} RATING
                  </span>
                  <div className="text-sm font-bold text-white mt-2">{report.summary}</div>
                  <div className="text-xs text-slate-400 mt-1">{report.dailyBudgetImpact}</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-4xl font-black text-indigo-300 font-mono tracking-tight">
                    {report.score}<span className="text-sm text-slate-400 font-normal">/100</span>
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Health Score</div>
                </div>
              </div>

              {/* Strengths and Vulnerabilities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Financial Strengths
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {report.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Leaks &amp; Vulnerabilities
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {report.vulnerabilities.map((vuln, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{vuln}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Plan */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Target className="w-4 h-4" /> AI Action Plan for Next 30 Days
                </h4>
                <div className="space-y-2 text-xs text-slate-200">
                  {report.actionItems.map((act, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Grounded in your real ledger &amp; limit compliance</span>
          <button
            type="button"
            onClick={runAudit}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Re-Analyze Finances
          </button>
        </div>
      </div>
    </div>
  );
};

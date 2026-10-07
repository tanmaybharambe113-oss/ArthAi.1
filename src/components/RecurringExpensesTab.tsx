import React, { useState } from 'react';
import { RecurringExpense, ExpenseCategory, PaymentMethod, RecurringFrequency } from '../types';
import { CATEGORIES, formatCurrency, getCategoryColor } from '../utils/storage';
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Trash2,
  X,
  CreditCard,
  Zap,
  Repeat,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface RecurringExpensesTabProps {
  recurringExpenses: RecurringExpense[];
  onAddRecurring: (item: Omit<RecurringExpense, 'id'>) => void;
  onToggleActive: (id: string) => void;
  onDeleteRecurring: (id: string) => void;
  onLogNow: (item: RecurringExpense) => void;
  currency: string;
  dailyLimit: number;
}

export const RecurringExpensesTab: React.FC<RecurringExpensesTabProps> = ({
  recurringExpenses,
  onAddRecurring,
  onToggleActive,
  onDeleteRecurring,
  onLogNow,
  currency,
  dailyLimit,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Bills & Utilities');
  const [paymentMode, setPaymentMode] = useState<PaymentMethod>('Net Banking');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoLog, setAutoLog] = useState(true);
  const [notes, setNotes] = useState('');

  // Calculate monthly burden
  const monthlyTotal = recurringExpenses
    .filter(r => r.isActive)
    .reduce((sum, r) => {
      switch (r.frequency) {
        case 'daily':
          return sum + r.amount * 30;
        case 'weekly':
          return sum + r.amount * 4.33;
        case 'monthly':
          return sum + r.amount;
        case 'yearly':
          return sum + r.amount / 12;
        default:
          return sum + r.amount;
      }
    }, 0);

  const dailyAllocation = Math.round(monthlyTotal / 30);
  const percentOfDailyLimit = dailyLimit > 0 ? Math.round((dailyAllocation / dailyLimit) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!title.trim() || isNaN(val) || val <= 0) return;

    onAddRecurring({
      title: title.trim(),
      amount: val,
      category,
      paymentMode,
      frequency,
      nextDueDate,
      isActive: true,
      autoLogToDaily: autoLog,
      notes: notes.trim() || undefined,
    });

    setTitle('');
    setAmount('');
    setNotes('');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Repeat className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white">Recurring Expenses &amp; Subscriptions</h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-lg">
              Manage fixed monthly bills, rent, SIPs, utilities &amp; digital subscriptions. Track upcoming due dates and log them into daily expenses with a single tap.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Recurring Bill
          </button>
        </div>

        {/* Burden Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-500/20">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Monthly Commitment</div>
            <div className="text-xl font-bold text-white font-mono mt-1">
              {formatCurrency(Math.round(monthlyTotal), currency)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Fixed auto-debits / month</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Daily Allocation</div>
            <div className="text-xl font-bold text-indigo-300 font-mono mt-1">
              {formatCurrency(dailyAllocation, currency)}/day
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Distributed daily cost</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Daily Limit Impact</div>
            <div className="text-xl font-bold text-amber-300 font-mono mt-1">
              {percentOfDailyLimit}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">of your {formatCurrency(dailyLimit, currency)} limit</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Subscriptions</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
              {recurringExpenses.filter(r => r.isActive).length} / {recurringExpenses.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Running automatically</div>
          </div>
        </div>
      </div>

      {/* Recurring Items List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span>Active Recurring Commitments</span>
          <span className="text-xs text-slate-400 font-normal">Sorted by due date</span>
        </h3>

        {recurringExpenses.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-500 text-xs">
            No recurring expenses registered yet. Click &quot;Add Recurring Bill&quot; to begin tracking subscriptions!
          </div>
        ) : (
          recurringExpenses.map(item => {
            const isDueSoon = new Date(item.nextDueDate).getTime() - Date.now() < 3 * 86400000;

            return (
              <div
                key={item.id}
                className={`p-4 md:p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  item.isActive
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-900/50 border-slate-800/60 opacity-60'
                }`}
              >
                {/* Details */}
                <div className="flex items-start md:items-center gap-3.5">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm"
                    style={{
                      backgroundColor: `${getCategoryColor(item.category)}20`,
                      color: getCategoryColor(item.category),
                    }}
                  >
                    <Repeat className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-white text-sm">{item.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold uppercase tracking-wider">
                        {item.frequency}
                      </span>
                      {isDueSoon && item.isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Due Soon
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap font-mono">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>{item.paymentMode}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
                        Next: {item.nextDueDate}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-slate-500 mt-1 italic">&quot;{item.notes}&quot;</p>
                    )}
                  </div>
                </div>

                {/* Right Amount & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="text-left md:text-right">
                    <div className="text-base font-bold text-white font-mono">
                      {formatCurrency(item.amount, currency)}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">per {item.frequency}</div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {/* Log Now into Today's Expenses */}
                    <button
                      type="button"
                      onClick={() => onLogNow(item)}
                      title="Log into today's expense ledger now"
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-400" /> Log Now
                    </button>

                    {/* Pause / Resume */}
                    <button
                      type="button"
                      onClick={() => onToggleActive(item.id)}
                      title={item.isActive ? 'Pause recurring bill' : 'Resume recurring bill'}
                      className={`p-2 rounded-xl border text-xs transition-colors ${
                        item.isActive
                          ? 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
                          : 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {item.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => onDeleteRecurring(item.id)}
                      title="Delete recurring bill"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Recurring Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Repeat className="w-5 h-5 text-indigo-400" />
                Add Recurring Expense
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Subscription or Bill Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix, Broadband WiFi, House Rent, Gym"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Amount ({currency})
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="999"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as RecurringFrequency)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Next Due Date</label>
                  <input
                    type="date"
                    required
                    value={nextDueDate}
                    onChange={e => setNextDueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Net Banking">Net Banking (Auto-Debit)</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="UPI">UPI Autopay</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Plan Details</label>
                <input
                  type="text"
                  placeholder="e.g. Standard HD plan, Billed every 15th"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-indigo-500/20"
              >
                Save Recurring Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

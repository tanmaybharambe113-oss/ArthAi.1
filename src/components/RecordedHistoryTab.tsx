import React, { useState, useMemo } from 'react';
import { Expense, PaymentMethod, ExpenseCategory } from '../types';
import { formatCurrency, CATEGORIES, getTodayString } from '../utils/storage';
import {
  History,
  CheckCircle2,
  Circle,
  Calendar,
  Filter,
  Search,
  Wallet,
  CreditCard,
  Building,
  Smartphone,
  Banknote,
  ChevronDown,
  ChevronUp,
  Download,
  Edit2,
  Trash2,
  Sparkles,
  CheckSquare,
  Square,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface RecordedHistoryTabProps {
  expenses: Expense[];
  dailyLimit: number;
  currency: string;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onToggleReconciled: (id: string) => void;
  onBatchReconcile: (ids: string[], isReconciled: boolean) => void;
  onOpenCSVManager: () => void;
}

export const RecordedHistoryTab: React.FC<RecordedHistoryTabProps> = ({
  expenses,
  dailyLimit,
  currency,
  onEditExpense,
  onDeleteExpense,
  onToggleReconciled,
  onBatchReconcile,
  onOpenCSVManager,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [customDate, setCustomDate] = useState(getTodayString());
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tallyFilter, setTallyFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    const today = getTodayString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    return expenses.filter(e => {
      // Date filter
      if (selectedFilter === 'today' && e.date !== today) return false;
      if (selectedFilter === 'yesterday' && e.date !== yesterday) return false;
      if (selectedFilter === 'custom' && e.date !== customDate) return false;
      if (selectedFilter === 'week') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        if (e.date < d.toISOString().split('T')[0]) return false;
      }
      if (selectedFilter === 'month') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        if (e.date < d.toISOString().split('T')[0]) return false;
      }

      // Payment filter
      if (paymentFilter !== 'all' && e.paymentMode !== paymentFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;

      // Tally filter
      if (tallyFilter === 'verified' && !e.isReconciled) return false;
      if (tallyFilter === 'pending' && e.isReconciled) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesDesc = e.description.toLowerCase().includes(q);
        const matchesNotes = e.notes?.toLowerCase().includes(q);
        const matchesCat = e.category.toLowerCase().includes(q);
        if (!matchesDesc && !matchesNotes && !matchesCat) return false;
      }

      return true;
    });
  }, [expenses, selectedFilter, customDate, paymentFilter, categoryFilter, tallyFilter, searchTerm]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    for (const exp of filteredExpenses) {
      if (!map[exp.date]) map[exp.date] = [];
      map[exp.date].push(exp);
    }
    // Sort dates descending
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredExpenses]);

  // Summary Metrics for the filtered view
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const verifiedCount = useMemo(() => {
    return filteredExpenses.filter(e => e.isReconciled).length;
  }, [filteredExpenses]);

  const pendingCount = filteredExpenses.length - verifiedCount;

  // Payment channel tally stats
  const channelStats = useMemo(() => {
    const stats: Record<PaymentMethod, { amount: number; count: number }> = {
      UPI: { amount: 0, count: 0 },
      Cash: { amount: 0, count: 0 },
      'Credit Card': { amount: 0, count: 0 },
      'Debit Card': { amount: 0, count: 0 },
      'Net Banking': { amount: 0, count: 0 },
    };

    filteredExpenses.forEach(e => {
      if (stats[e.paymentMode]) {
        stats[e.paymentMode].amount += e.amount;
        stats[e.paymentMode].count += 1;
      }
    });

    return stats;
  }, [filteredExpenses]);

  const toggleDateExpand = (date: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: prev[date] === false ? true : prev[date] === undefined ? false : !prev[date],
    }));
  };

  const handleMarkAllTallied = () => {
    const ids = filteredExpenses.map(e => e.id);
    onBatchReconcile(ids, true);
  };

  const handleUnmarkAllTallied = () => {
    const ids = filteredExpenses.map(e => e.id);
    onBatchReconcile(ids, false);
  };

  const isDateExpanded = (date: string) => {
    return expandedDates[date] !== false; // Default expanded
  };

  const getPaymentIcon = (mode: PaymentMethod) => {
    switch (mode) {
      case 'UPI':
        return <Smartphone className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Cash':
        return <Banknote className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Credit Card':
        return <CreditCard className="w-3.5 h-3.5 text-amber-400" />;
      case 'Debit Card':
        return <CreditCard className="w-3.5 h-3.5 text-purple-400" />;
      case 'Net Banking':
        return <Building className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Tally Overview Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <History className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Recorded History &amp; Tally Ledger
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verify and reconcile your transactions against bank statements, passbooks, and cash in hand.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onOpenCSVManager}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export Tally CSV
            </button>
            <button
              type="button"
              onClick={handleMarkAllTallied}
              disabled={filteredExpenses.length === 0 || pendingCount === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" /> Tally All ({pendingCount} pending)
            </button>
          </div>
        </div>

        {/* Channel Breakdown Tally Strip (UPI, Cash, CC, DC, NetBanking) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-6 pt-6 border-t border-slate-800/80">
          {/* Total in View */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Recorded</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              {formatCurrency(totalAmount, currency)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{filteredExpenses.length} transactions</div>
          </div>

          {/* UPI Tally */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-cyan-400" /> UPI Tally
            </div>
            <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">
              {formatCurrency(channelStats.UPI.amount, currency)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{channelStats.UPI.count} transactions</div>
          </div>

          {/* Cash in Hand Tally */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Banknote className="w-3 h-3 text-emerald-400" /> Cash Tally
            </div>
            <div className="text-lg font-bold text-emerald-300 font-mono mt-0.5">
              {formatCurrency(channelStats.Cash.amount, currency)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{channelStats.Cash.count} cash txns</div>
          </div>

          {/* Credit Card Tally */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-amber-400" /> Credit Card
            </div>
            <div className="text-lg font-bold text-amber-300 font-mono mt-0.5">
              {formatCurrency(channelStats['Credit Card'].amount, currency)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{channelStats['Credit Card'].count} swipes</div>
          </div>

          {/* Debit & NetBanking Tally */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Building className="w-3 h-3 text-indigo-400" /> Bank / Debit
            </div>
            <div className="text-lg font-bold text-indigo-300 font-mono mt-0.5">
              {formatCurrency(channelStats['Debit Card'].amount + channelStats['Net Banking'].amount, currency)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {channelStats['Debit Card'].count + channelStats['Net Banking'].count} transfers
            </div>
          </div>

          {/* Verification Status */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-teal-400" /> Tally Status
            </div>
            <div className="text-lg font-bold text-teal-300 font-mono mt-0.5">
              {verifiedCount} <span className="text-xs text-slate-400 font-normal">/ {filteredExpenses.length}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {pendingCount === 0 && filteredExpenses.length > 0 ? (
                <span className="text-emerald-400 font-semibold">100% Reconciled</span>
              ) : (
                <span>{pendingCount} to verify</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Date Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        {/* Date chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 text-xs font-semibold pr-1 shrink-0 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Range:
          </span>
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
              selectedFilter === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All History ({expenses.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('today')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
              selectedFilter === 'today'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('yesterday')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
              selectedFilter === 'yesterday'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('week')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
              selectedFilter === 'week'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('month')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
              selectedFilter === 'month'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('custom')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
              selectedFilter === 'custom'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Custom Date
          </button>

          {selectedFilter === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          )}
        </div>

        {/* Secondary filters: Search, Payment mode, Category, Tally state */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search store, notes, desc..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Payment Channels</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={tallyFilter}
              onChange={e => setTallyFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Tally States</option>
              <option value="verified">✅ Verified with Bank</option>
              <option value="pending">⏳ Pending Tally</option>
            </select>
          </div>
        </div>
      </div>

      {/* Day-Wise Tally Ledger */}
      <div className="space-y-4">
        {groupedByDate.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-500 text-xs space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto text-slate-600" />
            <div>No transactions match the selected tally filters.</div>
            <button
              type="button"
              onClick={() => {
                setSelectedFilter('all');
                setPaymentFilter('all');
                setCategoryFilter('all');
                setTallyFilter('all');
                setSearchTerm('');
              }}
              className="text-emerald-400 hover:underline text-xs"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          groupedByDate.map(([dateString, dayExpenses]) => {
            const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
            const isOverDayLimit = dailyLimit > 0 && dayTotal > dailyLimit;
            const limitDiff = dailyLimit > 0 ? Math.abs(dayTotal - dailyLimit) : 0;
            const expanded = isDateExpanded(dateString);
            const dayVerifiedCount = dayExpenses.filter(e => e.isReconciled).length;
            const allDayVerified = dayVerifiedCount === dayExpenses.length;

            return (
              <div
                key={dateString}
                className="rounded-3xl bg-slate-900 border border-slate-800/80 overflow-hidden shadow-lg transition-all"
              >
                {/* Date Group Header */}
                <div
                  onClick={() => toggleDateExpand(dateString)}
                  className="p-4 md:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 hover:bg-slate-850 cursor-pointer border-b border-slate-800/60 select-none"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Toggle collapse"
                      className="text-slate-400 hover:text-white"
                    >
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {dateString === getTodayString()
                            ? 'Today'
                            : new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">({dateString})</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          {dayExpenses.length} txns
                        </span>
                      </div>

                      {/* Daily Limit Comparison Subtitle */}
                      {dailyLimit > 0 && (
                        <div className="text-[11px] mt-0.5 flex items-center gap-1.5">
                          {isOverDayLimit ? (
                            <span className="text-rose-400 font-semibold">
                              Exceeded limit by {formatCurrency(limitDiff, currency)} ({Math.round(((dayTotal - dailyLimit) / dailyLimit) * 100)}% extra)
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-semibold">
                              Saved {formatCurrency(limitDiff, currency)} under limit ({Math.round(((dailyLimit - dayTotal) / dailyLimit) * 100)}% buffer)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-left sm:text-right">
                      <div className="text-base font-bold text-white font-mono">
                        {formatCurrency(dayTotal, currency)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {allDayVerified ? (
                          <span className="text-teal-400 font-semibold flex items-center gap-1 sm:justify-end">
                            <CheckCircle2 className="w-3 h-3" /> Fully Tallied
                          </span>
                        ) : (
                          <span>{dayVerifiedCount} / {dayExpenses.length} verified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Day Expense Items */}
                {expanded && (
                  <div className="divide-y divide-slate-800/40">
                    {dayExpenses.map(item => (
                      <div
                        key={item.id}
                        className={`p-3.5 md:px-5 flex items-center justify-between gap-3 text-xs transition-colors ${
                          item.isReconciled ? 'bg-slate-900/40' : 'bg-slate-900 hover:bg-slate-850'
                        }`}
                      >
                        {/* Left: Reconcile Toggle Checkbox + Title */}
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => onToggleReconciled(item.id)}
                            title={item.isReconciled ? 'Mark as untallied' : 'Mark as verified/tallied with bank statement'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              item.isReconciled
                                ? 'text-teal-400 bg-teal-500/15 hover:bg-teal-500/25'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {item.isReconciled ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-semibold truncate ${
                                  item.isReconciled ? 'text-slate-300 line-through decoration-slate-600' : 'text-white'
                                }`}
                              >
                                {item.description}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                {item.category}
                              </span>
                              {item.isReconciled && (
                                <span className="text-[9px] uppercase font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.2 rounded border border-teal-500/20">
                                  Tallied
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-mono">
                              <span>{item.time}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                {getPaymentIcon(item.paymentMode)}
                                {item.paymentMode}
                              </span>
                              {item.notes && (
                                <>
                                  <span>•</span>
                                  <span className="italic truncate max-w-[150px]">&quot;{item.notes}&quot;</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount & Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-bold font-mono text-white">
                            {formatCurrency(item.amount, currency)}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditExpense(item)}
                              title="Edit transaction"
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteExpense(item.id)}
                              title="Delete transaction"
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

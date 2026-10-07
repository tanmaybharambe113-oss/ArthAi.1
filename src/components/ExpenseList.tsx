import React, { useState } from 'react';
import { Expense, ExpenseCategory, PaymentMethod } from '../types';
import { CATEGORIES, formatCurrency, getCategoryColor } from '../utils/storage';
import {
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  Download,
  Plus,
  Utensils,
  ShoppingCart,
  Fuel,
  ShoppingBag,
  Zap,
  Film,
  HeartPulse,
  TrendingUp,
  MoreHorizontal,
} from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  currency: string;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onOpenCSVManager?: () => void;
}

const CategoryIcon: React.FC<{ category: string }> = ({ category }) => {
  switch (category) {
    case 'Food & Dining':
      return <Utensils className="w-4 h-4" />;
    case 'Groceries':
      return <ShoppingCart className="w-4 h-4" />;
    case 'Commute & Fuel':
      return <Fuel className="w-4 h-4" />;
    case 'Shopping':
      return <ShoppingBag className="w-4 h-4" />;
    case 'Bills & Utilities':
      return <Zap className="w-4 h-4" />;
    case 'Entertainment':
      return <Film className="w-4 h-4" />;
    case 'Health & Medical':
      return <HeartPulse className="w-4 h-4" />;
    case 'Investments':
      return <TrendingUp className="w-4 h-4" />;
    default:
      return <MoreHorizontal className="w-4 h-4" />;
  }
};

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  currency,
  onEdit,
  onDelete,
  onAddNew,
  onOpenCSVManager,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const filtered = expenses.filter(exp => {
    const matchesSearch =
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
    const matchesPayment = paymentFilter === 'all' || exp.paymentMode === paymentFilter;

    return matchesSearch && matchesCategory && matchesPayment;
  });

  const exportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['ID', 'Date', 'Time', 'Category', 'Description', 'Amount', 'PaymentMode', 'Notes'];
    const rows = expenses.map(e => [
      e.id,
      e.date,
      e.time,
      `"${e.category}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      e.amount,
      e.paymentMode,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ArthAI_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Recent Expenses &amp; Ledger
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {filtered.length} entries
            </span>
          </h3>
          <p className="text-xs text-slate-400">Track and manage every daily transaction</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCSVManager || exportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700/80 hover:border-emerald-500/50"
            title="Export or Import CSV records"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> CSV Manager
          </button>
          <button
            type="button"
            onClick={onAddNew}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="relative">
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Payment Methods</option>
            <option value="UPI">UPI</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Cash">Cash</option>
            <option value="Net Banking">Net Banking</option>
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No expenses found matching the filter criteria.
          </div>
        ) : (
          filtered.map(exp => (
            <div
              key={exp.id}
              className="p-3.5 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/90 hover:border-slate-700/90 transition-all flex items-center justify-between gap-3 group"
            >
              {/* Category Icon & Details */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{
                    backgroundColor: `${getCategoryColor(exp.category)}20`,
                    color: getCategoryColor(exp.category),
                  }}
                >
                  <CategoryIcon category={exp.category} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs truncate">
                      {exp.description}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                      style={{
                        backgroundColor: `${getCategoryColor(exp.category)}15`,
                        color: getCategoryColor(exp.category),
                      }}
                    >
                      {exp.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {exp.date} {exp.time}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-slate-400">
                      <CreditCard className="w-3 h-3 text-slate-500" />
                      {exp.paymentMode}
                    </span>
                    {exp.notes && (
                      <span className="italic text-slate-400 hidden sm:inline truncate max-w-[150px]">
                        &quot;{exp.notes}&quot;
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount & Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-sm font-bold text-white font-mono">
                    -{formatCurrency(exp.amount, currency)}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onEdit(exp)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                    title="Edit transaction"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(exp.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete transaction"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

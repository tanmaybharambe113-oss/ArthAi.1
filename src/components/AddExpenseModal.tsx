import React, { useState, useEffect } from 'react';
import { Expense, ExpenseCategory, PaymentMethod } from '../types';
import { CATEGORIES, getTodayString } from '../utils/storage';
import { X, PlusCircle, Check, Tag, Sparkles, RefreshCw } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'>, editId?: string) => void;
  expenseToEdit?: Expense | null;
  currency: string;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
  currency,
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Dining');
  const [paymentMode, setPaymentMode] = useState<PaymentMethod>('UPI');
  const [date, setDate] = useState(getTodayString());
  const [time, setTime] = useState('12:00');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAIParse = async () => {
    if (!aiPrompt.trim() || isParsingAI) return;
    setIsParsingAI(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/parse-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiPrompt }),
      });
      const data = await res.json();
      if (data.parsed) {
        if (data.parsed.amount) setAmount(data.parsed.amount.toString());
        if (data.parsed.description) setDescription(data.parsed.description);
        if (data.parsed.category) setCategory(data.parsed.category);
        if (data.parsed.paymentMode) setPaymentMode(data.parsed.paymentMode);
        if (data.parsed.notes) setNotes(data.parsed.notes);
      }
    } catch (e) {
      console.error(e);
      setError('AI parsing was unable to interpret the prompt.');
    } finally {
      setIsParsingAI(false);
    }
  };

  useEffect(() => {
    if (expenseToEdit) {
      setAmount(expenseToEdit.amount.toString());
      setDescription(expenseToEdit.description);
      setCategory(expenseToEdit.category);
      setPaymentMode(expenseToEdit.paymentMode);
      setDate(expenseToEdit.date);
      setTime(expenseToEdit.time);
      setNotes(expenseToEdit.notes || '');
    } else {
      setAmount('');
      setDescription('');
      setCategory('Food & Dining');
      setPaymentMode('UPI');
      setDate(getTodayString());
      const now = new Date();
      setTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
      setNotes('');
    }
    setError(null);
  }, [expenseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a brief description for this expense');
      return;
    }

    onSave(
      {
        amount: parsedAmount,
        description: description.trim(),
        category,
        paymentMode,
        date,
        time,
        notes: notes.trim() || undefined,
      },
      expenseToEdit ? expenseToEdit.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              {expenseToEdit ? <Check className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {expenseToEdit ? 'Edit Expense Record' : 'Log Daily Expense'}
              </h2>
              <p className="text-xs text-slate-400">Keep your daily limit and analytics updated</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* AI Magic Quick-Add Bar */}
          {!expenseToEdit && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-slate-800/80 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  AI Natural Language Quick-Fill
                </span>
                <span className="text-[10px] text-slate-400">Gemini Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. 'Swiggy dinner 450 upi' or 'Petrol 300 cash'..."
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAIParse();
                    }
                  }}
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAIParse}
                  disabled={isParsingAI || !aiPrompt.trim()}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0 transition-colors"
                >
                  {isParsingAI ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Autofill
                </button>
              </div>
            </div>
          )}

          {/* Big Amount Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Expense Amount
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-2xl font-bold text-emerald-400 font-mono">
                {currency}
              </span>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-slate-800/80 border-2 border-slate-700/80 rounded-2xl pl-12 pr-4 py-3.5 text-2xl font-bold text-white focus:outline-none focus:border-emerald-500 font-mono transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Description / What was this for?</label>
            <input
              type="text"
              required
              placeholder="e.g. Swiggy Lunch, Metro recharge, Coffee"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Category Selector Grid */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Payment Method</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {(['UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking'] as PaymentMethod[]).map(pm => {
                const isSelected = paymentMode === pm;
                return (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMode(pm)}
                    className={`py-2 px-2 rounded-xl border text-center text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {pm}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Additional Notes or Tags (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Split with Rohan, Work reimbursement"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-[0.99]"
            >
              {expenseToEdit ? 'Save Changes' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

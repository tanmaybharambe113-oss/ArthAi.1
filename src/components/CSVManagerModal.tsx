import React, { useState } from 'react';
import { Expense } from '../types';
import { generateCSVString, parseCSVToExpenses, formatCurrency, CATEGORIES } from '../utils/storage';
import {
  FileSpreadsheet,
  Download,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Filter,
  Calendar,
} from 'lucide-react';

interface CSVManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  onImportExpenses: (newExpenses: Expense[]) => void;
  currency: string;
}

export const CSVManagerModal: React.FC<CSVManagerModalProps> = ({
  isOpen,
  onClose,
  expenses,
  onImportExpenses,
  currency,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

  // Export filters
  const [exportRange, setExportRange] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Import state
  const [importText, setImportText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Expense[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter expenses for export
  const filteredForExport = expenses.filter(e => {
    const today = new Date().toISOString().split('T')[0];
    let matchDate = true;

    if (exportRange === 'today') {
      matchDate = e.date === today;
    } else if (exportRange === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      matchDate = e.date >= d.toISOString().split('T')[0];
    } else if (exportRange === 'month') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      matchDate = e.date >= d.toISOString().split('T')[0];
    } else if (exportRange === 'year') {
      const yearStart = `${new Date().getFullYear()}-01-01`;
      matchDate = e.date >= yearStart;
    }

    const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
    return matchDate && matchCategory;
  });

  const handleDownloadCSV = () => {
    const csvContent = generateCSVString(filteredForExport, currency);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ArthAI_Expenses_${exportRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      setImportText(text);
      const res = parseCSVToExpenses(text);
      if (res.error) {
        setImportError(res.error);
        setParsedPreview([]);
      } else {
        setParsedPreview(res.expenses);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return;
    onImportExpenses(parsedPreview);
    setImportSuccessMsg(`Successfully imported ${parsedPreview.length} expenses into your ledger!`);
    setParsedPreview([]);
    setImportText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                CSV Ledger Manager
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Export &amp; Import
                </span>
              </h2>
              <p className="text-xs text-slate-400">Export filtered financial reports or import past statements</p>
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

        {/* Tab switch */}
        <div className="flex items-center gap-2 p-3 bg-slate-950/40 border-b border-slate-800 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'export'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Export Filtered CSV
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'import'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Import Past CSV
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Time Span
                  </label>
                  <select
                    value={exportRange}
                    onChange={e => setExportRange(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">All Time Records ({expenses.length} txns)</option>
                    <option value="today">Today Only</option>
                    <option value="week">Past 7 Days</option>
                    <option value="month">Past 30 Days</option>
                    <option value="year">Current Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">All Categories</option>
                    {CATEGORIES.map(c => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview Summary */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-300">Export Scope:</div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Selected Transactions:</span>
                  <span className="font-bold text-white font-mono">{filteredForExport.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Total Amount in Batch:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {formatCurrency(
                      filteredForExport.reduce((s, e) => s + e.amount, 0),
                      currency
                    )}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadCSV}
                disabled={filteredForExport.length === 0}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Download CSV ({filteredForExport.length} Entries)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {importSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {importSuccessMsg}
                </div>
              )}

              {importError && (
                <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {importError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Select CSV File to Import
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-500 file:text-slate-950 hover:file:bg-teal-400"
                />
              </div>

              {/* Preview of Parsed Rows */}
              {parsedPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                    <span>Parsed Preview ({parsedPreview.length} entries detected):</span>
                    <span className="font-mono text-emerald-400">
                      Total: {formatCurrency(parsedPreview.reduce((s, e) => s + e.amount, 0), currency)}
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {parsedPreview.slice(0, 10).map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900 text-xs"
                      >
                        <div className="truncate mr-2">
                          <span className="font-semibold text-white">{p.description}</span>
                          <span className="text-[10px] text-slate-500 ml-2">({p.category})</span>
                        </div>
                        <span className="font-mono text-emerald-400 font-bold shrink-0">
                          {formatCurrency(p.amount, currency)}
                        </span>
                      </div>
                    ))}
                    {parsedPreview.length > 10 && (
                      <div className="text-center text-[10px] text-slate-500 pt-1">
                        ...and {parsedPreview.length - 10} more records ready to import
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Confirm &amp; Merge {parsedPreview.length} Expenses
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

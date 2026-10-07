import React, { useState } from 'react';
import { calculateDailyLimitStatus, formatCurrency, DAY_NAMES, getTodayString } from '../utils/storage';
import { Expense, UserProfile } from '../types';
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Edit3,
  X,
  Check,
  Flame,
  PiggyBank,
  Calendar,
  Sparkles,
  Gift,
  Sliders,
  Settings2,
} from 'lucide-react';

interface DailyLimitCardProps {
  expenses: Expense[];
  user: UserProfile;
  currency: string;
  onUpdateLimit: (newLimit: number) => void;
  onUpdateSchedule: (dayLimits: Record<number, number>, isWeeklyEnabled: boolean) => void;
  onUpdateBirthday: (birthday: string) => void;
  selectedDate?: string;
}

export const DailyLimitCard: React.FC<DailyLimitCardProps> = ({
  expenses,
  user,
  currency,
  onUpdateLimit,
  onUpdateSchedule,
  onUpdateBirthday,
  selectedDate = getTodayString(),
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempLimit, setTempLimit] = useState(user.dailyLimit.toString());
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Day specific limits local state for modal
  const [isWeeklyEnabled, setIsWeeklyEnabled] = useState(user.isWeeklyScheduleEnabled ?? false);
  const [dayLimits, setDayLimits] = useState<Record<number, number>>(
    user.daySpecificLimits || {
      0: 500, // Sunday
      1: user.dailyLimit || 130, // Monday
      2: user.dailyLimit || 130,
      3: user.dailyLimit || 130,
      4: user.dailyLimit || 130,
      5: user.dailyLimit || 130,
      6: user.dailyLimit || 130,
    }
  );
  const [tempDob, setTempDob] = useState(user.dateOfBirth || '');

  const status = calculateDailyLimitStatus(expenses, user, selectedDate);
  const percentUsed = status.isBirthday
    ? 0
    : Math.min(Math.round((status.todayTotal / (status.limit || 1)) * 100), 999);

  const handleSaveInline = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(tempLimit);
    if (!isNaN(val) && val > 0) {
      onUpdateLimit(val);
      setIsEditing(false);
    }
  };

  const handleSaveSchedule = () => {
    onUpdateSchedule(dayLimits, isWeeklyEnabled);
    if (tempDob !== user.dateOfBirth) {
      onUpdateBirthday(tempDob);
    }
    setIsScheduleModalOpen(false);
  };

  const applyMonSatSunPreset = (monSatAmount: number, sunAmount: number) => {
    setDayLimits({
      0: sunAmount,
      1: monSatAmount,
      2: monSatAmount,
      3: monSatAmount,
      4: monSatAmount,
      5: monSatAmount,
      6: monSatAmount,
    });
    setIsWeeklyEnabled(true);
  };

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-3xl border transition-all duration-300 p-5 md:p-6 shadow-xl ${
          status.isBirthday
            ? 'bg-gradient-to-br from-amber-950/70 via-slate-900 to-indigo-950/70 border-amber-500/40 shadow-amber-950/30'
            : status.isOverLimit
            ? 'bg-gradient-to-br from-rose-950/70 via-slate-900 to-slate-900 border-rose-500/40 shadow-rose-950/30'
            : 'bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border-emerald-500/30 shadow-emerald-950/20'
        }`}
      >
        {/* Background ambient decorative glow */}
        <div
          className={`absolute -right-10 -top-10 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none ${
            status.isBirthday
              ? 'bg-amber-400'
              : status.isOverLimit
              ? 'bg-rose-500'
              : 'bg-emerald-400'
          }`}
        />

        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2.5 rounded-2xl flex items-center justify-center ${
                status.isBirthday
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : status.isOverLimit
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {status.isBirthday ? (
                <Gift className="w-5 h-5 text-amber-400 animate-bounce" />
              ) : status.isOverLimit ? (
                <Flame className="w-5 h-5 animate-pulse" />
              ) : (
                <PiggyBank className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Daily Budget Engine
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    status.isBirthday
                      ? 'bg-amber-500/25 text-amber-300 border-amber-500/40'
                      : status.isOverLimit
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {status.isBirthday
                    ? '🎉 BIRTHDAY SPECIAL (UNLIMITED)'
                    : status.isOverLimit
                    ? 'LIMIT EXCEEDED'
                    : 'ON TRACK'}
                </span>
                {status.isCustomDayLimit && !status.isBirthday && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {status.dayName} Schedule Active
                  </span>
                )}
              </div>

              <h2 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                {status.isBirthday ? (
                  <span className="text-amber-300 font-extrabold flex items-center gap-1.5">
                    <span>🎂</span> Unlimited Birthday Mode
                  </span>
                ) : (
                  <>
                    <span>
                      {status.isCustomDayLimit ? `${status.dayName} Limit: ` : 'Daily Limit: '}
                      <span className="font-mono">{formatCurrency(status.limit, currency)}</span>
                    </span>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setTempLimit(status.limit.toString());
                          setIsEditing(true);
                        }}
                        title="Edit limit directly"
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </h2>
            </div>
          </div>

          {/* Right Action Tools: Schedule / Special Days Button */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <form
                onSubmit={handleSaveInline}
                className="flex items-center gap-2 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700"
              >
                <span className="text-xs text-slate-400 pl-2">{currency}</span>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  autoFocus
                  placeholder="e.g. 135"
                  value={tempLimit}
                  onChange={e => setTempLimit(e.target.value)}
                  className="w-28 bg-transparent text-sm font-semibold text-white focus:outline-none font-mono"
                />
                <button
                  type="submit"
                  title="Save custom daily limit"
                  className="p-1 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-3.5 py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Special Days &amp; Schedule</span>
              </button>
            )}
          </div>
        </div>

        {/* Birthday Greeting Callout (when active) */}
        {status.isBirthday && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg relative z-10 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🎉</span>
              <div>
                <strong className="text-white text-sm">Happy Birthday, {user.name || 'Friend'}!</strong>
                <p className="text-amber-300 mt-0.5">
                  Today is your day! Spend as much as you want with zero budget limit warnings or overdraft penalties. Enjoy to the fullest!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Alert Banner / Percentage Callout */}
        {!status.isBirthday && (
          <div
            className={`mt-4 p-4 rounded-2xl border flex items-center justify-between gap-4 relative z-10 ${
              status.isOverLimit
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  status.isOverLimit ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {status.isOverLimit ? (
                  <AlertTriangle className="w-4 h-4 animate-bounce" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight text-white">{status.statusText}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {status.isOverLimit
                    ? `Overdraft amount: ${formatCurrency(status.diff, currency)} beyond today's allowance`
                    : `Remaining safe budget for today: ${formatCurrency(Math.abs(status.diff), currency)}`}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span
                className={`text-2xl font-black font-mono tracking-tight ${
                  status.isOverLimit ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {status.isOverLimit ? `+${status.percentage}%` : `${status.percentage}%`}
              </span>
              <div className="text-[10px] uppercase font-bold text-slate-400">
                {status.isOverLimit ? 'Over Budget' : 'Safe / Saved'}
              </div>
            </div>
          </div>
        )}

        {/* Visual Progress Bar (Burn-rate Gauge) */}
        {!status.isBirthday && (
          <div className="mt-5 space-y-2 relative z-10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Today&apos;s Burn Rate</span>
              <span className="font-mono text-white font-semibold">
                {formatCurrency(status.todayTotal, currency)} / {formatCurrency(status.limit, currency)} (
                {percentUsed}%)
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-800/80 overflow-hidden p-0.5 border border-slate-700/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  status.isOverLimit
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                    : percentUsed > 75
                    ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                    : 'bg-gradient-to-r from-teal-400 to-emerald-400'
                }`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Day-of-week breakdown footer indicator */}
        {user.isWeeklyScheduleEnabled && !status.isBirthday && (
          <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Weekly Schedule: Mon–Sat{' '}
              <strong className="text-white font-mono">
                {formatCurrency(dayLimits[1] || user.dailyLimit, currency)}
              </strong>
              , Sunday Special{' '}
              <strong className="text-amber-400 font-mono">
                {formatCurrency(dayLimits[0] || 500, currency)}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline text-[11px]"
            >
              Modify Schedule
            </button>
          </div>
        )}
      </div>

      {/* Special Days & Weekly Budget Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Weekly Schedule &amp; Special Days</h3>
                  <p className="text-xs text-slate-400">
                    Set high limits on weekends/Sundays and unlock unlimited spending on your birthday.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feature 1: Day of Week Schedule */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    Day-of-Week Custom Budget
                  </h4>
                  <p className="text-xs text-slate-400">
                    Set specific limits for each day (e.g. Mon–Sat ₹130, Sunday special ₹500)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isWeeklyEnabled}
                    onChange={e => setIsWeeklyEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>

              {/* 1-Click Quick Preset */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-xs text-slate-400">1-Click Presets:</span>
                <button
                  type="button"
                  onClick={() => applyMonSatSunPreset(130, 500)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
                >
                  Mon–Sat: ₹130 | Sun: ₹500
                </button>
                <button
                  type="button"
                  onClick={() => applyMonSatSunPreset(200, 800)}
                  className="px-3 py-1.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 border border-slate-600 text-xs font-semibold transition-colors"
                >
                  Mon–Sat: ₹200 | Sun: ₹800
                </button>
              </div>

              {/* Day Inputs */}
              {isWeeklyEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    { day: 1, name: 'Monday' },
                    { day: 2, name: 'Tuesday' },
                    { day: 3, name: 'Wednesday' },
                    { day: 4, name: 'Thursday' },
                    { day: 5, name: 'Friday' },
                    { day: 6, name: 'Saturday' },
                    { day: 0, name: 'Sunday (Special Day)' },
                  ].map(({ day, name }) => (
                    <div
                      key={day}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        day === 0
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <span className={`text-xs font-semibold ${day === 0 ? 'text-amber-300 font-bold' : 'text-slate-300'}`}>
                        {name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">{currency}</span>
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={dayLimits[day] || ''}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setDayLimits(prev => ({ ...prev, [day]: val }));
                          }}
                          className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-right focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Feature 2: Birthday Mode Configuration */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-800/40 to-slate-800/40 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🎂</span>
                <div>
                  <h4 className="text-sm font-bold text-white">Your Birthday Special (with Year)</h4>
                  <p className="text-xs text-slate-400">
                    On your birthday, ArthAI allows you to spend freely with no budget limits — because it&apos;s your day!
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <label className="text-xs text-slate-300 font-medium">Date of Birth (YYYY-MM-DD):</label>
                <input
                  type="date"
                  value={tempDob}
                  onChange={e => setTempDob(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
              >
                Save Schedule &amp; Special Days
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

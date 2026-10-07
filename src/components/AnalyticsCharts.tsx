import React, { useState, useMemo } from 'react';
import { Expense, TimeHorizon } from '../types';
import { CATEGORIES, formatCurrency, getCategoryColor, getTodayString } from '../utils/storage';
import { PieChart, TrendingUp, BarChart3, Calendar, CreditCard, Sparkles, Activity } from 'lucide-react';

interface AnalyticsChartsProps {
  expenses: Expense[];
  currency: string;
  dailyLimit: number;
  timeHorizon: TimeHorizon;
  onHorizonChange: (h: TimeHorizon) => void;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  expenses,
  currency,
  dailyLimit,
  timeHorizon,
  onHorizonChange,
}) => {
  const [activeDonutIndex, setActiveDonutIndex] = useState<number | null>(null);

  // Filter expenses based on current selected horizon
  const filteredExpenses = useMemo(() => {
    const today = new Date();
    const todayStr = getTodayString();

    if (timeHorizon === 'daily') {
      return expenses.filter(e => e.date === todayStr);
    }

    if (timeHorizon === 'weekly') {
      // Last 7 days
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const startStr = sevenDaysAgo.toISOString().split('T')[0];
      return expenses.filter(e => e.date >= startStr && e.date <= todayStr);
    }

    if (timeHorizon === 'monthly') {
      // Current month or last 30 days
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      const startStr = thirtyDaysAgo.toISOString().split('T')[0];
      return expenses.filter(e => e.date >= startStr && e.date <= todayStr);
    }

    if (timeHorizon === 'yearly') {
      // Current year
      const yearStart = `${today.getFullYear()}-01-01`;
      return expenses.filter(e => e.date >= yearStart);
    }

    return expenses;
  }, [expenses, timeHorizon]);

  const totalPeriodAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Category breakdown for Donut Chart
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of filteredExpenses) {
      map.set(exp.category, (map.get(exp.category) || 0) + exp.amount);
    }

    const items = Array.from(map.entries()).map(([name, amount]) => ({
      name,
      amount,
      percentage: totalPeriodAmount > 0 ? Math.round((amount / totalPeriodAmount) * 100) : 0,
      color: getCategoryColor(name),
    }));

    return items.sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalPeriodAmount]);

  // Payment mode split
  const paymentStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of filteredExpenses) {
      map.set(exp.paymentMode, (map.get(exp.paymentMode) || 0) + exp.amount);
    }
    return Array.from(map.entries())
      .map(([mode, amount]) => ({
        mode,
        amount,
        percentage: totalPeriodAmount > 0 ? Math.round((amount / totalPeriodAmount) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalPeriodAmount]);

  // Time trend data points
  const trendData = useMemo(() => {
    const today = new Date();

    if (timeHorizon === 'daily') {
      // Group today's expenses by 4-hour slots
      const slots = ['Morning (6-12)', 'Afternoon (12-17)', 'Evening (17-21)', 'Night (21-6)'];
      const counts = [0, 0, 0, 0];

      filteredExpenses.forEach(e => {
        const hour = parseInt(e.time.split(':')[0], 10) || 12;
        if (hour >= 6 && hour < 12) counts[0] += e.amount;
        else if (hour >= 12 && hour < 17) counts[1] += e.amount;
        else if (hour >= 17 && hour < 21) counts[2] += e.amount;
        else counts[3] += e.amount;
      });

      return slots.map((label, idx) => ({
        label,
        amount: counts[idx],
        limit: dailyLimit / 4,
      }));
    }

    if (timeHorizon === 'weekly') {
      // 7 days breakdown
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dayTotal = expenses
          .filter(e => e.date === dateStr)
          .reduce((sum, e) => sum + e.amount, 0);

        result.push({
          label: `${dayName} (${d.getDate()})`,
          amount: dayTotal,
          limit: dailyLimit,
          isToday: i === 0,
        });
      }
      return result;
    }

    if (timeHorizon === 'monthly') {
      // 4 weeks breakdown
      const result = [];
      for (let i = 3; i >= 0; i--) {
        const label = `Week ${4 - i}`;
        // Approx 7 day buckets
        const bucketStart = new Date(today);
        bucketStart.setDate(bucketStart.getDate() - (i + 1) * 7);
        const bucketEnd = new Date(today);
        bucketEnd.setDate(bucketEnd.getDate() - i * 7);

        const bStartStr = bucketStart.toISOString().split('T')[0];
        const bEndStr = bucketEnd.toISOString().split('T')[0];

        const weekTotal = expenses
          .filter(e => e.date >= bStartStr && e.date <= bEndStr)
          .reduce((sum, e) => sum + e.amount, 0);

        result.push({
          label,
          amount: weekTotal,
          limit: dailyLimit * 7,
        });
      }
      return result;
    }

    // Yearly: 12 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = today.getFullYear();
    return monthNames.map((name, mIdx) => {
      const monthPrefix = `${currentYear}-${String(mIdx + 1).padStart(2, '0')}`;
      const monthTotal = expenses
        .filter(e => e.date.startsWith(monthPrefix))
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        label: name,
        amount: monthTotal,
        limit: dailyLimit * 30,
      };
    });
  }, [timeHorizon, filteredExpenses, expenses, dailyLimit]);

  // Max value for bar scaling
  const maxTrendVal = useMemo(() => {
    const maxAmount = Math.max(...trendData.map(d => d.amount), 1);
    const maxLimit = Math.max(...trendData.map(d => d.limit || 0), 1);
    return Math.max(maxAmount, maxLimit) * 1.15;
  }, [trendData]);

  // SVG Donut calculation
  const donutPaths = useMemo(() => {
    let accumulatedAngle = 0;
    const size = 200;
    const center = size / 2;
    const radius = 70;
    const strokeWidth = 24;

    return categoryStats.map((cat, idx) => {
      const sliceAngle = totalPeriodAmount > 0 ? (cat.amount / totalPeriodAmount) * 360 : 0;
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + sliceAngle;
      accumulatedAngle += sliceAngle;

      // Arc calculation in radians
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const largeArcFlag = sliceAngle > 180 ? 1 : 0;

      const pathData =
        sliceAngle >= 359.9
          ? `M ${center - radius} ${center} A ${radius} ${radius} 0 1 0 ${center + radius} ${center} A ${radius} ${radius} 0 1 0 ${center - radius} ${center}`
          : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

      return {
        ...cat,
        pathData,
        strokeWidth: activeDonutIndex === idx ? strokeWidth + 4 : strokeWidth,
      };
    });
  }, [categoryStats, totalPeriodAmount, activeDonutIndex]);

  // Patterns summary insights
  const peakDayInsight = useMemo(() => {
    if (filteredExpenses.length === 0) return 'No expenses yet';
    const dayCounts = new Map<string, number>();
    filteredExpenses.forEach(e => {
      const d = new Date(e.date);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts.set(dayName, (dayCounts.get(dayName) || 0) + e.amount);
    });
    const sorted = Array.from(dayCounts.entries()).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? `${sorted[0][0]} (${formatCurrency(sorted[0][1], currency)})` : 'Evenly distributed';
  }, [filteredExpenses, currency]);

  return (
    <div className="space-y-6">
      {/* Horizon selector buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Expense Analytics &amp; Patterns</h2>
        </div>

        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1">
          {(['daily', 'weekly', 'monthly', 'yearly'] as TimeHorizon[]).map(h => (
            <button
              key={h}
              type="button"
              onClick={() => onHorizonChange(h)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                timeHorizon === h
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Top Insights Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Period Total</span>
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {formatCurrency(totalPeriodAmount, currency)}
          </div>
          <div className="text-[11px] text-slate-400 capitalize mt-0.5">{timeHorizon} span</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Top Category</span>
            <PieChart className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-base font-bold text-white truncate mt-1">
            {categoryStats[0]?.name || 'None'}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
            {categoryStats[0] ? `${categoryStats[0].percentage}% of total` : '-'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Peak Spending</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-white truncate mt-1">{peakDayInsight}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Highest recorded day</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Transactions</span>
            <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {filteredExpenses.length} entries
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Avg {formatCurrency(filteredExpenses.length ? Math.round(totalPeriodAmount / filteredExpenses.length) : 0, currency)}/tx
          </div>
        </div>
      </div>

      {/* Main Charts: Donut Pie & Trend Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Chart with Category Breakdown (5 columns) */}
        <div className="lg:col-span-5 p-5 md:p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              Category Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {categoryStats.length} active
            </span>
          </div>

          {categoryStats.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
              <PieChart className="w-10 h-10 text-slate-600 mb-2 stroke-[1.5]" />
              No expenses recorded for this {timeHorizon} period.
            </div>
          ) : (
            <>
              {/* Interactive SVG Donut */}
              <div className="relative flex items-center justify-center py-2">
                <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                  {donutPaths.map((slice, i) => (
                    <path
                      key={slice.name}
                      d={slice.pathData}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth={slice.strokeWidth}
                      strokeLinecap="round"
                      className="cursor-pointer transition-all duration-200 hover:opacity-90"
                      onMouseEnter={() => setActiveDonutIndex(i)}
                      onMouseLeave={() => setActiveDonutIndex(null)}
                    />
                  ))}
                </svg>

                {/* Donut Center Info */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  {activeDonutIndex !== null && categoryStats[activeDonutIndex] ? (
                    <>
                      <div className="text-[11px] text-slate-400 font-medium truncate max-w-[110px]">
                        {categoryStats[activeDonutIndex].name}
                      </div>
                      <div className="text-base font-bold text-white font-mono mt-0.5">
                        {formatCurrency(categoryStats[activeDonutIndex].amount, currency)}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-bold">
                        {categoryStats[activeDonutIndex].percentage}%
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Total
                      </div>
                      <div className="text-base font-bold text-white font-mono mt-0.5">
                        {formatCurrency(totalPeriodAmount, currency)}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">{timeHorizon}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Category Legend List */}
              <div className="mt-4 space-y-2 overflow-y-auto max-h-48 pr-1">
                {categoryStats.map((cat, idx) => (
                  <div
                    key={cat.name}
                    onMouseEnter={() => setActiveDonutIndex(idx)}
                    onMouseLeave={() => setActiveDonutIndex(null)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                      activeDonutIndex === idx
                        ? 'bg-slate-800 border-slate-700'
                        : 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-slate-300 font-medium truncate">{cat.name}</span>
                    </div>
                    <div className="text-right shrink-0 font-mono">
                      <span className="text-white font-semibold">{formatCurrency(cat.amount, currency)}</span>
                      <span className="text-slate-400 text-[11px] ml-1.5 font-normal">
                        ({cat.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Trend Graph & Bar Pattern (7 columns) */}
        <div className="lg:col-span-7 p-5 md:p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Spending Pattern &amp; Daily Limit Reference
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bars show actual spending. Dashed line marks daily limit.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-block w-3 h-0.5 border-t border-dashed border-rose-400" />
              <span className="text-slate-400 text-[11px]">Limit Target</span>
            </div>
          </div>

          {/* Interactive Responsive Bar Chart */}
          <div className="flex-1 flex flex-col justify-end pt-6 pb-2 min-h-[220px]">
            <div className="relative h-44 w-full flex items-end justify-between gap-2 px-2 border-b border-slate-800">
              {/* Daily Limit Threshold line */}
              {trendData[0]?.limit && (
                <div
                  className="absolute left-0 right-0 border-t-2 border-dashed border-rose-400/60 z-10 pointer-events-none"
                  style={{
                    bottom: `${Math.min((trendData[0].limit / maxTrendVal) * 100, 95)}%`,
                  }}
                >
                  <span className="absolute right-1 -top-4 text-[9px] font-bold text-rose-400 bg-slate-900/90 px-1 rounded">
                    Limit: {formatCurrency(trendData[0].limit, currency)}
                  </span>
                </div>
              )}

              {/* Bars */}
              {trendData.map(d => {
                const heightPercent = Math.min((d.amount / maxTrendVal) * 100, 100);
                const isOverLimit = d.limit && d.amount > d.limit;

                return (
                  <div
                    key={d.label}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Hover Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-700 text-white text-[10px] py-1 px-2 rounded-lg font-mono pointer-events-none whitespace-nowrap z-20 shadow-xl">
                      <div>{d.label}</div>
                      <div className="font-bold text-emerald-400">{formatCurrency(d.amount, currency)}</div>
                    </div>

                    {/* Bar Pillar */}
                    <div
                      className={`w-full max-w-[42px] rounded-t-xl transition-all duration-300 ${
                        isOverLimit
                          ? 'bg-gradient-to-t from-rose-600 to-rose-400 group-hover:from-rose-500 group-hover:to-rose-300'
                          : 'bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300'
                      }`}
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Labels below bars */}
            <div className="flex justify-between gap-2 px-2 pt-2 text-[10px] text-slate-400 font-medium">
              {trendData.map(d => (
                <div key={d.label} className="flex-1 text-center truncate">
                  {d.label}
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method distribution */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium flex items-center gap-1.5 text-slate-300">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Payment Channels
              </span>
              <span className="text-[11px] font-mono">{paymentStats.length} methods</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {paymentStats.map(pm => (
                <div
                  key={pm.mode}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs flex items-center gap-2 font-mono"
                >
                  <span className="text-white font-medium">{pm.mode}</span>
                  <span className="text-emerald-400 font-bold">{pm.percentage}%</span>
                  <span className="text-slate-400 text-[10px]">({formatCurrency(pm.amount, currency)})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

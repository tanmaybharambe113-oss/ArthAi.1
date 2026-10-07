import { UserProfile, Expense, ParticleGoal, ExpenseCategory, RecurringExpense, BankAccountLink } from '../types';

export const CATEGORIES: { name: ExpenseCategory; color: string; icon: string }[] = [
  { name: 'Food & Dining', color: '#f97316', icon: 'Utensils' },
  { name: 'Groceries', color: '#10b981', icon: 'ShoppingCart' },
  { name: 'Commute & Fuel', color: '#06b6d4', icon: 'Fuel' },
  { name: 'Shopping', color: '#ec4899', icon: 'ShoppingBag' },
  { name: 'Bills & Utilities', color: '#8b5cf6', icon: 'Zap' },
  { name: 'Entertainment', color: '#eab308', icon: 'Film' },
  { name: 'Health & Medical', color: '#ef4444', icon: 'HeartPulse' },
  { name: 'Investments', color: '#14b8a6', icon: 'TrendingUp' },
  { name: 'Miscellaneous', color: '#64748b', icon: 'MoreHorizontal' },
];

export const getCategoryColor = (cat: string): string => {
  const match = CATEGORIES.find(c => c.name === cat);
  return match ? match.color : '#64748b';
};

export const getTodayString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export const formatCurrency = (amount: number, currency: string = '₹'): string => {
  return `${currency}${amount.toLocaleString('en-IN')}`;
};

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const isUserBirthday = (dateOfBirth?: string, targetDate: string = getTodayString()): boolean => {
  if (!dateOfBirth) return false;
  try {
    const [, bMonth, bDay] = dateOfBirth.split('-');
    const [, tMonth, tDay] = targetDate.split('-');
    return Boolean(bMonth && bDay && bMonth === tMonth && bDay === tDay);
  } catch {
    return false;
  }
};

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  email: '',
  phone: '',
  dailyLimit: 130,
  currency: '₹',
  isLoggedIn: false,
  joinedAt: new Date().toISOString(),
  dateOfBirth: '',
  isWeeklyScheduleEnabled: false,
  daySpecificLimits: {
    0: 500, // Sunday Special
    1: 130, // Monday
    2: 130, // Tuesday
    3: 130, // Wednesday
    4: 130, // Thursday
    5: 130, // Friday
    6: 130, // Saturday
  },
};

// Realistic sample expenses centered around today
export const getInitialExpenses = (): Expense[] => {
  const today = getTodayString();
  const d = new Date();

  const getDateOffset = (offsetDays: number) => {
    const target = new Date(d);
    target.setDate(target.getDate() + offsetDays);
    return target.toISOString().split('T')[0];
  };

  return [
    {
      id: 'exp-1',
      amount: 320,
      category: 'Food & Dining',
      description: 'South Indian Breakfast & Filter Coffee',
      date: today,
      time: '08:30',
      paymentMode: 'UPI',
      notes: 'Morning treat with colleagues',
    },
    {
      id: 'exp-2',
      amount: 150,
      category: 'Commute & Fuel',
      description: 'Metro card auto-recharge',
      date: today,
      time: '09:15',
      paymentMode: 'UPI',
    },
    {
      id: 'exp-3',
      amount: 480,
      category: 'Groceries',
      description: 'Fresh fruits and dairy essentials',
      date: today,
      time: '18:45',
      paymentMode: 'UPI',
    },
    {
      id: 'exp-4',
      amount: 540,
      category: 'Food & Dining',
      description: 'Team dinner at Biryani House',
      date: today,
      time: '20:15',
      paymentMode: 'Credit Card',
      notes: 'Dinner with project team',
    },
    // Past days in this week
    {
      id: 'exp-5',
      amount: 850,
      category: 'Shopping',
      description: 'Casual cotton t-shirt',
      date: getDateOffset(-1),
      time: '15:20',
      paymentMode: 'Debit Card',
    },
    {
      id: 'exp-6',
      amount: 310,
      category: 'Food & Dining',
      description: 'Lunch box delivery',
      date: getDateOffset(-1),
      time: '13:00',
      paymentMode: 'UPI',
    },
    {
      id: 'exp-7',
      amount: 1250,
      category: 'Bills & Utilities',
      description: 'Broadband Fiber Internet Bill',
      date: getDateOffset(-2),
      time: '11:00',
      paymentMode: 'Net Banking',
    },
    {
      id: 'exp-8',
      amount: 450,
      category: 'Entertainment',
      description: 'Cinema ticket for weekend movie',
      date: getDateOffset(-3),
      time: '19:30',
      paymentMode: 'Credit Card',
    },
    {
      id: 'exp-9',
      amount: 900,
      category: 'Commute & Fuel',
      description: 'Petrol top-up for 2-wheeler',
      date: getDateOffset(-4),
      time: '09:40',
      paymentMode: 'UPI',
    },
    {
      id: 'exp-10',
      amount: 1400,
      category: 'Groceries',
      description: 'Monthly pantry staples & grains',
      date: getDateOffset(-6),
      time: '17:00',
      paymentMode: 'Credit Card',
    },
    {
      id: 'exp-11',
      amount: 500,
      category: 'Health & Medical',
      description: 'Doctor consultation & vitamins',
      date: getDateOffset(-10),
      time: '11:30',
      paymentMode: 'UPI',
    },
    {
      id: 'exp-12',
      amount: 2500,
      category: 'Investments',
      description: 'Monthly Index Fund SIP Auto-Debit',
      date: getDateOffset(-15),
      time: '06:00',
      paymentMode: 'Net Banking',
      notes: 'Disciplined monthly mutual fund',
    },
  ];
};

export const getInitialParticles = (): ParticleGoal[] => {
  return [
    {
      id: 'part-1',
      title: 'Emergency 3-Month Fund',
      targetAmount: 50000,
      currentSaved: 32500,
      deadline: '2026-12-31',
      category: 'Suraksha (Safety)',
      icon: 'Shield',
      color: '#10b981',
      createdAt: '2026-08-01',
      linkedBank: {
        bankName: 'HDFC Bank',
        accountNumberMasked: '•••• 4812',
        accountType: 'Savings',
        ifscCode: 'HDFC0001234',
        mandateDailyAmount: 150,
        isMandateActive: true,
        linkedAt: '2026-08-01',
      },
    },
    {
      id: 'part-2',
      title: 'New High-Performance Laptop',
      targetAmount: 75000,
      currentSaved: 42000,
      deadline: '2026-11-20',
      category: 'Desires & Work',
      icon: 'Laptop',
      color: '#3b82f6',
      createdAt: '2026-09-01',
      linkedBank: {
        bankName: 'State Bank of India (SBI)',
        accountNumberMasked: '•••• 9921',
        accountType: 'Savings',
        ifscCode: 'SBIN0004921',
        mandateDailyAmount: 200,
        isMandateActive: true,
        linkedAt: '2026-09-01',
      },
    },
    {
      id: 'part-3',
      title: "Parents' Health & Tirupati Trip",
      targetAmount: 30000,
      currentSaved: 18500,
      deadline: '2027-01-15',
      category: 'Family Blessings',
      icon: 'Heart',
      color: '#f59e0b',
      createdAt: '2026-09-15',
    },
  ];
};

const STORAGE_KEYS = {
  USER: 'dhangyan_user_profile',
  EXPENSES: 'dhangyan_expenses',
  PARTICLES: 'dhangyan_particle_goals',
  RECURRING: 'dhangyan_recurring_expenses',
  SAVED_BANKS: 'arthai_saved_bank_accounts',
};

export const loadUserProfile = (): UserProfile => {
  const saved = localStorage.getItem(STORAGE_KEYS.USER);
  if (!saved) return DEFAULT_PROFILE;
  try {
    return JSON.parse(saved);
  } catch {
    return DEFAULT_PROFILE;
  }
};

export const saveUserProfile = (profile: UserProfile): void => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
};

export const loadExpenses = (): Expense[] => {
  const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
  if (!saved) {
    const initial = getInitialExpenses();
    saveExpenses(initial);
    return initial;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
};

export const saveExpenses = (expenses: Expense[]): void => {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
};

export const loadParticleGoals = (): ParticleGoal[] => {
  const saved = localStorage.getItem(STORAGE_KEYS.PARTICLES);
  if (!saved) {
    const initial = getInitialParticles();
    saveParticleGoals(initial);
    return initial;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
};

export const saveParticleGoals = (goals: ParticleGoal[]): void => {
  localStorage.setItem(STORAGE_KEYS.PARTICLES, JSON.stringify(goals));
};

export const getSavedBankAccounts = (particleGoals: ParticleGoal[] = []): BankAccountLink[] => {
  const bankMap = new Map<string, BankAccountLink>();

  // Default initial banks
  const initialBanks: BankAccountLink[] = [
    {
      bankName: 'HDFC Bank',
      accountNumberMasked: '•••• 4812',
      accountType: 'Savings',
      ifscCode: 'HDFC0001234',
      mandateDailyAmount: 150,
      isMandateActive: true,
      linkedAt: '2026-08-01',
    },
    {
      bankName: 'State Bank of India (SBI)',
      accountNumberMasked: '•••• 9921',
      accountType: 'Savings',
      ifscCode: 'SBIN0004921',
      mandateDailyAmount: 200,
      isMandateActive: true,
      linkedAt: '2026-09-01',
    },
  ];
  initialBanks.forEach(b => bankMap.set(`${b.bankName}-${b.accountNumberMasked}`, b));

  // Load from explicit saved storage
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_BANKS);
    if (raw) {
      const parsed: BankAccountLink[] = JSON.parse(raw);
      parsed.forEach(b => bankMap.set(`${b.bankName}-${b.accountNumberMasked}`, b));
    }
  } catch {}

  // Collect from active particle goals
  particleGoals.forEach(g => {
    if (g.linkedBank) {
      bankMap.set(`${g.linkedBank.bankName}-${g.linkedBank.accountNumberMasked}`, g.linkedBank);
    }
  });

  return Array.from(bankMap.values());
};

export const saveCustomBankAccount = (bank: BankAccountLink): void => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_BANKS);
    const existing: BankAccountLink[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter(
      b => `${b.bankName}-${b.accountNumberMasked}` !== `${bank.bankName}-${bank.accountNumberMasked}`
    );
    filtered.push(bank);
    localStorage.setItem(STORAGE_KEYS.SAVED_BANKS, JSON.stringify(filtered));
  } catch {}
};

// Daily Limit Calculation Helper
export interface DailyLimitStatus {
  todayTotal: number;
  limit: number;
  diff: number; // positive = over, negative = under
  percentage: number; // percentage extra or percentage saved
  isOverLimit: boolean;
  statusText: string;
  usageRatio: number; // e.g. 1.24 (124%) or 0.72 (72%)
  isBirthday?: boolean;
  isCustomDayLimit?: boolean;
  dayName?: string;
}

export const calculateDailyLimitStatus = (
  expenses: Expense[],
  userOrLimit: UserProfile | number,
  targetDate: string = getTodayString()
): DailyLimitStatus => {
  const todayExpenses = expenses.filter(e => e.date === targetDate);
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const isProfile = typeof userOrLimit === 'object' && userOrLimit !== null;
  const userProfile = isProfile ? (userOrLimit as UserProfile) : null;
  const baseLimit = isProfile ? userProfile!.dailyLimit : (userOrLimit as number);
  const currency = userProfile?.currency || '₹';

  const targetDateObj = new Date(targetDate + 'T00:00:00');
  const dayIndex = targetDateObj.getDay();
  const dayName = DAY_NAMES[dayIndex] || 'Today';

  // Check 1: User's Birthday (Spend freely, it's their special day!)
  if (userProfile?.dateOfBirth && isUserBirthday(userProfile.dateOfBirth, targetDate)) {
    return {
      todayTotal,
      limit: 0,
      diff: 0,
      percentage: 0,
      isOverLimit: false,
      statusText: `🎉 Happy Birthday! It's your day — spend freely with no budget limits today!`,
      usageRatio: 0,
      isBirthday: true,
      dayName,
    };
  }

  // Check 2: Day-of-week custom schedule (e.g. Mon-Sat 130, Sun special 500)
  let effectiveLimit = baseLimit;
  let isCustomDayLimit = false;

  if (userProfile?.isWeeklyScheduleEnabled && userProfile.daySpecificLimits) {
    const dayValue = userProfile.daySpecificLimits[dayIndex];
    if (dayValue !== undefined && dayValue > 0) {
      effectiveLimit = dayValue;
      isCustomDayLimit = true;
    }
  }

  if (effectiveLimit <= 0) {
    return {
      todayTotal,
      limit: 0,
      diff: todayTotal,
      percentage: 100,
      isOverLimit: todayTotal > 0,
      statusText: 'No daily limit set',
      usageRatio: 1,
      isBirthday: false,
      isCustomDayLimit,
      dayName,
    };
  }

  const usageRatio = todayTotal / effectiveLimit;

  if (todayTotal > effectiveLimit) {
    const extra = todayTotal - effectiveLimit;
    const percentage = Math.round((extra / effectiveLimit) * 100);
    const dayPrefix = isCustomDayLimit ? `${dayName} limit (${formatCurrency(effectiveLimit, currency)})` : 'daily limit';
    return {
      todayTotal,
      limit: effectiveLimit,
      diff: extra,
      percentage,
      isOverLimit: true,
      statusText: `You spent ${percentage}% extra over your ${dayPrefix} today!`,
      usageRatio,
      isBirthday: false,
      isCustomDayLimit,
      dayName,
    };
  } else {
    const saved = effectiveLimit - todayTotal;
    const percentage = Math.round((saved / effectiveLimit) * 100);
    const dayPrefix = isCustomDayLimit ? `${dayName} limit (${formatCurrency(effectiveLimit, currency)})` : 'daily limit';
    return {
      todayTotal,
      limit: effectiveLimit,
      diff: -saved,
      percentage,
      isOverLimit: false,
      statusText: `You are ${percentage}% under your ${dayPrefix} (${percentage}% saved)!`,
      usageRatio,
      isBirthday: false,
      isCustomDayLimit,
      dayName,
    };
  }
};

// Recurring Expenses Utilities
export const getInitialRecurringExpenses = (): RecurringExpense[] => {
  return [
    {
      id: 'rec-1',
      title: 'Broadband High-Speed WiFi',
      amount: 1199,
      category: 'Bills & Utilities',
      paymentMode: 'Net Banking',
      frequency: 'monthly',
      nextDueDate: '2026-10-15',
      isActive: true,
      autoLogToDaily: true,
      notes: 'Fiber 200 Mbps plan',
    },
    {
      id: 'rec-2',
      title: 'Netflix & Spotify Family Bundle',
      amount: 799,
      category: 'Entertainment',
      paymentMode: 'Credit Card',
      frequency: 'monthly',
      nextDueDate: '2026-10-20',
      isActive: true,
      autoLogToDaily: false,
      notes: 'Entertainment subscriptions',
    },
    {
      id: 'rec-3',
      title: 'Apartment Maintenance / Water',
      amount: 2500,
      category: 'Bills & Utilities',
      paymentMode: 'UPI',
      frequency: 'monthly',
      nextDueDate: '2026-10-10',
      isActive: true,
      autoLogToDaily: true,
      notes: 'Society maintenance fee',
    },
    {
      id: 'rec-4',
      title: 'Nifty 50 Index Mutual Fund SIP',
      amount: 5000,
      category: 'Investments',
      paymentMode: 'Net Banking',
      frequency: 'monthly',
      nextDueDate: '2026-10-05',
      isActive: true,
      autoLogToDaily: false,
      notes: 'Disciplined monthly index wealth',
    },
  ];
};

export const loadRecurringExpenses = (): RecurringExpense[] => {
  const saved = localStorage.getItem(STORAGE_KEYS.RECURRING);
  if (!saved) {
    const initial = getInitialRecurringExpenses();
    saveRecurringExpenses(initial);
    return initial;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
};

export const saveRecurringExpenses = (list: RecurringExpense[]): void => {
  localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(list));
};

export const calculateMonthlyRecurringBurden = (list: RecurringExpense[]): number => {
  return list
    .filter(item => item.isActive)
    .reduce((sum, item) => {
      switch (item.frequency) {
        case 'daily':
          return sum + item.amount * 30;
        case 'weekly':
          return sum + item.amount * 4.33;
        case 'monthly':
          return sum + item.amount;
        case 'yearly':
          return sum + item.amount / 12;
        default:
          return sum + item.amount;
      }
    }, 0);
};

// CSV Export and Import Utilities
export const generateCSVString = (expenses: Expense[], currency: string = '₹'): string => {
  const headers = ['ID', 'Date', 'Time', 'Category', 'Description', `Amount (${currency})`, 'Payment Mode', 'Notes'];
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

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

export const parseCSVToExpenses = (csvText: string): { expenses: Expense[]; error?: string } => {
  try {
    const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return { expenses: [], error: 'CSV file contains no data rows.' };
    }

    const result: Expense[] = [];
    const today = getTodayString();

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Regex to split by comma ignoring commas inside quotes
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));

      if (parts.length >= 5) {
        // Find amount (number)
        let amount = 0;
        let date = today;
        let time = '12:00';
        let category: ExpenseCategory = 'Miscellaneous';
        let description = 'Imported Expense';
        let paymentMode: any = 'UPI';
        let notes = '';

        // Match parts by index or heuristic
        if (parts.length >= 6) {
          date = parts[1] || today;
          time = parts[2] || '12:00';
          category = (parts[3] as ExpenseCategory) || 'Miscellaneous';
          description = parts[4] || 'Expense';
          amount = parseFloat(parts[5]) || 0;
          paymentMode = parts[6] || 'UPI';
          notes = parts[7] || 'Imported via CSV';
        } else {
          // generic fallback
          amount = parseFloat(parts[2]) || parseFloat(parts[1]) || 100;
          description = parts[0] || 'Imported Item';
        }

        if (amount > 0) {
          result.push({
            id: `imp-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
            amount,
            category,
            description,
            date,
            time,
            paymentMode,
            notes,
          });
        }
      }
    }

    return { expenses: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error parsing CSV';
    return { expenses: [], error: msg };
  }
};


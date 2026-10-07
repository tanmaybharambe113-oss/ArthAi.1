export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  dailyLimit: number;
  currency: string;
  isLoggedIn: boolean;
  joinedAt: string;
  dateOfBirth?: string; // YYYY-MM-DD (includes year)
  daySpecificLimits?: Record<number, number>; // 0: Sunday, 1: Monday, ..., 6: Saturday
  isWeeklyScheduleEnabled?: boolean;
}

export interface BankAccountLink {
  bankName: string;
  accountNumberMasked: string;
  accountType: 'Savings' | 'Current';
  ifscCode?: string;
  mandateDailyAmount?: number;
  isMandateActive?: boolean;
  linkedAt: string;
}

export type ExpenseCategory =
  | 'Food & Dining'
  | 'Groceries'
  | 'Commute & Fuel'
  | 'Shopping'
  | 'Bills & Utilities'
  | 'Entertainment'
  | 'Health & Medical'
  | 'Investments'
  | 'Miscellaneous';

export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Net Banking';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  paymentMode: PaymentMethod;
  notes?: string;
  isReconciled?: boolean;
}

export interface ParticleGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentSaved: number;
  deadline: string; // YYYY-MM-DD
  category: string;
  icon: string;
  color: string;
  createdAt: string;
  linkedBank?: BankAccountLink;
}

export type TimeHorizon = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paymentMode: PaymentMethod;
  frequency: RecurringFrequency;
  nextDueDate: string; // YYYY-MM-DD
  isActive: boolean;
  notes?: string;
  autoLogToDaily: boolean;
  lastLoggedDate?: string;
}

export interface AIHealthReport {
  score: number;
  status: 'Critical' | 'Fair' | 'Good' | 'Excellent';
  summary: string;
  strengths: string[];
  vulnerabilities: string[];
  actionItems: string[];
  dailyBudgetImpact: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

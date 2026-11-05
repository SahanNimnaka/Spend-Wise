export type ApiErrorDetail = {
  field: string;
  message: string;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  error: ApiErrorBody;
};

export type TransactionType = "INCOME" | "EXPENSE";

export type Transaction = {
  id: string;
  title: string;
  amount: string;
  type: TransactionType;
  category: string;
  date: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTransactionPayload = {
  title: string;
  amount: string;
  type: TransactionType;
  category: string;
  date: string;
  description?: string | null;
};

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>;

export type TransactionFilters = {
  type?: TransactionType;
  category?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TransactionListResult = {
  items: Transaction[];
  pagination: Pagination;
};

export type Budget = {
  id: string;
  category: string;
  limit: string;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateBudgetPayload = {
  category: string;
  limit: string;
  month: number;
  year: number;
};

export type UpdateBudgetPayload = Partial<CreateBudgetPayload>;

export type BudgetFilters = {
  month?: number;
  year?: number;
};

export type BudgetListResult = {
  items: Budget[];
  total: number;
};

export type Period = {
  month: number;
  year: number;
};

export type DashboardSummary = {
  period: Period;
  totalBalance: string;
  totalIncome: string;
  totalExpenses: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  monthlyBalance: string;
  budgetLimit: string;
  budgetSpent: string;
  budgetRemaining: string;
  budgetUsagePercentage: number;
  budgetExceeded: boolean;
  overspentAmount: string;
  hasBudget: boolean;
};

export type BudgetOverviewCategory = {
  category: string;
  limit: string | null;
  spent: string;
  remaining: string | null;
  usagePercentage: number | null;
  hasBudget: boolean;
  exceeded: boolean;
  overspentAmount: string;
};

export type DashboardBudgetOverview = {
  period: Period;
  totals: {
    budgetLimit: string;
    spent: string;
    remaining: string;
    usagePercentage: number;
    budgetExceeded: boolean;
    overspentAmount: string;
    hasBudget: boolean;
  };
  categories: BudgetOverviewCategory[];
};

export type DashboardActivityPoint = {
  day: string;
  date: string;
  income: number;
  expenses: number;
};

export type DashboardActivity = {
  period: Period;
  daysInMonth: number;
  transactionCount: number;
  hasActivity: boolean;
  totalIncome: string;
  totalExpenses: string;
  data: DashboardActivityPoint[];
};

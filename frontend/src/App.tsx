import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  Settings,
  Search,
  Bell,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  MoreHorizontal,
  ChevronDown,
  CalendarDays,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { getApiErrorMessage } from "./api/client";
import { useDashboardData } from "./hooks/useDashboardData";
import { useTransactions } from "./hooks/useTransactions";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "./services/transactions";
import type {
  BudgetOverviewCategory,
  CreateTransactionPayload,
  Transaction,
} from "./types/api";
import {
  clampPercentage,
  formatCurrency,
  formatPeriodLabel,
  formatTransactionDate,
  getCurrentPeriod,
  getTodayInputValue,
  normalizeAmountInput,
} from "./utils/format";
import { getTransactionVisual } from "./utils/transactionVisuals";

import "./App.css";

const BUDGET_COLORS = ["green", "blue", "orange"] as const;
const RECENT_TRANSACTION_LIMIT = 8;

const CATEGORY_OPTIONS = [
  "Food & Groceries",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Education",
  "Health",
  "Entertainment",
  "Other",
];

type FeedbackMessage = {
  kind: "success" | "error";
  message: string;
};

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [search, setSearch] = useState("");
  const [period] = useState(getCurrentPeriod);
  const {
    summary,
    overview,
    activity,
    isLoading: isDashboardLoading,
    error: dashboardError,
    reload: reloadDashboard,
  } = useDashboardData(period);
  const {
    items: transactions,
    total: transactionTotal,
    isLoading: isTransactionsLoading,
    error: transactionsError,
    reload: reloadTransactions,
  } = useTransactions(search);

  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("Food & Groceries");
  const [newType, setNewType] = useState<"expense" | "income">("expense");
  const [newDate, setNewDate] = useState(getTodayInputValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const periodLabel = formatPeriodLabel(period);
  const summaryLoading = isDashboardLoading && summary === null;
  const budgetUsagePercentage = summary?.budgetUsagePercentage ?? 0;
  const budgetPercentage = Math.round(budgetUsagePercentage);
  const budgetProgressWidth = clampPercentage(budgetUsagePercentage);
  const visibleTransactions =
    activePage === "Transactions"
      ? transactions
      : transactions.slice(0, RECENT_TRANSACTION_LIMIT);
  const summaryValueClass = summary === null ? "loading-value" : undefined;
  const categoryOptions = CATEGORY_OPTIONS.includes(newCategory)
    ? CATEGORY_OPTIONS
    : [newCategory, ...CATEGORY_OPTIONS];

  function formatSummaryValue(value: string | undefined): string {
    if (value !== undefined) {
      return formatCurrency(value);
    }

    return summaryLoading ? "Loading…" : "—";
  }

  useEffect(() => {
    if (feedback?.kind !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback(null);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [feedback]);

  useEffect(() => {
    if (openMenuId === null) {
      return;
    }

    function handlePointerDown(event: PointerEvent): void {
      const target = event.target;

      if (
        target instanceof Element &&
        target.closest("[data-row-actions]") !== null
      ) {
        return;
      }

      setOpenMenuId(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [openMenuId]);

  function openCreateForm(): void {
    setEditingTransaction(null);
    setFormError(null);
    setNewName("");
    setNewAmount("");
    setNewCategory("Food & Groceries");
    setNewType("expense");
    setNewDate(getTodayInputValue());
    setShowForm(true);
  }

  function openEditForm(transaction: Transaction): void {
    setEditingTransaction(transaction);
    setFormError(null);
    setNewName(transaction.title);
    setNewAmount(transaction.amount);
    setNewCategory(transaction.category);
    setNewType(transaction.type === "INCOME" ? "income" : "expense");
    setNewDate(transaction.date.slice(0, 10));
    setOpenMenuId(null);
    setShowForm(true);
  }

  function closeForm(): void {
    if (submittingRef.current || isSubmitting) {
      return;
    }

    setShowForm(false);
    setEditingTransaction(null);
    setFormError(null);
  }

  function selectTransactionType(type: "expense" | "income"): void {
    setNewType(type);

    if (type === "income") {
      setNewCategory("Income");
    } else if (newCategory === "Income") {
      setNewCategory("Food & Groceries");
    }
  }

  async function addTransaction(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const title = newName.trim();
    const amount = normalizeAmountInput(newAmount);

    if (title.length === 0) {
      setFormError("Description is required.");
      return;
    }

    if (amount === null) {
      setFormError(
        "Enter a valid amount greater than zero with up to 2 decimal places.",
      );
      return;
    }

    if (newDate.length === 0) {
      setFormError("Date is required.");
      return;
    }

    const payload: CreateTransactionPayload = {
      title,
      amount,
      type: newType === "income" ? "INCOME" : "EXPENSE",
      category: newType === "income" ? "Income" : newCategory,
      date: newDate,
    };

    const wasEditing = editingTransaction !== null;

    submittingRef.current = true;
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingTransaction !== null) {
        await updateTransaction(editingTransaction.id, payload);
      } else {
        await createTransaction(payload);
      }

      setShowForm(false);
      setEditingTransaction(null);
      setFeedback({
        kind: "success",
        message: wasEditing ? "Transaction updated." : "Transaction added.",
      });
      await Promise.all([reloadTransactions(), reloadDashboard()]);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  async function handleDelete(transaction: Transaction): Promise<void> {
    setOpenMenuId(null);

    if (!window.confirm(`Delete "${transaction.title}"?`)) {
      return;
    }

    setDeletingId(transaction.id);

    try {
      await deleteTransaction(transaction.id);

      if (editingTransaction?.id === transaction.id) {
        setShowForm(false);
        setEditingTransaction(null);
      }

      setFeedback({ kind: "success", message: "Transaction deleted." });
      await Promise.all([reloadTransactions(), reloadDashboard()]);
    } catch (error) {
      setFeedback({
        kind: "error",
        message: getApiErrorMessage(error),
      });
    } finally {
      setDeletingId(null);
    }
  }

  const navigation = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Transactions", icon: ArrowLeftRight },
    { label: "Budgets", icon: Target },
    { label: "Wallets", icon: Wallet },
  ];

  function renderBudgetItem(
    budget: BudgetOverviewCategory,
    index: number,
  ): React.ReactElement {
    const color = BUDGET_COLORS[index % BUDGET_COLORS.length];
    const percentage = budget.usagePercentage ?? 0;
    const width = clampPercentage(percentage);

    let numbers = "No budget set";

    if (budget.hasBudget && budget.limit !== null) {
      numbers = budget.exceeded
        ? `of ${formatCurrency(budget.limit)} · ${formatCurrency(budget.overspentAmount)} over`
        : `of ${formatCurrency(budget.limit)} · ${formatCurrency(budget.remaining ?? 0)} left`;
    }

    return (
      <div className="budget-item" key={budget.category}>
        <div className="budget-item-top">
          <div className="budget-name">
            <span className={`budget-color ${color}`} />
            <span>{budget.category}</span>
          </div>
          <strong>
            {budget.hasBudget ? `${Math.round(percentage)}%` : "No budget"}
          </strong>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${color}-fill`}
            style={{ width: `${width}%` }}
          />
        </div>
        <div className="budget-numbers">
          <span>{formatCurrency(budget.spent)}</span>
          <span>{numbers}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Wallet size={23} />
          </div>
          <span>
            Spend<span className="brand-accent">Wise</span>
          </span>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? "active" : ""}`}
              onClick={() => setActivePage(label)}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Transactions" && (
                <span className="nav-count">{transactionTotal}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="upgrade-card">
          <div className="upgrade-icon">
            <TrendingUp size={20} />
          </div>
          <h3>Build better habits</h3>
          <p>Small savings today can make a big difference tomorrow.</p>
          <button onClick={() => setActivePage("Budgets")}>
            View my budgets <ArrowUpRight size={15} />
          </button>
        </div>

        <button
          className={`nav-item settings-item ${activePage === "Settings" ? "active" : ""}`}
          onClick={() => setActivePage("Settings")}
        >
          <Settings size={19} />
          <span>Settings</span>
        </button>

        <div className="profile">
          <div className="avatar">S</div>
          <div className="profile-info">
            <strong>My Account</strong>
            <span>Personal workspace</span>
          </div>
          <MoreHorizontal size={20} className="profile-more" />
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <label className="search-box">
              <Search size={17} />
              <input
                aria-label="Search transactions"
                placeholder="Search transactions..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </label>

            <button
              className="icon-button notification-button"
              aria-label="Notifications"
              title="Notifications"
              onClick={() =>
                window.alert(
                  summary === null
                    ? "Budget data is still loading."
                    : summary.hasBudget
                      ? `Budget used: ${budgetPercentage}%. ${budgetPercentage >= 80 ? "Your spending is approaching the limit." : "Your spending is below 80% of the limit."}`
                      : "No monthly budget is set for this month.",
                )
              }
            >
              <Bell size={19} />
              <span />
            </button>

            <button
              className="avatar top-avatar"
              aria-label="My account"
              onClick={() => setActivePage("Settings")}
            >
              S
            </button>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                <span className="status-dot" /> YOUR FINANCIAL OVERVIEW
              </div>
              <h1>
                {activePage === "Overview"
                  ? "Good to see you"
                  : activePage}
                <span className="heading-period">.</span>
              </h1>
              <p className="welcome-subtitle">
                Here's what's happening with your money.
              </p>
            </div>

            <button className="primary-button" onClick={openCreateForm}>
              <Plus size={18} /> Add transaction
            </button>
          </section>

          {feedback !== null && (
            <div
              className={`feedback-banner ${feedback.kind}`}
              role={feedback.kind === "error" ? "alert" : "status"}
            >
              <span>{feedback.message}</span>
              <button
                type="button"
                className="feedback-dismiss"
                aria-label="Dismiss message"
                onClick={() => setFeedback(null)}
              >
                ×
              </button>
            </div>
          )}

          {dashboardError !== null && (
            <div className="feedback-banner error" role="alert">
              <span>{dashboardError}</span>
              <button
                type="button"
                className="feedback-retry"
                onClick={() => void reloadDashboard()}
              >
                Retry
              </button>
            </div>
          )}

          {activePage === "Settings" ? (
            <section className="panel settings-panel">
              <div className="section-heading">
                <div>
                  <h2>Settings</h2>
                  <p>Manage your personal finance preferences.</p>
                </div>
              </div>
              <div className="setting-row">
                <div>
                  <strong>Currency</strong>
                  <p>Display financial values in Sri Lankan Rupees.</p>
                </div>
                <span className="setting-value">LKR · Rs.</span>
              </div>
              <div className="setting-row">
                <div>
                  <strong>Monthly spending limit</strong>
                  <p>Your current overall expense target for {periodLabel}.</p>
                </div>
                <span className="setting-value">
                  {summary === null
                    ? summaryLoading
                      ? "Loading…"
                      : "—"
                    : summary.hasBudget
                      ? formatCurrency(summary.budgetLimit)
                      : "No budget set"}
                </span>
              </div>
              <p className="demo-note">
                Budget limits are read from the budgets API. This dashboard does
                not yet include budget create, edit, or delete controls.
              </p>
            </section>
          ) : (
            <>
              <section className="summary-grid">
                <article className="summary-card balance-card">
                  <div className="card-topline">
                    <span className="card-label">Total balance</span>
                    <span className="metric-icon balance-icon">
                      <Wallet size={19} />
                    </span>
                  </div>
                  <h2 className={summaryValueClass}>
                    {formatSummaryValue(summary?.totalBalance)}
                  </h2>
                  <div className="card-bottomline">
                    <span className="metric-positive">
                      <TrendingUp size={15} /> Current balance
                    </span>
                    <span className="muted-text">From recorded entries</span>
                  </div>
                </article>

                <article className="summary-card">
                  <div className="card-topline">
                    <span className="card-label">Total income</span>
                    <span className="metric-icon income-icon">
                      <ArrowDownLeft size={19} />
                    </span>
                  </div>
                  <h2 className={summaryValueClass}>
                    {formatSummaryValue(summary?.totalIncome)}
                  </h2>
                  <div className="card-bottomline">
                    <span className="metric-positive">
                      <TrendingUp size={15} /> Money received
                    </span>
                    <span className="muted-text">Recorded income</span>
                  </div>
                </article>

                <article className="summary-card">
                  <div className="card-topline">
                    <span className="card-label">Total expenses</span>
                    <span className="metric-icon expense-icon">
                      <ArrowUpRight size={19} />
                    </span>
                  </div>
                  <h2 className={summaryValueClass}>
                    {formatSummaryValue(summary?.totalExpenses)}
                  </h2>
                  <div className="card-bottomline">
                    <span className="metric-expense">
                      <TrendingDown size={15} /> Money spent
                    </span>
                    <span className="muted-text">Recorded expenses</span>
                  </div>
                </article>

                <article className="summary-card">
                  <div className="card-topline">
                    <span className="card-label">Budget remaining</span>
                    <span className="metric-icon budget-icon">
                      <Target size={19} />
                    </span>
                  </div>
                  <h2 className={summaryValueClass}>
                    {formatSummaryValue(summary?.budgetRemaining)}
                  </h2>
                  <div className="card-bottomline">
                    <span
                      className={
                        summary?.hasBudget && budgetPercentage >= 100
                          ? "metric-expense"
                          : "metric-positive"
                      }
                    >
                      {summary === null
                        ? summaryLoading
                          ? "Loading…"
                          : "—"
                        : summary.hasBudget
                          ? `${budgetPercentage}% used`
                          : "No budget set"}
                    </span>
                    <span className="muted-text">
                      {summary?.hasBudget
                        ? "Of monthly limit"
                        : "Set a budget to track usage"}
                    </span>
                  </div>
                </article>
              </section>

              <section className="dashboard-grid">
                <article className="panel chart-panel">
                  <div className="section-heading">
                    <div>
                      <h2>Financial activity</h2>
                      <p>Actual daily income and expenses for this month</p>
                    </div>
                    <button
                      type="button"
                      className="filter-button"
                      title={`Refresh data for ${periodLabel}`}
                      onClick={() => void reloadDashboard()}
                    >
                      <CalendarDays size={16} /> {periodLabel}
                      <ChevronDown size={15} />
                    </button>
                  </div>

                  <div className="chart-legend">
                    <span>
                      <i className="legend-dot income-dot" /> Income
                    </span>
                    <span>
                      <i className="legend-dot expense-dot" /> Expenses
                    </span>
                  </div>

                  <div className="chart-container">
                    {activity === null ? (
                      <div className="chart-placeholder">
                        {isDashboardLoading
                          ? "Loading activity…"
                          : "Activity data is unavailable."}
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={activity.data}
                          margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
                        >
                        <defs>
                          <linearGradient
                            id="incomeGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#16a879"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor="#16a879"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="expenseGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#f59e70"
                              stopOpacity={0.16}
                            />
                            <stop
                              offset="95%"
                              stopColor="#f59e70"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          stroke="#edf0ee"
                          strokeDasharray="4 5"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="day"
                          tick={{ fill: "#929b97", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          tickMargin={12}
                          minTickGap={18}
                        />
                        <YAxis
                          tick={{ fill: "#929b97", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => `${value / 1000}k`}
                          width={38}
                        />
                        <Tooltip
                          formatter={(value, name) => [
                            formatCurrency(Number(value)),
                            name === "income" ? "Income" : "Expenses",
                          ]}
                          labelFormatter={(label) => `${periodLabel} ${label}`}
                          contentStyle={{
                            border: "1px solid #e7ebe8",
                            borderRadius: "12px",
                            fontSize: "12px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="income"
                          stroke="#16a879"
                          strokeWidth={2.5}
                          fill="url(#incomeGradient)"
                        />
                        <Area
                          type="monotone"
                          dataKey="expenses"
                          stroke="#f59e70"
                          strokeWidth={2.5}
                          fill="url(#expenseGradient)"
                        />
                      </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  {activity !== null && !activity.hasActivity && (
                    <p className="chart-note">
                      No activity recorded for {periodLabel}.
                    </p>
                  )}
                </article>

                <article className="panel budget-panel">
                  <div className="section-heading">
                    <div>
                      <h2>Budget overview</h2>
                      <p>Your spending by category</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setActivePage("Budgets")}
                    >
                      See all
                    </button>
                  </div>

                  <div className="overall-budget">
                    <div className="overall-budget-header">
                      <span>Monthly spending</span>
                      <strong>
                        {summary?.hasBudget ? `${budgetPercentage}%` : "—"}
                      </strong>
                    </div>
                    <div className="progress-track overall-track">
                      <div
                        className="progress-fill green-fill"
                        style={{
                          width: `${summary?.hasBudget ? budgetProgressWidth : 0}%`,
                        }}
                      />
                    </div>
                    <p>
                      {summary === null
                        ? summaryLoading
                          ? "Loading budget…"
                          : "Budget data is unavailable."
                        : summary.hasBudget
                          ? `${formatCurrency(summary.budgetSpent)} of ${formatCurrency(summary.budgetLimit)}`
                          : `${formatCurrency(summary.budgetSpent)} spent · No monthly budget set`}
                    </p>
                  </div>

                  <div className="budget-list">
                    {overview === null ? (
                      <div className="empty-state">
                        {isDashboardLoading
                          ? "Loading budgets…"
                          : "Budget data is unavailable."}
                      </div>
                    ) : overview.categories.length === 0 ? (
                      <div className="empty-state">
                        No budgets or expenses for {periodLabel}.
                      </div>
                    ) : (
                      overview.categories.map((budget, index) =>
                        renderBudgetItem(budget, index),
                      )
                    )}
                  </div>
                </article>
              </section>

              <section className="panel transactions-panel">
                <div className="section-heading">
                  <div>
                    <h2>
                      {activePage === "Budgets"
                        ? "Budget details"
                        : activePage === "Wallets"
                          ? "Wallet transactions"
                          : "Recent transactions"}
                    </h2>
                    <p>
                      {activePage === "Transactions"
                        ? "Review and search your recorded transactions."
                        : "A closer look at your financial activity."}
                    </p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setActivePage("Transactions")}
                  >
                    View all <ArrowUpRight size={15} />
                  </button>
                </div>

                <div className="transaction-table">
                  <div className="transaction-table-head">
                    <span>TRANSACTION</span>
                    <span>CATEGORY</span>
                    <span>DATE</span>
                    <span className="amount-column">AMOUNT</span>
                  </div>

                  {isTransactionsLoading && transactions.length === 0 ? (
                    <div className="empty-state">Loading transactions…</div>
                  ) : transactionsError !== null ? (
                    <div className="empty-state transaction-error">
                      <span>{transactionsError}</span>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => void reloadTransactions()}
                      >
                        Retry
                      </button>
                    </div>
                  ) : visibleTransactions.length === 0 ? (
                    <div className="empty-state">
                      {search.trim().length > 0
                        ? `No transactions match "${search.trim()}".`
                        : "No transactions yet. Add your first transaction to get started."}
                    </div>
                  ) : (
                    visibleTransactions.map((transaction) => {
                      const { icon: Icon, color } = getTransactionVisual(
                        transaction.category,
                        transaction.type,
                      );
                      const isIncome = transaction.type === "INCOME";
                      const isDeleting = deletingId === transaction.id;

                      return (
                        <div
                          className={`transaction-row ${isDeleting ? "is-deleting" : ""}`}
                          key={transaction.id}
                        >
                          <div className="transaction-name">
                            <span className={`transaction-icon ${color}`}>
                              <Icon size={18} />
                            </span>
                            <strong>{transaction.title}</strong>
                          </div>
                          <span className="transaction-category">
                            {transaction.category}
                          </span>
                          <span className="transaction-date">
                            {formatTransactionDate(transaction.date)}
                          </span>
                          <div className="transaction-amount-cell">
                            <strong
                              className={`transaction-amount ${isIncome ? "positive-amount" : ""}`}
                            >
                              {isIncome ? "+" : "−"}
                              {formatCurrency(transaction.amount)}
                            </strong>
                            <div
                              className="row-action-wrap"
                              data-row-actions
                            >
                              <button
                                type="button"
                                className="row-action-button"
                                aria-label={`Actions for ${transaction.title}`}
                                aria-expanded={openMenuId === transaction.id}
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === transaction.id
                                      ? null
                                      : transaction.id,
                                  )
                                }
                                disabled={isDeleting}
                              >
                                <MoreHorizontal size={16} />
                              </button>
                              {openMenuId === transaction.id && (
                                <div className="row-action-menu" role="menu">
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => openEditForm(transaction)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    role="menuitem"
                                    className="danger"
                                    onClick={() => void handleDelete(transaction)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <footer className="page-footer">
                <span>SpendWise · Personal Finance</span>
                <span>Made for smarter money habits.</span>
              </footer>
            </>
          )}
        </div>
      </main>

      {showForm && (
        <div className="modal-backdrop" onClick={closeForm}>
          <section
            className="transaction-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 id="transaction-modal-title">
                  {editingTransaction === null
                    ? "Add transaction"
                    : "Edit transaction"}
                </h2>
                <p>
                  {editingTransaction === null
                    ? "Record money coming in or going out."
                    : "Update the details for this transaction."}
                </p>
              </div>
              <button
                className="icon-button"
                aria-label="Close"
                onClick={closeForm}
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>

            <form onSubmit={addTransaction} aria-busy={isSubmitting}>
              <label className="form-label">Transaction type</label>
              <div className="type-toggle">
                <button
                  type="button"
                  className={newType === "expense" ? "selected" : ""}
                  onClick={() => selectTransactionType("expense")}
                  disabled={isSubmitting}
                >
                  <TrendingDown size={17} /> Expense
                </button>
                <button
                  type="button"
                  className={newType === "income" ? "selected" : ""}
                  onClick={() => selectTransactionType("income")}
                  disabled={isSubmitting}
                >
                  <TrendingUp size={17} /> Income
                </button>
              </div>

              <label className="form-label" htmlFor="transaction-name">
                Description
              </label>
              <input
                id="transaction-name"
                className="form-input"
                placeholder="e.g. Grocery shopping"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                required
                maxLength={100}
                disabled={isSubmitting}
              />

              <label className="form-label" htmlFor="transaction-amount">
                Amount (Rs.)
              </label>
              <input
                id="transaction-amount"
                className="form-input"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={newAmount}
                onChange={(event) => setNewAmount(event.target.value)}
                required
                disabled={isSubmitting}
              />

              {newType === "expense" && (
                <>
                  <label className="form-label" htmlFor="transaction-category">
                    Category
                  </label>
                  <select
                    id="transaction-category"
                    className="form-input"
                    value={newCategory}
                    onChange={(event) => setNewCategory(event.target.value)}
                    disabled={isSubmitting}
                  >
                    {categoryOptions.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </>
              )}

              <label className="form-label" htmlFor="transaction-date">
                Date
              </label>
              <input
                id="transaction-date"
                className="form-input"
                type="date"
                value={newDate}
                onChange={(event) => setNewDate(event.target.value)}
                required
                disabled={isSubmitting}
              />

              {formError !== null && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}

              <button
                className="primary-button submit-button"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  editingTransaction === null ? (
                    "Saving…"
                  ) : (
                    "Updating…"
                  )
                ) : (
                  <>
                    <Plus size={18} />
                    {editingTransaction === null
                      ? "Save transaction"
                      : "Save changes"}
                  </>
                )}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
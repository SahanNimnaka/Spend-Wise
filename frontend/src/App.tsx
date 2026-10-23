import { useState } from "react";
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
  Coffee,
  ShoppingBag,
  Car,
  Zap,
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

import "./App.css";

const chartData = [
  { day: "01", income: 12000, expenses: 5000 },
  { day: "05", income: 18000, expenses: 9000 },
  { day: "09", income: 16000, expenses: 7000 },
  { day: "13", income: 24000, expenses: 12000 },
  { day: "17", income: 21000, expenses: 10000 },
  { day: "21", income: 30000, expenses: 15000 },
  { day: "25", income: 27000, expenses: 13000 },
  { day: "30", income: 35000, expenses: 17000 },
];

const initialTransactions = [
  {
    id: 1,
    name: "Grocery Shopping",
    category: "Food & Groceries",
    date: "Today, 10:42 AM",
    amount: -4250,
    icon: ShoppingBag,
    color: "orange",
  },
  {
    id: 2,
    name: "Monthly Salary",
    category: "Income",
    date: "Today, 9:15 AM",
    amount: 85000,
    icon: Wallet,
    color: "green",
  },
  {
    id: 3,
    name: "Coffee Shop",
    category: "Food & Drinks",
    date: "Yesterday, 4:30 PM",
    amount: -850,
    icon: Coffee,
    color: "purple",
  },
  {
    id: 4,
    name: "Transportation",
    category: "Travel",
    date: "Yesterday, 8:20 AM",
    amount: -1200,
    icon: Car,
    color: "blue",
  },
  {
    id: 5,
    name: "Electricity Bill",
    category: "Utilities",
    date: "22 Oct 2026",
    amount: -3200,
    icon: Zap,
    color: "yellow",
  },
];

const initialBudgets = [
  { name: "Food & Groceries", spent: 12500, limit: 20000, color: "green" },
  { name: "Transportation", spent: 6500, limit: 10000, color: "blue" },
  { name: "Shopping", spent: 8200, limit: 10000, color: "orange" },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("LKR", "Rs.");

type Transaction = (typeof initialTransactions)[number];

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("Food & Groceries");
  const [newType, setNewType] = useState<"expense" | "income">("expense");
  const [newDate, setNewDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  const totalIncome = transactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.amount < 0)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  const balance = totalIncome - totalExpenses;
  const monthlyBudget = 50000;
  const budgetPercentage = Math.min(
    100,
    Math.round((totalExpenses / monthlyBudget) * 100),
  );

  const filteredTransactions = transactions.filter((transaction) =>
    `${transaction.name} ${transaction.category}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  function addTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amount = Number(newAmount);

    if (!newName.trim() || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now(),
      name: newName.trim(),
      category: newType === "income" ? "Income" : newCategory,
      date: `${newDate} (manual entry)`,
      amount: newType === "income" ? amount : -amount,
      icon: newType === "income" ? Wallet : ShoppingBag,
      color: newType === "income" ? "green" : "orange",
    };

    setTransactions((previous) => [newTransaction, ...previous]);
    setNewName("");
    setNewAmount("");
    setShowForm(false);
  }

  const navigation = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Transactions", icon: ArrowLeftRight },
    { label: "Budgets", icon: Target },
    { label: "Wallets", icon: Wallet },
  ];

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
                <span className="nav-count">{transactions.length}</span>
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
                  `Budget used: ${budgetPercentage}%. ${budgetPercentage >= 80 ? "Your spending is approaching the limit." : "Your spending is below 80% of the limit."}`,
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

            <button
              className="primary-button"
              onClick={() => setShowForm(true)}
            >
              <Plus size={18} /> Add transaction
            </button>
          </section>

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
                  <p>Your current overall expense target.</p>
                </div>
                <span className="setting-value">
                  {formatCurrency(monthlyBudget)}
                </span>
              </div>
              <p className="demo-note">
                These preferences are currently demonstration values.
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
                  <h2>{formatCurrency(balance)}</h2>
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
                  <h2>{formatCurrency(totalIncome)}</h2>
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
                  <h2>{formatCurrency(totalExpenses)}</h2>
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
                  <h2>{formatCurrency(monthlyBudget - totalExpenses)}</h2>
                  <div className="card-bottomline">
                    <span
                      className={
                        budgetPercentage >= 100
                          ? "metric-expense"
                          : "metric-positive"
                      }
                    >
                      {budgetPercentage}% used
                    </span>
                    <span className="muted-text">Of monthly limit</span>
                  </div>
                </article>
              </section>

              <section className="dashboard-grid">
                <article className="panel chart-panel">
                  <div className="section-heading">
                    <div>
                      <h2>Financial activity</h2>
                      <p>Illustrative daily trends for this month</p>
                    </div>
                    <button className="filter-button">
                      <CalendarDays size={16} /> October 2026
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
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
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
                          labelFormatter={(label) => `October ${label}`}
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
                  </div>
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
                      <strong>{budgetPercentage}%</strong>
                    </div>
                    <div className="progress-track overall-track">
                      <div
                        className="progress-fill green-fill"
                        style={{ width: `${budgetPercentage}%` }}
                      />
                    </div>
                    <p>
                      {formatCurrency(totalExpenses)} of{" "}
                      {formatCurrency(monthlyBudget)}
                    </p>
                  </div>

                  <div className="budget-list">
                    {initialBudgets.map((budget) => {
                      const percentage = Math.min(
                        100,
                        Math.round((budget.spent / budget.limit) * 100),
                      );

                      return (
                        <div className="budget-item" key={budget.name}>
                          <div className="budget-item-top">
                            <div className="budget-name">
                              <span
                                className={`budget-color ${budget.color}`}
                              />
                              <span>{budget.name}</span>
                            </div>
                            <strong>{percentage}%</strong>
                          </div>
                          <div className="progress-track">
                            <div
                              className={`progress-fill ${budget.color}-fill`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="budget-numbers">
                            <span>{formatCurrency(budget.spent)}</span>
                            <span>of {formatCurrency(budget.limit)}</span>
                          </div>
                        </div>
                      );
                    })}
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

                  {filteredTransactions.length === 0 ? (
                    <div className="empty-state">
                      No transactions match your search.
                    </div>
                  ) : (
                    filteredTransactions.map((transaction) => {
                      const Icon = transaction.icon;

                      return (
                        <div
                          className="transaction-row"
                          key={transaction.id}
                        >
                          <div className="transaction-name">
                            <span
                              className={`transaction-icon ${transaction.color}`}
                            >
                              <Icon size={18} />
                            </span>
                            <strong>{transaction.name}</strong>
                          </div>
                          <span className="transaction-category">
                            {transaction.category}
                          </span>
                          <span className="transaction-date">
                            {transaction.date}
                          </span>
                          <strong
                            className={`transaction-amount ${transaction.amount > 0 ? "positive-amount" : ""}`}
                          >
                            {transaction.amount > 0 ? "+" : "−"}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </strong>
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
        <div
          className="modal-backdrop"
          onClick={() => setShowForm(false)}
        >
          <section
            className="transaction-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 id="transaction-modal-title">Add transaction</h2>
                <p>Record money coming in or going out.</p>
              </div>
              <button
                className="icon-button"
                aria-label="Close"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={addTransaction}>
              <label className="form-label">Transaction type</label>
              <div className="type-toggle">
                <button
                  type="button"
                  className={newType === "expense" ? "selected" : ""}
                  onClick={() => setNewType("expense")}
                >
                  <TrendingDown size={17} /> Expense
                </button>
                <button
                  type="button"
                  className={newType === "income" ? "selected" : ""}
                  onClick={() => setNewType("income")}
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
                  >
                    <option>Food & Groceries</option>
                    <option>Transportation</option>
                    <option>Shopping</option>
                    <option>Bills & Utilities</option>
                    <option>Education</option>
                    <option>Health</option>
                    <option>Entertainment</option>
                    <option>Other</option>
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
              />

              <button className="primary-button submit-button" type="submit">
                <Plus size={18} /> Save transaction
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import type {
  DashboardActivity,
  DashboardBudgetOverview,
  DashboardSummary,
} from "../src/services/dashboard.service.js";
import {
  errorData,
  resetDatabase,
  successData,
} from "./helpers.js";

async function seedDashboardData(): Promise<void> {
  await prisma.budget.createMany({
    data: [
      { category: "Food & Groceries", limit: "20000.00", month: 11, year: 2026 },
      { category: "Transportation", limit: "10000.00", month: 11, year: 2026 },
    ],
  });

  await prisma.transaction.createMany({
    data: [
      {
        title: "November Salary",
        amount: "100000.00",
        type: "INCOME",
        category: "Income",
        date: new Date(Date.UTC(2026, 10, 1)),
      },
      {
        title: "Groceries",
        amount: "12000.00",
        type: "EXPENSE",
        category: "Food & Groceries",
        date: new Date(Date.UTC(2026, 10, 5)),
      },
      {
        title: "Bus Pass",
        amount: "2000.00",
        type: "EXPENSE",
        category: "Transportation",
        date: new Date(Date.UTC(2026, 10, 6)),
      },
      {
        title: "Cinema",
        amount: "1500.00",
        type: "EXPENSE",
        category: "Entertainment",
        date: new Date(Date.UTC(2026, 10, 7)),
      },
      {
        title: "October Salary",
        amount: "50000.00",
        type: "INCOME",
        category: "Income",
        date: new Date(Date.UTC(2026, 9, 31)),
      },
      {
        title: "October Rent",
        amount: "30000.00",
        type: "EXPENSE",
        category: "Bills & Utilities",
        date: new Date(Date.UTC(2026, 9, 15)),
      },
    ],
  });
}

describe("Dashboard API", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("returns correct lifetime and monthly totals", async () => {
    await seedDashboardData();

    const response = await request(app)
      .get("/api/dashboard/summary?month=11&year=2026")
      .expect(200);
    const summary = successData<DashboardSummary>(response);

    expect(summary).toMatchObject({
      period: { month: 11, year: 2026 },
      totalIncome: "150000.00",
      totalExpenses: "45500.00",
      totalBalance: "104500.00",
      monthlyIncome: "100000.00",
      monthlyExpenses: "15500.00",
      monthlyBalance: "84500.00",
    });
  });

  it("calculates budget usage and remaining amounts", async () => {
    await seedDashboardData();

    const response = await request(app)
      .get("/api/dashboard/summary?month=11&year=2026")
      .expect(200);
    const summary = successData<DashboardSummary>(response);

    expect(summary).toMatchObject({
      budgetLimit: "30000.00",
      budgetSpent: "15500.00",
      budgetRemaining: "14500.00",
      budgetUsagePercentage: 51.67,
      budgetExceeded: false,
      overspentAmount: "0.00",
      hasBudget: true,
    });
  });

  it("returns category spending, limits, and unbudgeted categories", async () => {
    await seedDashboardData();

    const response = await request(app)
      .get("/api/dashboard/budgets?month=11&year=2026")
      .expect(200);
    const overview = successData<DashboardBudgetOverview>(response);

    expect(overview.totals).toEqual({
      budgetLimit: "30000.00",
      spent: "15500.00",
      remaining: "14500.00",
      usagePercentage: 51.67,
      budgetExceeded: false,
      overspentAmount: "0.00",
      hasBudget: true,
    });
    expect(overview.categories).toHaveLength(3);

    const food = overview.categories.find(
      (category) => category.category === "Food & Groceries",
    );
    expect(food).toMatchObject({
      limit: "20000.00",
      spent: "12000.00",
      remaining: "8000.00",
      usagePercentage: 60,
      hasBudget: true,
    });

    const entertainment = overview.categories.find(
      (category) => category.category === "Entertainment",
    );
    expect(entertainment).toMatchObject({
      limit: null,
      spent: "1500.00",
      remaining: null,
      usagePercentage: null,
      hasBudget: false,
    });
  });

  it("returns continuous daily activity data", async () => {
    await seedDashboardData();

    const response = await request(app)
      .get("/api/dashboard/activity?month=11&year=2026")
      .expect(200);
    const activity = successData<DashboardActivity>(response);

    expect(activity).toMatchObject({
      daysInMonth: 30,
      transactionCount: 4,
      hasActivity: true,
      totalIncome: "100000.00",
      totalExpenses: "15500.00",
    });
    expect(activity.data).toHaveLength(30);

    const days = new Map(activity.data.map((point) => [point.day, point]));
    expect(days.get("01")).toMatchObject({ income: 100000, expenses: 0 });
    expect(days.get("05")).toMatchObject({ income: 0, expenses: 12000 });
    expect(days.get("06")).toMatchObject({ income: 0, expenses: 2000 });
    expect(days.get("07")).toMatchObject({ income: 0, expenses: 1500 });
    expect(days.get("30")).toMatchObject({ income: 0, expenses: 0 });
  });

  it("filters dashboard data by month and year", async () => {
    await seedDashboardData();

    const summaryResponse = await request(app)
      .get("/api/dashboard/summary?month=10&year=2026")
      .expect(200);
    const october = successData<DashboardSummary>(summaryResponse);

    expect(october).toMatchObject({
      monthlyIncome: "50000.00",
      monthlyExpenses: "30000.00",
      monthlyBalance: "20000.00",
      budgetLimit: "0.00",
      hasBudget: false,
    });

    const activityResponse = await request(app)
      .get("/api/dashboard/activity?month=10&year=2026")
      .expect(200);
    const octoberActivity = successData<DashboardActivity>(activityResponse);

    expect(octoberActivity).toMatchObject({
      daysInMonth: 31,
      transactionCount: 2,
      totalIncome: "50000.00",
      totalExpenses: "30000.00",
    });

    const overviewResponse = await request(app)
      .get("/api/dashboard/budgets?month=10&year=2026")
      .expect(200);
    const octoberOverview =
      successData<DashboardBudgetOverview>(overviewResponse);

    expect(octoberOverview.totals).toMatchObject({
      budgetLimit: "0.00",
      spent: "30000.00",
      hasBudget: false,
    });
    expect(octoberOverview.categories).toHaveLength(1);
    expect(octoberOverview.categories[0]).toMatchObject({
      category: "Bills & Utilities",
      hasBudget: false,
      spent: "30000.00",
    });
  });

  it("handles an empty database with zero values", async () => {
    const summaryResponse = await request(app)
      .get("/api/dashboard/summary?month=11&year=2026")
      .expect(200);
    const summary = successData<DashboardSummary>(summaryResponse);

    expect(summary).toMatchObject({
      totalBalance: "0.00",
      totalIncome: "0.00",
      totalExpenses: "0.00",
      monthlyIncome: "0.00",
      monthlyExpenses: "0.00",
      budgetLimit: "0.00",
      budgetRemaining: "0.00",
      budgetUsagePercentage: 0,
      hasBudget: false,
    });

    const overviewResponse = await request(app)
      .get("/api/dashboard/budgets?month=11&year=2026")
      .expect(200);
    const overview = successData<DashboardBudgetOverview>(overviewResponse);

    expect(overview.categories).toEqual([]);
    expect(overview.totals).toMatchObject({
      budgetLimit: "0.00",
      spent: "0.00",
      hasBudget: false,
    });

    const activityResponse = await request(app)
      .get("/api/dashboard/activity?month=11&year=2026")
      .expect(200);
    const activity = successData<DashboardActivity>(activityResponse);

    expect(activity).toMatchObject({
      daysInMonth: 30,
      transactionCount: 0,
      hasActivity: false,
      totalIncome: "0.00",
      totalExpenses: "0.00",
    });
    expect(activity.data).toHaveLength(30);
    expect(
      activity.data.every(
        (point) => point.income === 0 && point.expenses === 0,
      ),
    ).toBe(true);
  });

  it("rejects invalid period parameters", async () => {
    const monthResponse = await request(app)
      .get("/api/dashboard/summary?month=13")
      .expect(400);
    expect(errorData(monthResponse).details?.[0]?.field).toBe("month");

    const yearResponse = await request(app)
      .get("/api/dashboard/activity?year=1999")
      .expect(400);
    expect(errorData(yearResponse).details?.[0]?.field).toBe("year");
  });
});

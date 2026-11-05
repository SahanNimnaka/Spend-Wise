import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../src/app.js";
import type { SerializedBudget } from "../src/services/budget.service.js";
import {
  errorData,
  resetDatabase,
  successData,
  type BudgetPayload,
} from "./helpers.js";

const validBudget: BudgetPayload = {
  category: "Food & Groceries",
  limit: "20000.00",
  month: 11,
  year: 2026,
};

function createBudget(overrides: Partial<BudgetPayload> = {}) {
  return request(app)
    .post("/api/budgets")
    .send({ ...validBudget, ...overrides });
}

describe("Budgets API", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates a valid budget", async () => {
    const response = await createBudget().expect(201);
    const budget = successData<SerializedBudget>(response);

    expect(budget).toMatchObject({
      category: "Food & Groceries",
      limit: "20000.00",
      month: 11,
      year: 2026,
    });
    expect(budget.id).toEqual(expect.any(String));
  });

  it.each([0, 13, "abc", 1.5])("rejects invalid month %s", async (month) => {
    const response = await createBudget({ month }).expect(400);
    const error = errorData(response);

    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details?.[0]?.field).toBe("month");
  });

  it.each([1999, 2101])("rejects unreasonable year %s", async (year) => {
    const response = await createBudget({ year }).expect(400);

    expect(errorData(response).details?.[0]?.field).toBe("year");
  });

  it.each(["0", "0.00", "-1", "abc", "1.234", "10000000000.00"])(
    "rejects invalid budget limit %s",
    async (limit) => {
      const response = await createBudget({ limit }).expect(400);
      const error = errorData(response);

      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.details?.[0]?.field).toBe("limit");
    },
  );

  it("prevents duplicate budgets for the same period", async () => {
    await createBudget().expect(201);

    const response = await createBudget().expect(409);
    const error = errorData(response);

    expect(error.code).toBe("BUDGET_ALREADY_EXISTS");
    expect(error.details?.[0]?.field).toBe("category");
  });

  it("treats category duplicates case-insensitively", async () => {
    await createBudget().expect(201);

    const response = await createBudget({
      category: "food & groceries",
    }).expect(409);

    expect(errorData(response).code).toBe("BUDGET_ALREADY_EXISTS");
  });

  it("updates a budget", async () => {
    const created = successData<SerializedBudget>(
      await createBudget().expect(201),
    );

    const response = await request(app)
      .put(`/api/budgets/${created.id}`)
      .send({
        category: "Transportation",
        limit: "15000.00",
        month: 12,
        year: 2026,
      })
      .expect(200);

    expect(successData<SerializedBudget>(response)).toMatchObject({
      id: created.id,
      category: "Transportation",
      limit: "15000.00",
      month: 12,
      year: 2026,
    });
  });

  it("prevents updating a budget into an existing period", async () => {
    await createBudget().expect(201);
    const second = successData<SerializedBudget>(
      await createBudget({
        category: "Transportation",
        limit: "10000.00",
      }).expect(201),
    );

    const response = await request(app)
      .put(`/api/budgets/${second.id}`)
      .send({ category: "Food & Groceries" })
      .expect(409);

    expect(errorData(response).code).toBe("BUDGET_ALREADY_EXISTS");
  });

  it("deletes a budget", async () => {
    const created = successData<SerializedBudget>(
      await createBudget().expect(201),
    );

    await request(app).delete(`/api/budgets/${created.id}`).expect(200);
    await request(app).get(`/api/budgets/${created.id}`).expect(404);
  });

  it("returns 404 for missing budget records", async () => {
    const missingId = "missing-budget";

    const getResponse = await request(app)
      .get(`/api/budgets/${missingId}`)
      .expect(404);
    expect(errorData(getResponse).code).toBe("BUDGET_NOT_FOUND");

    const updateResponse = await request(app)
      .put(`/api/budgets/${missingId}`)
      .send({ limit: "10.00" })
      .expect(404);
    expect(errorData(updateResponse).code).toBe("BUDGET_NOT_FOUND");

    const deleteResponse = await request(app)
      .delete(`/api/budgets/${missingId}`)
      .expect(404);
    expect(errorData(deleteResponse).code).toBe("BUDGET_NOT_FOUND");
  });

  it("rejects an invalid budget ID", async () => {
    const response = await request(app)
      .get("/api/budgets/bad!id")
      .expect(400);

    expect(errorData(response).code).toBe("VALIDATION_ERROR");
    expect(errorData(response).details?.[0]?.field).toBe("id");
  });

  it("filters budgets by month and year", async () => {
    await createBudget().expect(201);
    await createBudget({
      category: "Transportation",
      month: 10,
      year: 2026,
    }).expect(201);
    await createBudget({
      category: "Shopping",
      month: 11,
      year: 2025,
    }).expect(201);

    const response = await request(app)
      .get("/api/budgets?month=11&year=2026")
      .expect(200);
    const data = successData<{
      items: SerializedBudget[];
      total: number;
    }>(response);

    expect(data.total).toBe(1);
    expect(data.items[0]?.category).toBe("Food & Groceries");
  });

  it("rejects invalid budget query filters", async () => {
    const response = await request(app)
      .get("/api/budgets?month=13")
      .expect(400);

    expect(errorData(response).details?.[0]?.field).toBe("month");
  });
});

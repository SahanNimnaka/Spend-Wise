import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../src/app.js";
import type { SerializedTransaction } from "../src/services/transaction.service.js";
import {
  errorData,
  resetDatabase,
  successData,
  type TransactionPayload,
} from "./helpers.js";

const validTransaction: TransactionPayload = {
  title: "Grocery Shopping",
  amount: "1250.50",
  type: "EXPENSE",
  category: "Food & Groceries",
  date: "2026-11-05",
};

function createTransaction(
  overrides: Partial<TransactionPayload> = {},
) {
  return request(app)
    .post("/api/transactions")
    .send({ ...validTransaction, ...overrides });
}

describe("Transactions API", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates a valid transaction", async () => {
    const response = await createTransaction().expect(201);
    const transaction = successData<SerializedTransaction>(response);

    expect(response.body).toMatchObject({ success: true });
    expect(transaction).toMatchObject({
      title: "Grocery Shopping",
      amount: "1250.50",
      type: "EXPENSE",
      category: "Food & Groceries",
      date: "2026-11-05T00:00:00.000Z",
      description: null,
    });
    expect(transaction.id).toEqual(expect.any(String));
  });

  it.each([
    "0",
    "0.00",
    "-10",
    "abc",
    "1.234",
    "10000000000.00",
  ])("rejects invalid amount %s", async (amount) => {
    const response = await createTransaction({ amount }).expect(400);
    const error = errorData(response);

    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details?.[0]?.field).toBe("amount");
  });

  it("rejects an invalid transaction type", async () => {
    const response = await createTransaction({ type: "TRANSFER" }).expect(400);
    const error = errorData(response);

    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details?.[0]?.field).toBe("type");
  });

  it.each(["title", "category", "date"] as const)(
    "rejects a missing %s",
    async (field) => {
      const payload: Partial<TransactionPayload> = { ...validTransaction };
      delete payload[field];

      const response = await request(app)
        .post("/api/transactions")
        .send(payload)
        .expect(400);

      expect(errorData(response).details?.[0]?.field).toBe(field);
    },
  );

  it("rejects an invalid calendar date", async () => {
    const response = await createTransaction({ date: "2026-02-30" }).expect(400);

    expect(errorData(response).details?.[0]?.field).toBe("date");
  });

  it("rejects an oversized description", async () => {
    const response = await createTransaction({
      description: "x".repeat(501),
    }).expect(400);

    expect(errorData(response).details?.[0]?.field).toBe("description");
  });

  it("rejects unknown request fields", async () => {
    const response = await request(app)
      .post("/api/transactions")
      .send({ ...validTransaction, ownerId: "not-allowed" })
      .expect(400);

    expect(errorData(response).details?.[0]?.field).toBe("ownerId");
  });

  it("retrieves and paginates transactions", async () => {
    await createTransaction({ title: "First" }).expect(201);
    await createTransaction({ title: "Second" }).expect(201);
    await createTransaction({ title: "Third" }).expect(201);

    const firstPage = await request(app)
      .get("/api/transactions?page=1&limit=2")
      .expect(200);
    const firstPageData = successData<{
      items: SerializedTransaction[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(firstPage);

    expect(firstPageData.items).toHaveLength(2);
    expect(firstPageData.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
    });

    const secondPage = await request(app)
      .get("/api/transactions?page=2&limit=2")
      .expect(200);
    const secondPageData = successData<{
      items: SerializedTransaction[];
    }>(secondPage);

    expect(secondPageData.items).toHaveLength(1);
  });

  it("filters transactions by type, category, search, and date", async () => {
    await createTransaction({
      title: "Monthly Salary",
      amount: "5000.00",
      type: "INCOME",
      category: "Income",
      date: "2026-11-01",
    }).expect(201);
    await createTransaction({
      title: "Grocery Shopping",
      amount: "1200.00",
      type: "EXPENSE",
      category: "Food & Groceries",
      date: "2026-11-05",
      description: "Weekly food run",
    }).expect(201);
    await createTransaction({
      title: "Coffee",
      amount: "500.00",
      type: "EXPENSE",
      category: "Entertainment",
      date: "2026-12-01",
    }).expect(201);

    const typeFilter = await request(app)
      .get("/api/transactions?type=INCOME")
      .expect(200);
    expect(
      successData<{ items: SerializedTransaction[] }>(typeFilter).items,
    ).toHaveLength(1);

    const categoryFilter = await request(app)
      .get("/api/transactions?category=food%20%26%20groceries")
      .expect(200);
    expect(
      successData<{ items: SerializedTransaction[] }>(categoryFilter).items,
    ).toHaveLength(1);

    const searchFilter = await request(app)
      .get("/api/transactions?search=weekly")
      .expect(200);
    const searchItems =
      successData<{ items: SerializedTransaction[] }>(searchFilter).items;
    expect(searchItems).toHaveLength(1);
    expect(searchItems[0]?.title).toBe("Grocery Shopping");

    const dateFilter = await request(app)
      .get(
        "/api/transactions?startDate=2026-12-01&endDate=2026-12-31",
      )
      .expect(200);
    const dateItems =
      successData<{ items: SerializedTransaction[] }>(dateFilter).items;
    expect(dateItems).toHaveLength(1);
    expect(dateItems[0]?.title).toBe("Coffee");
  });

  it("updates a transaction", async () => {
    const created = successData<SerializedTransaction>(
      await createTransaction().expect(201),
    );

    const response = await request(app)
      .put(`/api/transactions/${created.id}`)
      .send({
        title: "Updated Groceries",
        amount: "2000.00",
        type: "INCOME",
        category: "Income",
        date: "2026-11-06",
        description: "Updated note",
      })
      .expect(200);

    const updated = successData<SerializedTransaction>(response);

    expect(updated).toMatchObject({
      id: created.id,
      title: "Updated Groceries",
      amount: "2000.00",
      type: "INCOME",
      category: "Income",
      date: "2026-11-06T00:00:00.000Z",
      description: "Updated note",
    });
  });

  it("deletes a transaction", async () => {
    const created = successData<SerializedTransaction>(
      await createTransaction().expect(201),
    );

    await request(app).delete(`/api/transactions/${created.id}`).expect(200);
    await request(app)
      .get(`/api/transactions/${created.id}`)
      .expect(404);
  });

  it("returns 404 for missing transaction records", async () => {
    const missingId = "missing-transaction";

    const getResponse = await request(app)
      .get(`/api/transactions/${missingId}`)
      .expect(404);
    expect(errorData(getResponse).code).toBe("TRANSACTION_NOT_FOUND");

    const updateResponse = await request(app)
      .put(`/api/transactions/${missingId}`)
      .send({ amount: "10.00" })
      .expect(404);
    expect(errorData(updateResponse).code).toBe("TRANSACTION_NOT_FOUND");

    const deleteResponse = await request(app)
      .delete(`/api/transactions/${missingId}`)
      .expect(404);
    expect(errorData(deleteResponse).code).toBe("TRANSACTION_NOT_FOUND");
  });

  it("rejects an invalid transaction ID", async () => {
    const response = await request(app)
      .get("/api/transactions/bad!id")
      .expect(400);

    expect(errorData(response).code).toBe("VALIDATION_ERROR");
    expect(errorData(response).details?.[0]?.field).toBe("id");
  });
});

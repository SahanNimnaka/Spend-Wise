import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { errorData } from "./helpers.js";

describe("API security and error handling", () => {
  it("exposes health checks at both /health and /api/health", async () => {
    const rootResponse = await request(app).get("/health").expect(200);
    const apiResponse = await request(app).get("/api/health").expect(200);

    expect(rootResponse.body).toMatchObject({
      success: true,
      data: { status: "ok" },
    });
    expect(apiResponse.body).toMatchObject({
      success: true,
      data: { status: "ok" },
    });
  });

  it("sets security headers and hides Express", async () => {
    const response = await request(app).get("/api/health").expect(200);

    expect(response.headers["x-powered-by"]).toBeUndefined();
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(response.headers["content-security-policy"]).toBeDefined();
  });

  it("allows the configured frontend origin", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", env.frontendOrigin)
      .expect(200);

    expect(response.headers["access-control-allow-origin"]).toBe(
      env.frontendOrigin,
    );
  });

  it("does not grant CORS access to unknown origins", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "http://malicious.example")
      .expect(200);

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("rejects invalid JSON with a consistent error", async () => {
    const response = await request(app)
      .post("/api/transactions")
      .set("Content-Type", "application/json")
      .send('{"title":')
      .expect(400);

    expect(errorData(response).code).toBe("INVALID_JSON");
  });

  it("rejects request bodies larger than 100kb", async () => {
    const response = await request(app)
      .post("/api/transactions")
      .send({
        title: "x".repeat(150_000),
        amount: "10.00",
        type: "EXPENSE",
        category: "Other",
        date: "2026-11-05",
      })
      .expect(413);

    expect(errorData(response).code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("returns 404 for unknown routes", async () => {
    const response = await request(app).get("/api/does-not-exist").expect(404);

    expect(errorData(response).code).toBe("ROUTE_NOT_FOUND");
  });

  it("does not expose stack traces or environment secrets", async () => {
    const response = await request(app)
      .post("/api/transactions")
      .send({})
      .expect(400);
    const serialized = JSON.stringify(response.body);

    expect(serialized).not.toMatch(/stack/i);
    expect(serialized).not.toMatch(/DATABASE_URL/i);
    expect(serialized).not.toMatch(/prisma/i);
    expect(serialized).not.toMatch(/postgresql:\/\//i);
  });
});

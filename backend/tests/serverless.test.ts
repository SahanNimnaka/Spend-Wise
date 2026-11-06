
import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app.js";

describe("Express application", () => {
  it("exports the Express app as a function", () => {
    expect(typeof app).toBe("function");
  });

  it("serves the API health check", async () => {
    const response = await request(app).get("/api/health").expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: { status: "ok" },
    });
  });

  it("serves the root health check", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: { status: "ok" },
    });
  });
});

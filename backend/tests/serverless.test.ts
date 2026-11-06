import request from "supertest";
import { describe, expect, it } from "vitest";

import handler from "../api/index.js";

describe("Vercel serverless entry point", () => {
  it("exports the Express app as the default handler", () => {
    expect(typeof handler).toBe("function");
  });

  it("serves the API health check through the handler", async () => {
    const response = await request(handler).get("/api/health").expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: { status: "ok" },
    });
  });

  it("serves the root health check through the handler", async () => {
    const response = await request(handler).get("/health").expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: { status: "ok" },
    });
  });
});

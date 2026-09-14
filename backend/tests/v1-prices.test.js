import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Versioned REST APIs (/api/v1)", () => {
  it("GET /api/v1/states should return full state list with relation counts", async () => {
    const res = await request(app).get("/api/v1/states");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty("id");
    expect(res.body.data[0]).toHaveProperty("name");
  });

  it("GET /api/v1/commodities should return commodities", async () => {
    const res = await request(app).get("/api/v1/commodities");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/v1/mandis should return paginated mandis", async () => {
    const res = await request(app).get("/api/v1/mandis?limit=5");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty("meta");
    expect(res.body.meta.limit).toBe(5);
  });

  it("GET /api/v1/prices should return paginated price records", async () => {
    const res = await request(app).get("/api/v1/prices?limit=5");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty("meta");
  });

  it("GET /api/v1/prices/analytics should calculate lowest, highest, modal average, and profitability ranking", async () => {
    const res = await request(app).get("/api/v1/prices/analytics?commodity=Apple");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("lowestPrice");
    expect(res.body.data).toHaveProperty("highestPrice");
    expect(res.body.data).toHaveProperty("averageModalPrice");
    expect(res.body.data).toHaveProperty("priceSpread");
    expect(res.body.data).toHaveProperty("bestMarket");
    expect(res.body.data).toHaveProperty("profitabilityRanking");
    expect(Array.isArray(res.body.data.profitabilityRanking)).toBe(true);
  });

  it("GET /api/v1/prices/compare should return comparison across mandis with profit margins", async () => {
    const res = await request(app).get("/api/v1/prices/compare?commodity=Apple&state=Punjab");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("markets");
    expect(Array.isArray(res.body.data.markets)).toBe(true);
    if (res.body.data.markets.length > 0) {
      expect(res.body.data.markets[0]).toHaveProperty("profitMargin");
      expect(res.body.data.markets[0]).toHaveProperty("profitMarginPct");
    }
  });

  it("GET /api/v1/prices/history should return date-wise price records", async () => {
    const res = await request(app).get("/api/v1/prices/history?commodity=Apple&days=60");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

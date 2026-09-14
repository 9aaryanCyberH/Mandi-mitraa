import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Legacy Frontend Compatibility Endpoints", () => {
  it("GET /health should return 200 with status ok and database connected", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.database).toBe("connected");
  });

  it("GET /states should return alphabetical list of states matching frontend contract", async () => {
    const res = await request(app).get("/states");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data).toContain("Punjab");
    expect(res.body.data).toContain("West Bengal");
  });

  it("GET /commodities?state=Punjab should return commodities for that state", async () => {
    const res = await request(app).get("/commodities?state=Punjab");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data).toContain("Apple");
  });

  it("GET /commodities without state should return 400 Bad Request", async () => {
    const res = await request(app).get("/commodities");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toMatch(/State parameter is required/i);
  });

  it("POST /getdata with valid state and commodity should return records with exact frontend keys", async () => {
    const res = await request(app)
      .post("/getdata")
      .send({ state: "Punjab", commodity: "Apple" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);

    if (res.body.data.length > 0) {
      const first = res.body.data[0];
      expect(first).toHaveProperty("APMC's");
      expect(first).toHaveProperty("District");
      expect(first).toHaveProperty("Commodity");
      expect(first).toHaveProperty("Min Price");
      expect(first).toHaveProperty("Modal Price");
      expect(first).toHaveProperty("Max Price");
      expect(first).toHaveProperty("Arrival Date");
    }
  });

  it("POST /getdata with missing parameters should return 400 Bad Request", async () => {
    const res = await request(app)
      .post("/getdata")
      .send({ state: "Punjab" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });
});

import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Authentication & Admin APIs", () => {
  const testEmail = `testuser_${Date.now()}@example.com`;
  let userToken = "";
  let adminToken = "";

  it("POST /api/v1/auth/register should create a new user and return JWT", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: testEmail,
        password: "password123",
        name: "Test Farmer"
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
    userToken = res.body.data.token;
  });

  it("POST /api/v1/auth/login with correct credentials should return token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testEmail,
        password: "password123"
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("token");
  });

  it("POST /api/v1/auth/login with wrong credentials should return 401", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testEmail,
        password: "wrongpassword"
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/v1/auth/me with valid Bearer token should return profile", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail.toLowerCase());
  });

  it("GET /api/v1/auth/me without token should return 401 Unauthorized", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/v1/admin/stats with non-admin token should return 403 Forbidden", async () => {
    const res = await request(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/v1/admin/stats with Admin account should return system counts", async () => {
    // Login as the seeded admin
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "admin@mandimitra.gov.in",
        password: "Admin@12345"
      });

    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.data.token;

    const statsRes = await request(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.success).toBe(true);
    expect(statsRes.body.data).toHaveProperty("states");
    expect(statsRes.body.data).toHaveProperty("marketPrices");
  });
});

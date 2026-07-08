import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { verifyCronSecret, validateRequiredSecrets } from "./cron-auth.js";

describe("verifyCronSecret", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("accepts a valid bearer token with timing-safe comparison", () => {
    process.env.CRON_SECRET = "test-secret";
    expect(
      verifyCronSecret({ headers: { authorization: "Bearer test-secret" } }),
    ).toBe(true);
  });

  it("rejects missing or invalid authorization", () => {
    process.env.CRON_SECRET = "test-secret";
    expect(verifyCronSecret({ headers: {} })).toBe(false);
    expect(
      verifyCronSecret({ headers: { authorization: "Bearer wrong-secret" } }),
    ).toBe(false);
  });

  it("rejects tokens with different lengths without throwing", () => {
    process.env.CRON_SECRET = "test-secret";
    expect(
      verifyCronSecret({ headers: { authorization: "Bearer short" } }),
    ).toBe(false);
  });

  it("allows requests in non-production when CRON_SECRET is unset", () => {
    delete process.env.CRON_SECRET;
    process.env.NODE_ENV = "development";
    expect(verifyCronSecret({ headers: {} })).toBe(true);
  });

  it("rejects requests when CRON_SECRET is unset and NODE_ENV is unset", () => {
    delete process.env.CRON_SECRET;
    delete process.env.NODE_ENV;
    expect(verifyCronSecret({ headers: {} })).toBe(false);
  });

  it("rejects requests in production when CRON_SECRET is unset", () => {
    delete process.env.CRON_SECRET;
    process.env.NODE_ENV = "production";
    expect(verifyCronSecret({ headers: {} })).toBe(false);
  });
});

describe("validateRequiredSecrets", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws in production when CRON_SECRET is missing", () => {
    process.env.NODE_ENV = "production";
    delete process.env.CRON_SECRET;
    process.env.CLERK_WEBHOOK_SECRET = "whsec_test";
    expect(() => validateRequiredSecrets()).toThrow("CRON_SECRET");
  });

  it("does not throw in development without secrets", () => {
    process.env.NODE_ENV = "development";
    delete process.env.CRON_SECRET;
    delete process.env.CLERK_WEBHOOK_SECRET;
    expect(() => validateRequiredSecrets()).not.toThrow();
  });
});

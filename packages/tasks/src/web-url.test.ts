import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("getWebBaseUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("uses WEB_URL when set", async () => {
    process.env.WEB_URL = "https://callsheet.app/";
    const { getWebBaseUrl } = await import("./web-url.js");
    expect(getWebBaseUrl()).toBe("https://callsheet.app");
  });

  it("falls back to localhost in development", async () => {
    delete process.env.WEB_URL;
    process.env.NODE_ENV = "development";
    const { getWebBaseUrl } = await import("./web-url.js");
    expect(getWebBaseUrl()).toBe("http://localhost:5173");
  });

  it("throws in production when WEB_URL is missing", async () => {
    delete process.env.WEB_URL;
    process.env.NODE_ENV = "production";
    const { getWebBaseUrl } = await import("./web-url.js");
    expect(() => getWebBaseUrl()).toThrow("WEB_URL is not set");
  });
});

import { describe, expect, it } from "vitest";
import { resolveUsername } from "./users.js";

const base = {
  id: "user_2abcDEF123",
  email_addresses: [],
  primary_email_address_id: null,
  username: null,
  image_url: null,
};

describe("resolveUsername", () => {
  it("prefers the Clerk username when set", () => {
    const data = { ...base, username: "jcw" };
    expect(resolveUsername(data, "jonathan@example.com")).toBe("jcw");
  });

  it("falls back to the email local part when Clerk sends no username", () => {
    expect(resolveUsername(base, "jonathan.white@example.com")).toBe("jonathan.white");
  });

  it("treats a whitespace-only Clerk username as absent", () => {
    const data = { ...base, username: "  " };
    expect(resolveUsername(data, "jonathan@example.com")).toBe("jonathan");
  });

  it("trims surrounding whitespace off the chosen value", () => {
    const data = { ...base, username: "  jcw  " };
    expect(resolveUsername(data, "jonathan@example.com")).toBe("jcw");
  });

  it("falls back to the Clerk id only when nothing else is available", () => {
    expect(resolveUsername(base, "")).toBe("user_2abcDEF123");
  });

  it("never returns an empty string", () => {
    expect(resolveUsername(base, "@example.com")).toBe("user_2abcDEF123");
  });

  // The handle renders as `@username`, so a value with spaces would read wrong.
  // Clerk's own usernames are space-free and the email local part cannot contain
  // an unquoted space, so the resolved handle is safe behind an `@`.
  it("never resolves to a value containing a space", () => {
    const cases = [
      { data: { ...base, username: "jcw" }, email: "jonathan@example.com" },
      { data: base, email: "jonathan.white@example.com" },
      { data: base, email: "" },
    ];

    for (const { data, email } of cases) {
      expect(resolveUsername(data, email)).not.toMatch(/\s/);
    }
  });
});

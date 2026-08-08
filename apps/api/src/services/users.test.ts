import { describe, expect, it } from "vitest";
import { resolveUsername } from "./users.js";

const base = {
  id: "user_2abcDEF123",
  email_addresses: [],
  primary_email_address_id: null,
  username: null,
  first_name: null,
  last_name: null,
  image_url: null,
};

describe("resolveUsername", () => {
  it("prefers the Clerk username when set", () => {
    const data = { ...base, username: "jcw", first_name: "Jonathan" };
    expect(resolveUsername(data, "jonathan@example.com")).toBe("jcw");
  });

  it("falls back to the full name for OAuth sign-ups with no username", () => {
    const data = { ...base, first_name: "Jonathan", last_name: "White" };
    expect(resolveUsername(data, "jonathan@example.com")).toBe("Jonathan White");
  });

  it("uses the first name alone when there is no last name", () => {
    const data = { ...base, first_name: "Jonathan" };
    expect(resolveUsername(data, "jonathan@example.com")).toBe("Jonathan");
  });

  it("falls back to the email local part when no name is present", () => {
    expect(resolveUsername(base, "jonathan.white@example.com")).toBe("jonathan.white");
  });

  it("treats whitespace-only Clerk fields as absent", () => {
    const data = { ...base, username: "  ", first_name: " ", last_name: "  " };
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
});

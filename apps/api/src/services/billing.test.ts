import { describe, expect, it } from "vitest";
import { LeagueServiceError } from "./leagues.js";
import {
  assertClassificationAllowed,
  assertLeagueCreationAllowed,
  assertMaxMembersAllowed,
  isProFromHas,
} from "./billing.js";

describe("isProFromHas", () => {
  it("returns false when no has function is provided", () => {
    expect(isProFromHas(undefined)).toBe(false);
  });

  it("returns true when has() matches the pro plan", () => {
    const has = ((arg: { plan?: string; feature?: string }) => arg.plan === "pro") as never;
    expect(isProFromHas(has)).toBe(true);
  });

  it("returns true when has() matches any pro feature", () => {
    const has = ((arg: { plan?: string; feature?: string }) =>
      arg.feature === "large_leagues") as never;
    expect(isProFromHas(has)).toBe(true);
  });

  it("returns false when has() matches nothing", () => {
    const has = (() => false) as never;
    expect(isProFromHas(has)).toBe(false);
  });

  it("returns false (does not throw) when has() throws", () => {
    const has = (() => {
      throw new Error("clerk unavailable");
    }) as never;
    expect(isProFromHas(has)).toBe(false);
  });
});

describe("assertMaxMembersAllowed", () => {
  it("allows a free league at the 10-member limit", () => {
    expect(() => assertMaxMembersAllowed("free", 10)).not.toThrow();
  });

  it("blocks a free league above 10 members with UPGRADE_REQUIRED", () => {
    try {
      assertMaxMembersAllowed("free", 11);
      throw new Error("expected assertMaxMembersAllowed to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(LeagueServiceError);
      const e = error as LeagueServiceError;
      expect(e.status).toBe(403);
      expect(e.code).toBe("UPGRADE_REQUIRED");
      expect(e.details?.upgradeUrl).toBe("/settings/billing");
    }
  });

  it("allows a pro league at the 50-member limit", () => {
    expect(() => assertMaxMembersAllowed("pro", 50)).not.toThrow();
  });

  it("blocks a pro league above 50 members", () => {
    expect(() => assertMaxMembersAllowed("pro", 51)).toThrow(LeagueServiceError);
  });
});

describe("assertLeagueCreationAllowed", () => {
  it("allows a free user below the 2-league limit", () => {
    expect(() => assertLeagueCreationAllowed("free", 1)).not.toThrow();
  });

  it("blocks a free user at the 2-league limit", () => {
    expect(() => assertLeagueCreationAllowed("free", 2)).toThrow(LeagueServiceError);
  });

  it("allows a pro user regardless of active league count", () => {
    expect(() => assertLeagueCreationAllowed("pro", 100)).not.toThrow();
  });
});

describe("assertClassificationAllowed", () => {
  it("allows any user to use core classifications", () => {
    expect(() => assertClassificationAllowed("free", "core")).not.toThrow();
    expect(() => assertClassificationAllowed("pro", "core")).not.toThrow();
  });

  it("blocks free users from beta classifications", () => {
    expect(() => assertClassificationAllowed("free", "beta")).toThrow(LeagueServiceError);
  });

  it("allows pro users to use beta classifications", () => {
    expect(() => assertClassificationAllowed("pro", "beta")).not.toThrow();
  });
});

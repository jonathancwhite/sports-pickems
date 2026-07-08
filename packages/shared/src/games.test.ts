import { describe, expect, it } from "vitest";
import {
  isSeasonCompletionTerminalStatus,
  SEASON_COMPLETION_TERMINAL_STATUSES,
} from "./games.js";

describe("isSeasonCompletionTerminalStatus", () => {
  it("treats final, cancelled, and postponed as terminal", () => {
    expect(SEASON_COMPLETION_TERMINAL_STATUSES).toEqual(["final", "cancelled", "postponed"]);
    expect(isSeasonCompletionTerminalStatus("final")).toBe(true);
    expect(isSeasonCompletionTerminalStatus("cancelled")).toBe(true);
    expect(isSeasonCompletionTerminalStatus("postponed")).toBe(true);
  });

  it("does not treat in-progress or scheduled games as terminal", () => {
    expect(isSeasonCompletionTerminalStatus("scheduled")).toBe(false);
    expect(isSeasonCompletionTerminalStatus("in_progress")).toBe(false);
  });
});

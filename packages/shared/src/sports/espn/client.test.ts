import { describe, expect, it } from "vitest";
import { EspnApiError, espnFetch, resetEspnClientState } from "./client.js";

describe("espnFetch", () => {
  it("times out hung requests", async () => {
    resetEspnClientState();

    const fetchFn: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        const signal = init?.signal;
        if (!signal) {
          return;
        }

        if (signal.aborted) {
          reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
          return;
        }

        signal.addEventListener("abort", () => {
          reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
        });
      });

    await expect(
      espnFetch("/sports/football/college-football/scoreboard", {}, {
        fetchFn,
        timeoutMs: 50,
      }),
    ).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof EspnApiError && error.message.includes("timed out after 50ms"),
    );
  });
});

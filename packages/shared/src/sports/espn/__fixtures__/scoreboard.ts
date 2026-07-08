import type { EspnEvent, EspnScoreboard } from "../types.js";

export const finalGameEvent: EspnEvent = {
  id: "401999001",
  date: "2025-09-06T23:00:00.000Z",
  name: "Alabama Crimson Tide at Georgia Bulldogs",
  week: { number: 2 },
  competitions: [
    {
      id: "401999001",
      date: "2025-09-06T23:00:00.000Z",
      status: {
        clock: 0,
        displayClock: "0:00",
        period: 4,
        type: {
          id: "3",
          name: "STATUS_FINAL",
          state: "post",
          completed: true,
          description: "Final",
        },
      },
      competitors: [
        {
          id: "333",
          homeAway: "home",
          score: "28",
          team: {
            id: "333",
            displayName: "Alabama Crimson Tide",
            abbreviation: "ALA",
          },
        },
        {
          id: "61",
          homeAway: "away",
          score: "28",
          team: {
            id: "61",
            displayName: "Georgia Bulldogs",
            abbreviation: "UGA",
          },
        },
      ],
    },
  ],
};

const scheduledGameEvent: EspnEvent = {
  id: "401856766",
  date: "2026-08-29T16:00:00.000Z",
  name: "North Carolina Tar Heels at TCU Horned Frogs",
  week: { number: 1 },
  competitions: [
    {
      id: "401856766",
      date: "2026-08-29T16:00:00.000Z",
      status: {
        clock: 0,
        displayClock: "0:00",
        period: 0,
        type: {
          id: "1",
          name: "STATUS_SCHEDULED",
          state: "pre",
          completed: false,
          description: "Scheduled",
        },
      },
      competitors: [
        {
          id: "2628",
          homeAway: "home",
          score: "0",
          team: {
            id: "2628",
            displayName: "TCU Horned Frogs",
            abbreviation: "TCU",
          },
        },
        {
          id: "153",
          homeAway: "away",
          score: "0",
          team: {
            id: "153",
            displayName: "North Carolina Tar Heels",
            abbreviation: "UNC",
          },
        },
      ],
    },
  ],
};

/** Minimal ESPN scoreboard fixture for unit tests */
export const mockEspnScoreboard: EspnScoreboard = {
  season: { year: 2026, type: 2 },
  week: { number: 1 },
  events: [scheduledGameEvent, finalGameEvent],
};

export const inProgressGameEvent: EspnEvent = {
  id: "401999002",
  date: "2025-09-07T19:30:00.000Z",
  name: "Ohio State Buckeyes at Michigan Wolverines",
  week: { number: 3 },
  competitions: [
    {
      id: "401999002",
      date: "2025-09-07T19:30:00.000Z",
      status: {
        clock: 420,
        displayClock: "7:00",
        period: 3,
        type: {
          id: "2",
          name: "STATUS_IN_PROGRESS",
          state: "in",
          completed: false,
          description: "In Progress",
        },
      },
      competitors: [
        {
          id: "194",
          homeAway: "home",
          score: "14",
          team: {
            id: "194",
            displayName: "Ohio State Buckeyes",
            abbreviation: "OSU",
          },
        },
        {
          id: "130",
          homeAway: "away",
          score: "10",
          team: {
            id: "130",
            displayName: "Michigan Wolverines",
            abbreviation: "MICH",
          },
        },
      ],
    },
  ],
};

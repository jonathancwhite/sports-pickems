/**
 * Real ESPN NFL scoreboard capture — 2025 regular season, week 3, all 16 games,
 * fetched on 2026-08-08 and trimmed to the fields `EspnScoreboard` declares.
 *
 * Kept verbatim (real team ids, real names, real scores) so the group mapping is
 * asserted against ESPN's actual payload rather than a hand-written stand-in.
 * Note the absence of `conferenceId` on every team — that absence is the whole
 * reason `nfl-groups.ts` exists.
 */

import type { EspnScoreboard } from "../types.js";

export const nflWeek3Scoreboard: EspnScoreboard = {
  season: { year: 2025, type: 2 },
  week: { number: 3 },
  events: [
    {
      id: "401772937",
      date: "2025-09-19T00:15Z",
      name: "Miami Dolphins at Buffalo Bills",
      week: {
        number: 3,
      },
      season: {
        year: 2025,
        type: 2,
      },
      competitions: [
        {
          id: "401772937",
          date: "2025-09-19T00:15Z",
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
              id: "2",
              homeAway: "home",
              score: "31",
              team: {
                id: "2",
                displayName: "Buffalo Bills",
                abbreviation: "BUF",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/buf.png",
              },
            },
            {
              id: "15",
              homeAway: "away",
              score: "21",
              team: {
                id: "15",
                displayName: "Miami Dolphins",
                abbreviation: "MIA",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/mia.png",
              },
            },
          ],
        },
      ],
    },
    {
      id: "401772842",
      date: "2025-09-21T17:00Z",
      name: "Green Bay Packers at Cleveland Browns",
      week: {
        number: 3,
      },
      season: {
        year: 2025,
        type: 2,
      },
      competitions: [
        {
          id: "401772842",
          date: "2025-09-21T17:00Z",
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
              id: "5",
              homeAway: "home",
              score: "13",
              team: {
                id: "5",
                displayName: "Cleveland Browns",
                abbreviation: "CLE",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/cle.png",
              },
            },
            {
              id: "9",
              homeAway: "away",
              score: "10",
              team: {
                id: "9",
                displayName: "Green Bay Packers",
                abbreviation: "GB",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/gb.png",
              },
            },
          ],
        },
      ],
    },
    {
      id: "401772733",
      date: "2025-09-21T17:00Z",
      name: "Indianapolis Colts at Tennessee Titans",
      week: {
        number: 3,
      },
      season: {
        year: 2025,
        type: 2,
      },
      competitions: [
        {
          id: "401772733",
          date: "2025-09-21T17:00Z",
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
              id: "10",
              homeAway: "home",
              score: "20",
              team: {
                id: "10",
                displayName: "Tennessee Titans",
                abbreviation: "TEN",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/ten.png",
              },
            },
            {
              id: "11",
              homeAway: "away",
              score: "41",
              team: {
                id: "11",
                displayName: "Indianapolis Colts",
                abbreviation: "IND",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/ind.png",
              },
            },
          ],
        },
      ],
    },
    {
      id: "401772731",
      date: "2025-09-21T17:00Z",
      name: "Cincinnati Bengals at Minnesota Vikings",
      week: {
        number: 3,
      },
      season: {
        year: 2025,
        type: 2,
      },
      competitions: [
        {
          id: "401772731",
          date: "2025-09-21T17:00Z",
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
              id: "16",
              homeAway: "home",
              score: "48",
              team: {
                id: "16",
                displayName: "Minnesota Vikings",
                abbreviation: "MIN",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/min.png",
              },
            },
            {
              id: "4",
              homeAway: "away",
              score: "10",
              team: {
                id: "4",
                displayName: "Cincinnati Bengals",
                abbreviation: "CIN",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/cin.png",
              },
            },
          ],
        },
      ],
    },
    {
      id: "401772732",
      date: "2025-09-21T17:00Z",
      name: "Pittsburgh Steelers at New England Patriots",
      week: {
        number: 3,
      },
      season: {
        year: 2025,
        type: 2,
      },
      competitions: [
        {
          id: "401772732",
          date: "2025-09-21T17:00Z",
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
              id: "17",
              homeAway: "home",
              score: "14",
              team: {
                id: "17",
                displayName: "New England Patriots",
                abbreviation: "NE",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/ne.png",
              },
            },
            {
              id: "23",
              homeAway: "away",
              score: "21",
              team: {
                id: "23",
                displayName: "Pittsburgh Steelers",
                abbreviation: "PIT",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/pit.png",
              },
            },
          ],
        },
      ],
    },
    {
      id: "401772839",
      date: "2025-09-21T17:00Z",
      name: "Los Angeles Rams at Philadelphia Eagles",
      week: {
        number: 3,
      },
      season: {
        year: 2025,
        type: 2,
      },
      competitions: [
        {
          id: "401772839",
          date: "2025-09-21T17:00Z",
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
              id: "21",
              homeAway: "home",
              score: "33",
              team: {
                id: "21",
                displayName: "Philadelphia Eagles",
                abbreviation: "PHI",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/phi.png",
              },
            },
            {
              id: "14",
              homeAway: "away",
              score: "26",
              team: {
                id: "14",
                displayName: "Los Angeles Rams",
                abbreviation: "LAR",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/lar.png",
              },
            },
          ],
        },
      ],
    },
    {
      id: "401772840",
      date: "2025-09-21T17:00Z",
      name: "New York Jets at Tampa Bay Buccaneers",
      week: {
        number: 3,
      },
      season: {
        year: 2025,
        type: 2,
      },
      competitions: [
        {
          id: "401772840",
          date: "2025-09-21T17:00Z",
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
              id: "27",
              homeAway: "home",
              score: "29",
              team: {
                id: "27",
                displayName: "Tampa Bay Buccaneers",
                abbreviation: "TB",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/tb.png",
              },
            },
            {
              id: "20",
              homeAway: "away",
              score: "27",
              team: {
                id: "20",
                displayName: "New York Jets",
                abbreviation: "NYJ",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/nyj.png",
              },
            },
          ],
        },
      ],
    },
    {
      id: "401772841",
      date: "2025-09-21T17:00Z",
      name: "Las Vegas Raiders at Washington Commanders",
      week: {
        number: 3,
      },
      season: {
        year: 2025,
        type: 2,
      },
      competitions: [
        {
          id: "401772841",
          date: "2025-09-21T17:00Z",
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
              id: "28",
              homeAway: "home",
              score: "41",
              team: {
                id: "28",
                displayName: "Washington Commanders",
                abbreviation: "WSH",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/wsh.png",
              },
            },
            {
              id: "13",
              homeAway: "away",
              score: "24",
              team: {
                id: "13",
                displayName: "Las Vegas Raiders",
                abbreviation: "LV",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/lv.png",
              },
            },
          ],
        },
      ],
    },
    {
      id: "401772838",
      date: "2025-09-21T17:00Z",
      name: "Atlanta Falcons at Carolina Panthers",
      week: {
        number: 3,
      },
      season: {
        year: 2025,
        type: 2,
      },
      competitions: [
        {
          id: "401772838",
          date: "2025-09-21T17:00Z",
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
              id: "29",
              homeAway: "home",
              score: "30",
              team: {
                id: "29",
                displayName: "Carolina Panthers",
                abbreviation: "CAR",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/car.png",
              },
            },
            {
              id: "1",
              homeAway: "away",
              score: "0",
              team: {
                id: "1",
                displayName: "Atlanta Falcons",
                abbreviation: "ATL",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/atl.png",
              },
            },
          ],
        },
      ],
    },
    {
      id: "401772734",
      date: "2025-09-21T17:00Z",
      name: "Houston Texans at Jacksonville Jaguars",
      week: {
        number: 3,
      },
      season: {
        year: 2025,
        type: 2,
      },
      competitions: [
        {
          id: "401772734",
          date: "2025-09-21T17:00Z",
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
              id: "30",
              homeAway: "home",
              score: "17",
              team: {
                id: "30",
                displayName: "Jacksonville Jaguars",
                abbreviation: "JAX",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/jax.png",
              },
            },
            {
              id: "34",
              homeAway: "away",
              score: "10",
              team: {
                id: "34",
                displayName: "Houston Texans",
                abbreviation: "HOU",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/hou.png",
              },
            },
          ],
        },
      ],
    },
    {
      id: "401772735",
      date: "2025-09-21T20:05Z",
      name: "Denver Broncos at Los Angeles Chargers",
      week: {
        number: 3,
      },
      season: {
        year: 2025,
        type: 2,
      },
      competitions: [
        {
          id: "401772735",
          date: "2025-09-21T20:05Z",
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
              id: "24",
              homeAway: "home",
              score: "23",
              team: {
                id: "24",
                displayName: "Los Angeles Chargers",
                abbreviation: "LAC",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/lac.png",
              },
            },
            {
              id: "7",
              homeAway: "away",
              score: "20",
              team: {
                id: "7",
                displayName: "Denver Broncos",
                abbreviation: "DEN",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/den.png",
              },
            },
          ],
        },
      ],
    },
    {
      id: "401772736",
      date: "2025-09-21T20:05Z",
      name: "New Orleans Saints at Seattle Seahawks",
      week: {
        number: 3,
      },
      season: {
        year: 2025,
        type: 2,
      },
      competitions: [
        {
          id: "401772736",
          date: "2025-09-21T20:05Z",
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
              id: "26",
              homeAway: "home",
              score: "44",
              team: {
                id: "26",
                displayName: "Seattle Seahawks",
                abbreviation: "SEA",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/sea.png",
              },
            },
            {
              id: "18",
              homeAway: "away",
              score: "13",
              team: {
                id: "18",
                displayName: "New Orleans Saints",
                abbreviation: "NO",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/no.png",
              },
            },
          ],
        },
      ],
    },
    {
      id: "401772844",
      date: "2025-09-21T20:25Z",
      name: "Dallas Cowboys at Chicago Bears",
      week: {
        number: 3,
      },
      season: {
        year: 2025,
        type: 2,
      },
      competitions: [
        {
          id: "401772844",
          date: "2025-09-21T20:25Z",
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
              id: "3",
              homeAway: "home",
              score: "31",
              team: {
                id: "3",
                displayName: "Chicago Bears",
                abbreviation: "CHI",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/chi.png",
              },
            },
            {
              id: "6",
              homeAway: "away",
              score: "14",
              team: {
                id: "6",
                displayName: "Dallas Cowboys",
                abbreviation: "DAL",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/dal.png",
              },
            },
          ],
        },
      ],
    },
    {
      id: "401772843",
      date: "2025-09-21T20:25Z",
      name: "Arizona Cardinals at San Francisco 49ers",
      week: {
        number: 3,
      },
      season: {
        year: 2025,
        type: 2,
      },
      competitions: [
        {
          id: "401772843",
          date: "2025-09-21T20:25Z",
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
              id: "25",
              homeAway: "home",
              score: "16",
              team: {
                id: "25",
                displayName: "San Francisco 49ers",
                abbreviation: "SF",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/sf.png",
              },
            },
            {
              id: "22",
              homeAway: "away",
              score: "15",
              team: {
                id: "22",
                displayName: "Arizona Cardinals",
                abbreviation: "ARI",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/ari.png",
              },
            },
          ],
        },
      ],
    },
    {
      id: "401772920",
      date: "2025-09-22T00:20Z",
      name: "Kansas City Chiefs at New York Giants",
      week: {
        number: 3,
      },
      season: {
        year: 2025,
        type: 2,
      },
      competitions: [
        {
          id: "401772920",
          date: "2025-09-22T00:20Z",
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
              id: "19",
              homeAway: "home",
              score: "9",
              team: {
                id: "19",
                displayName: "New York Giants",
                abbreviation: "NYG",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/nyg.png",
              },
            },
            {
              id: "12",
              homeAway: "away",
              score: "22",
              team: {
                id: "12",
                displayName: "Kansas City Chiefs",
                abbreviation: "KC",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/kc.png",
              },
            },
          ],
        },
      ],
    },
    {
      id: "401772812",
      date: "2025-09-23T00:15Z",
      name: "Detroit Lions at Baltimore Ravens",
      week: {
        number: 3,
      },
      season: {
        year: 2025,
        type: 2,
      },
      competitions: [
        {
          id: "401772812",
          date: "2025-09-23T00:15Z",
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
              id: "33",
              homeAway: "home",
              score: "30",
              team: {
                id: "33",
                displayName: "Baltimore Ravens",
                abbreviation: "BAL",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/bal.png",
              },
            },
            {
              id: "8",
              homeAway: "away",
              score: "38",
              team: {
                id: "8",
                displayName: "Detroit Lions",
                abbreviation: "DET",
                logo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/det.png",
              },
            },
          ],
        },
      ],
    },
  ],
};

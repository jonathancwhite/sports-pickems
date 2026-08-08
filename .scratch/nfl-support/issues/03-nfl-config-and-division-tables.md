# NFL LeagueConfig and division tables

Type: task
Status: open
Blocked by: 02

## Question

Add the `nfl` entry to the `LeagueConfig` record, backed by static reference tables for divisions and conferences (Q10).

**Why static**: verified against the live API on 2026-08-08 — ESPN's NFL scoreboard returns no `conferenceId` on `competitors[].team`. Site-v2 `/teams` and `/standings` don't carry it either; only the core API's `seasons/{y}/types/2/groups` ref-walk does, which would mean several extra HTTP requests per sync with a runtime failure mode. NFL realignment last happened in 2002.

Build:

- `espn/nfl-groups.ts` — a 32-row table mapping **ESPN team id** → division slug (`afc-east`, `afc-north`, `afc-south`, `afc-west`, `nfc-east`, `nfc-north`, `nfc-south`, `nfc-west`), plus display names and short labels, following the shape and documentation style of the existing `conferences.ts`.
- Conference (`afc` / `nfc`) is **derived from the division slug**, not stored separately — `afc-east` implies `afc`. A game row carries only the division.
- The `nfl` `LeagueConfig`: path `/sports/football/nfl/scoreboard`, no `groups` param, week fallback 18, `groupForTeam` reading the static map by team id.

Key on ESPN's numeric team **id**, not abbreviation — abbreviations are more likely to drift and relocations change city names.

Tests: capture a real NFL scoreboard response into `__fixtures__` and assert the full map/group path, including that all 32 ids resolve and that an unknown id returns `null` rather than throwing.

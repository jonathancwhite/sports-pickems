/** ESPN college football scoreboard API response shapes (subset). */

export interface EspnStatusType {
  id: string;
  name: string;
  state: "pre" | "in" | "post";
  completed: boolean;
  description: string;
}

export interface EspnCompetitionStatus {
  clock: number;
  displayClock: string;
  period: number;
  type: EspnStatusType;
}

export interface EspnTeam {
  id: string;
  displayName: string;
  abbreviation: string;
}

export interface EspnCompetitor {
  id: string;
  homeAway: "home" | "away";
  score: string;
  team: EspnTeam;
}

export interface EspnCompetition {
  id: string;
  date: string;
  status: EspnCompetitionStatus;
  competitors: EspnCompetitor[];
}

export interface EspnEvent {
  id: string;
  date: string;
  name: string;
  week?: { number: number };
  season?: { year: number; type: number };
  competitions: EspnCompetition[];
}

export interface EspnScoreboard {
  season?: { year: number; type: number };
  week?: { number: number };
  events: EspnEvent[];
}

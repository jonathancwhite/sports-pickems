import type {
  CreateLeagueInput,
  CurrentUser,
  GamesResponse,
  InvitePreview,
  LeaderboardResponse,
  League,
  LeagueDetail,
  MyLeaguesResponse,
  PickSummaryResponse,
  PicksResponse,
  PublicLeaguesQuery,
  PublicLeaguesResponse,
  SlateDetail,
  SlateListResponse,
  SportWithClassifications,
  SubmitPicksInput,
  UpdatePreferences,
  WaitlistResponse,
} from "@callsheet/shared";
import { useAuth } from "@clerk/clerk-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAuthToken(getToken: () => Promise<string | null>): Promise<string | null> {
  return getToken();
}

export async function apiFetch<T>(
  path: string,
  getToken: () => Promise<string | null>,
  init?: RequestInit,
): Promise<T> {
  const token = await getAuthToken(getToken);
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = undefined;
    }
    throw new ApiError(`Request failed: ${res.status}`, res.status, body);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function publicApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = undefined;
    }
    throw new ApiError(`Request failed: ${res.status}`, res.status, body);
  }

  return res.json() as Promise<T>;
}

export function useApiClient() {
  const { getToken } = useAuth();

  return {
    getCurrentUser: () => apiFetch<CurrentUser>("/api/users/me", getToken),
    updatePreferences: (preferences: UpdatePreferences) =>
      apiFetch<CurrentUser>("/api/users/me/preferences", getToken, {
        method: "PUT",
        body: JSON.stringify(preferences),
      }),
    getSports: () => apiFetch<SportWithClassifications[]>("/api/sports", getToken),
    getMyLeagues: () => apiFetch<MyLeaguesResponse>("/api/leagues/me", getToken),
    createLeague: (input: CreateLeagueInput) =>
      apiFetch<League>("/api/leagues", getToken, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    getLeague: (id: string) => apiFetch<LeagueDetail>(`/api/leagues/${id}`, getToken),
    joinLeague: (code: string, password?: string) =>
      apiFetch<League>(`/api/leagues/invite/${code}/join`, getToken, {
        method: "POST",
        body: JSON.stringify(password ? { password } : {}),
      }),
    getInvitePreview: (code: string) =>
      publicApiFetch<InvitePreview>(`/api/leagues/invite/${code}`),
    getPublicLeagues: (query: PublicLeaguesQuery) => {
      const params = new URLSearchParams();
      if (query.sportId) params.set("sportId", query.sportId);
      if (query.classificationId) params.set("classificationId", query.classificationId);
      if (query.sort) params.set("sort", query.sort);
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));
      const qs = params.toString();
      return publicApiFetch<PublicLeaguesResponse>(
        `/api/leagues/public${qs ? `?${qs}` : ""}`,
      );
    },
    joinPublicLeague: (id: string) =>
      apiFetch<League>(`/api/leagues/${id}/join`, getToken, { method: "POST" }),
    joinWaitlist: (id: string) =>
      apiFetch<{ position: number }>(`/api/leagues/${id}/waitlist`, getToken, {
        method: "POST",
      }),
    getWaitlist: (id: string) =>
      apiFetch<WaitlistResponse>(`/api/leagues/${id}/waitlist`, getToken),
    leaveWaitlist: (id: string) =>
      apiFetch<void>(`/api/leagues/${id}/waitlist/me`, getToken, { method: "DELETE" }),
    leaveLeague: (id: string) =>
      apiFetch<void>(`/api/leagues/${id}/members/me`, getToken, { method: "DELETE" }),
    removeMember: (leagueId: string, userId: string) =>
      apiFetch<LeagueDetail>(`/api/leagues/${leagueId}/members/${userId}`, getToken, {
        method: "DELETE",
      }),
    getGames: (seasonId: string, week: number, classificationId?: string) => {
      const params = new URLSearchParams({
        seasonId,
        week: String(week),
      });
      if (classificationId) {
        params.set("classificationId", classificationId);
      }
      return apiFetch<GamesResponse>(`/api/games?${params.toString()}`, getToken);
    },
    getSlates: (leagueId: string) =>
      apiFetch<SlateListResponse>(`/api/leagues/${leagueId}/slates`, getToken),
    getSlate: (leagueId: string, week: number, includePicks = false) => {
      const params = includePicks ? "?includePicks=true" : "";
      return apiFetch<SlateDetail>(
        `/api/leagues/${leagueId}/slates/${week}${params}`,
        getToken,
      );
    },
    setSlate: (leagueId: string, week: number, gameIds: string[]) =>
      apiFetch<SlateDetail>(`/api/leagues/${leagueId}/slates/${week}`, getToken, {
        method: "PUT",
        body: JSON.stringify({ gameIds }),
      }),
    getPicks: (leagueId: string, week: number, options?: { userId?: string; all?: boolean }) => {
      const params = new URLSearchParams();
      if (options?.userId) params.set("userId", options.userId);
      if (options?.all) params.set("all", "true");
      const qs = params.toString();
      return apiFetch<PicksResponse>(
        `/api/leagues/${leagueId}/picks/${week}${qs ? `?${qs}` : ""}`,
        getToken,
      );
    },
    submitPicks: (leagueId: string, week: number, input: SubmitPicksInput) =>
      apiFetch<PicksResponse>(`/api/leagues/${leagueId}/picks/${week}`, getToken, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    getPickSummary: (leagueId: string, week: number) =>
      apiFetch<PickSummaryResponse>(
        `/api/leagues/${leagueId}/picks/${week}/summary`,
        getToken,
      ),
    getSeasonLeaderboard: (leagueId: string) =>
      apiFetch<LeaderboardResponse>(`/api/leagues/${leagueId}/leaderboard`, getToken),
    getWeeklyLeaderboard: (leagueId: string, week: number) =>
      apiFetch<LeaderboardResponse>(
        `/api/leagues/${leagueId}/leaderboard/${week}`,
        getToken,
      ),
  };
}

export function getInviteUrl(code: string): string {
  const base = import.meta.env.VITE_APP_URL ?? window.location.origin;
  return `${base.replace(/\/$/, "")}/invite/${code}`;
}

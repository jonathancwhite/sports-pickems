import type {
  CreateLeagueInput,
  CurrentUser,
  InvitePreview,
  League,
  LeagueDetail,
  MyLeaguesResponse,
  PublicLeaguesQuery,
  PublicLeaguesResponse,
  SportWithClassifications,
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
  };
}

export function getInviteUrl(code: string): string {
  const base = import.meta.env.VITE_APP_URL ?? window.location.origin;
  return `${base.replace(/\/$/, "")}/invite/${code}`;
}

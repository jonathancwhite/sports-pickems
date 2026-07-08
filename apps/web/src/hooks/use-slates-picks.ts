import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SubmitPicksInput } from "@callsheet/shared";
import { useApiClient } from "@/lib/api";
import { ApiError } from "@/lib/api";

import { useEffect, useRef, useState } from "react";
import type { SlateListResponse } from "@callsheet/shared";
import { resolveDefaultWeek } from "@/components/week-selector";

export function useSelectedWeek(slates: SlateListResponse | undefined) {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && slates) {
      setSelectedWeek(resolveDefaultWeek(slates.slates, slates.currentWeek));
      initialized.current = true;
    }
  }, [slates]);

  return [selectedWeek ?? slates?.currentWeek ?? 1, setSelectedWeek] as const;
}

export function useSlates(leagueId: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: ["slates", leagueId],
    queryFn: () => api.getSlates(leagueId),
    enabled: Boolean(leagueId),
  });
}

export function useSlate(leagueId: string, week: number, includePicks = false) {
  const api = useApiClient();

  return useQuery({
    queryKey: ["slate", leagueId, week, includePicks],
    queryFn: async () => {
      try {
        return await api.getSlate(leagueId, week, includePicks);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: Boolean(leagueId) && week > 0,
  });
}

export function useSetSlate(leagueId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ week, gameIds }: { week: number; gameIds: string[] }) =>
      api.setSlate(leagueId, week, gameIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["slates", leagueId] });
      queryClient.invalidateQueries({ queryKey: ["slate", leagueId, variables.week] });
      queryClient.invalidateQueries({ queryKey: ["league", leagueId] });
    },
  });
}

export function useGames(seasonId: string | undefined, week: number, classificationId?: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: ["games", seasonId, week, classificationId],
    queryFn: () => api.getGames(seasonId!, week, classificationId),
    enabled: Boolean(seasonId) && week > 0,
  });
}

export function usePicks(
  leagueId: string,
  week: number,
  options?: { userId?: string; all?: boolean; enabled?: boolean },
) {
  const api = useApiClient();

  return useQuery({
    queryKey: ["picks", leagueId, week, options?.userId ?? "me", options?.all ?? false],
    queryFn: () => api.getPicks(leagueId, week, options),
    enabled: (options?.enabled ?? true) && Boolean(leagueId) && week > 0,
  });
}

export function useSubmitPicks(leagueId: string, week: number) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitPicksInput) => api.submitPicks(leagueId, week, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["picks", leagueId, week] });
      queryClient.invalidateQueries({ queryKey: ["pickSummary", leagueId, week] });
      queryClient.invalidateQueries({ queryKey: ["slate", leagueId, week] });
    },
  });
}

export function usePickSummary(leagueId: string, week: number, enabled = true) {
  const api = useApiClient();

  return useQuery({
    queryKey: ["pickSummary", leagueId, week],
    queryFn: () => api.getPickSummary(leagueId, week),
    enabled: enabled && Boolean(leagueId) && week > 0,
    retry: false,
  });
}

export const WEEKS = Array.from({ length: 15 }, (_, index) => index + 1);

export function getCurrentWeekFromGames(games: { week: number; startTime: string }[]): number {
  if (games.length === 0) {
    return 1;
  }

  const now = Date.now();
  const upcoming = games
    .filter((game) => new Date(game.startTime).getTime() > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  if (upcoming.length > 0) {
    return upcoming[0]!.week;
  }

  return Math.max(...games.map((game) => game.week));
}

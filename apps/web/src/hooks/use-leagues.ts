import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateLeagueInput, PublicLeaguesQuery } from "@callsheet/shared";
import { useApiClient } from "@/lib/api";

export const MY_LEAGUES_QUERY_KEY = ["myLeagues"] as const;

export function usePublicLeagues(query: PublicLeaguesQuery) {
  const api = useApiClient();

  return useQuery({
    queryKey: ["publicLeagues", query],
    queryFn: () => api.getPublicLeagues(query),
  });
}

export function useMyLeagues() {
  const api = useApiClient();

  return useQuery({
    queryKey: MY_LEAGUES_QUERY_KEY,
    queryFn: () => api.getMyLeagues(),
  });
}

export function useSports() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["sports"],
    queryFn: () => api.getSports(),
  });
}

export function useLeague(leagueId: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: ["league", leagueId],
    queryFn: () => api.getLeague(leagueId),
    enabled: Boolean(leagueId),
  });
}

export function useInvitePreview(code: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: ["invitePreview", code],
    queryFn: () => api.getInvitePreview(code),
    enabled: Boolean(code),
  });
}

export function useCreateLeague() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLeagueInput) => api.createLeague(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_LEAGUES_QUERY_KEY });
    },
  });
}

export function useJoinLeague() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ code, password }: { code: string; password?: string }) =>
      api.joinLeague(code, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_LEAGUES_QUERY_KEY });
    },
  });
}

export function useJoinPublicLeague() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leagueId: string) => api.joinPublicLeague(leagueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_LEAGUES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["publicLeagues"] });
    },
  });
}

export function useJoinWaitlist() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leagueId: string) => api.joinWaitlist(leagueId),
    onSuccess: (_data, leagueId) => {
      queryClient.invalidateQueries({ queryKey: ["publicLeagues"] });
      queryClient.invalidateQueries({ queryKey: ["waitlist", leagueId] });
    },
  });
}

export function useWaitlist(leagueId: string, enabled: boolean) {
  const api = useApiClient();

  return useQuery({
    queryKey: ["waitlist", leagueId],
    queryFn: () => api.getWaitlist(leagueId),
    enabled: enabled && Boolean(leagueId),
  });
}

export function useLeaveLeague() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leagueId: string) => api.leaveLeague(leagueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_LEAGUES_QUERY_KEY });
    },
  });
}

export function useRemoveMember() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leagueId, userId }: { leagueId: string; userId: string }) =>
      api.removeMember(leagueId, userId),
    onSuccess: (league) => {
      queryClient.setQueryData(["league", league.id], league);
      queryClient.invalidateQueries({ queryKey: MY_LEAGUES_QUERY_KEY });
    },
  });
}

export function useLeagueSeasons(leagueId: string, enabled = true) {
  const api = useApiClient();

  return useQuery({
    queryKey: ["leagueSeasons", leagueId],
    queryFn: () => api.getLeagueSeasons(leagueId),
    enabled: enabled && Boolean(leagueId),
  });
}

export function useLeagueSettings(leagueId: string, enabled = true) {
  const api = useApiClient();

  return useQuery({
    queryKey: ["leagueSettings", leagueId],
    queryFn: () => api.getLeagueSettings(leagueId),
    enabled: enabled && Boolean(leagueId),
  });
}

export function useStartNewSeason() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leagueId, year }: { leagueId: string; year: number }) =>
      api.startNewSeason(leagueId, { year }),
    onSuccess: (league) => {
      queryClient.invalidateQueries({ queryKey: MY_LEAGUES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["league", league.id] });
      queryClient.invalidateQueries({ queryKey: ["leagueSeasons", league.id] });
    },
  });
}

export function useJoinSeason() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leagueId: string) => api.joinSeason(leagueId),
    onSuccess: (league) => {
      queryClient.invalidateQueries({ queryKey: MY_LEAGUES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["league", league.id] });
    },
  });
}

export function useUpdateLeague() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leagueId,
      input,
    }: {
      leagueId: string;
      input: import("@callsheet/shared").UpdateLeagueInput;
    }) => api.updateLeague(leagueId, input),
    onSuccess: (league) => {
      queryClient.setQueryData(["league", league.id], (old: import("@callsheet/shared").LeagueDetail | undefined) =>
        old ? { ...old, ...league } : league,
      );
      queryClient.invalidateQueries({ queryKey: MY_LEAGUES_QUERY_KEY });
    },
  });
}

export function useDeleteLeague() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leagueId: string) => api.deleteLeague(leagueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_LEAGUES_QUERY_KEY });
    },
  });
}

export function useInitiateTransfer() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leagueId,
      targetUserId,
    }: {
      leagueId: string;
      targetUserId: string;
    }) => api.initiateTransfer(leagueId, { targetUserId }),
    onSuccess: (_data, { leagueId }) => {
      queryClient.invalidateQueries({ queryKey: ["leagueSettings", leagueId] });
    },
  });
}

export function useAcceptTransfer() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leagueId: string) => api.acceptTransfer(leagueId),
    onSuccess: (league) => {
      queryClient.invalidateQueries({ queryKey: MY_LEAGUES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["league", league.id] });
      queryClient.invalidateQueries({ queryKey: ["leagueSettings", league.id] });
    },
  });
}

export function useDeclineTransfer() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leagueId: string) => api.declineTransfer(leagueId),
    onSuccess: (_data, leagueId) => {
      queryClient.invalidateQueries({ queryKey: ["leagueSettings", leagueId] });
    },
  });
}

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

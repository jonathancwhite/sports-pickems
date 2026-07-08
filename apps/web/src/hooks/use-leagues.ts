import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateLeagueInput } from "@callsheet/shared";
import { useApiClient } from "@/lib/api";

export const MY_LEAGUES_QUERY_KEY = ["myLeagues"] as const;

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

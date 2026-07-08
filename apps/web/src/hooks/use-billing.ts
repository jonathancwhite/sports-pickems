import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";

export function useUserBilling() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["user-billing"],
    queryFn: () => api.getUserBilling(),
  });
}

export function useCreatedLeagueCount() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["created-league-count"],
    queryFn: () => api.getCreatedLeagueCount(),
  });
}

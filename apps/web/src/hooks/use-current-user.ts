import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdatePreferences } from "@callsheet/shared";
import { useAuth } from "@clerk/clerk-react";
import { ApiError, useApiClient } from "@/lib/api";
import { showApiError } from "@/lib/toast";

export const CURRENT_USER_QUERY_KEY = ["currentUser"] as const;

export function useCurrentUser() {
  const { isSignedIn } = useAuth();
  const api = useApiClient();

  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => api.getCurrentUser(),
    enabled: isSignedIn,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) {
        return failureCount < 5;
      }
      return failureCount < 1;
    },
    retryDelay: (_attempt, error) => {
      if (error instanceof ApiError && error.status === 404) {
        const body = error.body as { retryAfterMs?: number } | undefined;
        return body?.retryAfterMs ?? 2000;
      }
      return 1000;
    },
  });
}

export function useUpdatePreferences() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: UpdatePreferences) => api.updatePreferences(preferences),
    onMutate: async (preferences) => {
      await queryClient.cancelQueries({ queryKey: CURRENT_USER_QUERY_KEY });
      const previous = queryClient.getQueryData(CURRENT_USER_QUERY_KEY);

      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, (old: unknown) => {
        if (!old || typeof old !== "object" || !("preferences" in old)) {
          return old;
        }
        return {
          ...old,
          preferences: { ...(old.preferences as object), ...preferences },
        };
      });

      return { previous };
    },
    onError: (error, _preferences, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CURRENT_USER_QUERY_KEY, context.previous);
      }
      showApiError(error, "Failed to update preferences");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Theme } from "@callsheet/shared";
import { useAuth } from "@clerk/clerk-react";
import { ApiError, useApiClient } from "@/lib/api";

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

export function useUpdateTheme() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (theme: Theme) => api.updatePreferences({ theme }),
    onMutate: async (theme) => {
      await queryClient.cancelQueries({ queryKey: CURRENT_USER_QUERY_KEY });
      const previous = queryClient.getQueryData(CURRENT_USER_QUERY_KEY);

      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, (old: unknown) => {
        if (!old || typeof old !== "object") {
          return old;
        }
        return {
          ...old,
          preferences: { theme },
        };
      });

      return { previous };
    },
    onError: (_error, _theme, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CURRENT_USER_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
  });
}

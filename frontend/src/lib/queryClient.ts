/**
 * React Query client.
 *
 * Centralized so every part of the app shares one cache and one set
 * of defaults, rather than each feature creating its own QueryClient.
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute — dashboard/analytics data doesn't need to refetch on every focus
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

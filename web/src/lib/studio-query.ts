import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 8_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

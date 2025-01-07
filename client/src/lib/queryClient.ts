import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const [url, params] = queryKey;

        // Build URL with query parameters if they exist
        const queryParams = params ? new URLSearchParams(
          Object.entries(params).map(([key, value]) => [key, String(value)])
        ).toString() : '';

        const fullUrl = queryParams ? `${url}?${queryParams}` : url;

        const res = await fetch(fullUrl, {
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status >= 500) {
            throw new Error(`${res.status}: ${res.statusText}`);
          }

          throw new Error(`${res.status}: ${await res.text()}`);
        }

        return res.json();
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    }
  },
});
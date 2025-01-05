import { useQuery } from "@tanstack/react-query";

export function useCredits() {
  const { data, isLoading, error } = useQuery<{ credits: number }>({
    queryKey: ["/api/credits"],
  });

  return {
    credits: data?.credits ?? 0,
    isLoading,
    error,
  };
}

import { useQuery } from "@tanstack/react-query";
import { customersRepository } from "@/lib/repositories";
import { useAuth } from "@/hooks/use-auth";

export type ClientMinItem = { id: string; name: string };

export function useClientsMin() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["clients-min"],
    queryFn: () => customersRepository.getAllMin() as Promise<ClientMinItem[]>,
    enabled: typeof window !== "undefined" && !!session,
    refetchOnMount: "always",
    retry: 2,
  });
}

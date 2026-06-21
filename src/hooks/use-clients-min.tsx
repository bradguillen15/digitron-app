import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { customersRepository } from "@/lib/repositories";

export type ClientMinItem = { id: string; name: string };

export function useClientsMin() {
  return useQuery({
    queryKey: ["clients-min"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return [];
      return customersRepository.getAllMin() as Promise<ClientMinItem[]>;
    },
    enabled: typeof window !== "undefined",
    refetchOnMount: "always",
    retry: 2,
  });
}

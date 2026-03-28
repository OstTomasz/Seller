import { useQuery } from "@tanstack/react-query";
import { Client } from "@/types";
import { clientsApi } from "@/api/clients";

export const useClientsForEvent = () =>
  useQuery({
    queryKey: ["clients-for-event"],
    queryFn: async (): Promise<Client[]> => {
      const { data } = await clientsApi.getForEvent();
      return data.clients;
    },
    staleTime: 60_000,
  });

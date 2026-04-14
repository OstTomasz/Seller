import { useQuery } from "@tanstack/react-query";
import { clientsApi } from "@/api/clients";
import { queryKeys } from "@/lib/queryKeys";

export const useClients = () => {
  return useQuery({
    queryKey: queryKeys.clients.all(),
    queryFn: async () => {
      const { data } = await clientsApi.getAll();
      return data.clients;
    },
    staleTime: 30 * 1000,
  });
};

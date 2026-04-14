import { useQuery } from "@tanstack/react-query";
import { clientsApi } from "@/api/clients";
import { queryKeys } from "@/lib/queryKeys";

export const useClient = (id: string) => {
  return useQuery({
    queryKey: queryKeys.clients.details(id),
    queryFn: async () => {
      const { data } = await clientsApi.getById(id);
      return data.client;
    },
    enabled: !!id,
  });
};

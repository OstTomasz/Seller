import { useQuery } from "@tanstack/react-query";
import { clientsApi } from "@/api/clients";

export const useClient = (id: string) => {
  return useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data } = await clientsApi.getById(id);
      return data.client;
    },
    enabled: !!id,
  });
};

import { useQuery } from "@tanstack/react-query";
import { clientsApi } from "@/api/clients";

export const useClients = () => {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data } = await clientsApi.getAll();
      return data.clients;
    },
    staleTime: 30 * 1000,
  });
};

import { useQuery } from "@tanstack/react-query";
import { clientsApi } from "@/api/clients";

export const useArchivedClients = () =>
  useQuery({
    queryKey: ["clients", "archived"],
    queryFn: async () => {
      const { data } = await clientsApi.getArchived();
      return data.clients;
    },
    staleTime: 30 * 1000,
  });

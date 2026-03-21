// client/src/features/notifications/hooks/useNotificationClient.ts
import { useQuery } from "@tanstack/react-query";
import { Client } from "@/types";
import { clientsApi } from "@/api/clients";

export const useNotificationClient = (clientId: string | null) =>
  useQuery({
    queryKey: ["notification-client", clientId],
    queryFn: async (): Promise<Client> => {
      const { data } = await clientsApi.getById(clientId!);
      return data.client;
    },
    enabled: !!clientId,
    staleTime: 30_000,
  });

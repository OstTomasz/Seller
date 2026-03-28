// client/src/features/calendar/hooks/useEventInvitations.ts

import { useQuery } from "@tanstack/react-query";
import { IInvitationWithInvitee } from "@/types";
import { api } from "@/lib/axios";

const fetchEventInvitations = async (eventId: string): Promise<IInvitationWithInvitee[]> => {
  const { data } = await api.get<{ invitations: IInvitationWithInvitee[] }>(
    `/events/${eventId}/invitations`,
  );
  return data.invitations;
};

export const useEventInvitations = (eventId: string | null) =>
  useQuery({
    queryKey: ["event-invitations", eventId],
    queryFn: () => fetchEventInvitations(eventId!),
    enabled: !!eventId,
    staleTime: 0,
  });

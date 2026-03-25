import { api } from "@/lib/axios";
import type { IEvent, IInvitation } from "@seller/shared/types";
import type { UserForInvite } from "@/types";

export interface EventsQueryParams {
  from: string;
  to: string;
}

export interface CreateEventPayload {
  title: string;
  startDate: string;
  duration: number | null;
  allDay: boolean;
  location?: string;
  description?: string;
  type: "client_meeting" | "team_meeting" | "personal";
  clientId?: string;
  mandatory?: boolean;
  inviteeIds?: string[];
  regionId?: string;
  superregionId?: string;
}

export interface UpdateEventPayload {
  title?: string;
  startDate?: string;
  duration?: number | null;
  allDay?: boolean;
  location?: string | null;
  description?: string | null;
  type?: "client_meeting" | "team_meeting" | "personal";
  clientId?: string | null;
}

// Backend wraps all responses — { events }, { invitations }, { event, conflicts } etc.

export const fetchEvents = async (params: EventsQueryParams): Promise<IEvent[]> => {
  const { data } = await api.get<{ events: IEvent[] }>("/events", { params });
  return data.events;
};

export const fetchPendingInvitations = async (): Promise<IInvitation[]> => {
  const { data } = await api.get<{ invitations: IInvitation[] }>("/events/invitations");
  return data.invitations;
};

export const fetchAllUsersForInvite = async (): Promise<UserForInvite[]> => {
  const { data } = await api.get<{ users: UserForInvite[] }>("/events/users");
  return data.users;
};

export const createEvent = async (
  payload: CreateEventPayload,
): Promise<{ event: IEvent; conflicts: IEvent[] }> => {
  const { data } = await api.post<{ event: IEvent; conflicts: IEvent[] }>("/events", payload);
  return data;
};

export const updateEventDate = async (
  eventId: string,
  payload: { startDate: string; duration: number | null },
): Promise<IEvent> => {
  const { data } = await api.patch<{ event: IEvent; conflicts: IEvent[] }>(
    `/events/${eventId}`,
    payload,
  );
  return data.event;
};

export const respondToInvitation = async (
  eventId: string,
  status: "accepted" | "rejected",
): Promise<IInvitation> => {
  const { data } = await api.patch<{ invitation: IInvitation }>(`/events/${eventId}/respond`, {
    status,
  });
  return data.invitation;
};

export const updateEvent = async (
  eventId: string,
  payload: UpdateEventPayload,
): Promise<{ event: IEvent; conflicts: IEvent[] }> => {
  const { data } = await api.patch<{ event: IEvent; conflicts: IEvent[] }>(
    `/events/${eventId}`,
    payload,
  );
  return data;
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  await api.delete(`/events/${eventId}`);
};

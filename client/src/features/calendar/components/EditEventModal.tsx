import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, ConfirmDialog } from "@/components/ui";
import { useUpdateEvent } from "../hooks/useUpdateEvent";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";

import {
  buildDuration,
  buildStartDate,
  eventFormSchema,
  type CalendarEvent,
  type EventFormValues,
} from "@/types";
import dayjs from "dayjs";
import { EventForm } from "./EventForm";
import { useAuthStore } from "@/store/authStore";
import { useEventInvitations } from "../hooks/useEventInvitations";
import { useMemo } from "react";
import { EventType } from "@seller/shared/types";

/** Converts CalendarEvent back into form values for editing */
const buildDefaultValues = (event: CalendarEvent): EventFormValues => {
  const raw = event.resource.raw;
  return {
    title: raw.title,
    type: raw.type,
    allDay: raw.allDay,
    startDate: dayjs(raw.startDate).format("YYYY-MM-DD"),
    startTime: raw.allDay ? "09:00" : dayjs(raw.startDate).format("HH:mm"),
    duration: raw.duration ?? 60,
    location: raw.location ?? "",
    description: raw.description ?? "",
    inviteeIds: [],
    clientId:
      typeof raw.clientId === "object" ? (raw.clientId?._id ?? null) : (raw.clientId ?? null),
  };
};

interface EditEventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

export const EditEventModal = ({ event, onClose }: EditEventModalProps) => {
  const { user } = useAuthStore();
  const updateEvent = useUpdateEvent();

  const { data: existingInvitations = [] } = useEventInvitations(event?.resource.raw._id ?? null);

  const defaultValues = useMemo(() => {
    if (!event) return undefined;
    const base = buildDefaultValues(event);
    base.inviteeIds = existingInvitations
      .filter((inv) => inv.status !== "rejected")
      .map((inv) => (typeof inv.inviteeId === "object" ? inv.inviteeId._id : inv.inviteeId))
      .filter((id) => id !== user?._id);
    return base;
  }, [event, existingInvitations, user?._id]);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
    // Re-populate form when a different event is passed in
    values: defaultValues,
  });

  const discard = useDiscardConfirm(form.formState.isDirty, () => {
    form.reset(defaultValues);
    onClose();
  });

  if (!event) return null;

  const onSubmit = (values: EventFormValues) => {
    updateEvent.mutate(
      {
        eventId: event.resource.raw._id,
        payload: {
          title: values.title,
          type: values.type as EventType,
          allDay: values.allDay,
          startDate: buildStartDate(values),
          duration: buildDuration(values),
          location: values.location || null,
          description: values.description || null,
          inviteeIds: values.inviteeIds,
          clientId: values.clientId ?? null,
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <>
      <Modal isOpen={event !== null} onClose={discard.tryClose} title="Edit event" size="md">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <EventForm
            form={form}
            isPending={updateEvent.isPending}
            onCancel={discard.tryClose}
            submitLabel="Save changes"
            canSetMandatory={false}
            existingInvitations={existingInvitations}
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={discard.isOpen}
        onClose={discard.cancel}
        onConfirm={discard.confirm}
        title="Discard changes?"
        description="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
      />
    </>
  );
};

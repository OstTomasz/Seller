import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, ConfirmDialog } from "@/components/ui";
import { useCreateEvent } from "../hooks/useCreateEvent";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import { buildDuration, buildStartDate, eventFormSchema, EventFormValues } from "@/types";
import { EventForm } from "./EventForm";
import { useAuthStore } from "@/store/authStore";
import { useMemo } from "react";
import { EventType } from "@seller/shared/types";

const buildDefaultValues = (
  prefillStart?: Date,
  prefillValues?: Partial<EventFormValues>,
): EventFormValues => {
  // Format date in LOCAL timezone, not UTC
  const formatLocalDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatLocalTime = (date: Date): string => {
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${min}`;
  };

  // In month view RBC gives midnight — default to 08:00
  const isMonthMidnight = (date: Date) => date.getHours() === 0 && date.getMinutes() === 0;

  return {
    title: prefillValues?.title ?? "",
    type: prefillValues?.type ?? "personal",
    allDay: prefillValues?.allDay ?? false,
    startDate: prefillStart ? formatLocalDate(prefillStart) : formatLocalDate(new Date()),
    startTime: prefillStart
      ? isMonthMidnight(prefillStart)
        ? "08:00"
        : formatLocalTime(prefillStart)
      : (prefillValues?.startTime ?? "08:00"),
    duration: prefillValues?.duration ?? 60,
    location: prefillValues?.location ?? "",
    description: prefillValues?.description ?? "",
    inviteeIds: prefillValues?.inviteeIds ?? [],
    clientId: null,
  };
};

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillStart?: Date;
  prefillValues?: Partial<EventFormValues>;
}

export const CreateEventModal = ({
  isOpen,
  onClose,
  prefillStart,
  prefillValues,
}: CreateEventModalProps) => {
  const { user } = useAuthStore();
  const canSetMandatory = user?.role === "director" || user?.role === "deputy";

  const defaultValues = useMemo(
    () => buildDefaultValues(prefillStart, prefillValues),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen], // recalculate only when modal opens — not on every render
  );

  const createEvent = useCreateEvent();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
    values: defaultValues,
  });

  const discard = useDiscardConfirm(form.formState.isDirty, () => {
    form.reset(defaultValues);
    onClose();
  });

  const onSubmit = (values: EventFormValues) => {
    createEvent.mutate(
      {
        title: values.title,
        type: values.type as EventType,
        allDay: values.allDay,
        startDate: buildStartDate(values),
        duration: buildDuration(values),
        location: values.location || null,
        description: values.description || null,
        inviteeIds: values.inviteeIds?.length ? values.inviteeIds : undefined,
        mandatory: canSetMandatory ? (values.mandatory ?? false) : undefined,
        clientId: values.clientId ?? null,
      },
      {
        onSuccess: () => {
          form.reset(defaultValues);
          onClose();
        },
      },
    );
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={discard.tryClose} title="New event" size="md">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <EventForm
            form={form}
            isPending={createEvent.isPending}
            onCancel={discard.tryClose}
            submitLabel="Create event"
            canSetMandatory={canSetMandatory}
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

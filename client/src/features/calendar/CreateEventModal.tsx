import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, ConfirmDialog } from "@/components/ui";
import { useCreateEvent } from "./hooks/useCreateEvent";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import { buildDuration, buildStartDate, eventFormSchema, EventFormValues } from "@/types";
import { EventForm } from "./EventForm";
import { useAuthStore } from "@/store/authStore";
import { useMemo } from "react";

const buildDefaultValues = (
  prefillStart?: Date,
  prefillValues?: Partial<EventFormValues>,
): EventFormValues => ({
  title: prefillValues?.title ?? "",
  type: prefillValues?.type ?? "personal",
  allDay: prefillValues?.allDay ?? false,
  startDate: prefillStart
    ? prefillStart.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10),
  startTime: prefillStart
    ? prefillStart.toTimeString().slice(0, 5)
    : (prefillValues?.startTime ?? "09:00"),
  duration: prefillValues?.duration ?? 60,
  location: prefillValues?.location ?? "",
  description: prefillValues?.description ?? "",
});

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
        type: values.type,
        allDay: values.allDay,
        startDate: buildStartDate(values),
        duration: buildDuration(values),
        location: values.location || undefined,
        description: values.description || undefined,
        inviteeIds: values.inviteeIds?.length ? values.inviteeIds : undefined,
        mandatory: canSetMandatory ? (values.mandatory ?? false) : undefined,
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
      <Modal
        isOpen={isOpen}
        onClose={discard.tryClose}
        title="New event"
        size="md"
        disableOutsideClick
      >
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <EventForm
            form={form}
            isPending={createEvent.isPending}
            onCancel={discard.tryClose}
            submitLabel="Create event"
            showInvitees
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

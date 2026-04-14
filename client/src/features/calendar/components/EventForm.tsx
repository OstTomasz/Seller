import type { UseFormReturn } from "react-hook-form";
import { EventFormValues, IInvitationWithInvitee } from "@/types";
import { Button } from "@/components/ui";
import { useUsersForInvite } from "../hooks/useUsersForInvite";
import { useClientsForEvent } from "../hooks/useClientsForEvent";
import { useEffect, useMemo, useState } from "react";
import { InviteUsersModal } from "./InviteUsersModal";
import { useAuthStore } from "@/store/authStore";
import { getRelevantUserIds } from "../utils/eventForm.helpers";
import { ClientPickerSection, ParticipantsSection } from "./EventForm.sections";
import {
  BasicInfoSection,
  DateTimeSection,
  DetailsSection,
  MandatorySection,
} from "./EventForm.basicSections";

// ── Props ─────────────────────────────────────────────────────────────────────

interface EventFormProps {
  form: UseFormReturn<EventFormValues>;
  isPending: boolean;
  onCancel: () => void;
  submitLabel: string;

  canSetMandatory?: boolean;
  existingInvitations?: IInvitationWithInvitee[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export const EventForm = ({
  form,
  isPending,
  onCancel,
  submitLabel,
  canSetMandatory,
  existingInvitations,
}: EventFormProps) => {
  const { user: currentUser } = useAuthStore();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const { data: allUsers = [] } = useUsersForInvite();
  const { data: clientsForEvent = [] } = useClientsForEvent();
  const [clientSearch, setClientSearch] = useState("");

  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const eventType = form.watch("type");

  const showClientPicker = eventType === "client_meeting";

  const showInvitees = eventType === "team_meeting" || eventType === "client_meeting";

  const inviteeIds = watch("inviteeIds") ?? [];
  const rejectedIds =
    existingInvitations
      ?.filter(
        (inv) =>
          inv.status === "rejected" &&
          typeof inv.inviteeId === "object" &&
          !inviteeIds.includes(inv.inviteeId._id),
      )
      .map((inv) => (typeof inv.inviteeId === "object" ? inv.inviteeId._id : "")) ?? [];

  const allChipIds = [...inviteeIds, ...rejectedIds];

  const selectedClientId = watch("clientId");

  const selectedClient = useMemo(
    () => clientsForEvent.find((c) => c._id === selectedClientId),
    [clientsForEvent, selectedClientId],
  );

  const relevantUserIds = useMemo(() => {
    if (eventType !== "client_meeting" || !selectedClient) return null;
    return getRelevantUserIds(selectedClient, allUsers, currentUser?._id);
  }, [eventType, selectedClient, allUsers, currentUser?._id]);

  const allDay = watch("allDay");

  useEffect(() => {
    if (eventType !== "client_meeting" || !relevantUserIds) return;
    const currentIds = watch("inviteeIds") ?? [];
    const validIds = currentIds.filter(
      (id) =>
        relevantUserIds.includes(id) ||
        existingInvitations?.some(
          (inv) =>
            typeof inv.inviteeId === "object" &&
            inv.inviteeId._id === id &&
            (inv.status === "accepted" || inv.status === "pending"),
        ),
    );
    if (validIds.length !== currentIds.length) {
      setValue("inviteeIds", validIds, { shouldDirty: true });
    }
  }, [selectedClientId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 max-h-[60vh] overflow-y-auto pr-1">
        <BasicInfoSection register={register} control={control} errors={errors} setValue={setValue} />
        <MandatorySection canSetMandatory={canSetMandatory} eventType={eventType} control={control} />
        <DateTimeSection control={control} register={register} errors={errors} allDay={allDay} />
        <DetailsSection register={register} errors={errors} />
      </div>

      {showClientPicker && (
        <ClientPickerSection
          control={control}
          clientsForEvent={clientsForEvent}
          clientSearch={clientSearch}
          setClientSearch={setClientSearch}
          errorMessage={errors.clientId?.message}
        />
      )}

      {showInvitees ? (
        <>
          <ParticipantsSection
            inviteeIds={inviteeIds}
            allChipIds={allChipIds}
            allUsers={allUsers}
            existingInvitations={existingInvitations}
            onAddInvitee={(id) => setValue("inviteeIds", [...inviteeIds, id], { shouldDirty: true })}
            onRemoveInvitee={(id) =>
              setValue(
                "inviteeIds",
                inviteeIds.filter((inviteeId) => inviteeId !== id),
                { shouldDirty: true },
              )
            }
            onOpenInviteModal={() => setInviteModalOpen(true)}
            errorMessage={form.formState.errors.inviteeIds?.message}
          />

          <InviteUsersModal
            isOpen={inviteModalOpen}
            onClose={(e?: React.MouseEvent) => {
              e?.stopPropagation();
              setInviteModalOpen(false);
            }}
            selectedIds={inviteeIds}
            onConfirm={(ids) => setValue("inviteeIds", ids, { shouldDirty: true })}
            excludeUserId={currentUser?._id}
            lockedIds={
              existingInvitations
                ?.filter((inv) => inv.status === "accepted" || inv.status === "pending")
                .map((inv) =>
                  typeof inv.inviteeId === "object" ? inv.inviteeId._id : inv.inviteeId,
                ) ?? []
            }
            allowedIds={relevantUserIds ?? undefined}
          />
        </>
      ) : null}

      {/* ── Actions ────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </div>
  );
};

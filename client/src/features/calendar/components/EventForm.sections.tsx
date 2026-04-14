import { Controller, type Control } from "react-hook-form";
import { CheckCircle2, Clock, Search, UserPlus, X, XCircle } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Client, EventFormValues, IInvitationWithInvitee, UserForInvite } from "@/types";
import { FieldError, SectionTitle, getUserName } from "../utils/eventForm.helpers";

interface ClientPickerSectionProps {
  control: Control<EventFormValues>;
  clientsForEvent: Client[];
  clientSearch: string;
  setClientSearch: (value: string) => void;
  errorMessage?: string;
}

export const ClientPickerSection = ({
  control,
  clientsForEvent,
  clientSearch,
  setClientSearch,
  errorMessage,
}: ClientPickerSectionProps) => (
  <section>
    <SectionTitle>Client</SectionTitle>
    <Controller
      name="clientId"
      control={control}
      render={({ field }) => {
        const selected = clientsForEvent.find((client) => client._id === field.value);
        const filtered = clientsForEvent.filter((client) =>
          client.companyName.toLowerCase().includes(clientSearch.toLowerCase()),
        );

        return (
          <div className="flex flex-col gap-2">
            {selected ? (
              <div className="flex items-center justify-between rounded-lg border border-celery-700 bg-celery-900/30 px-3 py-2">
                <div>
                  <p className="text-sm text-celery-100">{selected.companyName}</p>
                  <p className="text-xs text-celery-500">#{selected.numericId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => field.onChange(null)}
                  className="text-celery-600 hover:text-red-400 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-celery-500" />
                <Input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Search client..."
                  surface="elevated"
                  hideErrorSpace
                  className="pl-8 pr-3 py-2 text-celery-200"
                />
                {clientSearch && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-celery-700 bg-bg-elevated shadow-lg max-h-48 overflow-y-auto">
                    {filtered.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-celery-600">No clients found</p>
                    ) : (
                      filtered.map((client) => (
                        <button
                          key={client._id}
                          type="button"
                          onClick={() => {
                            field.onChange(client._id);
                            setClientSearch("");
                          }}
                          className="flex items-center justify-between w-full px-3 py-2 text-sm text-celery-200 hover:bg-celery-800 transition-colors"
                        >
                          <span>{client.companyName}</span>
                          <span className="text-xs text-celery-500">#{client.numericId}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }}
    />
    <FieldError message={errorMessage} />
  </section>
);

interface ParticipantsSectionProps {
  inviteeIds: string[];
  allChipIds: string[];
  allUsers: UserForInvite[];
  existingInvitations?: IInvitationWithInvitee[];
  onAddInvitee: (id: string) => void;
  onRemoveInvitee: (id: string) => void;
  onOpenInviteModal: () => void;
  errorMessage?: string;
}

export const ParticipantsSection = ({
  inviteeIds,
  allChipIds,
  allUsers,
  existingInvitations,
  onAddInvitee,
  onRemoveInvitee,
  onOpenInviteModal,
  errorMessage,
}: ParticipantsSectionProps) => (
  <section>
    <SectionTitle>Participants</SectionTitle>
    <div className="flex flex-col gap-2">
      {inviteeIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {allChipIds.map((id) => {
            const existing = existingInvitations?.find(
              (invitation) =>
                typeof invitation.inviteeId === "object" && invitation.inviteeId._id === id,
            );
            const isPendingReInvite = existing?.status === "rejected" && inviteeIds.includes(id);
            const isLocked = existing?.status === "accepted" || existing?.status === "pending";
            const isRejected = existing?.status === "rejected" && !isPendingReInvite;

            return (
              <span
                key={id}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs",
                  existing?.status === "accepted"
                    ? "bg-celery-700 text-celery-100"
                    : existing?.status === "pending"
                      ? "bg-amber-950 text-amber-300 border border-amber-800"
                      : isPendingReInvite
                        ? "bg-celery-800 text-celery-300 border border-celery-600"
                        : isRejected
                          ? "bg-red-950 text-red-300 border border-red-800"
                          : "bg-celery-700 text-celery-100",
                )}
              >
                {getUserName(id, allUsers)}
                {existing?.status === "accepted" && <CheckCircle2 className="size-3 text-celery-400" />}
                {existing?.status === "pending" && <Clock className="size-3 text-amber-400" />}
                {isPendingReInvite && <UserPlus className="size-3 text-celery-400" />}
                {isRejected && <XCircle className="size-3 text-red-400" />}
                {isRejected && (
                  <button
                    type="button"
                    onClick={() => onAddInvitee(id)}
                    className="hover:text-celery-300 transition-colors"
                    title="Re-invite"
                  >
                    <UserPlus className="size-3" />
                  </button>
                )}
                {isPendingReInvite && (
                  <button
                    type="button"
                    onClick={() => onRemoveInvitee(id)}
                    className="hover:text-red-300 transition-colors"
                    title="Cancel re-invite"
                  >
                    <X className="size-3" />
                  </button>
                )}
                {!isLocked && !isRejected && !isPendingReInvite && (
                  <button
                    type="button"
                    onClick={() => onRemoveInvitee(id)}
                    className="hover:text-red-300 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        className="self-start text-celery-500 hover:text-celery-300 text-xs"
        onClick={onOpenInviteModal}
      >
        <UserPlus className="size-3.5 mr-1.5" />
        {inviteeIds.length > 0 ? "Edit participants" : "Invite participants"}
      </Button>
    </div>
    <FieldError message={errorMessage} />
  </section>
);

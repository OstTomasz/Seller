import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { Client, EventFormValues, IInvitationWithInvitee, UserForInvite } from "@/types";
import { Input, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useUsersForInvite } from "./hooks/useUsersForInvite";
import { useClientsForEvent } from "./hooks/useClientsForEvent";
import { useEffect, useMemo, useState } from "react";
import { InviteUsersModal } from "./InviteUsersModal";
import { CheckCircle2, Clock, XCircle, UserPlus, X, Search } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

// ── Helpers ───────────────────────────────────────────────────────────────────

export const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <span className="min-h-4 text-xs text-red-400">{message}</span>
  ) : (
    <span className="min-h-4" />
  );

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xs font-semibold text-celery-500 uppercase tracking-wider mb-3">
    {children}
  </h3>
);

interface PopulatedPosition {
  _id: string;
  currentHolder?: { _id: string };
  region?: {
    _id: string;
    parentRegion?: { _id: string; name?: string } | null;
  };
}

const getRelevantUserIds = (
  client: Client,
  allUsers: UserForInvite[],
  excludeUserId?: string,
): string[] => {
  const ids = new Set<string>();

  const assignedTo = client.assignedTo as unknown as PopulatedPosition;
  const assignedAdvisor = client.assignedAdvisor as unknown as PopulatedPosition | null;

  if (assignedTo?.currentHolder?._id) ids.add(assignedTo.currentHolder._id);
  if (assignedAdvisor?.currentHolder?._id) ids.add(assignedAdvisor.currentHolder._id);

  const parentRegion = assignedTo?.region?.parentRegion;
  const superRegionId =
    parentRegion != null && typeof parentRegion === "object" ? parentRegion._id : undefined;

  // deputy
  if (superRegionId) {
    allUsers
      .filter((u) => {
        const region = u.position?.region;
        if (!region) return false;
        const match = region.parentRegion === null && region._id.toString() === superRegionId;
        return match;
      })
      .forEach((u) => ids.add(u._id));
  }

  // directors

  allUsers.filter((u) => !u.position?.region).forEach((u) => ids.add(u._id));

  if (excludeUserId) ids.delete(excludeUserId);

  return [...ids];
};

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

  const getuserName = (id: string) => {
    const u = allUsers.find((u) => u._id === id);
    return u ? `${u.firstName} ${u.lastName}` : id;
  };

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
        {/* ── Basic info ───────────────────────────────────────────── */}
        <section>
          <SectionTitle>Basic information</SectionTitle>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-celery-500">Title</label>
              <Input {...register("title")} placeholder="Event title" />
              <FieldError message={errors.title?.message} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-celery-500">Type</label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    value={field.value as string}
                    onChange={(e) => {
                      field.onChange(e);
                      if (e.target.value === "personal") {
                        setValue("mandatory", false);
                      }
                    }}
                    className="w-full rounded-lg bg-bg-elevated border border-celery-700
                               px-3 py-2 text-sm text-celery-200
                               focus:outline-none focus:border-celery-500"
                  >
                    <option value="personal">Personal</option>
                    <option value="team_meeting">Team meeting</option>
                    <option value="client_meeting">Client meeting</option>
                  </select>
                )}
              />
              <FieldError message={errors.type?.message} />
            </div>
          </div>
        </section>

        {canSetMandatory ? (
          <label
            className={cn(
              "flex items-center gap-3 select-none",
              eventType === "personal" ? "opacity-40 cursor-not-allowed" : "cursor-pointer", // ✅
            )}
          >
            <Controller
              name="mandatory"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  role="switch"
                  disabled={eventType === "personal"} // ✅
                  aria-checked={field.value ?? false}
                  onClick={() => {
                    if (eventType === "personal") return;
                    field.onChange(!(field.value ?? false));
                  }}
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors",
                    field.value && eventType !== "personal" ? "bg-red-600" : "bg-celery-800",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                      field.value && eventType !== "personal" && "translate-x-4",
                    )}
                  />
                </button>
              )}
            />
            <span className="text-sm text-celery-300">Mandatory for team</span>
          </label>
        ) : null}

        {/* ── Date & time ──────────────────────────────────────────── */}
        <section>
          <SectionTitle>Date & time</SectionTitle>
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <Controller
                name="allDay"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value}
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      "relative h-5 w-9 rounded-full transition-colors",
                      field.value ? "bg-celery-600" : "bg-celery-800",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                        field.value && "translate-x-4",
                      )}
                    />
                  </button>
                )}
              />
              <span className="text-sm text-celery-300">All day</span>
            </label>

            <div className={cn("grid gap-3", allDay ? "grid-cols-1" : "grid-cols-2")}>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-celery-500">Date</label>
                <Input type="date" {...register("startDate")} />
                <FieldError message={errors.startDate?.message} />
              </div>

              {!allDay ? (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-celery-500">Time</label>
                    <Input type="time" {...register("startTime")} />
                    <FieldError message={errors.startTime?.message} />
                  </div>
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-xs text-celery-500">Duration (minutes)</label>
                    <Input
                      type="number"
                      min={15}
                      step={15}
                      {...register("duration", { valueAsNumber: true })}
                      placeholder="60"
                    />
                    <FieldError message={errors.duration?.message} />
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {/* ── Details ──────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Details (optional)</SectionTitle>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-celery-500">Location</label>
              <Input {...register("location")} placeholder="Office, Google Meet…" />
              <FieldError message={errors.location?.message} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-celery-500">Description</label>
              <textarea
                {...register("description")}
                placeholder="Additional notes…"
                rows={3}
                className="w-full rounded-lg bg-bg-elevated border border-celery-700
                           px-3 py-2 text-sm text-celery-200 resize-none
                           focus:outline-none focus:border-celery-500"
              />
              <FieldError message={errors.description?.message} />
            </div>
          </div>
        </section>
      </div>

      {showClientPicker && (
        <section>
          <SectionTitle>Client</SectionTitle>
          <Controller
            name="clientId"
            control={control}
            render={({ field }) => {
              const selected = clientsForEvent.find((c) => c._id === field.value);
              const filtered = clientsForEvent.filter((c) =>
                c.companyName.toLowerCase().includes(clientSearch.toLowerCase()),
              );

              return (
                <div className="flex flex-col gap-2">
                  {/* Selected client chip */}
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
                    // Search + dropdown
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-celery-500" />
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Search client..."
                        className="w-full rounded-lg border border-celery-700 bg-bg-elevated
                             pl-8 pr-3 py-2 text-sm text-celery-200
                             focus:outline-none focus:border-celery-500"
                      />
                      {clientSearch && (
                        <div
                          className="absolute z-10 mt-1 w-full rounded-lg border border-celery-700
                                  bg-bg-elevated shadow-lg max-h-48 overflow-y-auto"
                        >
                          {filtered.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-celery-600">No clients found</p>
                          ) : (
                            filtered.map((c) => (
                              <button
                                key={c._id}
                                type="button"
                                onClick={() => {
                                  field.onChange(c._id);
                                  setClientSearch("");
                                }}
                                className="flex items-center justify-between w-full px-3 py-2
                                     text-sm text-celery-200 hover:bg-celery-800 transition-colors"
                              >
                                <span>{c.companyName}</span>
                                <span className="text-xs text-celery-500">#{c.numericId}</span>
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
          <FieldError message={errors.clientId?.message} />
        </section>
      )}

      {showInvitees ? (
        <section>
          <SectionTitle>Participants</SectionTitle>
          <div className="flex flex-col gap-2">
            {inviteeIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {allChipIds.map((id) => {
                  const existing = existingInvitations?.find(
                    (inv) => typeof inv.inviteeId === "object" && inv.inviteeId._id === id,
                  );

                  const isPendingReInvite =
                    existing?.status === "rejected" && inviteeIds.includes(id);

                  const isLocked =
                    existing?.status === "accepted" || existing?.status === "pending";
                  const isRejected = existing?.status === "rejected" && !isPendingReInvite; // ✅

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
                              ? "bg-celery-800 text-celery-300 border border-celery-600" // ✅ "będzie ponownie zaproszony"
                              : isRejected
                                ? "bg-red-950 text-red-300 border border-red-800"
                                : "bg-celery-700 text-celery-100",
                      )}
                    >
                      {getuserName(id)}
                      {existing?.status === "accepted" && (
                        <CheckCircle2 className="size-3 text-celery-400" />
                      )}
                      {existing?.status === "pending" && (
                        <Clock className="size-3 text-amber-400" />
                      )}
                      {isPendingReInvite && <UserPlus className="size-3 text-celery-400" />}{" "}
                      {isRejected && <XCircle className="size-3 text-red-400" />}
                      {isRejected && (
                        <button
                          type="button"
                          onClick={() =>
                            setValue("inviteeIds", [...inviteeIds, id], { shouldDirty: true })
                          }
                          className="hover:text-celery-300 transition-colors"
                          title="Re-invite"
                        >
                          <UserPlus className="size-3" />
                        </button>
                      )}
                      {/* Cofnij re-invite — gdy isPendingReInvite */}
                      {isPendingReInvite && (
                        <button
                          type="button"
                          onClick={() =>
                            setValue(
                              "inviteeIds",
                              inviteeIds.filter((i) => i !== id),
                              { shouldDirty: true },
                            )
                          }
                          className="hover:text-red-300 transition-colors"
                          title="Cancel re-invite"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                      {/* Nowi bez statusu — X usuwa */}
                      {!isLocked && !isRejected && !isPendingReInvite && (
                        <button
                          type="button"
                          onClick={() =>
                            setValue(
                              "inviteeIds",
                              inviteeIds.filter((i) => i !== id),
                              { shouldDirty: true },
                            )
                          }
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
              onClick={() => setInviteModalOpen(true)}
            >
              <UserPlus className="size-3.5 mr-1.5" />
              {inviteeIds.length > 0 ? "Edit participants" : "Invite participants"}
            </Button>
          </div>
          <FieldError message={form.formState.errors.inviteeIds?.message} />

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
        </section>
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

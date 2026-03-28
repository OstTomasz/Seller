import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { EventFormValues } from "@/types";
import { Input, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useUsersForInvite } from "./hooks/useUsersForInvite";
import { useState } from "react";
import { InviteUsersModal } from "./InviteUsersModal";
import { UserPlus, X } from "lucide-react";
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

// ── Props ─────────────────────────────────────────────────────────────────────

interface EventFormProps {
  form: UseFormReturn<EventFormValues>;
  isPending: boolean;
  onCancel: () => void;
  submitLabel: string;
  showInvitees?: boolean;
  canSetMandatory?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const EventForm = ({
  form,
  isPending,
  onCancel,
  submitLabel,
  showInvitees,
  canSetMandatory,
}: EventFormProps) => {
  const { user: currentUser } = useAuthStore();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const { data: allUsers = [] } = useUsersForInvite();
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const inviteeIds = watch("inviteeIds") ?? [];

  const allDay = watch("allDay");

  const getuserName = (id: string) => {
    const u = allUsers.find((u) => u._id === id);
    return u ? `${u.firstName} ${u.lastName}` : id;
  };

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
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <Controller
              name="mandatory"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value ?? false}
                  onClick={() => field.onChange(!(field.value ?? false))}
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors",
                    field.value ? "bg-red-600" : "bg-celery-800",
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

      {showInvitees ? (
        <section>
          <SectionTitle>Participants</SectionTitle>
          <div className="flex flex-col gap-2">
            {/* Selected participants chips */}
            {inviteeIds.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {inviteeIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full
                         bg-celery-700 text-celery-100 px-2.5 py-0.5 text-xs"
                  >
                    {getuserName(id)}
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
                  </span>
                ))}
              </div>
            ) : null}

            {/* Open modal button */}
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

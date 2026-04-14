import { Controller, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import { Input, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { EventFormValues } from "@/types";
import { FieldError, SectionTitle } from "../utils/eventForm.helpers";

interface BasicInfoSectionProps {
  register: UseFormRegister<EventFormValues>;
  control: Control<EventFormValues>;
  errors: FieldErrors<EventFormValues>;
  setValue: UseFormSetValue<EventFormValues>;
}

export const BasicInfoSection = ({ register, control, errors, setValue }: BasicInfoSectionProps) => (
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
            <Select
              {...field}
              value={field.value as string}
              surface="elevated"
              hideErrorSpace
              options={[
                { value: "personal", label: "Personal" },
                { value: "team_meeting", label: "Team meeting" },
                { value: "client_meeting", label: "Client meeting" },
              ]}
              onChange={(e) => {
                field.onChange(e);
                if (e.target.value === "personal") setValue("mandatory", false);
              }}
            />
          )}
        />
        <FieldError message={errors.type?.message} />
      </div>
    </div>
  </section>
);

interface MandatorySectionProps {
  canSetMandatory?: boolean;
  eventType: EventFormValues["type"];
  control: Control<EventFormValues>;
}

export const MandatorySection = ({ canSetMandatory, eventType, control }: MandatorySectionProps) => {
  if (!canSetMandatory) return null;
  return (
    <label
      className={cn(
        "flex items-center gap-3 select-none",
        eventType === "personal" ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
      )}
    >
      <Controller
        name="mandatory"
        control={control}
        render={({ field }) => (
          <button
            type="button"
            role="switch"
            disabled={eventType === "personal"}
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
  );
};

interface DateTimeSectionProps {
  control: Control<EventFormValues>;
  register: UseFormRegister<EventFormValues>;
  errors: FieldErrors<EventFormValues>;
  allDay: boolean;
}

export const DateTimeSection = ({ control, register, errors, allDay }: DateTimeSectionProps) => (
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
          <Input type="date" min={new Date().toISOString().split("T")[0]} {...register("startDate")} />
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
);

interface DetailsSectionProps {
  register: UseFormRegister<EventFormValues>;
  errors: FieldErrors<EventFormValues>;
}

export const DetailsSection = ({ register, errors }: DetailsSectionProps) => (
  <section>
    <SectionTitle>Details (optional)</SectionTitle>
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-celery-500">Location</label>
        <Input {...register("location")} placeholder="Office, Google Meet..." />
        <FieldError message={errors.location?.message} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-celery-500">Description</label>
        <Textarea
          {...register("description")}
          placeholder="Additional notes..."
          rows={3}
          surface="elevated"
          hideErrorSpace
          className="text-celery-200"
        />
        <FieldError message={errors.description?.message} />
      </div>
    </div>
  </section>
);

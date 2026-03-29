import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { useCreateRegion } from "../hooks/useManagementStructure";
import { toast } from "sonner";
import type { Region } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Required"),
  prefix: z.string().min(1, "Required").max(6, "Max 6 chars"),
  parentRegionId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  superregions: Region[];
  forceParentId?: string; // deputy — locked to their superregion
  isSuperregion?: boolean; // director creating superregion
}

export const CreateRegionModal = ({
  isOpen,
  onClose,
  superregions,
  forceParentId,
  isSuperregion = false,
}: Props) => {
  const { mutate, isPending } = useCreateRegion();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { parentRegionId: forceParentId ?? "" },
  });

  const onSubmit = (data: FormData) => {
    mutate(
      {
        name: data.name,
        prefix: data.prefix.toUpperCase(),
        parentRegionId: isSuperregion ? undefined : data.parentRegionId || undefined,
      },
      {
        onSuccess: () => {
          toast.success(isSuperregion ? "Superregion created" : "Region created");
          reset();
          onClose();
        },
        onError: (e: unknown) => {
          const msg = (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message;
          toast.error(msg ?? "Failed to create region");
        },
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSuperregion ? "Create superregion" : "Create region"}
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Name" error={errors.name?.message} {...register("name")} />
        <Input label="Prefix (e.g. POM)" error={errors.prefix?.message} {...register("prefix")} />
        {!isSuperregion && !forceParentId ? (
          <Select
            label="Superregion"
            error={errors.parentRegionId?.message}
            options={superregions
              .filter((sr) => sr.parentRegion === null)
              .map((sr) => ({ value: sr._id, label: sr.name }))}
            placeholder="Select superregion…"
            {...register("parentRegionId")}
          />
        ) : null}
        {forceParentId ? (
          <p className="text-xs text-celery-500">
            Will be created under:{" "}
            <span className="text-celery-300">
              {superregions.find((sr) => sr._id === forceParentId)?.name}
            </span>
          </p>
        ) : null}
        <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

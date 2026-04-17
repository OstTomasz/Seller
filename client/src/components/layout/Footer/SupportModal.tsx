import { Modal, Button, Input, Textarea } from "@/components/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

const supportSchema = z.object({
  type: z.enum(["bug", "idea", "other"]),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type SupportFormData = z.infer<typeof supportSchema>;

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_TYPES = [
  { value: "bug", label: "Bug" },
  { value: "idea", label: "Idea" },
  { value: "other", label: "Other" },
] as const;

export const SupportModal = ({ isOpen, onClose }: SupportModalProps) => {
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupportFormData>({
    resolver: zodResolver(supportSchema),
    defaultValues: { type: "bug" },
  });

  const onSubmit = (data: SupportFormData) => {
    // TODO: send to support email when available
    console.log("Support request submitted:", {
      ...data,
      submittedBy: user?.email,
      submittedAt: new Date().toISOString(),
    });
    reset();
    onClose();
    toast.success("Report submitted successfully");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report an issue or idea">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Report type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-celery-300">Report type</label>
          <div className="flex gap-4">
            {REPORT_TYPES.map(({ value, label }) => (
              <label
                key={value}
                className="flex items-center gap-2 text-sm text-celery-400 cursor-pointer"
              >
                <input
                  type="radio"
                  value={value}
                  {...register("type")}
                  className="accent-celery-500"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <Input
          label="Subject"
          placeholder="Brief description of the issue or idea"
          error={errors.subject?.message}
          {...register("subject")}
        />

        <Textarea
          label="Message"
          placeholder="Describe in detail..."
          rows={4}
          error={errors.message?.message}
          {...register("message")}
        />

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Submit report</Button>
        </div>
      </form>
    </Modal>
  );
};

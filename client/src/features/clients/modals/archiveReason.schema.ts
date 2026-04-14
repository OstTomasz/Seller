import { z } from "zod";

export const archiveReasonSchema = z.object({
  reason: z.string().min(1, "Reason is required").min(10, "Please provide more detail"),
});

export type ArchiveReasonFormValues = z.infer<typeof archiveReasonSchema>;

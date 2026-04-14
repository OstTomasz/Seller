import { cn } from "@/lib/utils";

interface LabeledFieldProps {
  label: string;
  value: React.ReactNode;
  capitalize?: boolean;
}

export const LabeledField = ({ label, value, capitalize = false }: LabeledFieldProps) => (
  <div className="flex flex-col gap-0.5 mx-auto">
    <span className="text-xs text-celery-600 mx-auto">{label}</span>
    <span className={cn("text-sm text-celery-200 mx-auto", capitalize && "capitalize")}>{value ?? "—"}</span>
  </div>
);

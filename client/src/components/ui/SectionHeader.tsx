import type { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
}

export const SectionHeader = ({ icon: Icon, title }: SectionHeaderProps) => (
  <div className="flex items-center gap-2 mb-4 w-full justify-center">
    <Icon className="h-4 w-4 text-celery-500" />
    <h2 className="text-sm font-semibold text-celery-500 uppercase tracking-wider">{title}</h2>
  </div>
);

// client/src/features/users/UserPage.tsx
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumbs, Card, Loader, FetchError } from "@/components/ui";
import {
  Phone,
  Briefcase,
  Calendar,
  FileText,
  History,
  StickyNote,
  LucideIcon,
} from "lucide-react";
import { useUserDetails } from "./hooks/useUserDetails";
import { positionsApi } from "@/api/positions";
import { useAuthStore } from "@/store/authStore";
import logoPlaceholder from "@/assets/logo.avif";
import { formatDate } from "@/lib/utils";
import type { IPositionHistory, IUserNote, INoteAuthor } from "@/types";

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title }: { icon: LucideIcon; title: string }) => (
  <div className="flex items-center gap-2 mb-4 w-full justify-center">
    <Icon className="h-4 w-4 text-celery-500" />
    <h2 className="text-sm font-semibold text-celery-500 uppercase tracking-wider">{title}</h2>
  </div>
);

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5 mx-auto">
    <span className="text-xs text-celery-600 mx-auto">{label}</span>
    <span className="text-sm text-celery-200 mx-auto capitalize">{value ?? "—"}</span>
  </div>
);

const getNoteAuthor = (createdBy: string | INoteAuthor | null): string => {
  if (!createdBy || typeof createdBy === "string") return "Unknown";
  return `${createdBy.firstName} ${createdBy.lastName}`;
};

const getHistoryHolder = (userId: IPositionHistory["userId"]): string => {
  if (typeof userId === "string") return userId;
  return `${userId.firstName} ${userId.lastName}`;
};

// ── Component ─────────────────────────────────────────────────────────────────

export const UserPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();
  const { data, isLoading, isError } = useUserDetails(id!);
  const location = useLocation();
  const fromArchive = (location.state as { from?: string } | null)?.from === "archive";

  const canSeeNotes = currentUser?.role === "director" || currentUser?.role === "deputy";

  const positionId = data?.user?.position?._id;

  const { data: historyData } = useQuery({
    queryKey: ["position-history", positionId],
    queryFn: () => positionsApi.getHistory(positionId!).then((r) => r.data.history),
    enabled: !!positionId && canSeeNotes,
  });

  if (isLoading) return <Loader label="employee" />;
  if (isError || !data) return <FetchError label="employee" />;

  const { user, profile } = data;

  const fullName = `${user.firstName} ${user.lastName}`;
  const positionCode = user.position?.code ?? null;
  const regionName = user.position?.region?.name ?? null;
  const superregionName = user.position?.region?.parentRegion?.name ?? null;
  const avatarSrc = profile?.avatar ?? logoPlaceholder;

  const notes = (user as unknown as { notes?: IUserNote[] }).notes ?? [];

  return (
    <div className="flex flex-col max-w-3xl mx-auto gap-6">
      <Breadcrumbs
        items={
          fromArchive
            ? [{ label: "Archive", to: "/archive" }, { label: fullName }]
            : [{ label: "Company", to: "/company" }, { label: fullName }]
        }
      />

      {/* Header */}
      <div className="flex items-center gap-6">
        <img
          src={avatarSrc}
          alt={fullName}
          className="w-20 h-20 rounded-full object-cover border-2 border-celery-700 bg-bg-elevated"
        />
        <div className="flex flex-col gap-1">
          <h1 className="text-fluid-h1 font-bold text-celery-100">{fullName}</h1>
          <div className="flex items-center gap-4 text-sm text-celery-500">
            <span>#{user.numericId}</span>
            {positionCode ? <span>{positionCode}</span> : null}
          </div>
        </div>
      </div>

      {/* Contact */}
      <Card>
        <SectionHeader icon={Phone} title="Contact" />
        <div className="grid md:grid-cols-2 gap-6 w-[90%] mx-auto">
          <Field
            label="Phone"
            value={
              user.phone ? (
                <a href={`tel:${user.phone}`} className="hover:text-celery-100 transition-colors">
                  {user.phone}
                </a>
              ) : null
            }
          />
          <Field
            label="Email"
            value={
              user.email ? (
                <a
                  href={`mailto:${user.email}`}
                  className="hover:text-celery-100 transition-colors"
                >
                  {user.email}
                </a>
              ) : null
            }
          />
        </div>
      </Card>

      {/* Position */}
      <Card>
        <SectionHeader icon={Briefcase} title="Position" />
        <div className="grid md:grid-cols-2 gap-6 w-[90%] mx-auto">
          <Field label="Role" value={user.role} />
          <Field label="Code" value={positionCode} />
          {user.grade ? <Field label="Grade" value={String(user.grade)} /> : null}
          {regionName ? <Field label="Region" value={regionName} /> : null}
          {superregionName ? <Field label="Superregion" value={superregionName} /> : null}
        </div>
      </Card>

      {/* Employment */}
      <Card>
        <SectionHeader icon={Calendar} title="Employment" />
        <div className="grid md:grid-cols-3 gap-6 w-[90%] mx-auto">
          <Field label="Hired at" value={formatDate(user.createdAt, true)} />
          <Field label="Workplace" value={profile?.workplace ?? null} />
          <Field label="Last login" value={formatDate(profile?.lastLoginAt ?? null)} />
        </div>
      </Card>

      {/* About */}
      <Card>
        <SectionHeader icon={FileText} title="About" />
        <div className="w-[90%] mx-auto">
          <p className="text-sm text-celery-300 whitespace-pre-wrap">
            {profile?.description ?? "—"}
          </p>
        </div>
      </Card>

      {/* Notes — deputy/director only */}
      {canSeeNotes ? (
        <Card>
          <SectionHeader icon={StickyNote} title="Notes" />
          {notes.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {notes.map((note) => (
                <div
                  key={note._id}
                  className="flex flex-col gap-2 p-3 rounded-lg border border-celery-700 bg-bg-base
                             w-full sm:w-[calc(50%-0.375rem)]"
                >
                  <p className="text-sm text-celery-300 whitespace-pre-wrap">{note.content}</p>
                  <div className="flex flex-col gap-0.5 mt-auto">
                    <span className="text-xs text-celery-500">{getNoteAuthor(note.createdBy)}</span>
                    <span className="text-xs text-celery-600">
                      {new Date(note.createdAt).toLocaleDateString("pl-PL")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-celery-600 w-[90%] mx-auto">No notes</p>
          )}
        </Card>
      ) : null}

      {/* Position history — deputy/director only */}
      {canSeeNotes && positionId ? (
        <Card>
          <SectionHeader icon={History} title="Position history" />
          {historyData && historyData.length > 0 ? (
            <div className="w-[90%] mx-auto">
              <div className="flex flex-col gap-2">
                {historyData.map((entry) => (
                  <div
                    key={entry._id}
                    className="flex items-center justify-between py-2 border-b border-celery-800 last:border-0"
                  >
                    <span className="text-sm text-celery-200">
                      {getHistoryHolder(entry.userId)}
                    </span>
                    <div className="flex gap-4 text-xs text-celery-500">
                      <span>{formatDate(entry.assignedAt)}</span>
                      <span>→</span>
                      <span>{entry.removedAt ? formatDate(entry.removedAt) : "present"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-celery-600 w-[90%] mx-auto">No history available</p>
          )}
        </Card>
      ) : null}
    </div>
  );
};

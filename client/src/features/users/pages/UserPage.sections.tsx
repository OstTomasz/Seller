import { Breadcrumbs, Card, LabeledField, SectionHeader } from "@/components/ui";
import { Briefcase, Calendar, FileText, History, Phone, StickyNote } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { INoteAuthor, IPositionHistory, IUserNote, UserRole } from "@/types";

const getNoteAuthor = (createdBy: string | INoteAuthor | null): string => {
  if (!createdBy || typeof createdBy === "string") return "Unknown";
  return `${createdBy.firstName} ${createdBy.lastName}`;
};

const getHistoryHolder = (userId: IPositionHistory["userId"]): string =>
  typeof userId === "string" ? userId : `${userId.firstName} ${userId.lastName}`;

export const UserHeader = ({
  fullName,
  avatarSrc,
  numericId,
  positionCode,
}: {
  fullName: string;
  avatarSrc: string;
  numericId: string | number;
  positionCode: string | null;
}) => (
  <div className="flex items-center gap-6">
    <img
      src={avatarSrc}
      alt={fullName}
      className="w-20 h-20 rounded-full object-cover border-2 border-celery-700 bg-bg-elevated"
    />
    <div className="flex flex-col gap-1">
      <h1 className="text-fluid-h1 font-bold text-celery-100">{fullName}</h1>
      <div className="flex items-center gap-4 text-sm text-celery-500">
        <span>#{numericId}</span>
        {positionCode ? <span>{positionCode}</span> : null}
      </div>
    </div>
  </div>
);

export const UserBreadcrumbs = ({ fromArchive, fullName }: { fromArchive: boolean; fullName: string }) => (
  <Breadcrumbs
    items={
      fromArchive
        ? [{ label: "Archive", to: "/archive" }, { label: fullName }]
        : [{ label: "Company", to: "/company" }, { label: fullName }]
    }
  />
);

export const ContactCard = ({ phone, email }: { phone?: string | null; email?: string | null }) => (
  <Card>
    <SectionHeader icon={Phone} title="Contact" />
    <div className="grid md:grid-cols-2 gap-6 w-[90%] mx-auto">
      <LabeledField
        label="Phone"
        value={phone ? <a href={`tel:${phone}`} className="hover:text-celery-100 transition-colors">{phone}</a> : null}
      />
      <LabeledField
        label="Email"
        value={
          email ? (
            <a href={`mailto:${email}`} className="hover:text-celery-100 transition-colors">
              {email}
            </a>
          ) : null
        }
      />
    </div>
  </Card>
);

export const PositionCard = ({
  role,
  positionCode,
  grade,
  regionName,
  superregionName,
}: {
  role: UserRole;
  positionCode: string | null;
  grade?: number | null;
  regionName: string | null;
  superregionName: string | null;
}) => (
  <Card>
    <SectionHeader icon={Briefcase} title="Position" />
    <div className="grid md:grid-cols-2 gap-6 w-[90%] mx-auto">
      <LabeledField label="Role" value={role} capitalize />
      <LabeledField label="Code" value={positionCode} />
      {grade ? <LabeledField label="Grade" value={String(grade)} /> : null}
      {regionName ? <LabeledField label="Region" value={regionName} /> : null}
      {superregionName ? <LabeledField label="Superregion" value={superregionName} /> : null}
    </div>
  </Card>
);

export const EmploymentCard = ({
  createdAt,
  workplace,
  lastLoginAt,
}: {
  createdAt: string;
  workplace?: string | null;
  lastLoginAt?: string | null;
}) => (
  <Card>
    <SectionHeader icon={Calendar} title="Employment" />
    <div className="grid md:grid-cols-3 gap-6 w-[90%] mx-auto">
      <LabeledField label="Hired at" value={formatDate(createdAt, true)} />
      <LabeledField label="Workplace" value={workplace ?? null} />
      <LabeledField label="Last login" value={formatDate(lastLoginAt ?? null)} />
    </div>
  </Card>
);

export const AboutCard = ({ description }: { description?: string | null }) => (
  <Card>
    <SectionHeader icon={FileText} title="About" />
    <div className="w-[90%] mx-auto">
      <p className="text-sm text-celery-300 whitespace-pre-wrap">{description ?? "—"}</p>
    </div>
  </Card>
);

export const NotesCard = ({ notes }: { notes: IUserNote[] }) => (
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
              <span className="text-xs text-celery-600">{new Date(note.createdAt).toLocaleDateString("pl-PL")}</span>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-celery-600 w-[90%] mx-auto">No notes</p>
    )}
  </Card>
);

export const PositionHistoryCard = ({ history }: { history: IPositionHistory[] }) => (
  <Card>
    <SectionHeader icon={History} title="Position history" />
    {history.length > 0 ? (
      <div className="w-[90%] mx-auto">
        <div className="flex flex-col gap-2">
          {history.map((entry) => (
            <div
              key={entry._id}
              className="flex items-center justify-between py-2 border-b border-celery-800 last:border-0"
            >
              <span className="text-sm text-celery-200">{getHistoryHolder(entry.userId)}</span>
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
);

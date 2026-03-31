import { useParams } from "react-router-dom";
import { Breadcrumbs, Card, Loader, FetchError } from "@/components/ui";
import { Phone, Briefcase, Calendar, FileText, LucideIcon } from "lucide-react";
import { useUserDetails } from "./hooks/useUserDetails";
import logoPlaceholder from "@/assets/logo.avif";
import { formatDate } from "@/lib/utils";

// ── Shared sub-components (reuse pattern from ClientPage) ─────────────────────

const SectionHeader = ({ icon: Icon, title }: { icon: LucideIcon; title: string }) => (
  <div className="flex items-center gap-2 mb-4 w-full justify-center">
    <Icon className="h-4 w-4 text-celery-500" />
    <h2 className="text-sm font-semibold text-celery-500 uppercase tracking-wider">{title}</h2>
  </div>
);

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5 mx-auto">
    <span className="text-xs text-celery-600 mx-auto">{label}</span>
    <span className="text-sm text-celery-200 mx-auto">{value ?? "—"}</span>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

export const UserPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useUserDetails(id!);

  if (isLoading) return <Loader label="employee" />;
  if (isError || !data) return <FetchError label="employee" />;

  const { user, profile } = data;

  const fullName = `${user.firstName} ${user.lastName}`;
  const positionCode = user.position?.code ?? null;
  const regionName = user.position?.region?.name ?? null;
  const superregionName = user.position?.region?.parentRegion?.name ?? null;
  const avatarSrc = profile?.avatar ?? logoPlaceholder;

  return (
    <div className="flex flex-col max-w-3xl mx-auto gap-6">
      <Breadcrumbs items={[{ label: "Company", to: "/company" }, { label: fullName }]} />

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
        <div className="grid md:grid-cols-2 gap-6 w-[90%] mx-auto capitalize">
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
    </div>
  );
};

import { useParams, useNavigate } from "react-router-dom";
import { useClient } from "./hooks/useClient";
import { useAuthStore } from "@/store/authStore";
import { Breadcrumbs, Spinner, Badge, Card } from "@/components/ui";
import { UserRole } from "@/types";
import { MapPin, Phone, Mail, Users, FileText, Clock, LucideIcon } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  reminder: "Reminder",
  inactive: "Inactive",
  archived: "Archived",
};

const STATUS_BADGE_VARIANTS: Record<string, "active" | "warning" | "error" | "muted"> = {
  active: "active",
  reminder: "warning",
  inactive: "error",
  archived: "muted",
};

const formatDate = (date: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const SectionHeader = ({ icon: Icon, title }: { icon: LucideIcon; title: string }) => (
  <div className="flex justify-center items-center gap-2 mb-4">
    <Icon className="h-4 w-4 text-celery-500" />
    <h2 className="text-sm font-semibold text-celery-500 uppercase tracking-wider">{title}</h2>
  </div>
);

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-celery-600">{label}</span>
    <span className="text-sm text-celery-200">{value ?? "—"}</span>
  </div>
);

export const ClientPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role as UserRole;

  const { data: client, isLoading, isError } = useClient(id!);

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <span className="text-sm text-celery-500">Loading client...</span>
        </div>
      </div>
    );

  if (isError || !client)
    return (
      <div className="flex items-center justify-center py-20 text-error">Failed to load client</div>
    );

  const salesperson = client.assignedTo?.currentHolder
    ? `${client.assignedTo.currentHolder.firstName} ${client.assignedTo.currentHolder.lastName}`
    : "—";

  const advisor = client.assignedAdvisor?.currentHolder
    ? `${client.assignedAdvisor.currentHolder.firstName} ${client.assignedAdvisor.currentHolder.lastName}`
    : "—";

  const region = client.assignedTo?.region?.name ?? "—";
  const superregion = client.assignedTo?.region?.parentRegion?.name ?? "—";

  const showSalesperson = role !== "salesperson";
  const showRegion = role === "deputy" || role === "director";
  const showSuperregion = role === "director";

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: "Clients", to: "/clients" }, { label: client.companyName }]} />

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-fluid-h1 font-bold text-celery-100">{client.companyName}</h1>
            <Badge variant={STATUS_BADGE_VARIANTS[client.status] ?? "muted"}>
              {STATUS_LABELS[client.status] ?? client.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-celery-500">
            <span>ID: {client.numericId}</span>
            {client.nip ? <span>NIP: {client.nip}</span> : null}
          </div>
        </div>
      </div>

      {/* Two column layout */}
      {/* Top row — 2 cards side by side*/}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Basic info */}
        <Card>
          <SectionHeader icon={FileText} title="Basic information" />
          <div className="w-[90%] flex flex-col md:flex-row max-w-md justify-between gap-3 mx-auto">
            <Field label="Company name" value={client.companyName} />
            {client.inactivityReason ? (
              <Field label="Inactivity reason" value={client.inactivityReason} />
            ) : null}
          </div>
        </Card>

        {/* Dates */}
        <Card>
          <SectionHeader icon={Clock} title="Dates" />
          <div className="w-[90%] flex flex-col md:flex-row max-w-md justify-between gap-3 mx-auto">
            <Field label="Created at" value={formatDate(client.createdAt)} />
            <Field label="Last updated" value={formatDate(client.updatedAt)} />
          </div>
        </Card>
      </div>
      {/* Second row — addresses + Assignment*/}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Addresses */}
        <Card>
          <SectionHeader icon={MapPin} title="Addresses" />
          {client.addresses.length === 0 ? (
            <p className="text-sm text-celery-600">No addresses</p>
          ) : (
            <div className="flex flex-col gap-10">
              {client.addresses.map((address) => (
                <div key={address._id} className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-celery-500 uppercase tracking-wider mx-auto">
                    {address.label}
                  </span>

                  <div className="flex flex-col gap-8">
                    <div className="w-[90%] max-w-md flex justify-between gap-3 mx-auto">
                      <Field label="Street" value={address.street} />
                      <Field label="Postal code" value={address.postalCode} />
                      <Field label="City" value={address.city} />
                    </div>

                    <div className="flex flex-col gap-2">
                      {address.contacts.length > 0 ? (
                        <>
                          <span className="text-xs text-celery-600 font-medium">Contacts</span>
                          <div className="space-y-3">
                            {address.contacts.map((contact) => (
                              <div
                                key={contact._id}
                                className="flex flex-col gap-1 pl-3 border-l-2 border-celery-700"
                              >
                                <span className="text-sm text-celery-200">
                                  {contact.firstName} {contact.lastName}
                                </span>
                                {contact.phone && (
                                  <span className="flex items-center gap-1.5 text-xs text-celery-500">
                                    <Phone className="h-3 w-3" /> {contact.phone}
                                  </span>
                                )}
                                {contact.email && (
                                  <span className="flex items-center gap-1.5 text-xs text-celery-500">
                                    <Mail className="h-3 w-3" /> {contact.email}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-celery-600 italic">No contacts assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Assignment */}
        <Card className="flex flex-col">
          <SectionHeader icon={Users} title="Assignment" />

          <div className="grid grid-cols-2 gap-10 w-[90%] mx-auto items-center ">
            {showSalesperson && <Field label="Salesperson" value={salesperson} />}
            <Field label="Advisor" value={advisor} />
            {showRegion && <Field label="Region" value={region} />}
            {showSuperregion && <Field label="Superregion" value={superregion} />}
          </div>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <SectionHeader icon={FileText} title="Notes" />
        {client.notes ? (
          <p className="text-sm text-celery-300 whitespace-pre-wrap">{client.notes}</p>
        ) : (
          <p className="text-sm text-celery-600">No notes</p>
        )}
      </Card>
    </div>
  );
};

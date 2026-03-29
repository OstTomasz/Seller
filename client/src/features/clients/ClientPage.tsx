import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useClient } from "./hooks/useClient";
import { useAuthStore } from "@/store/authStore";
import { Breadcrumbs, Card, Loader, FetchError, Button } from "@/components/ui";
import { INoteAuthor, UserRole } from "@/types";
import { MapPin, Phone, Mail, Users, FileText, Clock, Pencil, LucideIcon } from "lucide-react";
import { EditBasicModal } from "./EditBasicModal";
import { EditAddressesModal } from "./EditAddressesModal";
import { EditNotesModal } from "./EditNotesModal";
import { EditAssignmentModal } from "./EditAssignmentModal";

// v2
// const STATUS_LABELS: Record<string, string> = {
//   active: "Active",
//   reminder: "Reminder",
//   inactive: "Inactive",
//   archived: "Archived",
// };
// const STATUS_BADGE_VARIANTS: Record<string, "active" | "warning" | "error" | "muted"> = {
//   active: "active",
//   reminder: "warning",
//   inactive: "error",
//   archived: "muted",
// };

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

const SectionHeader = ({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
}) => (
  <div className="flex justify-between items-center mb-4">
    <div className="flex items-center gap-2 mb-4 w-full justify-center">
      <Icon className="h-4 w-4 text-celery-500" />
      <h2 className="text-sm font-semibold text-celery-500 uppercase tracking-wider">{title}</h2>
    </div>
    {children ? <div>{children}</div> : null}
  </div>
);

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5 mx-auto">
    <span className="text-xs text-celery-600 mx-auto">{label}</span>
    <span className="text-sm text-celery-200 mx-auto">{value ?? "—"}</span>
  </div>
);

const getNoteAuthor = (createdBy: string | INoteAuthor | null): string => {
  if (!createdBy) return "Unknown";
  if (typeof createdBy === "string") return "Unknown";
  return `${createdBy.firstName} ${createdBy.lastName}`;
};

export const ClientPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const role = user?.role as UserRole;
  const navigate = useNavigate();
  const [isEditBasicOpen, setIsEditBasicOpen] = useState(false);
  const [isEditAddressesOpen, setIsEditAddressesOpen] = useState(false);
  const [isEditNotesOpen, setIsEditNotesOpen] = useState(false);
  const [isEditAssignmentOpen, setIsEditAssignmentOpen] = useState(false);

  const location = useLocation();
  const clientsSearch = (location.state as { clientsSearch?: string } | null)?.clientsSearch ?? "";

  const { data: client, isLoading, isError } = useClient(id!);

  const currentUserId = user?._id ?? "";

  if (isLoading) return <Loader label="client" />;
  if (isError || !client) return <FetchError label="client" />;

  const salespersonId = client.assignedTo?.currentHolder?._id ?? null;
  const salespersonName = client.assignedTo?.currentHolder
    ? `${client.assignedTo.currentHolder.firstName} ${client.assignedTo.currentHolder.lastName}`
    : "—";

  const advisorId = client.assignedAdvisor?.currentHolder?._id ?? null;
  const advisorName = client.assignedAdvisor?.currentHolder
    ? `${client.assignedAdvisor.currentHolder.firstName} ${client.assignedAdvisor.currentHolder.lastName}`
    : "—";

  const region = client.assignedTo?.region?.name ?? "—";
  const superregion = client.assignedTo?.region?.parentRegion?.name ?? "—";

  const showAssignment = role === "deputy" || role === "director";
  const showSuperregion = role === "director";

  return (
    <div className="flex flex-col max-w-7xl mx-auto gap-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Clients", to: `/clients${clientsSearch}` },
          { label: client.companyName },
        ]}
      />

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-fluid-h1 font-bold text-celery-100">{client.companyName}</h1>
            {/* <Badge variant={STATUS_BADGE_VARIANTS[client.status] ?? "muted"}>
              {STATUS_LABELS[client.status] ?? client.status}
            </Badge> v2*/}
          </div>
          <div className="flex items-center gap-4 text-sm text-celery-500">
            <span>ID: {client.numericId}</span>
            {client.nip ? <span>NIP: {client.nip}</span> : null}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditBasicOpen(true)}
          className="flex items-center gap-1.5 text-celery-500 hover:text-celery-300"
        >
          <Pencil size={14} />
          Edit
        </Button>
      </div>

      {/* Addresses */}
      <Card>
        <SectionHeader icon={MapPin} title="Addresses">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditAddressesOpen(true)}
            className="text-celery-500 hover:text-celery-300"
          >
            <Pencil size={14} />
          </Button>
        </SectionHeader>
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
                  {address.contacts.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs text-celery-600 font-medium">Contacts</span>
                      <div className="flex flex-wrap gap-3">
                        {address.contacts.map((contact) => (
                          <div
                            key={contact._id}
                            className="flex flex-col gap-1 pl-3 border-l-2 border-celery-700"
                          >
                            <span className="text-sm text-celery-200">
                              {contact.firstName} {contact.lastName}
                            </span>
                            {contact.phone ? (
                              <span className="flex items-center gap-1.5 text-xs text-celery-500">
                                <Phone className="h-3 w-3" /> {contact.phone}
                              </span>
                            ) : null}
                            {contact.email ? (
                              <span className="flex items-center gap-1.5 text-xs text-celery-500">
                                <Mail className="h-3 w-3" /> {contact.email}
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-celery-600 italic">No contacts assigned</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Assignment */}
      {showAssignment ? (
        <Card>
          <SectionHeader icon={Users} title="Assignment">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditAssignmentOpen(true)}
              className="text-celery-500 hover:text-celery-300"
            >
              <Pencil size={14} />
            </Button>
          </SectionHeader>
          <div className="grid grid-cols-2 gap-10 w-[90%] mx-auto items-center">
            <Field
              label="Salesperson"
              value={
                salespersonId ? (
                  <button
                    onClick={() => navigate(`/users/${salespersonId}`)}
                    className="text-celery-200 hover:text-celery-100 hover:underline transition-colors text-left"
                  >
                    {salespersonName}
                  </button>
                ) : (
                  salespersonName
                )
              }
            />
            <Field
              label="Advisor"
              value={
                advisorId ? (
                  <button
                    onClick={() => navigate(`/users/${advisorId}`)}
                    className="text-celery-200 hover:text-celery-100 hover:underline transition-colors text-left"
                  >
                    {advisorName}
                  </button>
                ) : (
                  advisorName
                )
              }
            />
            <Field label="Region" value={region} />
            {showSuperregion ? <Field label="Superregion" value={superregion} /> : null}
          </div>
        </Card>
      ) : null}

      {/* Notes */}
      <Card>
        <SectionHeader icon={FileText} title="Notes">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditNotesOpen(true)}
            className="text-celery-500 hover:text-celery-300"
          >
            <Pencil size={14} />
          </Button>
        </SectionHeader>
        {client.notes && client.notes.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {client.notes.map((note) => (
              <div
                key={note._id}
                className="flex flex-col gap-2 p-3 rounded-lg border border-celery-700 bg-bg-base
                     w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]"
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
          <p className="text-sm text-celery-600">No notes</p>
        )}
      </Card>

      {/* Others */}
      <Card>
        <SectionHeader icon={Clock} title="Others" />
        <div className="flex flex-col gap-4 w-[90%] mx-auto items-center">
          <div className="flex gap-10">
            <Field label="Created at" value={formatDate(client.createdAt)} />
            <Field label="Last updated" value={formatDate(client.updatedAt)} />
          </div>
          {client.inactivityReason ? (
            <Field label="Inactivity reason" value={client.inactivityReason} />
          ) : null}
        </div>
      </Card>

      {/* Modals */}
      <EditBasicModal
        isOpen={isEditBasicOpen}
        onClose={() => setIsEditBasicOpen(false)}
        client={client}
      />
      <EditAddressesModal
        isOpen={isEditAddressesOpen}
        onClose={() => setIsEditAddressesOpen(false)}
        client={client}
      />
      <EditNotesModal
        isOpen={isEditNotesOpen}
        onClose={() => setIsEditNotesOpen(false)}
        client={client}
        currentUserId={currentUserId}
      />
      <EditAssignmentModal
        isOpen={isEditAssignmentOpen}
        onClose={() => setIsEditAssignmentOpen(false)}
        client={client}
        userRole={role}
      />
    </div>
  );
};

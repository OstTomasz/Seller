import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useClient } from "../hooks/useClient";
import { useAuthStore } from "@/store/authStore";
import { Breadcrumbs, Loader, FetchError, Button } from "@/components/ui";
import { UserRole } from "@/types";
import { Pencil } from "lucide-react";
import { EditBasicModal } from "../modals/EditBasicModal";
import { EditAddressesModal } from "../modals/EditAddressesModal";
import { EditNotesModal } from "../modals/EditNotesModal";
import { EditAssignmentModal } from "../modals/EditAssignmentModal";
import { AddressesCard, AssignmentCard, NotesCard, OthersCard } from "./ClientPage.sections";

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
  const fromArchive = (location.state as { from?: string } | null)?.from === "archive";
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

  const showAssignment = role === "advisor" || role === "deputy" || role === "director";

  return (
    <div className="flex flex-col max-w-7xl mx-auto gap-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={
          fromArchive
            ? [{ label: "Archive", to: "/archive" }, { label: client.companyName }]
            : [{ label: "Clients", to: `/clients${clientsSearch}` }, { label: client.companyName }]
        }
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

      <AddressesCard client={client} onEdit={() => setIsEditAddressesOpen(true)} />

      {/* Assignment */}
      {showAssignment ? (
        <AssignmentCard
          role={role}
          salespersonId={salespersonId}
          salespersonName={salespersonName}
          advisorId={advisorId}
          advisorName={advisorName}
          region={region}
          superregion={superregion}
          onOpenEdit={() => setIsEditAssignmentOpen(true)}
          onOpenUser={(userId) => navigate(`/users/${userId}`)}
        />
      ) : null}

      {/* Notes */}
      <NotesCard client={client} onEdit={() => setIsEditNotesOpen(true)} />

      {/* Others */}
      <OthersCard client={client} />

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
        userRole={role}
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

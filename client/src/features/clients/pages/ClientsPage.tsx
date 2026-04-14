import { useState } from "react";
import { useClients } from "../hooks/useClients";
import { ClientsTable } from "../components/ClientsTable";
import { Client, UserRole } from "@/types";
import { Button, FetchError, ListPageSkeleton } from "@/components/ui";
import { Plus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { AddClientModal } from "../modals/AddClientModal";
import { DirectArchiveModal } from "../modals/DirectArchiveModal";
import { RequestArchiveModal } from "../modals/RequestArchiveModal";

export const ClientsPage = () => {
  const { data: clients = [], isLoading, isError } = useClients();
  const { user } = useAuthStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [requestArchiveClient, setRequestArchiveClient] = useState<Client | null>(null);
  const [directArchiveClient, setDirectArchiveClient] = useState<Client | null>(null);

  if (isLoading) return <ListPageSkeleton />;

  if (isError) return <FetchError label="clients" />;

  return (
    <div className="max-w-6xl flex flex-col gap-6 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-fluid-h1 font-bold text-celery-100">Clients</h1>
        <Button onClick={() => setAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add client
        </Button>
      </div>

      {/* Table */}
      <ClientsTable
        clients={clients}
        onRequestArchive={(client) => setRequestArchiveClient(client)}
        onDirectArchive={(client) => setDirectArchiveClient(client)}
      />

      <AddClientModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        userRole={user?.role as import("@/types").UserRole}
      />

      <RequestArchiveModal
        client={requestArchiveClient}
        onClose={() => setRequestArchiveClient(null)}
      />
      <DirectArchiveModal
        client={directArchiveClient}
        onClose={() => setDirectArchiveClient(null)}
        userRole={user?.role as UserRole}
      />
    </div>
  );
};

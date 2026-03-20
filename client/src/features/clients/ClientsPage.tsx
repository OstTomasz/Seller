import { useState } from "react";
import { useClients } from "./hooks/useClients";
import { ClientsTable } from "./ClientsTable";
// import { Client } from "@/types";
import { Button, FetchError, Loader } from "@/components/ui";
import { Plus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { AddClientModal } from "./AddClientModal";

export const ClientsPage = () => {
  const { data: clients = [], isLoading, isError } = useClients();
  const { user } = useAuthStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  // const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  // const [actionsClient, setActionsClient] = useState<{
  //   client: Client;
  //   anchor: HTMLElement;
  // } | null>(null);

  if (isLoading) return <Loader label="clients" />;

  if (isError) return <FetchError label="clients" />;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-fluid-h1 font-bold text-celery-100">Clients</h1>
        <Button onClick={() => setAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add client
        </Button>
      </div>

      {/* Table */}
      <ClientsTable clients={clients} onActionsClick={(_client, _anchor) => {}} />

      <AddClientModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        userRole={user?.role as import("@/types").UserRole}
      />

      {/* Modals — coming next */}
      {/* <ActionsMenu client={actionsClient?.client} anchor={actionsClient?.anchor} onClose={() => setActionsClient(null)} /> */}
    </div>
  );
};

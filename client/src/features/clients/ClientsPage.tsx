import { useState } from "react";
import { useClients } from "./hooks/useClients";
import { ClientsTable } from "./ClientsTable";
import { Client } from "@/types";
import { Button, Spinner } from "@/components/ui";
import { Plus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export const ClientsPage = () => {
  const { data: clients = [], isLoading, isError } = useClients();
  const { user } = useAuthStore();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [actionsClient, setActionsClient] = useState<{
    client: Client;
    anchor: HTMLElement;
  } | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <span className="text-sm text-celery-500">Loading clients...</span>
        </div>
      </div>
    );

  if (isError)
    return (
      <div className="flex items-center justify-center py-20 text-error">
        Failed to load clients
      </div>
    );

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
      <ClientsTable
        clients={clients}
        onActionsClick={(client, anchor) => setActionsClient({ client, anchor })}
      />

      {/* Modals — coming next */}
      {/* <ClientDetailsModal client={selectedClient} onClose={() => setSelectedClient(null)} /> */}
      {/* <AddClientModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} /> */}
      {/* <ActionsMenu client={actionsClient?.client} anchor={actionsClient?.anchor} onClose={() => setActionsClient(null)} /> */}
    </div>
  );
};

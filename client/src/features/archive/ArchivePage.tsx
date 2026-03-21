import { useState } from "react";
import { Client } from "@/types";
import { useArchivedClients } from "./hooks/useArchivedClients";
import { ArchiveClientsTable } from "./ArchiveClientsTable";
import { Loader, FetchError } from "@/components/ui";
import { UnarchiveModal } from "./UnarchiveModal";

type ArchiveTab = "clients" | "employees";

export const ArchivePage = () => {
  const [activeTab, setActiveTab] = useState<ArchiveTab>("clients");
  const [unarchiveClient, setUnarchiveClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading, isError } = useArchivedClients();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-fluid-h1 font-bold text-celery-100">Archive</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-celery-700">
        {(["clients", "employees"] as ArchiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? "border-celery-400 text-celery-200"
                : "border-transparent text-celery-500 hover:text-celery-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "clients" ? (
        isLoading ? (
          <Loader label="archived clients" />
        ) : isError ? (
          <FetchError label="archived clients" />
        ) : (
          <ArchiveClientsTable
            clients={clients}
            onUnarchive={(client) => setUnarchiveClient(client)}
          />
        )
      ) : (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-celery-500">Employees archive — coming soon</p>
        </div>
      )}

      <UnarchiveModal client={unarchiveClient} onClose={() => setUnarchiveClient(null)} />
    </div>
  );
};

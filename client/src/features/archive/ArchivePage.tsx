// client/src/features/archive/ArchivePage.tsx
import { useState } from "react";
import { Client } from "@/types";
import { useArchivedClients } from "./hooks/useArchivedClients";
import { useArchivedUsers } from "./hooks/useArchivedUsers";
import { ArchiveClientsTable } from "./ArchiveClientsTable";
import { ArchivedUsersTable } from "./ArchivedUsersTable";
import { Loader, FetchError } from "@/components/ui";
import { UnarchiveModal } from "./UnarchiveModal";
import type { ArchivedUser } from "@/types";

type ArchiveTab = "clients" | "employees";

export const ArchivePage = () => {
  const [activeTab, setActiveTab] = useState<ArchiveTab>("clients");
  const [unarchiveClient, setUnarchiveClient] = useState<Client | null>(null);
  const [, setUnarchiveUser] = useState<ArchivedUser | null>(null);

  const { data: clients = [], isLoading: cLoading, isError: cError } = useArchivedClients();
  const { data: users = [], isLoading: uLoading, isError: uError } = useArchivedUsers();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-fluid-h1 font-bold text-celery-100">Archive</h1>

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

      {activeTab === "clients" ? (
        cLoading ? (
          <Loader label="archived clients" />
        ) : cError ? (
          <FetchError label="archived clients" />
        ) : (
          <ArchiveClientsTable clients={clients} onUnarchive={setUnarchiveClient} />
        )
      ) : uLoading ? (
        <Loader label="archived employees" />
      ) : uError ? (
        <FetchError label="archived employees" />
      ) : (
        <ArchivedUsersTable users={users} onUnarchive={setUnarchiveUser} />
      )}

      <UnarchiveModal client={unarchiveClient} onClose={() => setUnarchiveClient(null)} />
      {/* UnarchiveUserModal — do zbudowania w późniejszym kroku */}
    </div>
  );
};

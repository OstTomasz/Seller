import { useState } from "react";
import { ManagementStructure } from "./ManagementStructure";
import { ManagementUsers } from "./ManagementUsers";
import { ManagementRegions } from "./ManagementRegions";

type ManagementTab = "structure" | "users" | "regions";

export const ManagementPage = () => {
  const [activeTab, setActiveTab] = useState<ManagementTab>("structure");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-fluid-h1 font-bold text-celery-100">Management</h1>

      <div className="flex gap-1 border-b border-celery-700">
        {(["structure", "users", "regions"] as ManagementTab[]).map((tab) => (
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

      {activeTab === "structure" ? <ManagementStructure /> : null}
      {activeTab === "users" ? <ManagementUsers /> : null}
      {activeTab === "regions" ? <ManagementRegions /> : null}
    </div>
  );
};

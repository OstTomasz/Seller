import { useState } from "react";
import { CompanyStructure } from "./CompanyStructure";

type CompanyTab = "structure" | "documents";

export const CompanyPage = () => {
  const [activeTab, setActiveTab] = useState<CompanyTab>("structure");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-fluid-h1 font-bold text-celery-100">Company</h1>

      <div className="flex gap-1 border-b border-celery-700">
        {(["structure", "documents"] as CompanyTab[]).map((tab) => (
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

      {activeTab === "structure" ? (
        <CompanyStructure />
      ) : (
        <div className="flex items-center justify-center h-48 text-celery-600 text-sm">
          Documents — coming soon
        </div>
      )}
    </div>
  );
};

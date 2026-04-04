import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Loader, FetchError, Button } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { regionsApi } from "@/api/regions";
import { useAuthStore } from "@/store/authStore";
import { useDeleteRegion, useAllPositions } from "./hooks/useManagementStructure";
import { useConfirm } from "@/hooks/useConfirm";
import { CreateRegionModal } from "./modals/CreateRegionModal";
import type { Region, PositionWithHolder } from "@/types";

import { ConfirmDialog } from "@/components/ui";

export const ManagementRegions = () => {
  const { user } = useAuthStore();
  const isDirector = user?.role === "director";
  const [createRegionOpen, setCreateRegionOpen] = useState(false);
  const [createSuperregionOpen, setCreateSuperregionOpen] = useState(false);
  const { mutate: deleteRegion, isPending: isDeleting } = useDeleteRegion();

  const {
    isOpen,
    payload: regionToDelete,
    ask,
    confirm,
    cancel,
  } = useConfirm<Region>((region) => {
    deleteRegion(region._id);
  });

  const {
    data: regions,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["management-regions"],
    queryFn: () => regionsApi.getAll().then((r) => r.data.regions),
  });

  const { data: positions } = useAllPositions();

  // Deputy's superregion id
  const mySuperregionId = !isDirector
    ? positions?.find(
        (p: PositionWithHolder) => p.type === "deputy" && p.currentHolder?._id === user?._id,
      )?.region?._id
    : undefined;

  if (isLoading) return <Loader label="regions" />;
  if (isError || !regions) return <FetchError label="regions" />;

  const superregions = regions.filter((r: Region) => r.parentRegion === null);
  const subregions = regions.filter((r: Region) => r.parentRegion !== null);

  const visibleSuperregions = isDirector
    ? superregions
    : superregions.filter((sr: Region) => sr._id === mySuperregionId);

  return (
    <>
      <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
        <div className="flex gap-3 justify-end">
          {isDirector ? (
            <Button variant="ghost" onClick={() => setCreateSuperregionOpen(true)}>
              <Plus className="size-4 mr-2" />
              New superregion
            </Button>
          ) : null}
          <Button onClick={() => setCreateRegionOpen(true)}>
            <Plus className="size-4 mr-2" />
            New region
          </Button>
        </div>

        {visibleSuperregions.map((sr: Region) => {
          const children = subregions.filter((sub: Region) => sub.parentRegion === sr._id);
          return (
            <div key={sr._id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-semibold text-celery-500 uppercase tracking-wider">
                  {sr.name} ({sr.prefix})
                </h3>
                {isDirector && children.length === 0 ? (
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => ask(sr)}
                    className="text-celery-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                ) : null}
              </div>
              <div className="flex flex-col gap-1 ml-4">
                {children.map((sub: Region) => {
                  const hasHolders = positions?.some(
                    (p: PositionWithHolder) =>
                      p.region?._id === sub._id && p.currentHolder !== null,
                  );
                  return (
                    <div
                      key={sub._id}
                      className="flex items-center justify-between rounded-lg px-3 py-2 bg-bg-elevated"
                    >
                      <span className="text-sm text-celery-200">
                        {sub.name}
                        <span className="ml-2 text-xs text-celery-500">{sub.prefix}</span>
                      </span>
                      {isDirector && !hasHolders ? (
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => ask(sub)}
                          className="text-celery-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
                {children.length === 0 ? (
                  <p className="text-xs text-celery-600 italic px-3">No regions</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <CreateRegionModal
        isOpen={createRegionOpen}
        onClose={() => setCreateRegionOpen(false)}
        superregions={superregions}
        forceParentId={!isDirector ? mySuperregionId : undefined}
      />
      <CreateRegionModal
        isOpen={createSuperregionOpen}
        onClose={() => setCreateSuperregionOpen(false)}
        superregions={superregions}
        isSuperregion
      />
      <ConfirmDialog
        isOpen={isOpen}
        title="Delete region"
        description={`Delete "${regionToDelete?.name ?? ""}"? This cannot be undone.`}
        onConfirm={confirm}
        onClose={cancel}
      />
    </>
  );
};

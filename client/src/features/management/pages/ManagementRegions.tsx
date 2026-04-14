import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { FetchError, Button, ListPageSkeleton } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { regionsApi } from "@/api/regions";
import { useAuthStore } from "@/store/authStore";
import type { Region, PositionWithHolder } from "@/types";
import { useAllPositions } from "../hooks/useManagementStructure";
import { EditRegionModal } from "../modals/EditRegionModal";
import { CreateRegionModal } from "../modals/CreateRegionModal";

export const ManagementRegions = () => {
  const { user } = useAuthStore();
  const isDirector = user?.role === "director";
  const [editRegion, setEditRegion] = useState<{
    id: string;
    name: string;
    prefix: string;
    isSuperregion: boolean;
  } | null>(null);
  const [createSuperregionOpen, setCreateSuperregionOpen] = useState(false);

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

  if (isLoading) return <ListPageSkeleton />;
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
        </div>

        {visibleSuperregions.map((sr: Region) => {
          const children = subregions.filter((sub: Region) => sub.parentRegion === sr._id);
          return (
            <div key={sr._id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-semibold text-celery-500 uppercase tracking-wider">
                  {sr.name} ({sr.prefix})
                </h3>
                {isDirector ? (
                  <button
                    type="button"
                    onClick={() =>
                      setEditRegion({
                        id: sr._id,
                        name: sr.name,
                        prefix: sr.prefix,
                        isSuperregion: true,
                      })
                    }
                    className="text-celery-600 hover:text-celery-300 transition-colors p-1"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                ) : null}
              </div>
              <div className="flex flex-col gap-1 ml-4">
                {children.map((sub: Region) => {
                  return (
                    <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-bg-elevated">
                      <span className="text-sm text-celery-200">
                        {sub.name}
                        <span className="ml-2 text-xs text-celery-500">{sub.prefix}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditRegion({
                            id: sub._id,
                            name: sub.name,
                            prefix: sub.prefix,
                            isSuperregion: false,
                          })
                        }
                        className="text-celery-600 hover:text-celery-300 transition-colors p-1"
                      >
                        <Pencil className="size-3.5" />
                      </button>
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
      <EditRegionModal
        region={editRegion}
        superregions={superregions}
        canDelete={
          editRegion?.isSuperregion
            ? subregions.filter((sub) => sub.parentRegion === editRegion.id).length === 0
            : !positions?.some(
                (p: PositionWithHolder) =>
                  p.region?._id === editRegion?.id && !(p.type === "advisor" && !p.currentHolder),
              )
        }
        onClose={() => setEditRegion(null)}
      />
      <CreateRegionModal
        isOpen={createSuperregionOpen}
        onClose={() => setCreateSuperregionOpen(false)}
        superregions={superregions}
        isSuperregion
      />
    </>
  );
};

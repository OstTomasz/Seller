import { useState, useEffect } from "react";
import { Modal, Button, Input, Select, ConfirmDialog } from "@/components/ui";
import {
  useUpdateRegionName,
  useUpdateRegionPrefix,
  useMoveRegion,
  useCreateRegion,
  useDeleteRegion,
} from "../hooks/useManagementStructure";
import type { Region } from "@/types";
import { toast } from "sonner";

interface Props {
  region: { id: string; name: string; prefix: string; isSuperregion: boolean } | null;
  superregions: Region[];
  canDelete: boolean; // brak subregionów (superregion) lub brak pozycji (region)
  onClose: () => void;
}

/** Unified region management modal: edit name/prefix, move, create subregion, delete */
export const EditRegionModal = ({ region, superregions, canDelete, onClose }: Props) => {
  const { mutate: mutateName, isPending: isPendingName } = useUpdateRegionName();
  const { mutate: mutatePrefix, isPending: isPendingPrefix } = useUpdateRegionPrefix();
  const { mutate: moveRegion, isPending: isMoving } = useMoveRegion();
  const { mutate: createRegion, isPending: isCreating } = useCreateRegion();
  const { mutate: deleteRegion, isPending: isDeleting } = useDeleteRegion();

  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [selectedSuperregion, setSelectedSuperregion] = useState("");
  const [newRegionName, setNewRegionName] = useState("");
  const [newRegionPrefix, setNewRegionPrefix] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isPendingEdit = isPendingName || isPendingPrefix;

  useEffect(() => {
    if (region) {
      setName(region.name);
      setPrefix(region.prefix);
      setSelectedSuperregion("");
      setNewRegionName("");
      setNewRegionPrefix("");
      setConfirmDelete(false);
    }
  }, [region]);

  const nameChanged = name.trim() !== region?.name;
  const prefixChanged = prefix.trim().toUpperCase() !== region?.prefix;

  const handleSave = () => {
    if (!region) return;
    if (nameChanged) mutateName({ id: region.id, name: name.trim() });
    if (prefixChanged) mutatePrefix({ id: region.id, prefix: prefix.trim().toUpperCase() });
    if (nameChanged || prefixChanged) onClose();
  };

  const handleMove = () => {
    if (!region || !selectedSuperregion) return;
    moveRegion(
      { id: region.id, newParentId: selectedSuperregion },
      {
        onSuccess: () => {
          toast.success("Region moved");
          onClose();
        },
        onError: () => toast.error("Failed to move region"),
      },
    );
  };

  const handleCreateSubregion = () => {
    if (!region || !newRegionName.trim() || !newRegionPrefix.trim()) return;
    createRegion(
      {
        name: newRegionName.trim(),
        prefix: newRegionPrefix.trim().toUpperCase(),
        parentRegionId: region.id,
      },
      {
        onSuccess: () => {
          toast.success("Region created");
          setNewRegionName("");
          setNewRegionPrefix("");
          onClose();
        },
        onError: (e: unknown) => {
          const msg = (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message;
          toast.error(msg ?? "Failed to create region");
        },
      },
    );
  };

  const handleDelete = () => {
    if (!region) return;
    deleteRegion(region.id, {
      onSuccess: () => {
        toast.success("Deleted");
        setConfirmDelete(false);
        onClose();
      },
      onError: (e: unknown) => {
        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(msg ?? "Failed to delete");
      },
    });
  };

  const availableSuperregions = superregions.filter(
    (sr) => sr.parentRegion === null && sr._id !== region?.id,
  );

  return (
    <>
      <Modal isOpen={!!region} onClose={onClose} title="Edit region" size="sm">
        <div className="flex flex-col gap-5">
          {/* ── Name & prefix ────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-celery-500 uppercase tracking-wider">
              {region?.isSuperregion ? "Superregion" : "Region"} details
            </p>
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              label="Prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <Button
              onClick={handleSave}
              disabled={
                (!nameChanged && !prefixChanged) || !name.trim() || !prefix.trim() || isPendingEdit
              }
            >
              {isPendingEdit ? "Saving…" : "Save"}
            </Button>
          </div>

          <div className="border-t border-celery-700" />

          {/* ── Move (tylko subregion) / Create subregion (superregion) ── */}
          {region?.isSuperregion ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-celery-500 uppercase tracking-wider">
                Create region
              </p>
              <Input
                label="Name"
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                placeholder="Region name"
              />
              <Input
                label="Prefix"
                value={newRegionPrefix}
                onChange={(e) => setNewRegionPrefix(e.target.value.toUpperCase())}
                placeholder="e.g. POM"
                maxLength={6}
              />
              <Button
                onClick={handleCreateSubregion}
                disabled={!newRegionName.trim() || !newRegionPrefix.trim() || isCreating}
              >
                {isCreating ? "Creating…" : "Create region"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-celery-500 uppercase tracking-wider">
                Move to superregion
              </p>
              <Select
                label="Target superregion"
                value={selectedSuperregion}
                onChange={(e) => setSelectedSuperregion(e.target.value)}
                placeholder="Select superregion…"
                options={availableSuperregions.map((sr) => ({ value: sr._id, label: sr.name }))}
              />
              <Button onClick={handleMove} disabled={!selectedSuperregion || isMoving}>
                {isMoving ? "Moving…" : "Move"}
              </Button>
            </div>
          )}

          {/* ── Delete ───────────────────────────────────────────── */}
          {canDelete ? (
            <>
              <div className="border-t border-celery-700" />
              <Button
                variant="danger"
                onClick={() => setConfirmDelete(true)}
                disabled={isDeleting}
                className="w-full justify-center"
              >
                Delete {region?.isSuperregion ? "superregion" : "region"}
              </Button>
            </>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={`Delete ${region?.isSuperregion ? "superregion" : "region"}?`}
        description={`Delete "${region?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </>
  );
};

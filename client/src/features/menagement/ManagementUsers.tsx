import { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { Input, Loader, FetchError, Button } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import { useAuthStore } from "@/store/authStore";
import { useAllPositions } from "./hooks/useManagementStructure";
import { CreateUserModal } from "./modals/CreateUserModal";
import type { User, UserRole, PositionWithHolder } from "@/types";

export const ManagementUsers = () => {
  const { user: currentUser } = useAuthStore();
  const isDirector = currentUser?.role === "director";
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const {
    data: users,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => usersApi.getAllForStructure().then((r) => r.data.users as User[]),
  });

  const { data: positions } = useAllPositions();

  const vacantPositions = useMemo(
    () => (positions ?? []).filter((p: PositionWithHolder) => !p.currentHolder),
    [positions],
  );

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = search.toLowerCase().trim();
    let list = users;

    // Deputy sees only their superregion's users
    if (!isDirector) {
      const myPos = positions?.find(
        (p: PositionWithHolder) => p.type === "deputy" && p.currentHolder?._id === currentUser?._id,
      );
      const mySuperregionId = myPos?.region?._id;
      list = list.filter((u) => {
        const pos = u.position as unknown as PositionWithHolder | null;
        const regionParent = pos?.region?.parentRegion;
        const parentId =
          regionParent && typeof regionParent === "object"
            ? (regionParent as { _id: string })._id
            : regionParent;
        return parentId === mySuperregionId || pos?.region?._id === mySuperregionId;
      });
    }

    if (!q) return list;
    return list.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [users, search, isDirector, positions, currentUser?._id]);

  if (isLoading) return <Loader label="users" />;
  if (isError) return <FetchError label="users" />;

  const allowedRoles: UserRole[] = isDirector
    ? ["advisor", "salesperson"]
    : ["advisor", "salesperson"];

  return (
    <>
      <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 size-4 text-celery-500 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="pl-9"
            />
          </div>
          <Button onClick={() => setCreateOpen(true)} className="h-fit">
            <Plus className="size-4 mr-2" />
            New user
          </Button>
        </div>

        <div className="flex flex-col gap-1">
          {filtered.map((u) => {
            const pos = u.position as unknown as PositionWithHolder | null;
            return (
              <div
                key={u._id}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-bg-elevated"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-celery-200">
                    {u.firstName} {u.lastName}
                    <span className="ml-2 text-xs text-celery-500">#{u.numericId}</span>
                  </span>
                  <span className="text-xs text-celery-600">{u.email}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-celery-500">
                  {pos?.code ? (
                    <span>{pos.code}</span>
                  ) : (
                    <span className="italic">No position</span>
                  )}
                  <span className={u.isActive ? "text-celery-400" : "text-red-400"}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 ? (
            <p className="text-sm text-celery-600 text-center py-8">No users found.</p>
          ) : null}
        </div>
      </div>

      <CreateUserModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        availablePositions={vacantPositions.map((p: PositionWithHolder) => ({
          id: p._id,
          code: p.code,
        }))}
        allowedRoles={allowedRoles}
      />
    </>
  );
};

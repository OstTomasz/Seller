import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader, FetchError } from "@/components/ui";
import { useUserDetails } from "../hooks/useUserDetails";
import { positionsApi } from "@/api/positions";
import { useAuthStore } from "@/store/authStore";
import logoPlaceholder from "@/assets/logo.avif";
import type { IUserNote } from "@/types";
import {
  AboutCard,
  ContactCard,
  EmploymentCard,
  NotesCard,
  PositionCard,
  PositionHistoryCard,
  UserBreadcrumbs,
  UserHeader,
} from "./UserPage.sections";

// ── Component ─────────────────────────────────────────────────────────────────

export const UserPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();
  const { data, isLoading, isError } = useUserDetails(id!);
  const location = useLocation();
  const fromArchive = (location.state as { from?: string } | null)?.from === "archive";

  const canSeeNotes = currentUser?.role === "director" || currentUser?.role === "deputy";

  const positionId = data?.user?.position?._id;

  const { data: historyData } = useQuery({
    queryKey: ["position-history", positionId],
    queryFn: () => positionsApi.getHistory(positionId!).then((r) => r.data.history),
    enabled: !!positionId && canSeeNotes,
  });

  if (isLoading) return <Loader label="employee" />;
  if (isError || !data) return <FetchError label="employee" />;

  const { user, profile } = data;

  const fullName = `${user.firstName} ${user.lastName}`;
  const positionCode = user.position?.code ?? null;
  const regionName = user.position?.region?.name ?? null;
  const superregionName = user.position?.region?.parentRegion?.name ?? null;
  const avatarSrc = profile?.avatar ?? logoPlaceholder;

  const notes = (user as unknown as { notes?: IUserNote[] }).notes ?? [];

  return (
    <div className="flex flex-col max-w-3xl mx-auto gap-6">
      <UserBreadcrumbs fromArchive={fromArchive} fullName={fullName} />
      <UserHeader
        fullName={fullName}
        avatarSrc={avatarSrc}
        numericId={user.numericId}
        positionCode={positionCode}
      />
      <ContactCard phone={user.phone} email={user.email} />
      <PositionCard
        role={user.role}
        positionCode={positionCode}
        grade={user.grade}
        regionName={regionName}
        superregionName={superregionName}
      />
      <EmploymentCard
        createdAt={user.createdAt}
        workplace={profile?.workplace}
        lastLoginAt={profile?.lastLoginAt}
      />
      <AboutCard description={profile?.description} />
      {canSeeNotes ? <NotesCard notes={notes} /> : null}
      {canSeeNotes && positionId ? <PositionHistoryCard history={historyData ?? []} /> : null}
    </div>
  );
};

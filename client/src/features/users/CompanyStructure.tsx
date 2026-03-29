import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Crown, ChevronDown, ChevronRight } from "lucide-react";
import { Input, Loader, FetchError } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useCompanyStructure } from "./hooks/useCompanyStructure";
import { matchesSearch, type SuperRegionNode, type SubRegionNode } from "./utils/buildHierarchy";
import type { UserForInvite } from "@/types";

// ── UserRow ───────────────────────────────────────────────────────────────────

const UserRow = ({ user }: { user: UserForInvite }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/users/${user._id}`)}
      className="flex items-center justify-between rounded-lg px-3 py-2 w-full
                 text-sm bg-bg-elevated text-celery-300 hover:bg-celery-800
                 transition-colors text-left"
    >
      <span>
        {user.firstName} {user.lastName}
        <span className="ml-2 text-xs text-celery-600">#{user.numericId}</span>
      </span>
      {user.position ? (
        <span className="text-xs text-celery-500 shrink-0">{user.position.code}</span>
      ) : null}
    </button>
  );
};

// ── RegionHeader ──────────────────────────────────────────────────────────────

const RegionHeader = ({
  label,
  collapsed,
  onToggle,
  indent = false,
}: {
  label: string;
  collapsed: boolean;
  onToggle: () => void;
  indent?: boolean;
}) => (
  <button
    type="button"
    onClick={onToggle}
    className={cn(
      "flex items-center gap-2 px-2 py-1 w-full rounded text-left",
      "text-xs font-semibold text-celery-500 uppercase tracking-wider",
      "hover:bg-celery-800 transition-colors",
      indent && "ml-4",
    )}
  >
    {collapsed ? (
      <ChevronRight className="size-3.5 shrink-0" />
    ) : (
      <ChevronDown className="size-3.5 shrink-0" />
    )}
    {label}
  </button>
);

// ── SubRegionSection ──────────────────────────────────────────────────────────

const SubRegionSection = ({
  sub,
  collapsed,
  onToggle,
}: {
  sub: SubRegionNode;
  collapsed: boolean;
  onToggle: () => void;
}) => (
  <div className="flex flex-col gap-1">
    <RegionHeader
      label={`${sub.name} (${sub.prefix})`}
      collapsed={collapsed}
      onToggle={onToggle}
      indent
    />
    {!collapsed ? (
      <div className="flex flex-col gap-1 ml-8">
        {sub.users.map((u) => (
          <UserRow key={u._id} user={u} />
        ))}
      </div>
    ) : null}
  </div>
);

// ── SuperRegionSection ────────────────────────────────────────────────────────

const SuperRegionSection = ({
  sr,
  collapsed,
  collapsedSubs,
  onToggle,
  onToggleSub,
}: {
  sr: SuperRegionNode;
  collapsed: boolean;
  collapsedSubs: Set<string>;
  onToggle: () => void;
  onToggleSub: (prefix: string) => void;
}) => (
  <div className="flex flex-col gap-1">
    <RegionHeader label={`${sr.name} (${sr.prefix})`} collapsed={collapsed} onToggle={onToggle} />
    {!collapsed ? (
      <div className="flex flex-col gap-1">
        {sr.users.map((u) => (
          <UserRow key={u._id} user={u} />
        ))}
        {sr.subRegions.map((sub) => (
          <SubRegionSection
            key={sub.id}
            sub={sub}
            collapsed={collapsedSubs.has(sub.prefix)}
            onToggle={() => onToggleSub(sub.prefix)}
          />
        ))}
      </div>
    ) : null}
  </div>
);

// ── CompanyStructure ──────────────────────────────────────────────────────────

export const CompanyStructure = () => {
  const { data: hierarchy, isLoading, isError } = useCompanyStructure();
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [collapsedSubs, setCollapsedSubs] = useState<Set<string>>(new Set());

  const toggle = (key: string, setter: React.Dispatch<React.SetStateAction<Set<string>>>) =>
    setter((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const visible = useMemo(() => {
    if (!hierarchy) return null;
    const q = search.toLowerCase().trim();
    if (!q) return hierarchy;

    const filterUsers = (list: UserForInvite[]) => list.filter((u) => matchesSearch(u, q));

    return {
      directors: filterUsers(hierarchy.directors),
      superRegions: hierarchy.superRegions
        .map((sr) => ({
          ...sr,
          users: filterUsers(sr.users),
          subRegions: sr.subRegions
            .map((sub) => ({ ...sub, users: filterUsers(sub.users) }))
            .filter((sub) => sub.users.length > 0),
        }))
        .filter((sr) => sr.users.length > 0 || sr.subRegions.length > 0),
    };
  }, [hierarchy, search]);

  if (isLoading) return <Loader label="structure" />;
  if (isError || !visible) return <FetchError label="structure" />;

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-3 size-4 text-celery-500 pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or code…"
          className="pl-9"
        />
      </div>

      <div className="flex flex-col gap-2">
        {/* Directors */}
        {visible.directors.map((user) => (
          <div key={user._id} className="flex items-center gap-2 px-2">
            <Crown className="size-3 text-yellow-500 shrink-0" />
            <UserRow user={user} />
          </div>
        ))}

        {/* SuperRegions */}
        {visible.superRegions.map((sr) => (
          <SuperRegionSection
            key={sr.prefix}
            sr={sr}
            collapsed={collapsed.has(sr.prefix)}
            collapsedSubs={collapsedSubs}
            onToggle={() => toggle(sr.prefix, setCollapsed)}
            onToggleSub={(p) => toggle(p, setCollapsedSubs)}
          />
        ))}

        {visible.directors.length === 0 && visible.superRegions.length === 0 ? (
          <p className="text-sm text-celery-600 text-center py-8">No users found.</p>
        ) : null}
      </div>
    </div>
  );
};

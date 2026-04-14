export const queryKeys = {
  clients: {
    all: () => ["clients"] as const,
    archived: () => ["clients", "archived"] as const,
    details: (id: string) => ["client", id] as const,
  },
  notifications: {
    all: () => ["notifications"] as const,
  },
  management: {
    regions: () => ["management-regions"] as const,
    users: () => ["management-users"] as const,
    allUsers: () => ["all-users"] as const,
    allPositions: () => ["all-positions"] as const,
    usersWithoutPosition: () => ["users-without-position"] as const,
    companyStructure: () => ["company-structure"] as const,
  },
  users: {
    details: (id: string) => ["user-details", id] as const,
    profile: () => ["my-profile"] as const,
  },
} as const;

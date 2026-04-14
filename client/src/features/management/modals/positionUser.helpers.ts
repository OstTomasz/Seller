import type { UserForInvite } from "@/types";

export const buildAssignableUserOptions = (users: UserForInvite[]) =>
  users.map((user) => ({
    value: user._id,
    label: `${user.firstName} ${user.lastName} #${user.numericId}`,
  }));

interface AssignPayload {
  userId: string;
  positionId: string;
}

interface AssignOptions {
  onSuccess: () => void;
  onError: () => void;
}

type AssignMutate = (payload: AssignPayload, options: AssignOptions) => void;

export const assignUserToPosition = (
  mutate: AssignMutate,
  selectedUserId: string,
  positionId: string,
  options: AssignOptions,
) => {
  mutate({ userId: selectedUserId, positionId }, options);
};

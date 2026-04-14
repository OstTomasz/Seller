import { ForbiddenError } from "../../utils/errors";
import type { UserRole } from "../../types";

const assertRoleIn = (role: UserRole, allowed: UserRole[]): void => {
  if (!allowed.includes(role)) {
    throw new ForbiddenError();
  }
};

export const assertDirector = (role: UserRole): void => {
  assertRoleIn(role, ["director"]);
};

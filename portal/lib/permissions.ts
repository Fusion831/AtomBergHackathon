import { Role } from "@prisma/client";

/**
 * Access Control utility for consistent checking across server components.
 */
export const hasAccess = (userRole: Role | string, allowedRoles: Role[]) => {
  return allowedRoles.includes(userRole as Role);
};

export const ROUTES = {
  ADMIN: ["ADMIN"] as Role[],
  MANAGER: ["ADMIN", "MANAGER"] as Role[],
  EMPLOYEE: ["ADMIN", "MANAGER", "EMPLOYEE"] as Role[],
};

export const canEditGoal = (userRole: Role, goalOwnerId: string, userId: string) => {
  if (userRole === "ADMIN") return true;
  return goalOwnerId === userId;
};

// Extensible permissions matrix structure here

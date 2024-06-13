import { useUserStore } from "../stores/usersStore";
import type { Optional } from "../types/common";
import type { EUserAccessRole, EUserGlobalRole, IUser } from "../types/user";

export const hasLoadedUserGlobalRole = async (globalRole: EUserGlobalRole): Promise<boolean> => {
  const { isUserLoaded, user } = useUserStore();

  if (!isUserLoaded) {
    throw new Error("[hasUserGlobalRoleAdminGuard]: user should be loaded before entering guard");
  }

  return hasUserGlobalRole(user, globalRole);
};

export const hasUserGlobalRole = (user: IUser, userGlobalRole: EUserGlobalRole): boolean => {
  return !!user.userGlobalRoles?.some((r): boolean => r.role === userGlobalRole);
};

export const hasUserOneOfGlobalRoles = (user: IUser, userGlobalRoles: EUserGlobalRole[]): boolean => {
  return !!user.userGlobalRoles?.some((r): boolean => !!r.role && userGlobalRoles.includes(r.role));
};

export const hasUserAccessRole = (user: IUser, userAccessRole: EUserAccessRole): boolean => {
  return !!user.userAccessRoles?.some((r): boolean => r.role === userAccessRole);
};

export const hasUserOneOfRoles = (user: IUser, userAccessRoles: EUserAccessRole[]): boolean => {
  return !!user.userAccessRoles?.some((r): boolean => userAccessRoles.includes(r.role));
};

export const getUserFullName = (user: Optional<IUser>): string => `${user?.firstname ?? ""} ${user?.lastname?.toUpperCase() ?? ""}`.trim();

export const getUserIdentity = (user: Optional<IUser>): string => {
  if (!user) return "";

  if (user.firstname || user.lastname) return `${getUserFullName(user)} ${user.email ? `(${user.email})` : ""}`;

  return user.email;
};

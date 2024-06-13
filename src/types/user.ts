import type { Id } from "./common";

export interface IUser {
  id: number;
  azureADUserID: string;
  externalID?: string | null;
  lastname?: string | null;
  firstname?: string | null;
  email: string;
  code?: string | null;
  phone?: string | null;
  emailVerified?: boolean;
  officialIDNumber?: string | null;
  acceptedTermOfUseVersion?: string | null;
  jobPosition?: string | null;
  userGlobalRoles?: IUserGlobalRole[] | null;
  creationDateTime?: string;
  lastAccessDateTime?: string;
  lastAppVersions?: IUserLastAppVersions | null;
  userAccessRoles?: IUserAccessRole[] | null;
}

export interface IUserAccessRole {
  companyID: number;
  id: number;
  person: IUser;
  personID: number;
  role: EUserAccessRole;
  inherited?: boolean | null;
  inheritedUserAccess?: IUser | null;
  inheritedUserAccessId?: Id | null;
}

export enum EUserApplication {
  AndroidApp = "AndroidApp",
  WindowsApp = "WindowsApp",
  Dashboard = "Dashboard",
  XamarinApp = "XamarinApp",
  eECFWindowsApp = "eECFWindowsApp",
  DashboardEECF = "DashboardEECF",
  Other = "Other"
}

export enum EUserGlobalRole {
  Admin = "Admin",
  CompanyUser = "CompanyUser",
  Accountant = "Accountant"
}

export enum EUserAccessRole {
  Owner = "Owner",
  Admin = "Admin",
  Employee = "Employee",
  VigileAdmin = "VigileAdmin",
  Vigile = "Vigile",
  CustomerService= "CustomerService",
  DematITAdmin = "DematITAdmin"
}

export interface IUserLastAppVersions {
  androidApp?: string;
  windowsApp?: string;
  dashboard?: string;
  xamarinApp?: string;
  eECFWindowsApp?: string;
  DashboardEECF?: string;
  other?: string;
}

export interface IUserGlobalRole {
  id?: number;
  personID?: number;
  role?: EUserGlobalRole;
}

export interface IUsersFilters {
  page: number;
  limit: number;
  term?: string;
  orderBy?: "lastAccess" | "new";
}

export interface IUserUpdateHistoryNote {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  allowZoom?: boolean;
  video?: string | null;
  version?: string | null;
}

export interface IUserAccessRoleOption {
  label: string;
  value: EUserAccessRole;
}


import { RouteLocationNamedRaw, RouteLocationPathRaw } from "vue-router";


import { ComponentProps } from "@/types/common";

export interface IRoute extends RouteLocationNamedRaw, RouteLocationPathRaw {
  label: string;
  name: string;
  iconPath?: ComponentProps<any>["iconPath"];
  icon?: string
  gestAccess?: boolean;
  iconColor?: string;
  path: string;
}


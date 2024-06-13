import { RouteLocationNamedRaw, RouteLocationPathRaw } from "vue-router";

import { SbIcon }  from "@/components/index";

import { ComponentProps } from "@/types/common";

export interface IRoute extends RouteLocationNamedRaw, RouteLocationPathRaw {
  label: string;
  name: string;
  iconPath?: ComponentProps<typeof SbIcon>["iconPath"];
  icon?: string
  gestAccess?: boolean;
  iconColor?: string;
  path: string;
}


import { i18n } from "@/locales";
import type { IRoute } from "@/types/route";
import { Link, HomeFilled, Connection } from '@element-plus/icons-vue'


export enum ERouteName {
  Dashboard = "Dashboard",
  Login = "Login",
  Modal = "Modal",
  Redirect = "Redirect",
  
}


export const ROUTES: Record<ERouteName, IRoute> = {
 
  [ERouteName.Dashboard]: {
    label: i18n.global.t("common.routes.dashboard"),
    name: ERouteName.Dashboard,
    path: "/",
    iconPath: "Element:EditPen"
  },

  [ERouteName.Login]: {
    label: i18n.global.t("common.routes.Login"),
    name: ERouteName.Login,
    path: "/login",
    iconPath: "Element:EditPen",
  },

  [ERouteName.Modal]: {
    label: i18n.global.t("common.routes.Modal"),
    name: ERouteName.Modal,
    path: "/modal",
    iconPath: "Element:EditPen",
  },
  [ERouteName.Redirect]: {
    label: i18n.global.t("common.routes.Redirect"),
    name: ERouteName.Redirect,
    path: '/redirect',
  },

};
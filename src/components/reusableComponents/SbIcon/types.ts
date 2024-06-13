import type { customIcons } from "./custom/icons";
import type * as elementIcons from "./element/icons";

export type ElementIcons = keyof typeof elementIcons;
export type CustomIcons = keyof typeof customIcons;
export type IconPath = `Element:${ElementIcons}` | `Custom:${CustomIcons}`;
export type IconPosition = "start" | "end";

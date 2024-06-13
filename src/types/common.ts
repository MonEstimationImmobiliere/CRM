import type { AllowedComponentProps, Component, ComponentOptions, ComponentOptionsMixin, ComputedOptions, MethodOptions, Ref, VNodeProps } from "vue";
import type { ComposerTranslation } from "vue-i18n";

export type Nullable<T> = T | null;
export type Optional<T> = T | null | undefined;
export type Id = string | number;
export type ComponentType = "default" | "primary" | "success" | "info" | "warning" | "danger";
export type ComponentSize = "small" | "default" | "large";
export type TranslatedCustomValidator = (translate: ComposerTranslation) => (_: unknown, value: string) => boolean | Error;

export interface ISbActionsDialogAction {
  id: string;
  title: string;
  divider?: boolean;
  type?: ComponentType;
  loading?: Ref<boolean>;
  disabled?: boolean;
  payload?: unknown;
}

export type ComponentProps<T extends Component> = T extends new (...args: unknown[]) => unknown
  ? Omit<InstanceType<T>["$props"], keyof VNodeProps | keyof AllowedComponentProps>
  : never;

export type PureComponentProps<T extends Component> = Omit<ComponentProps<T>, | `on${string}`>;

export type ComponentEmits<T extends Component> = T extends new (...args: unknown[]) => unknown
  ? InstanceType<T>["$emit"]
  : never;

export type Events<T extends Component> = T extends ComponentOptions<
never,
unknown,
unknown,
ComputedOptions,
MethodOptions,
ComponentOptionsMixin,
ComponentOptionsMixin,
infer E
>
  ? keyof E
  : never;

export enum EStatus {
  IDLE = "idle",
  FETCHING = "fetching",
  FETCH_SUCCESS = "fetch-success",
  FETCH_ERROR = "fetch-error",
  FETCH_DONE = "fetch-done",
  SUBMITTING = "submitting",
  SUBMIT_ERROR = "submit-error",
  SUBMIT_SUCCESS = "submit-success",
  DELETING = "deleting",
  DELETE_ERROR = "delete-error",
  DELETE_SUCCESS = "delete-success",
  PROCESSING = "processing",
  PROCESS_ERROR = "process-error",
  PROCESS_SUCCESS = "process-success",
  ERROR = "error"
}

export type UncapitalizedObjectKeysInDepth<T> = {
  [K in keyof T as K extends string ? Uncapitalize<K> : K]: T[K] extends object ? UncapitalizedObjectKeysInDepth<T[K]> : T[K];
};

export enum EStreetNumberTypes {
  Bis = "Bis",
  Ter = "Ter",
  Quater = "Quater"
}

export interface IAddress {
  city?: string;
  locality?: string;
  addressSupplement?: string;
  country?: string;
  street?: string;
  streetNumber?: string;
  streetNumberType?: EStreetNumberTypes | "";
  zipCode?: string;
}

export enum ESocialNetworkType {
  Instagram = "Instagram",
  Pinterest = "Pinterest",
  Snapchat = "Snapchat",
  TikTok = "TikTok",
  X = "X",
  LinkedIn = "LinkedIn",
  Facebook = "Facebook",
  WebSite = "WebSite",
  Youtube = "Youtube",
  Messenger = "Messenger",
  WhatsAppBusiness = "WhatsAppBusiness",
  WhatsApp = "WhatsApp"
}

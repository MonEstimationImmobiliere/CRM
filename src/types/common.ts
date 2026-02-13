import type { AllowedComponentProps, Component, VNodeProps } from 'vue';

export type ComponentProps<T extends Component> = T extends new (
  ...args: unknown[]
) => unknown
  ? Omit<
      InstanceType<T>['$props'],
      keyof VNodeProps | keyof AllowedComponentProps
    >
  : never;

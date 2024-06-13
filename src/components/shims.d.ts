import { AriaAttributes, DOMAttributes } from "react";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    class?: any;
  }
}

import { EnvType, SwitchType } from "types/app"

/**
 * app
 */
export const appTitle = 'boiler plate'

/**
 * mock api：on，off  
 */
export const mock: SwitchType = 'on'

/**
 * mock namespace，url
 */
export const mockNamespace: boolean = true

/**
 * mock
 * appConfig mock ‘on’mock
 */
export const mockEnv: EnvType[] = ['development', 'staging', 'production']

/**
 * 
 */
export enum transitions {
  fade = 'fade',
  fadeScale = 'fade-scale',
  slideLeft = 'slide-left',
  slideRight = 'slide-right',
  slideUp = 'slide-up',
  slideDown = 'slide-down',
}

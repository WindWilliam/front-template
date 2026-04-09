import type { Options } from 'prettier'
import { basePrettier } from './base'

/* Vue 配置 */
const config: Options = {
  ...basePrettier,
}

export const vuePrettier = config

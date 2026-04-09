import type { Options } from 'prettier'
import { basePrettier } from './base'

/* React 配置 */
const config: Options = {
  ...basePrettier,
}

export const reactPrettier = config

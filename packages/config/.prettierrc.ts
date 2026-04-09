import type { Options } from 'prettier'
import { basePrettier } from './prettier/base.ts'

const config: Options = {
  ...basePrettier,
}

export default config

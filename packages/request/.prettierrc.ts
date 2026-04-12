import type { Options } from 'prettier'

// 直接使用 config 包的 basePrettier 配置
// 注意: @front-template/config 目前未导出 prettier，直接从源文件引用
import { basePrettier } from '../config/prettier/base.ts'

const config: Options = {
  ...basePrettier,
}

export default config

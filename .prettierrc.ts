import type { Options } from 'prettier';
import { basePrettier } from '@front-template/config/prettier/base.ts';
// import basePrettier from '@front-template/config/prettier/test.json' with { type: 'json' };

const config: Options = {
  ...basePrettier,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
};

export default config;

import { extendBaseLint } from '@front-template/config';

const config = [
  {
    // 跳过内部依赖包 packages 和 apps 目录
    ignores: ['node_modules', 'dist', '.turbo', '.pnpm-store', 'packages', 'apps'],
  },
];

export default extendBaseLint(config);

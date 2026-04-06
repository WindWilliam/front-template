import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  // rules: {
  //   'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']],
  //   'subject-case': [0, 'never', ['sentence-case']],
  // },
};

export default config;

import type { Configuration } from 'lint-staged'

const config: Configuration = {
  '*.{js,ts}': ['eslint --fix', 'prettier --write'],
  '*.{json,md}': ['prettier --write'],
}

export default config

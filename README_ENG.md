# front-template

front template by wind

## English

## English Overview

This is a frontend template in a monorepo, using pnpm workspaces and Turbo for cross-package orchestration. It contains a root configuration and multiple packages/apps under `packages/*` and `apps/*` for rapid prototyping and unified scaffolding.

## Quick Start

- Install dependencies: `pnpm i`
- Run workspace tasks: `pnpm turbo run <target>` from the repo root (use `-w` for workspaces when needed)
- Common scripts:
- `pnpm lint` — run code and style checks
- `pnpm format` — auto-format code
- `pnpm test` — run tests (root script is a placeholder; per-package tests may exist)
- `pnpm build` — build outputs (if defined)

## Project Structure

- Root contains: `pnpm-workspace.yaml`, `package.json`, `README.md`, and other configs
- Code organized under `packages/*` and `apps/*`
- Root and workspace are orchestrated by Turbo for cross-package tasks

## Common Scripts & Tools

- Dependency management: `pnpm i`
- Per-workspace commands: `pnpm -w <script>` (e.g., `pnpm -w turbo run build`)
- Code checks: `pnpm lint`
- Formatting: `pnpm format`
- Tests: `pnpm test`
- Build: `pnpm build`

## Contributing

- Ensure lint/format/tests pass before PRs
- Keep changes small and well-scoped; prefer patch-style commits
- Use branches and descriptive commit messages

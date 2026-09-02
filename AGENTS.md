# AGENTS.md

## Repository purpose

This repository is the Bitfocus-facing publishing wrapper for the ScStw Companion connection. The implementation lives in the `scstw-streamdeck` Git submodule, primarily in:

- `scstw-streamdeck/packages/companion`: Companion integration;
- `scstw-streamdeck/packages/core`: shared protocol and stopwatch behavior.

Do not duplicate implementation or protocol logic in the outer repository. The outer repository should contain only the files and workspace configuration needed for Bitfocus to identify, build, package, document, and release the module.

## Setup and validation

Use Node.js 22.20 or a compatible Node 22 release and Yarn 4 with the `node-modules` linker.

```sh
git submodule update --init --recursive
corepack enable
yarn install
yarn build
yarn companion-module-check
yarn package
```

Before a release, also verify that the generated package loads and that the shared core tests pass:

```sh
yarn workspace @itsblue/scstw-streamdeck-core test
```

Do not commit `node_modules`, `pkg`, or generated `.tgz` archives.

## Files mirrored from the submodule

The outer repository must expose real files under `companion/` because Bitfocus reads and packages them from the repository root. Do not replace the outer `companion` directory with a symlink.

Keep these files synchronized whenever the nested module changes:

| Outer publishing file | Nested source file | Sync rule |
| --- | --- | --- |
| `companion/HELP.md` | `scstw-streamdeck/packages/companion/companion/HELP.md` | Contents must be identical. |
| `companion/manifest.json` | `scstw-streamdeck/packages/companion/companion/manifest.json` | All module metadata must match except for path-dependent fields described below. |
| `package.json` | `scstw-streamdeck/packages/companion/package.json` | Release versions must match. Keep the outer workspace/build adapter and nested package names intentionally distinct. |
| `LICENSE` | `scstw-streamdeck/LICENSE` | License text must remain identical. |
| `build-config.cjs` | `scstw-streamdeck/packages/companion/build-config.cjs` | Keep packaging behavior equivalent while preserving their different relative paths to `LICENSE`. |

The two manifests intentionally differ only where their filesystem locations require it:

- outer `$schema`: `../node_modules/@companion-module/base/assets/manifest.schema.json`;
- nested `$schema`: `../../../node_modules/@companion-module/base/assets/manifest.schema.json`;
- outer runtime entrypoint: `../scstw-streamdeck/packages/companion/dist/main.js`;
- nested runtime entrypoint: `../dist/main.js`.

Keep the source manifest `version` and `runtime.apiVersion` values at `0.0.0`. The packaging tool replaces them with the release version from the outer `package.json` and the installed `@companion-module/base` version.

## Stable identifiers

- Repository: `companion-module-itsblue-scstw`
- Package and manifest ID: `itsblue-scstw`
- Legacy IDs: `companion-module-itsblue-scstw` and `scstw-stopwatch`

Treat these identifiers as stable. Do not remove a legacy ID, as that would break migration of existing Companion configurations.

## Submodule changes

Changes under `scstw-streamdeck` belong to the submodule repository. Commit and push them there first, then commit the updated submodule pointer in this repository. A dirty submodule working tree is not included in an outer commit or release tag.

Every outer release tag must point to a public, reachable submodule commit containing the matching Companion source and metadata.

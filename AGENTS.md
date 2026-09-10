# AGENTS.md

## Repository purpose

This repository is the Bitfocus-facing publishing wrapper for the ScStw Companion connection. The implementation lives in the `scstw-streamdeck` Git submodule, primarily in:

- `scstw-streamdeck/packages/companion`: Companion integration;
- `scstw-streamdeck/packages/core`: shared protocol and stopwatch behavior;
- `scstw-streamdeck/packages/renderer`: deterministic button rendering shared by Companion and Elgato.

Do not duplicate implementation or protocol logic in the outer repository. The outer repository should contain only the files and workspace configuration needed for Bitfocus to identify, build, package, document, and release the module.

## Setup and validation

Use Node.js 22.20 or a compatible Node 22 release and Yarn 4 with the `node-modules` linker.

```sh
git submodule update --init --recursive
corepack enable
yarn install
yarn sync-submodule
yarn check:sync-submodule
yarn build
yarn companion-module-check
yarn package
```

Before a release, also verify that the generated package loads and that the shared core and renderer tests pass:

```sh
yarn workspace @itsblue/scstw-streamdeck-core test
yarn workspace @itsblue/scstw-streamdeck-renderer test
```

The outer workspaces use relative symlinks under `packages/` pointing to the corresponding submodule packages. Keep these workspace paths under `packages/` so `yarn workspace` uses the outer project's lockfile and install. Declaring workspace paths through `scstw-streamdeck/` causes Yarn to discover the submodule's separate project when running scripts. Keep implementation files in the submodule; the symlinks are only workspace configuration.

Do not commit `node_modules`, `pkg`, or generated `.tgz` archives.

The Companion build depends on the renderer's checked-in source assets and packages its WASM renderer, font, and third-party notices from the submodule. Keep those assets and notices in the submodule; do not duplicate them in the outer publishing wrapper.

## Files mirrored from the submodule

The outer repository must expose real files under `companion/` because Bitfocus reads and packages them from the repository root. Do not replace the outer `companion` directory with a symlink.

Keep these files synchronized whenever the nested module changes:

```sh
yarn sync-submodule
```

This copies the nested help and license, regenerates the outer manifest with its required path overrides, and synchronizes the nested Companion version, Node engine, module-base version, and module-tools version into the outer `package.json`. Use `yarn check:sync-submodule` to detect drift without modifying files. The normal build runs this check automatically.

| Outer publishing file     | Nested source file                                            | Sync rule                                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `companion/HELP.md`       | `scstw-streamdeck/packages/companion/companion/HELP.md`       | Contents must be identical.                                                                                                                                                               |
| `companion/manifest.json` | `scstw-streamdeck/packages/companion/companion/manifest.json` | All module metadata must match except for path-dependent fields described below.                                                                                                          |
| `package.json`            | `scstw-streamdeck/packages/companion/package.json`            | The release version, Node engine, module-base version, and module-tools version are synchronized. Keep the outer workspace/build adapter and nested package names intentionally distinct. |
| `LICENSE`                 | `scstw-streamdeck/LICENSE`                                    | `yarn sync-submodule` keeps the license text identical.                                                                                                                                   |

The two manifests intentionally differ only where their filesystem locations require it:

- outer `$schema`: `../node_modules/@companion-module/base/assets/manifest.schema.json`;
- nested `$schema`: `../../../node_modules/@companion-module/base/assets/manifest.schema.json`;
- outer runtime entrypoint: `../scstw-streamdeck/packages/companion/dist/main.js`;
- nested runtime entrypoint: `../dist/main.js`.

Keep the source manifest `version` and `runtime.apiVersion` values at `0.0.0`. The packaging tool replaces them with the release version from the outer `package.json` and the installed `@companion-module/base` version.

## Stable identifiers

- Repository: `companion-module-itsblue-scstw`
- Package and manifest ID: `itsblue-scstw`
- Legacy IDs: none; the empty list is intentional because no former IDs were published.

Treat the repository and manifest identifiers as stable once the module has been published.

## Submodule changes

Changes under `scstw-streamdeck` belong to the submodule repository. Commit and push them there first, then commit the updated submodule pointer in this repository. A dirty submodule working tree is not included in an outer commit or release tag.

Every outer release tag must point to a public, reachable submodule commit containing the matching Companion source and metadata.

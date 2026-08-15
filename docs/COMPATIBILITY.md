# Compatibility Record

This file records verified behavior, not intended support. Update it with exact
versions and evidence during each release candidate.

## Current status

`0.1.0-beta.1` has completed packed-tarball install, real browser load,
enable/disable, uninstall and stock-profile recovery in an isolated profile.
Agent turns and approval allow/deny still require credentialed manual testing;
do not advertise those paths as verified yet.

## Development baseline

| Item | Value |
| --- | --- |
| DSH source baseline | `47f943859bef60e4160492346772ded9b24f765a` |
| DSH npm release | `@deepseek-ai/dsh@0.1.0-rc.6` |
| Node.js | `^22.19.0 || >=24.0.0` |
| Browser | Chrome `151.0.7922.138`; Edge `151.0.4129.72`, headless runtime verified |
| OS | Windows 11 development and isolated-profile runtime verified |

## Release verification table

| DSH version / commit | Browser | OS | Install | Real turn | Approval | Restart | Uninstall | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `0.1.0-rc.6` / `47f9438` | Chrome 151 / Edge 151 | Windows 11 | pass | pending | pending | pass | pass | [evidence](ACCEPTANCE_EVIDENCE.md) |

The npm version and the repository default branch (`master`) were rechecked on
2026-08-16: npm remained `0.1.0-rc.6` and the default-branch head remained
`47f943859bef60e4160492346772ded9b24f765a`.

## Plugin coexistence

Full-shell themes are conflicts unless explicitly proven otherwise. DSH-OS26
will detect them and recommend enabling only one full-shell material plugin.
The official theme snapshot exposes registered theme ids but not the source ids
of token-only override layers. Therefore Settings always shows a compatibility
notice, and names a conflicting registered theme when the API exposes one.

| Plugin | Expected relation | Verified result |
| --- | --- | --- |
| `dsh-liquid-glass` | full-shell/theme conflict | pending |
| `dsh-theme-lab` | full-shell/theme conflict | pending |
| `dsh-skin-glass` | full-shell/theme conflict | pending |
| `silk-background` | token/background conflict | pending |
| sidebar/workbench plugins | should coexist through official slots | pending |

## Known limitations

- DSH `0.1` client APIs are explicitly pre-stable; this beta pins one baseline.
- Custom wallpaper is browser-local and capped at 2 MB.
- Cinematic uses deterministic SVG displacement plus CSS optics, not mandatory
  WebGL; unsupported filters fall back to Balanced rendering.
- Plugin conflict detection currently warns for a non-built-in active theme;
  it does not disable another plugin automatically.
- macOS/Linux, real approval allow/deny and credentialed real-turn video
  capture remain release blockers, not implied support.

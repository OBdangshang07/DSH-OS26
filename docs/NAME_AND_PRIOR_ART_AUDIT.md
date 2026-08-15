# Name and Prior-Art Audit

Audit date: 2026-08-16. Exact-name check repeated at 01:43 CST (UTC+8).

This is a discovery and branding check, not a legal trademark opinion.

## Name availability

Searches performed:

- GitHub repository search: `dsh-os26 in:name`.
- GitHub repository search: `DSH-OS26`.
- GitHub repository search: `os26 deepseek harness`.
- GitHub topic search: `os26 topic:dsh-plugin`.
- npm exact package lookup: `dsh-os26`.
- npm search: `os26` and `dsh os26`.

Results at the audit time:

- No exact or near-exact GitHub repository named `DSH-OS26` or `dsh-os26`.
- No DeepSeek Harness plugin using `OS26` was found.
- The unscoped npm package `dsh-os26` returned `E404` and appears available.
- No npm package was returned for the exact `os26` search.

The latest repeat check returned GitHub `total_count: 0` for all four queries:
`DSH-OS26 in:name`, `dsh os26 in:name`, `os26 deepseek in:name,description`
and `os26 harness in:name,description`. `npm view dsh-os26` still returned
`E404`. A broad npm search returned unrelated packages using `dsh` as initials,
not an OS26 or DSH visual-shell collision.

Nearby names include `dsh-agent-os-*` repositories. They describe an Agent OS
runtime, planner, scheduler and observability stack rather than a visual shell,
so they are a semantic neighbor but not a likely product-name collision.

## Naming decision

Keep:

- Display name: `DSH-OS26`.
- npm package: `dsh-os26`.
- Suggested GitHub repository: `DSH-OS26` or `dsh-os26`.

Fallback if the npm name is taken before release:

- `@<publisher>/dsh-os26`.

Re-run the audit within 24 hours before announcing or publishing. Name
availability can change at any time; this document does not reserve either the
GitHub repository or npm package.

## Association risk

The name intentionally evokes a modern operating-system generation. That is
useful for the video concept but creates two perception risks:

1. `DSH` may be interpreted as an official DeepSeek product.
2. `OS26` plus Liquid Glass may be interpreted as an Apple-affiliated project.

Required mitigation:

> DSH-OS26 is an independent open-source plugin for DeepSeek Harness, inspired
> by modern liquid-glass interfaces. It is not affiliated with or endorsed by
> DeepSeek or Apple.

Do not use Apple or DeepSeek logos as the project logo. Do not ship copied
wallpapers, system sounds, SF Symbols, proprietary fonts or screenshots that
imply an official partnership.

## Existing Liquid Glass and glassmorphism work

The theme is not new in the DSH ecosystem. Relevant public projects include:

- [`xingyingyuzhui/dsh-liquid-glass`](https://github.com/xingyingyuzhui/dsh-liquid-glass) - wallpaper and optional glass islands.
- [`394804078-pixel/dsh-liquid-glass`](https://github.com/394804078-pixel/dsh-liquid-glass) - transparent iOS-inspired composer and
  modal styling.
- [`Ultronen/dsh-theme-lab`](https://github.com/Ultronen/dsh-theme-lab) - full-shell transparency, wallpaper and blur.
- [`noexcs/dsh-skin-glass`](https://github.com/noexcs/dsh-skin-glass) - component glass, color extraction, SVG refraction
  and WCAG checks.
- [`z21for99/silk-background`](https://github.com/z21for99/silk-background) - WebGL silk background and glass theme tokens.
- [`YLifeOnlyOnce/dsh-dynamic-island`](https://github.com/YLifeOnlyOnce/dsh-dynamic-island) - an agent-state Dynamic Island concept.

DSH-OS26 must credit these as prior art where relevant. It must not claim to be
the first Liquid Glass plugin for DSH.

## Defensible differentiation

The product earns its own place only if the public release demonstrates all of
the following together:

- real DSH agent state drives the full material system;
- five coordinated functional surfaces, not one decorative widget;
- continuous state transitions with accessible text semantics;
- daily-use Eco/Balanced modes plus an optional Cinematic mode;
- measured contrast, performance and clean-uninstall behavior;
- no telemetry or credential access.

If the beta ships only wallpaper, blur and a floating capsule, it is too close
to existing work and should not be launched as a differentiated product.

## Reservation recommendation

Before publishing a public teaser:

1. Create the intended GitHub repository.
2. Confirm the npm publisher account and 2FA/provenance setup.
3. Publish only when a meaningful beta is ready; do not release an empty package
   solely to squat the name.
4. Use the scoped fallback if the unscoped package becomes unavailable.

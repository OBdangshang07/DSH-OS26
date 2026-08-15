# Release Gates

`0.1.0-beta.1` may be published only when every P0 item below passes. A failed
P0 gate cannot be waived for a launch date or a better-looking video.

## P0 product gates

- [x] A clean DSH Web profile installs the packed tarball with one command.
- [x] DSH starts without warnings attributable to DSH-OS26.
- [ ] A real agent turn completes through thinking, tool execution and result.
- [ ] Approval allow and deny both work through official DSH behavior.
- [x] Disable and uninstall restore the stock interface after restart.
- [x] No user data, prompt, credential or file path leaves the browser.
- [x] No launch feature exists only in a mock/demo build.

## Compatibility matrix

Test and record the exact versions in `docs/COMPATIBILITY.md`:

| Dimension | Required coverage |
| --- | --- |
| DSH | latest npm release plus one pinned mainline commit |
| Browser | latest stable Chrome and Edge |
| OS | Windows 11; one of macOS or Linux before stable `0.1.0` |
| Theme | light, dark and system |
| Width | 1280, 1440, 1920 and a 768 px narrow viewport |
| Scale | 100%, 125%, 150%, 200% browser zoom |
| Motion | normal and reduced |
| Transparency | normal and reduced/opaque |
| Sessions | fresh, restored, switched, parallel and disconnected |

Known full-shell themes must be tested as conflicts, not presented as supported
combinations. At minimum detect and warn about:

- `dsh-liquid-glass` variants;
- `dsh-theme-lab`;
- `dsh-skin-glass`;
- `silk-background`;
- other plugins that override the same official theme tokens.

## Automated tests

### Unit

- State reducer transition and precedence table.
- Duplicate, late and stale event handling.
- Material token generation.
- Contrast floor calculation.
- Settings validation and migrations.
- Capability detection and fallback selection.
- Lifecycle disposer idempotency.

### Integration

- DSH module-loader registration.
- Official client dependency injection.
- Session projection to semantic state fixtures.
- Refresh/reconnect state restoration.
- Theme switch without stale overrides.
- WebGL loss to Balanced fallback.

### End to end

- Install from packed tarball.
- Start Web profile and load the client module.
- Run a deterministic demonstration task.
- Exercise allow, deny, tool failure and blocked flows.
- Restart, upgrade, disable and uninstall.
- Confirm no residual DOM, storage migration crash or patch row remains.

### Visual regression

- Baselines for every state, theme, quality tier and required viewport.
- Focus indicators, long model names, long tool names and Chinese/English copy.
- No clipped approval controls or unreadable code blocks.
- A small pixel tolerance for GPU effects; semantic layout regions must remain
  stable.

## Performance budgets

Measure on a documented reference machine with browser DevTools traces.

- Idle Eco mode: no continuous animation loop.
- Hidden tab: no active render loop.
- Balanced transitions: no plugin-caused long task over 50 ms.
- Balanced interaction: target 60 fps; P95 plugin frame work below 4 ms.
- Cinematic mode: P95 plugin frame work below 8 ms on the reference GPU.
- Client JavaScript: target below 150 KB gzip for beta.
- Added steady-state heap: target below 20 MB in Balanced mode.
- Custom wallpaper storage is bounded and fails with a useful message.

If Cinematic misses its budget, ship it as experimental or remove it from the
beta. Never slow down the default mode to preserve a video effect.

## Accessibility gates

- [ ] Normal text contrast is at least 4.5:1.
- [ ] Large text and meaningful boundaries are at least 3:1.
- [ ] State has text/icon semantics in addition to color and motion.
- [ ] Focus is visible through every surface.
- [ ] Approval focus returns to a predictable target.
- [ ] Screen-reader announcements are useful and rate-limited.
- [ ] Reduced motion removes non-essential movement.
- [ ] Reduced transparency produces an opaque, readable interface.
- [ ] 200% zoom does not hide critical actions.

## Security and privacy gates

- No `eval`, dynamic remote code, analytics, telemetry or third-party fonts.
- No network permission is needed for built-in assets.
- Wallpaper URLs, if supported later, are opt-in and documented; local upload is
  the default.
- No credential service, environment variable, shell, filesystem or session
  content access beyond the minimum official UI projections.
- Diagnostics contain only plugin/DSH/browser versions and feature flags.
- Generated bundle and npm tarball are inspected for unexpected dependencies.

## Packaging gates

- [x] `npm run quality` passes from the current initialized worktree.
- [x] `npm pack --dry-run --json` contains only intended files.
- [x] The packed tarball installs successfully in a clean profile.
- [ ] Version, changelog and Git tag agree.
- [ ] README install and remove commands are copy-paste tested.
- [ ] License and third-party notices cover every asset and dependency.
- [ ] npm package and GitHub release point to the same commit.

## Claim discipline

Allowed:

- "Agent-reactive Liquid Glass shell for DeepSeek Harness."
- "State is driven by real DSH projections/events" when the evidence exists.
- Measured performance numbers with machine, browser and test method attached.

Not allowed:

- "The first DSH Liquid Glass plugin."
- "Pixel-perfect iOS 26."
- "Zero performance impact."
- "Works with every plugin."
- "Official DSH/iOS integration."
- Any comparison captured with competitors misconfigured or outdated.

## Human release review

Before publishing, one person other than the primary implementer should:

1. Install from the packed artifact.
2. Complete the demo task without developer instructions.
3. Use keyboard-only navigation for approval.
4. Switch to reduced motion/transparency.
5. Uninstall and confirm the stock UI returns.
6. Compare the README and launch video against the actual package.

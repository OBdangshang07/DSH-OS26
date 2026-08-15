# DSH-OS26 Implementation Plan

> Visual quality note: the `0.1.0-beta.1` implementation passed its technical
> gates but did not meet the launch visual bar. The component-level V2 redesign,
> compatibility tiers and new visual release gates are defined in
> [`VISUAL_REDESIGN_PLAN_V2.zh-CN.md`](./VISUAL_REDESIGN_PLAN_V2.zh-CN.md).

## Release target

The first public release is `0.1.0-beta.1`. It must be a useful daily-driver
plugin, not a video-only mockup. The launch promise is:

> DSH-OS26 turns real DeepSeek Harness agent state into a readable Liquid Glass
> material language, while remaining reversible, accessible and performant.

The beta is ready only when a clean DSH Web profile can install it with one
command, complete a real agent turn, survive a restart, and return to the stock
UI after uninstalling it.

## Current beta implementation map

| Area | Implemented in the package | Release evidence / remaining gate |
| --- | --- | --- |
| Official integration | Theme token override, official slots and current-session projection only | Pinned DSH `0.1.0-rc.6`; no private DOM selector or source patch |
| State | Seven semantic states with safety-first precedence and bounded completion receipt | Fixture/unit coverage passes; credentialed real-turn and approval branches still need recording |
| Surfaces | Status capsule, composer dock, tool activity, approval/blocked attention and completion receipt | All seven render branches covered; native approval controls remain authoritative |
| Material | Eco, Balanced and deterministic SVG Cinematic; light/dark/system; preset/local wallpaper | WCAG floor tests, reduced-transparency fallback and browser acceptance pass |
| Settings | 14 native controls, bounded 2 MB local import, reset, conflict warning and privacy-safe diagnostics | Keyboard order, explicit focus rings and residue-free enable/disable pass in Chrome and Edge |
| Operations | Pack/install, restart, legacy-config upgrade, disable, uninstall and stock recovery | Repeated against the real tarball in an isolated DSH/browser profile |
| Performance | Zero runtime dependency, no external resource, no idle render loop in Eco | 39,341-byte client; about 1.20 MB conservative heap delta; no idle long task observed |
| Publication | README, changelog, compatibility, claim rules, prior-art credit, safe demo fixture, CI and gated publishing runbook | Name currently clear; publication, second-person review and final real-flow video remain external gates |

## Scope

### Must ship in `0.1.0-beta.1`

1. **Material engine**
   - Light, dark and system color schemes.
   - Independent fill opacity, blur, saturation and highlight controls.
   - `Eco`, `Balanced` and `Cinematic` quality tiers.
   - A static fallback when `backdrop-filter`, SVG filters or WebGL are absent.
   - Wallpaper presets plus a bounded local custom-wallpaper import.
   - Contrast compensation driven by wallpaper luminance.

2. **Signal engine**
   - A small semantic state machine: `idle`, `thinking`, `tool-running`,
     `approval`, `success`, `error` and `blocked`.
   - State derived from official DSH projections/events, never from timers that
     pretend the agent is working.
   - Correct restoration after refresh, reconnect and session switching.
   - Parallel sessions do not leak state into each other.

3. **Five release surfaces**
   - Agent status capsule.
   - Composer material treatment.
   - Tool-running activity surface.
   - Approval attention sheet or official-slot companion.
   - Completion receipt.

4. **Settings and control**
   - Master enable switch.
   - Quality tier, transparency, blur, motion and wallpaper controls.
   - Reset to defaults.
   - Visible compatibility warning when another full-shell theme is active.
   - Settings remain local to the browser and never contain credentials.

5. **Accessibility and safety**
   - `prefers-reduced-motion` and a manual motion override.
   - `prefers-reduced-transparency` and a manual opaque mode.
   - Keyboard operation and meaningful focus order.
   - Status text and ARIA live updates; state never relies on color alone.
   - WCAG AA contrast for normal text in every shipped preset.

6. **Operational quality**
   - Clean install, upgrade, disable and uninstall.
   - No network requests, telemetry, credential reads or shell execution.
   - No changes to DSH source files or generated Web assets.
   - A documented compatibility window and pinned test baseline.

### Explicitly deferred

- Pixel-perfect copies of Apple screens, icons or proprietary assets.
- A fake Control Center, Dock or lock screen that does not control real DSH
  capabilities.
- Replacement of every DSH component in the first release.
- Mobile-native applications.
- Audio feedback, cloud theme sync or analytics.
- Mandatory WebGL. Cinematic optics must always be optional.

## Architecture

### Target source layout

```text
src/client/
  index.js                 plugin lifecycle
  app-controller.js        composition root
  state/
    reducer.js             semantic state machine
    dsh-adapter.js         official DSH projection/event adapter
    session-store.js       per-session state and reconnect recovery
  material/
    tokens.js              semantic material tokens
    controller.js          state -> material parameters
    contrast.js            wallpaper luminance and readable fill floor
    capabilities.js        browser feature and quality-tier detection
    optics-css.js          Eco/Balanced renderer
    optics-cinematic.js    optional SVG/WebGL renderer
  surfaces/
    status-capsule.js
    composer.js
    tool-activity.js
    approval.js
    completion-receipt.js
  settings/
    schema.js
    storage.js
    panel.js
  styles/
    base.js
    motion.js
    surfaces.js
  compatibility/
    dsh-version.js
    theme-conflicts.js
    diagnostics.js
```

### Rules

- Raw DSH events terminate at `dsh-adapter.js`; visual code consumes only the
  semantic state model.
- The plugin must prefer official theme tokens, projections, remote methods and
  UI slots. DOM selectors against hashed or private class names are release
  blockers.
- A MutationObserver may be used only for a documented compatibility fallback,
  must be bounded to a stable root, and must not poll the full document.
- Every controller returns a disposer. HMR, disable and uninstall must remove
  DOM nodes, subscriptions, filters, canvases, listeners and style attributes.
- Cinematic rendering is isolated behind the same material interface as CSS so
  it can fail closed to Balanced mode.

## Implementation phases

### Phase 0 - Bootstrap (complete)

Delivered:

- DSH bundle and Web client faces.
- Module-loader build.
- Lifecycle-safe glass capsule.
- Contract tests and npm package dry run.

Exit evidence: `npm run quality` passes and the generated package contains only
the declared six runtime files.

### Phase 1 - Official integration spike

Tasks:

- Pin the exact DSH release and source commit used for development.
- Inventory the official theme service, settings slot, shell overlay slot,
  session projection and approval interaction APIs.
- Build a small signal probe that logs normalized state in development mode.
- Verify refresh, session switch, reconnect, parallel session and HMR behavior.
- Record every imported client package under `dsh.client.inject`.

Exit criteria:

- No private DOM class is required for the status capsule or signal engine.
- A real turn produces the expected state sequence with fixture evidence.
- API assumptions are recorded in `docs/COMPATIBILITY.md`.

### Phase 2 - State engine

Tasks:

- Implement a pure reducer and per-session store.
- Add stale-event and duplicate-event protection.
- Resolve precedence, for example approval over tool-running and blocked over
  idle.
- Add replay fixtures for success, tool failure, approval and interrupted turns.
- Expose a development-only diagnostics panel showing the source event behind
  the current semantic state.

Exit criteria:

- Reducer branch coverage is 100%.
- Refreshing during every state restores the same visible state.
- No animation continues after the active session changes.

### Phase 3 - Material engine

Tasks:

- Define semantic material tokens rather than component-specific magic values.
- Implement Eco and Balanced renderers first.
- Add wallpaper luminance sampling and contrast floors.
- Add a Cinematic optics experiment with a strict timeout and fallback.
- Pause continuous rendering when the document is hidden.
- Recover gracefully from WebGL context loss.

Exit criteria:

- All presets pass contrast checks.
- Unsupported browsers remain readable.
- Turning the plugin off restores official theme tokens byte-for-byte.
- Cinematic failure falls back without reloading the page.

### Phase 4 - Fluid shell surfaces

Tasks:

- Ship the five release surfaces in order: capsule, composer, tool activity,
  approval, completion receipt.
- Use a shared spring/motion vocabulary.
- Keep shape transitions continuous where the official slot model permits it.
- Make approval actions mirror official state rather than introduce a second
  independent approval state machine.
- Ensure labels remain visible when animation or transparency is disabled.

Exit criteria:

- The real demo path `idle -> thinking -> tool-running -> approval -> success`
  is understandable with sound off.
- Keyboard-only users can approve, deny and return focus correctly.
- No surface obscures native stop, permission or error controls.

### Phase 5 - Settings and compatibility

Tasks:

- Register a native settings section.
- Add quality and accessibility controls with safe defaults.
- Detect known full-shell glass/theme plugins and show a non-blocking warning.
- Add a one-click diagnostic export containing versions and feature flags but
  no prompts, session content, file paths or credentials.
- Document tested coexistence with common sidebar and UI plugins.

Exit criteria:

- Bad or old settings migrate or reset without breaking startup.
- Two full-shell themes cannot silently stack into unreadable UI.
- Diagnostic output is privacy-reviewed and deterministic.

### Phase 6 - Hardening and release candidate

Tasks:

- Run the complete test matrix in `RELEASE_GATES.md`.
- Capture verified screenshots and performance traces.
- Test installation from the exact npm tarball, not the source directory.
- Test upgrade from the previous beta and clean uninstall.
- Freeze feature work; fix only release blockers.

Exit criteria:

- Every P0 gate passes.
- No known data-loss, approval, credential, accessibility or startup defect.
- README claims link to reproducible evidence.

### Phase 7 - Launch

Tasks:

- Re-run the name and prior-art audit within 24 hours of publication.
- Publish the npm beta with provenance where available.
- Create a GitHub release with checksums, compatibility and known limitations.
- Record the video from the published tarball on a clean profile.
- Publish the video only after another person can follow the install command.

## Definition of done

The plugin is not release-ready merely because it looks good. It is done when:

- the launch footage shows real behavior from the published package;
- every visual state has a functional and accessible meaning;
- daily use works in Balanced mode without measurable annoyance;
- Eco mode remains useful on weaker hardware;
- uninstall restores stock DSH without manual repair;
- prior work is credited and no "first Liquid Glass plugin" claim is made;
- limitations are written before users discover them.

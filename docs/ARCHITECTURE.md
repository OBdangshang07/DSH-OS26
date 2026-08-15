# Architecture and Milestones

## Package shape

```text
package.json
  dsh.bundle.patch -> cordis.patch.yml
  dsh.client.web   -> exports["./client"]

src/index.js              host face; no host capabilities requested
src/client/index.js       official services/slots and lifecycle composition
src/client/components.js  React surfaces and native settings page
src/client/config.js      validated browser-local settings
src/client/state.js       official projection -> semantic state adapter
src/client/material.js    token pairs, wallpapers and luminance compensation
src/client/store.js       useSyncExternalStore-compatible primitive
src/client/styles.js      scoped material/surface primitives
scripts/build-client.mjs  DSH module-loader bundle generator
lib/client.js             generated browser artifact
```

No DSH source file is patched. Removing the plugin must remove its DOM, event
listeners, style element and root data attributes.

## Planned client modules

```text
DSH signals
  -> SignalController
  -> MaterialState
  -> MaterialController
  -> shell surfaces

Pointer / wallpaper / theme
  -> OpticsController
  -> CSS variables or WebGL uniforms
```

### SignalController

Maps DSH projections and live events into a small stable state machine:

```text
idle | thinking | tool-running | approval | success | error | blocked
```

Raw Harness events should not leak into visual components.

### MaterialController

Converts semantic state into material properties:

- fill opacity;
- blur and saturation;
- refraction strength;
- highlight velocity;
- edge color;
- spring stiffness and damping.

### Optics tiers

- Eco: opaque/translucent CSS with no continuous animation.
- Balanced: `backdrop-filter` plus bounded CSS highlights.
- Cinematic: SVG/WebGL refraction with a strict frame-time budget.

## Milestones

### M0 — Bootstrap

- Package and Cordis bundle contract.
- Client module build.
- Lifecycle-safe status capsule.
- Build and contract tests.

### M1 — Material engine (implemented)

- Theme-token integration.
- Light/dark/system support.
- Wallpaper and contrast analysis.
- Eco/Balanced/Cinematic quality tiers.

### M2 — Signal engine (implemented; manual real-flow verification pending)

- Real DSH state projections.
- Replay-safe state restoration.
- Approval and blocked attention semantics.

### M3 — Fluid shell (implemented)

- Composer, tool cards, approval sheet and completion receipt.
- Shared spring choreography and continuous shape transitions.

### M4 — Release hardening (in progress)

- Third-party UI-slot compatibility.
- WCAG contrast checks.
- Reduced-motion/transparency testing.
- GPU/frame-time benchmarks and recovery from WebGL context loss.
- Install, upgrade and uninstall smoke tests.

# DSH-OS26 Product Direction

## Product statement

DSH-OS26 is an agent-reactive Liquid Glass shell for DeepSeek Harness. The
material is functional: it communicates what the agent is doing and when human
attention is required.

## Differentiation

Existing glass themes mainly provide wallpaper, transparency, blur, or a single
floating island. DSH-OS26 combines three systems:

1. **Material engine** — blur, refraction, specular light, contrast and fallback.
2. **Signal engine** — idle, thinking, tool, approval, success, error and blocked.
3. **Fluid shell** — sidebar, composer, tool cards, sheets and live activities
   share one motion and material language.

## Product principles

- State before decoration: every animation must communicate agent state.
- Optical depth, not blur-only glass.
- Official plugin seams over DOM-class patching.
- Readability always wins over transparency.
- Motion and transparency can be reduced independently.
- The Cinematic mode may be dramatic; the default mode must remain practical.

## Milestone surfaces

The first public demo should cover exactly five surfaces:

1. Agent status capsule.
2. Composer.
3. Tool execution card.
4. Approval sheet.
5. Completion receipt.

## Demo promise

The launch video should be able to show a continuous state arc:

```text
idle -> thinking -> tool-running -> approval -> success
```

The audience should understand each state with the labels muted. If the visual
language cannot do that, the material system is not finished.

## Brand

- Display name: `DSH-OS26`
- Package name: `dsh-os26`
- Tagline: `The agent-reactive Liquid Glass shell for DeepSeek Harness.`
- Avoid Apple logos, proprietary assets, copied system icons or claims of
  official iOS compatibility.


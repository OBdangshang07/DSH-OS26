# DSH-OS26

Agent-reactive Liquid Glass shell for the DeepSeek Harness Web UI.

DSH-OS26 is not intended to be a static transparency theme. Its product goal is
to turn agent state into a material language: thinking flows, tools pulse,
approvals condense, failures disturb the surface, and completed work settles.

> Inspired by modern liquid-glass operating-system interfaces. This independent
> project is not affiliated with or endorsed by Apple or DeepSeek.

## Beta status

`0.1.0-beta.1` now includes:

- state derived from official DSH session projections: idle, thinking, tool,
  approval, blocked, success and error;
- five coordinated surfaces: capsule, composer dock, tool activity, approval
  attention and completion receipt;
- native settings with Eco, Balanced and Cinematic modes, light/dark/system
  floating surfaces, local wallpapers and bounded custom imports;
- reversible official theme-token overrides, wallpaper contrast compensation,
  reduced-motion/transparency fallbacks and privacy-safe diagnostics;
- no network calls, telemetry, credential access, shell execution or DSH source
  patching.

The public beta has **not been published yet**. Real-turn/approval recording,
cross-browser visual review and an independent human install review remain
release gates; see [acceptance evidence](docs/ACCEPTANCE_EVIDENCE.md).

## Development

```sh
npm install
npm run build
npm test
npm run quality
```

## Install in DeepSeek Harness

Build the exact artifact, then install it into the DSH profile (installing it
in an unrelated npm project is not enough):

```sh
npm pack
dsh plugin --profile web add "D:/AI_project/DSH_OS26/dsh-os26-0.1.0-beta.1.tgz"
```

After npm publication, the equivalent command will be:

```sh
dsh plugin --profile web add dsh-os26@beta
```

Restart `dsh web` after adding, upgrading or removing the bundle.

To remove it:

```sh
dsh plugin --profile web remove dsh-os26
```

## Prior art and positioning

Liquid Glass in DSH already has strong prior art, including
[`dsh-liquid-glass`](https://github.com/xingyingyuzhui/dsh-liquid-glass),
[`dsh-theme-lab`](https://github.com/Ultronen/dsh-theme-lab),
[`dsh-skin-glass`](https://github.com/noexcs/dsh-skin-glass),
[`silk-background`](https://github.com/z21for99/silk-background) and
[`dsh-dynamic-island`](https://github.com/YLifeOnlyOnce/dsh-dynamic-island).
DSH-OS26 does not claim to be the first or a pixel-perfect iOS copy. Its
differentiator is coordinated material feedback driven by real DSH Agent state.

## Project documents

- [Product direction](docs/PRODUCT.md)
- [Architecture and milestones](docs/ARCHITECTURE.md)
- [Complete implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Release gates](docs/RELEASE_GATES.md)
- [Compatibility record](docs/COMPATIBILITY.md)
- [Video launch plan (Chinese)](docs/VIDEO_LAUNCH_PLAN.zh-CN.md)
- [Name and prior-art audit](docs/NAME_AND_PRIOR_ART_AUDIT.md)
- [Acceptance evidence](docs/ACCEPTANCE_EVIDENCE.md)
- [Third-party notices](docs/THIRD_PARTY_NOTICES.md)
- [Changelog](CHANGELOG.md)

## License

MIT

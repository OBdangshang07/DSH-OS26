# Acceptance Evidence — 0.1.0-beta.1

Recorded 2026-08-16 in an isolated Windows 11 DSH home. No normal user profile
was modified and DSH telemetry was explicitly disabled for the run.

## Artifact

- Built with Node `22.19.0` and npm `10.9.3`.
- `npm run quality`: 33/33 automated tests pass.
- `npm audit`: 0 vulnerabilities in the plugin development tree.
- Packed artifact: 17 declared files, about 34 kB packed / 92 kB unpacked.
- Client bundle: 39,341 bytes / 12,087 bytes gzip, SHA-256
  `82f3eb1e59efbd53fb3aa60a59401ebc1083ceeabf6ece010ca0925a72ffb16e`.
- No bundled dependency, remote asset, credential read, telemetry or shell face.

## Official-profile acceptance

Baseline: `@deepseek-ai/dsh@0.1.0-rc.6`, source commit
`47f943859bef60e4160492346772ded9b24f765a`.

1. Installed the exact `.tgz` using `dsh plugin --profile web add <tarball>`.
2. `dsh --profile web --dump-config` contained one `dsh-os26` row.
3. DSH Web booted on an OS-assigned localhost port.
4. The boot manifest served `dsh-os26/client.js` with the five declared official
   client dependencies.
5. Chrome loaded the client with `data-dsh-os26="on"`, exactly one scoped style
   and one status capsule.
6. Native Settings contained `DSH-OS26`; its page rendered 14 controls and the
   independence disclaimer.
7. Turning the master switch off produced `data-dsh-os26="off"`, removed the
   capsule and official token override; turning it on restored them.
8. `dsh plugin --profile web remove dsh-os26` removed the package and bundle.
9. The stock Web profile then booted and served HTTP 200 with no DSH-OS26 entry.
10. Chrome `151.0.7922.138` and Edge `151.0.4129.72` both loaded the exact
    rebuilt client whose SHA-256 matched the installed profile copy.
11. Both browsers passed light, dark and system palettes; Eco, Balanced and
    Cinematic tiers; 1920x1080, 1440x900, 1280x800 and 768x700 layouts; reduced
    motion/transparency; and zero page exceptions.
12. All 14 Settings controls traversed in sequential Tab order and exposed a
    2-3 px explicit focus ring. Both critical Settings actions stayed reachable
    in a 720x450 effective-200%-layout emulation.
13. The final Chrome idle window produced no long task; whole-page script time
    was 3.273 ms and whole-page task time was 25.321 ms. Edge measured 0.025 ms
    and 11.499 ms respectively in the same 2.5-second method.
14. After forced garbage collection, the plugin/settings page used about
    1.20 MB more JS heap than a fresh stock page (a conservative upper bound,
    because the stock measurement did not mount Settings).

## Upgrade and rollback proof

The upgrade test used the same isolated DSH profile and the same persisted
Chrome user-data directory across both package versions:

1. `0.0.1` stored a version-0 fixture with `opacity: 20`, `blur: 999` and
   `quality: balanced`; the legacy page rendered 20% opacity.
2. The profile was upgraded in place with the current `0.1.0-beta.1` tarball.
3. The new page still read the untouched version-0 fixture, proving this was
   not a fresh-profile substitute.
4. Runtime normalization rendered opacity `0.65` and blur `48`, preserved the
   valid quality choice, and mounted exactly one style and one capsule.
5. Removal deleted the package declaration and installed package. A stock boot
   using the same browser profile had no OS26 root state, style, capsule or
   theme-token residue.

## Still required before publication

- Credentialed real turn covering thinking → tool → result.
- Real approval allow and deny, blocked question and tool-error paths.
- Manual approval focus-return, screen-reader review and actual browser-zoom
  checks around native approval controls (plugin-owned controls and effective
  200% layout already pass automation).
- macOS or Linux coverage before stable `0.1.0` (Windows is the beta baseline).
- A second person's tarball install/uninstall review.
- Name/prior-art audit repeated within 24 hours of publication.
- Video recorded from the finally published tarball.

These pending items are deliberately visible. Passing package boot does not
justify claiming that every runtime behavior is verified.

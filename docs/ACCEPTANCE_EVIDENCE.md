# Acceptance Evidence — 0.1.0-beta.1

Recorded 2026-08-16 in an isolated Windows 11 DSH home. No normal user profile
was modified and DSH telemetry was explicitly disabled for the run.

## Artifact

- Built with Node `22.19.0` and npm `10.9.3`.
- `npm run quality`: automated suite passes.
- `npm audit`: 0 vulnerabilities in the plugin development tree.
- Packed artifact: 15 declared files, about 29.1 kB packed / 79.2 kB unpacked.
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
10. Edge `151.0.4129.72` loaded the final artifact; Cinematic mounted its SVG
    displacement filter and a 768×700 viewport at 2× device scale kept the
    entire overlay inside the viewport.

## Still required before publication

- Credentialed real turn covering thinking → tool → result.
- Real approval allow and deny, blocked question and tool-error paths.
- Remaining viewport/zoom/accessibility matrix beyond the verified Edge case.
- Performance trace and contrast measurement, not visual estimation.
- A second person's tarball install/uninstall review.
- Name/prior-art audit repeated within 24 hours of publication.
- Video recorded from the finally published tarball.

These pending items are deliberately visible. Passing package boot does not
justify claiming that every runtime behavior is verified.

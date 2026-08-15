# Acceptance Evidence — 0.1.0-beta.1

Recorded 2026-08-16 in an isolated Windows 11 DSH home. No normal user profile
was modified and DSH telemetry was explicitly disabled for the run.

## Artifact

- Built with Node `22.19.0` and npm `10.9.3`.
- `npm run quality`: 48/48 automated tests pass.
- `npm audit`: 0 vulnerabilities in the plugin development tree.
- Packed artifact: 18 declared files, about 54.4 kB packed / 173.2 kB unpacked.
- Client bundle: 95,860 bytes / 21,356 bytes gzip, SHA-256
  `042b6ef3be150530ea235642b76743f01285a674bff53f0a80e77d27b4e75c13`.
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

## V2 real-runtime acceptance

The rebuilt tarball was completely removed and re-added to the real `web`
profile before these checks. Edge `151.0.4129.72` loaded the installed bundle;
its SHA-256 matched the worktree bundle above.

1. A real Read Only agent turn produced native thinking, denied Pwsh and
   escalation-tool rows, then settled from real DSH session projections.
2. The side-effect-free expression `[System.IO.Path]::GetTempPath()` was first
   denied by Windows Read Only ConstrainedLanguage, then retried through the
   official approval service. Separate sessions exercised real `拒绝` and
   `允许一次` decisions.
3. Both approval cards stayed inside a 1440x900 viewport with zero page
   overflow, a 20 px radius, a 1 px edge and
   `blur(19.68px) saturate(1.5) contrast(1.04)`.
4. No plugin status or attention overlay competed with the native decision
   card (`competingOverlays: 0`), so both approval actions remained visible.
5. After both deny and allow, focus returned to the enabled native composer
   `TEXTAREA` and remained there when the turn settled.
6. Real historical sessions exposed settled and failed tool rows plus a goal
   bar. Expanded tool glass used a 14 px radius and 1 px edge without wrapping
   the native code/diff reading surface; the goal glass used a 16 px radius.
7. Automatic full-text titles were added only to genuinely clipped,
   ellipsized/clamped text; current real sessions produced 8 such affordances.
8. Light, dark and system; Eco, Balanced and Cinematic; 1920, 1440, 1280 and
   768 layouts; reduced motion/transparency; keyboard traversal; compact
   multi-preset menu; and effective-200%-layout automation all passed with no
   page exception or horizontal overflow.
9. A real `ask_user_question` turn rendered one single-select question. The
   card stayed inside 1440x900 with a 20 px radius, zero page overflow and no
   competing plugin overlay; `Balanced Glass` was selected and submitted
   through the native radio and submit controls.
10. A real `/plan` turn called `exit_plan_mode` and rendered the specialized
    plan-review card. Its 542 px overflowing plan body scrolled independently
    while `去聊天里说`, `拒绝` and `确认执行` remained visible. Confirmation
    completed a zero-side-effect conversational plan.
11. Both question and plan review returned focus to the native composer
    `TEXTAREA`. Their full browser accessibility trees exposed the expected
    heading, radio and button roles/names; disabled and checked state were
    present where applicable.
12. A long real conversation was scrolled to its top. The composer seat stayed
    visible with computed `position: sticky` and `bottom: 0`; its bottom edge
    exactly matched the message scroller bottom edge at 900 px. The same
    composer remained the post-decision focus target in the approval, question
    and plan-review flows above.
13. Native Settings used a 28 px modal surface over a dimmed, blurred scrim.
    The opaque-readable base now lives on the dialog itself instead of only a
    negative-z-index optical layer. While Settings was open, the underlying
    composer and agent-status overlay both had zero opacity and hidden
    visibility, so no input field or conversation text leaked through.
14. Sidebar session rows used a 15 px radius, workspace/group rows used 10 px,
    and the selected session used a neutral glass highlight with a narrow focus
    marker. Long Chinese, English and path labels produced zero row or tree
    overflow.
15. A supplemental Edge run used real browser keyboard accelerators: `Ctrl+0`
    followed by five `Ctrl++` presses changed `devicePixelRatio` from 1 to 2
    and the CSS viewport from 1440x900 to 720x450. The composer remained inside
    the viewport with zero horizontal overflow. After scrolling the real
    Settings container from 0 to 844 px, both critical actions were visible
    and usable. This catches browser-zoom compositing defects, but it does not
    replace the required human screenshot containing browser chrome or the
    screen-reader/keyboard sign-off.

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

- Manual screen-reader review and actual browser Ctrl+ zoom checks around
  native decision controls (browser AX-tree semantics, focus return and
  effective-200%-layout automation already pass).
- macOS or Linux coverage before stable `0.1.0` (Windows is the beta baseline).
- A second person's tarball install/uninstall review.
- Repeat the name/prior-art audit again if publication occurs after
  2026-08-17 06:44 CST (UTC+8).
- Video recorded from the finally published tarball.

These pending items are deliberately visible. Passing package boot does not
justify claiming that every runtime behavior is verified.

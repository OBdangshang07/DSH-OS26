# Safe Video Fixture

This fixture creates a repeatable real DSH flow without touching a user project,
network service or credential.

## Local preflight

```sh
node verify.mjs
```

Expected final line content includes `DSH_OS26_DEMO: 12/12 PASS`. The verifier
only reads `input.json` and waits 900 ms so the tool-running state is visible.

For the approval scene, follow [PROMPT.zh-CN.md](PROMPT.zh-CN.md). The only
allowed write target is ignored `work/result.json`. Delete that file between
the allow and deny recordings. Never point this fixture at a real repository.

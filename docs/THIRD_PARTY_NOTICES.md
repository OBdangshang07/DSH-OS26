# Third-Party Notices

DSH-OS26 source code is released under the MIT License in the repository root.

The distributed npm tarball contains no copied third-party wallpaper, icon,
font, sound, screenshot, shader, JavaScript library or other visual asset.
Built-in wallpapers and optics are original CSS/SVG definitions in this
project.

React is declared as an optional peer because the DeepSeek Harness Web runtime
provides it. React is not bundled in `lib/client.js`; React is available under
the MIT License: <https://github.com/facebook/react/blob/main/LICENSE>.

React DOM and Vite are development/test dependencies only and are not bundled
or installed as runtime dependencies of DSH-OS26.

DeepSeek Harness is a host compatibility target, not redistributed by this
package. Its repository and license are available at
<https://github.com/deepseek-ai/deepseek-harness>.

Projects listed in [Name and Prior-Art Audit](NAME_AND_PRIOR_ART_AUDIT.md) are
credited as ecosystem prior art. No source code or assets from those projects
are copied into DSH-OS26.

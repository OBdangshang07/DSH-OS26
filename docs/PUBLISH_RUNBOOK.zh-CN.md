# DSH-OS26 发布操作手册

本手册只描述授权后的外部操作。推送源码、创建仓库、发布 npm 和创建 Release
都会改变外部状态，执行前必须由仓库所有者明确确认。

## 当前本地发布身份

- 包名：`dsh-os26`
- 版本：`0.1.0-beta.1`
- 标签：`v0.1.0-beta.1`
- DSH 基线：`@deepseek-ai/dsh@0.1.0-rc.6`
- 建议仓库：`OBdangshang07/DSH-OS26`

## 1. 发布前 24 小时复查名字

```sh
gh search repos "DSH-OS26 in:name"
gh search repos "dsh os26 in:name"
npm view dsh-os26 name version
```

预期 GitHub 没有同名仓库，npm 返回 E404。查询结果不构成商标意见，也不会保留
名称；若 npm 名称被占用，改用 `@OBdangshang07/dsh-os26`，不要抢发空包。

## 2. 创建并推送 GitHub 仓库

仅在明确授权后执行：

```sh
gh repo create OBdangshang07/DSH-OS26 --public --source . --remote origin
git push -u origin main
git push origin v0.1.0-beta.1
```

推送不会自动发布 npm。CI 会在 Windows 和 Linux 上执行质量、包内容与安全审计。

## 3. 配置首次 npm 发布

1. 在 npm 创建或确认发布者账户，开启双因素认证。
2. 在 GitHub 仓库创建受保护 Environment：`npm-release`，配置人工审批。
3. 因为包名尚未首次发布，先创建短期 npm granular access token，作为该
   Environment 的 `NPM_TOKEN` Secret；不要写入仓库或视频。
4. 先运行 `Build release candidate`，下载 tarball 和 `SHA256SUMS.txt`。
5. 让第二位测试者从该 tarball 完成安装、真实任务、键盘审批和卸载。
6. 首次发布成功后，在 npm 包设置中绑定 Trusted Publisher：GitHub 仓库和
   `.github/workflows/publish-npm.yml`，随后删除 `NPM_TOKEN` Secret 并撤销短期
   token。后续版本仅使用 OIDC Trusted Publisher。

## 4. 真实状态验收

使用隔离 DSH Profile 和测试凭据，按
[`demo/fixture/PROMPT.zh-CN.md`](../demo/fixture/PROMPT.zh-CN.md)分别录制：

- 允许写入：必须出现 idle → thinking → tool-running → approval → success；
- 拒绝写入：必须出现 approval，拒绝后确认未生成 `work/result.json`；
- 工具失败：临时传入不存在的 fixture 文件，确认进入 error，随后恢复；
- blocked：让 Agent 在缺少一个无敏感信息的参数时提问，回答后继续。

不得用开发者工具改状态、不得访问真实仓库、不得在一个镜头中假装完成两条分支。

## 5. 人工可访问性与第二人复核

下列检查必须由真人在准备发布的同一 tarball 上完成。CDP、缩小视口、
`deviceScaleFactor` 和浏览器 AX Tree 可以作为补充证据，但不能代替本节签字。

### 实际浏览器 Ctrl+ 200%

1. 在 Chrome 或 Edge 中按 `Ctrl+0` 回到 100%，再用 `Ctrl++` 将浏览器菜单显示的
   缩放值调到 200%；不要只改 Windows 显示缩放或 DevTools 设备比例。
2. 分别检查空 Composer、多行输入、长模型/权限名、多插件模式菜单、设置页底部操作、
   审批、用户问题和计划审阅。
3. 用键盘完成一次审批和一次问题提交；确认关键按钮始终可见、页面无横向滚动，
   决策面消失后焦点回到 Composer。
4. 截图必须同时包含浏览器 200% 缩放提示和被测控件；任何裁切、竖排按钮、文字遮挡
   或需要把缩放降回去才能操作都判为失败。

### 真实屏幕阅读器

1. Windows beta 至少使用 Narrator 或 NVDA；记录产品名和版本。Narrator 可用
   `Win+Ctrl+Enter` 启停。
2. 不看鼠标，仅用 `Tab`、`Shift+Tab`、方向键、`Space` 和 `Enter` 走完 Composer、
   模式菜单、设置、审批、用户问题与计划审阅。
3. 核对名称、角色、选中/禁用状态和问题标题会被播报；玻璃装饰层不得形成重复焦点，
   审批/问题/计划结束后不得把阅读顺序留在已消失的控件上。
4. 记录实际播报问题。AX Tree 自动检查通过不等于本项通过。

### 第二位使用者独立复核

第二位测试者只能拿到 README、tarball 和期望 SHA-256，不能接受实现者口头提示。
测试者需要独立完成：校验哈希、安装、重启 DSH Web、完成真实任务、键盘审批、切换
reduced-motion/transparency、禁用、卸载、重启并确认原 UI 恢复。若需要实现者介入才完成，
本门禁失败并应修正文档或产品。

发布签字记录：

```text
Artifact: dsh-os26-0.1.0-beta.1.tgz
Expected SHA-256: <copy from the candidate's external SHA256SUMS.txt>
Reviewer alias:
Review date/time/timezone:
OS and version:
DSH version:
Browser and version:
Screen reader and version:
Actual Ctrl+ 200%: PASS / FAIL
Screen-reader decision flows: PASS / FAIL
Independent install/task/uninstall: PASS / FAIL
Stock UI restored after restart: PASS / FAIL
Evidence links or filenames:
Notes:
Reviewer sign-off:
```

## 6. 发布 npm beta

在 GitHub Actions 手动运行 `Publish npm beta`，输入完整确认字符串：

```text
PUBLISH dsh-os26@0.1.0-beta.1
```

工作流固定检出版本标签，重新执行所有检查，并通过 OIDC provenance 发布。发布后：

```sh
npm view dsh-os26@0.1.0-beta.1 dist.integrity dist.tarball
dsh plugin --profile web add dsh-os26@beta
```

必须从 npm 重新安装并重复 smoke test；本地 tarball 通过不能替代 registry 验证。

## 7. GitHub Release 与视频

GitHub Release 应包含版本、DSH/浏览器兼容范围、已知限制、tarball SHA-256、安装和
卸载命令。正式视频只能录制 npm 已发布包；如画面使用 fixture 或设计预览，必须明确
标注。视频上线后的置顶评论应包含兼容版本、非官方声明、安装/卸载命令和已知冲突。

## 回滚边界

npm 版本不可覆盖或重发。发现 P0 问题时先把 beta dist-tag 移回上一安全版本或弃用
问题版本，再发布递增的新 beta；不要删除 Git 历史或伪造同版本修复包。

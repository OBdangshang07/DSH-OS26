window.__ModuleLoader__.load({
  id: 'dsh-os26',
  factory: function (require) {
    'use strict';
    var module = { exports: {} };
    var exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let react = require("react");
react = __toESM(react, 1);
//#region src/client/store.js
function createStore(initialValue) {
	let value = initialValue;
	const listeners = /* @__PURE__ */ new Set();
	return {
		getSnapshot: () => value,
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		set(next) {
			if (Object.is(value, next)) return;
			value = next;
			for (const listener of [...listeners]) listener();
		}
	};
}
//#endregion
//#region src/client/config.js
var STORAGE_KEY = "dsh-os26.config.v1";
var DEFAULT_CONFIG = Object.freeze({
	version: 1,
	enabled: true,
	scheme: "system",
	quality: "balanced",
	opacity: 58,
	blur: 24,
	saturation: 150,
	highlight: 64,
	motion: "system",
	opaque: false,
	wallpaper: "aurora",
	customWallpaper: "",
	diagnostics: false
});
var ENUMS = {
	scheme: [
		"system",
		"light",
		"dark"
	],
	quality: [
		"eco",
		"balanced",
		"cinematic"
	],
	motion: [
		"system",
		"full",
		"reduced"
	],
	wallpaper: [
		"aurora",
		"ocean",
		"dusk",
		"none",
		"custom"
	]
};
function numberIn(value, fallback, min, max) {
	return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
}
function normalizeConfig(input) {
	const source = input && typeof input === "object" ? input : {};
	const next = { ...DEFAULT_CONFIG };
	next.enabled = typeof source.enabled === "boolean" ? source.enabled : next.enabled;
	next.opaque = typeof source.opaque === "boolean" ? source.opaque : next.opaque;
	next.diagnostics = typeof source.diagnostics === "boolean" ? source.diagnostics : next.diagnostics;
	for (const [key, values] of Object.entries(ENUMS)) if (values.includes(source[key])) next[key] = source[key];
	next.opacity = numberIn(source.opacity, next.opacity, 20, 96);
	next.blur = numberIn(source.blur, next.blur, 0, 48);
	next.saturation = numberIn(source.saturation, next.saturation, 80, 220);
	next.highlight = numberIn(source.highlight, next.highlight, 0, 100);
	if (typeof source.customWallpaper === "string" && source.customWallpaper.length <= 3040870.4 && /^data:image\/(?:png|jpeg|webp);base64,/.test(source.customWallpaper)) next.customWallpaper = source.customWallpaper;
	if (next.wallpaper === "custom" && !next.customWallpaper) next.wallpaper = "aurora";
	return next;
}
function createConfigStore(storage = globalThis.localStorage) {
	let initial = DEFAULT_CONFIG;
	try {
		initial = normalizeConfig(JSON.parse(storage?.getItem("dsh-os26.config.v1") ?? "null"));
	} catch {}
	const store = createStore(initial);
	return {
		...store,
		update(patch) {
			const next = normalizeConfig({
				...store.getSnapshot(),
				...patch
			});
			store.set(next);
			try {
				storage?.setItem(STORAGE_KEY, JSON.stringify(next));
			} catch {}
		},
		reset() {
			const next = { ...DEFAULT_CONFIG };
			store.set(next);
			try {
				storage?.setItem(STORAGE_KEY, JSON.stringify(next));
			} catch {}
		}
	};
}
//#endregion
//#region src/client/components.js
var h = react.createElement;
var STATE_COPY = {
	idle: ["待命", "准备接收下一条任务"],
	thinking: ["思考中", "Agent 正在组织下一步"],
	"tool-running": ["工具运行中", "真实工具调用正在执行"],
	approval: ["等待审批", "请在原生审批区确认操作"],
	success: ["已完成", "本轮任务已安全结束"],
	error: ["发生错误", "请查看会话中的错误详情"],
	blocked: ["需要你处理", "回答问题或审阅计划后继续"]
};
function useStore(store) {
	return react.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
function StateMark({ state }) {
	return h("span", {
		className: "os26-state-mark",
		"aria-hidden": "true"
	});
}
function StatusOverlay({ signalStore, configStore }) {
	const signal = useStore(signalStore);
	const config = useStore(configStore);
	if (!config.enabled) return null;
	const copy = STATE_COPY[signal.state] ?? STATE_COPY.idle;
	const expanded = [
		"tool-running",
		"approval",
		"blocked",
		"error"
	].includes(signal.state);
	return h("div", {
		className: "os26-overlay-stack",
		"data-state": signal.state
	}, config.quality === "cinematic" && h("svg", {
		className: "os26-filter-defs",
		"aria-hidden": "true"
	}, h("filter", {
		id: "os26-fluid-optic",
		x: "-30%",
		y: "-30%",
		width: "160%",
		height: "160%"
	}, h("feTurbulence", {
		type: "fractalNoise",
		baseFrequency: ".018 .032",
		numOctaves: "2",
		seed: "26",
		result: "noise"
	}), h("feDisplacementMap", {
		in: "SourceGraphic",
		in2: "noise",
		scale: "5",
		xChannelSelector: "R",
		yChannelSelector: "B"
	}))), h("section", {
		className: `os26-status-capsule${expanded ? " is-expanded" : ""}`,
		role: "status",
		"aria-live": "polite",
		"aria-atomic": "true",
		"aria-label": `DSH-OS26：${copy[0]}。${copy[1]}`
	}, h(StateMark, { state: signal.state }), h("span", { className: "os26-status-copy" }, h("strong", null, copy[0]), h("small", null, copy[1])), signal.state === "tool-running" && h("span", { className: "os26-tool-count" }, `${signal.toolCount} 个工具`)), signal.state === "tool-running" && h("section", {
		className: "os26-activity-surface",
		"aria-label": "工具活动"
	}, h("div", {
		className: "os26-activity-track",
		"aria-hidden": "true"
	}, h("i")), h("span", null, "Harness 正在执行真实调用")), (signal.state === "approval" || signal.state === "blocked") && h("aside", {
		className: "os26-attention-surface",
		role: "note"
	}, h("strong", null, signal.state === "approval" ? "操作权已交还给你" : "Agent 正在等你"), h("span", null, signal.state === "approval" ? "使用原生审批控件继续；本插件不会代替你的决定。" : "在原生输入区完成问题或计划审阅。")), signal.state === "success" && h("output", { className: "os26-receipt-surface" }, h("span", {
		className: "os26-check",
		"aria-hidden": "true"
	}, "✓"), h("span", null, h("strong", null, "完成回执"), h("small", null, "由真实运行结束事件触发"))));
}
function ComposerDock({ signalStore, configStore }) {
	const signal = useStore(signalStore);
	if (!useStore(configStore).enabled) return null;
	const copy = STATE_COPY[signal.state] ?? STATE_COPY.idle;
	return h("div", {
		className: "os26-composer-dock",
		"data-state": signal.state
	}, h(StateMark, { state: signal.state }), h("span", null, copy[0]), h("span", { className: "os26-composer-detail" }, signal.state === "idle" ? "Agent-reactive material" : copy[1]));
}
function Toggle({ checked, onChange, label, hint }) {
	return h("label", { className: "os26-setting-row" }, h("span", null, h("strong", null, label), hint && h("small", null, hint)), h("input", {
		type: "checkbox",
		checked,
		onChange: (e) => onChange(e.currentTarget.checked)
	}));
}
function Select({ value, onChange, label, children }) {
	return h("label", { className: "os26-setting-row" }, h("strong", null, label), h("select", {
		value,
		onChange: (e) => onChange(e.currentTarget.value)
	}, children));
}
function Range({ value, onChange, label, min, max, unit = "" }) {
	return h("label", { className: "os26-range-row" }, h("span", null, h("strong", null, label), h("output", null, `${value}${unit}`)), h("input", {
		type: "range",
		min,
		max,
		value,
		onChange: (e) => onChange(Number(e.currentTarget.value))
	}));
}
var option = (value, label) => h("option", {
	value,
	key: value
}, label);
function SettingsPanel({ configStore, diagnostics, compatibility }) {
	const config = useStore(configStore);
	const [notice, setNotice] = react.useState("");
	const patch = (key) => (value) => configStore.update({ [key]: value });
	const importWallpaper = (event) => {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = "";
		if (!file) return;
		if (![
			"image/png",
			"image/jpeg",
			"image/webp"
		].includes(file.type) || file.size > 2097152) {
			setNotice("仅支持不超过 2 MB 的 PNG、JPEG 或 WebP。");
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result !== "string") return;
			configStore.update({
				customWallpaper: reader.result,
				wallpaper: "custom"
			});
			setNotice("壁纸只保存在本浏览器。");
		};
		reader.onerror = () => setNotice("无法读取这张图片。");
		reader.readAsDataURL(file);
	};
	const exportDiagnostics = () => {
		const blob = new Blob([JSON.stringify(diagnostics(), null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = "dsh-os26-diagnostics.json";
		anchor.click();
		URL.revokeObjectURL(url);
		setNotice("诊断文件不含提示词、会话内容、路径或凭据。");
	};
	return h("section", {
		className: "os26-settings",
		"aria-labelledby": "os26-settings-title"
	}, h("header", { className: "os26-settings-hero" }, h("span", {
		className: "os26-settings-orb",
		"aria-hidden": "true"
	}), h("span", null, h("h2", { id: "os26-settings-title" }, "DSH-OS26"), h("p", null, "真实 Agent 状态驱动的 Liquid Glass 材质系统"))), compatibility && h("p", {
		className: "os26-warning",
		role: "status"
	}, compatibility), h("fieldset", null, h("legend", null, "启用与外观"), h(Toggle, {
		checked: config.enabled,
		onChange: patch("enabled"),
		label: "启用 DSH-OS26",
		hint: "关闭后立即撤销主题 Token 和全部界面"
	}), h(Select, {
		value: config.scheme,
		onChange: patch("scheme"),
		label: "浮层配色"
	}, option("system", "跟随系统"), option("light", "浅色"), option("dark", "深色")), h(Select, {
		value: config.quality,
		onChange: patch("quality"),
		label: "质量档位"
	}, option("eco", "Eco · 静态省电"), option("balanced", "Balanced · 推荐"), option("cinematic", "Cinematic · 增强高光")), h(Select, {
		value: config.wallpaper,
		onChange: patch("wallpaper"),
		label: "壁纸"
	}, option("aurora", "Aurora"), option("ocean", "Ocean"), option("dusk", "Dusk"), option("none", "无"), config.customWallpaper && option("custom", "本地自定义")), h("label", { className: "os26-file-button" }, "导入本地壁纸", h("input", {
		type: "file",
		accept: "image/png,image/jpeg,image/webp",
		onChange: importWallpaper
	}))), h("fieldset", null, h("legend", null, "材质参数"), h(Range, {
		value: config.opacity,
		onChange: patch("opacity"),
		label: "填充不透明度",
		min: 20,
		max: 96,
		unit: "%"
	}), h(Range, {
		value: config.blur,
		onChange: patch("blur"),
		label: "模糊",
		min: 0,
		max: 48,
		unit: "px"
	}), h(Range, {
		value: config.saturation,
		onChange: patch("saturation"),
		label: "饱和度",
		min: 80,
		max: 220,
		unit: "%"
	}), h(Range, {
		value: config.highlight,
		onChange: patch("highlight"),
		label: "高光",
		min: 0,
		max: 100,
		unit: "%"
	})), h("fieldset", null, h("legend", null, "辅助功能与隐私"), h(Select, {
		value: config.motion,
		onChange: patch("motion"),
		label: "动态效果"
	}, option("system", "跟随系统"), option("full", "完整"), option("reduced", "减少动态")), h(Toggle, {
		checked: config.opaque,
		onChange: patch("opaque"),
		label: "不透明模式",
		hint: "弱化透明与背景模糊，增强可读性"
	}), h(Toggle, {
		checked: config.diagnostics,
		onChange: patch("diagnostics"),
		label: "开发诊断",
		hint: "只显示状态来源，不记录会话内容"
	})), h("div", { className: "os26-settings-actions" }, h("button", {
		type: "button",
		onClick: exportDiagnostics
	}, "导出隐私安全诊断"), h("button", {
		type: "button",
		className: "secondary",
		onClick: () => {
			configStore.reset();
			setNotice("已恢复默认设置。");
		}
	}, "恢复默认")), notice && h("p", {
		className: "os26-notice",
		role: "status"
	}, notice), h("p", { className: "os26-disclaimer" }, "独立社区项目，与 DeepSeek 或 Apple 无隶属或背书关系。"));
}
function DiagnosticBadge({ signalStore, configStore }) {
	const signal = useStore(signalStore);
	const config = useStore(configStore);
	if (!config.enabled || !config.diagnostics) return null;
	return h("code", { className: "os26-diagnostics" }, `${signal.state} ← ${signal.source}`);
}
//#endregion
//#region src/client/material.js
var PRESET_LUMINANCE = {
	aurora: .22,
	ocean: .14,
	dusk: .11,
	none: .5,
	custom: .28
};
function materialTokens(config, luminance = PRESET_LUMINANCE[config.wallpaper] ?? .28) {
	const opaque = config.opaque || config.quality === "eco";
	const contrastFloor = luminance < .16 ? .68 : luminance < .3 ? .58 : .48;
	const alpha = opaque ? .94 : Math.max(config.opacity / 100, contrastFloor);
	return {
		"--dsw-alias-bg-base": {
			light: `rgba(238, 245, 255, ${Math.min(.97, alpha + .08)})`,
			dark: `rgba(8, 15, 31, ${Math.min(.97, alpha + .08)})`
		},
		"--dsw-alias-bg-layer-1": {
			light: `rgba(255, 255, 255, ${alpha})`,
			dark: `rgba(19, 28, 48, ${alpha})`
		},
		"--dsw-alias-bg-layer-2": {
			light: `rgba(248, 251, 255, ${Math.min(.98, alpha + .07)})`,
			dark: `rgba(27, 38, 61, ${Math.min(.98, alpha + .07)})`
		},
		"--dsw-alias-bg-overlay": {
			light: `rgba(255, 255, 255, ${Math.min(.98, alpha + .12)})`,
			dark: `rgba(12, 20, 38, ${Math.min(.98, alpha + .12)})`
		},
		"--dsw-alias-border-l1": {
			light: "rgba(255,255,255,.76)",
			dark: "rgba(255,255,255,.20)"
		},
		"--dsw-alias-border-l2": {
			light: "rgba(62,78,112,.20)",
			dark: "rgba(214,230,255,.28)"
		},
		"--dsw-alias-label-primary": {
			light: "#17213a",
			dark: "#f5f8ff"
		},
		"--dsw-alias-label-secondary": {
			light: "#485573",
			dark: "#b9c4db"
		},
		"--dsw-specific-sidebar-fill": {
			light: `rgba(231, 240, 255, ${Math.min(.96, alpha + .03)})`,
			dark: `rgba(9, 18, 37, ${Math.min(.96, alpha + .03)})`
		}
	};
}
function sampleWallpaperLuminance(dataUrl, environment = globalThis) {
	return new Promise((resolve) => {
		if (!dataUrl || typeof environment.Image !== "function" || !environment.document) {
			resolve(PRESET_LUMINANCE.custom);
			return;
		}
		const image = new environment.Image();
		image.onload = () => {
			try {
				const canvas = environment.document.createElement("canvas");
				canvas.width = 32;
				canvas.height = 32;
				const context = canvas.getContext("2d", { willReadFrequently: true });
				if (!context) throw new Error("canvas unavailable");
				context.drawImage(image, 0, 0, 32, 32);
				const pixels = context.getImageData(0, 0, 32, 32).data;
				let total = 0;
				for (let index = 0; index < pixels.length; index += 4) {
					const channel = (value) => {
						const normalized = value / 255;
						return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
					};
					total += channel(pixels[index]) * .2126 + channel(pixels[index + 1]) * .7152 + channel(pixels[index + 2]) * .0722;
				}
				resolve(Math.min(1, Math.max(0, total / (pixels.length / 4))));
			} catch {
				resolve(PRESET_LUMINANCE.custom);
			}
		};
		image.onerror = () => resolve(PRESET_LUMINANCE.custom);
		image.src = dataUrl;
	});
}
function wallpaperValue(config) {
	if (config.wallpaper === "none") return "none";
	if (config.wallpaper === "custom" && config.customWallpaper) return `url("${config.customWallpaper}")`;
	if (config.wallpaper === "ocean") return "radial-gradient(circle at 12% 16%, #31c6d8 0, transparent 38%), radial-gradient(circle at 84% 76%, #3856c8 0, transparent 42%), #07152b";
	if (config.wallpaper === "dusk") return "radial-gradient(circle at 22% 18%, #ff9b85 0, transparent 34%), radial-gradient(circle at 76% 80%, #7567e8 0, transparent 44%), #1b1731";
	return "radial-gradient(circle at 18% 12%, #6ee7f2 0, transparent 34%), radial-gradient(circle at 82% 22%, #9d80ff 0, transparent 38%), radial-gradient(circle at 62% 86%, #4b7cff 0, transparent 42%), #111d3c";
}
function applyMaterialRoot(root, config, capabilities = {}) {
	root.dataset.dshOs26 = config.enabled ? "on" : "off";
	root.dataset.os26Quality = config.quality;
	root.dataset.os26Scheme = config.scheme;
	root.dataset.os26Motion = config.motion;
	root.dataset.os26Opaque = config.opaque ? "true" : "false";
	root.dataset.os26Backdrop = capabilities.backdrop === false ? "fallback" : "supported";
	root.style.setProperty("--os26-opacity", String(config.opacity / 100));
	root.style.setProperty("--os26-blur", `${config.blur}px`);
	root.style.setProperty("--os26-saturation", `${config.saturation}%`);
	root.style.setProperty("--os26-highlight", String(config.highlight / 100));
	root.style.setProperty("--os26-luminance", String(PRESET_LUMINANCE[config.wallpaper] ?? .28));
	root.style.setProperty("--os26-wallpaper", wallpaperValue(config));
}
function clearMaterialRoot(root) {
	for (const key of [
		"dshOs26",
		"os26Quality",
		"os26Scheme",
		"os26Motion",
		"os26Opaque",
		"os26Backdrop"
	]) delete root.dataset[key];
	for (const name of [
		"--os26-opacity",
		"--os26-blur",
		"--os26-saturation",
		"--os26-highlight",
		"--os26-luminance",
		"--os26-wallpaper",
		"--os26-pointer-x",
		"--os26-pointer-y"
	]) root.style.removeProperty(name);
}
//#endregion
//#region src/client/state.js
var INITIAL_SIGNAL = Object.freeze({
	state: "idle",
	source: "no-session",
	sessionId: void 0,
	toolCount: 0,
	revision: 0
});
function pendingKinds(snapshot) {
	const pending = snapshot?.pending;
	if (!Array.isArray(pending)) return [];
	return pending.map((item) => item?.kind ?? item?.type).filter(Boolean);
}
function deriveSemanticState(snapshot) {
	if (!snapshot) return {
		state: "idle",
		source: "no-session",
		toolCount: 0
	};
	const kinds = pendingKinds(snapshot);
	const summaryKind = snapshot.pendingInteraction;
	if (summaryKind === "approval" || kinds.includes("approval")) return {
		state: "approval",
		source: "pending-approval",
		toolCount: snapshot.runningCalls?.length ?? 0
	};
	if (summaryKind === "question" || summaryKind === "plan-review" || kinds.includes("question") || kinds.includes("plan-review")) return {
		state: "blocked",
		source: `pending-${summaryKind ?? kinds[0]}`,
		toolCount: snapshot.runningCalls?.length ?? 0
	};
	if ((snapshot.runningCalls?.length ?? 0) > 0) return {
		state: "tool-running",
		source: "running-calls",
		toolCount: snapshot.runningCalls.length
	};
	if (snapshot.running === true) return {
		state: "thinking",
		source: "session-running",
		toolCount: 0
	};
	if (snapshot.lastAgentError || snapshot.promptError) return {
		state: "error",
		source: "session-error",
		toolCount: 0
	};
	return {
		state: "idle",
		source: "session-idle",
		toolCount: 0
	};
}
function createSignalStore(currentProvideInfo, timers = globalThis) {
	const store = createStore(INITIAL_SIGNAL);
	let sessionOff;
	let successTimer;
	let lastWasActive = false;
	let revision = 0;
	const clearSuccess = () => {
		if (successTimer !== void 0) timers.clearTimeout(successTimer);
		successTimer = void 0;
	};
	const publish = (sessionId, snapshot) => {
		const next = deriveSemanticState(snapshot);
		const active = [
			"thinking",
			"tool-running",
			"approval",
			"blocked"
		].includes(next.state);
		const completed = !active && lastWasActive && next.state === "idle";
		lastWasActive = active;
		clearSuccess();
		const signal = {
			...next,
			sessionId,
			revision: ++revision
		};
		if (completed) {
			store.set({
				...signal,
				state: "success",
				source: "run-settled"
			});
			successTimer = timers.setTimeout(() => store.set({
				...signal,
				state: "idle",
				source: "success-expired",
				revision: ++revision
			}), 4200);
		} else store.set(signal);
	};
	const bindCurrent = () => {
		sessionOff?.();
		sessionOff = void 0;
		clearSuccess();
		lastWasActive = false;
		const info = currentProvideInfo?.getSnapshot?.();
		const source = info?.hooks?.session;
		if (!source?.getSnapshot) {
			publish(void 0, void 0);
			return;
		}
		const sync = () => publish(info.sessionId, source.getSnapshot());
		sessionOff = source.subscribe?.(sync);
		sync();
	};
	const currentOff = currentProvideInfo?.subscribe?.(bindCurrent);
	bindCurrent();
	return {
		...store,
		dispose() {
			currentOff?.();
			sessionOff?.();
			clearSuccess();
		}
	};
}
//#endregion
//#region src/client/styles.js
var OS26_STYLES = String.raw`
:root[data-dsh-os26='on'] {
  --os26-surface: rgba(16, 27, 50, var(--os26-opacity, .58));
  --os26-surface-solid: #15213a;
  --os26-edge: rgba(255, 255, 255, .34);
  --os26-text: #f7f9ff;
  --os26-muted: #bdc8dc;
  --os26-accent: 99, 220, 255;
  --os26-state: 99, 220, 255;
  --os26-pointer-x: 70vw;
  --os26-pointer-y: 20vh;
}

:root[data-dsh-os26='on'][data-os26-scheme='light'] {
  --os26-surface: rgba(245, 249, 255, var(--os26-opacity, .58));
  --os26-surface-solid: #eef4ff;
  --os26-edge: rgba(255, 255, 255, .9);
  --os26-text: #17213a;
  --os26-muted: #53617c;
}

@media (prefers-color-scheme: light) {
  :root[data-dsh-os26='on'][data-os26-scheme='system'] {
    --os26-surface: rgba(245, 249, 255, var(--os26-opacity, .58));
    --os26-surface-solid: #eef4ff;
    --os26-edge: rgba(255, 255, 255, .9);
    --os26-text: #17213a;
    --os26-muted: #53617c;
  }
}

:root[data-dsh-os26='on'] body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: var(--os26-wallpaper);
  background-position: center;
  background-size: cover;
}

.os26-overlay-stack {
  position: fixed;
  right: max(20px, env(safe-area-inset-right));
  bottom: max(20px, env(safe-area-inset-bottom));
  z-index: 80;
  display: flex;
  width: min(360px, calc(100vw - 32px));
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  color: var(--os26-text);
  pointer-events: none;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.os26-filter-defs { position: absolute; width: 0; height: 0; overflow: hidden; }

.os26-status-capsule,
.os26-activity-surface,
.os26-attention-surface,
.os26-receipt-surface,
.os26-settings-hero {
  border: 1px solid var(--os26-edge);
  background:
    radial-gradient(circle at var(--os26-pointer-x) var(--os26-pointer-y), rgba(255,255,255,calc(var(--os26-highlight) * .38)), transparent 30%),
    linear-gradient(145deg, rgba(255,255,255,.17), transparent 46%),
    var(--os26-surface);
  box-shadow: inset 0 1px rgba(255,255,255,.45), 0 16px 48px rgba(3,8,20,.25);
  -webkit-backdrop-filter: blur(var(--os26-blur)) saturate(var(--os26-saturation));
  backdrop-filter: blur(var(--os26-blur)) saturate(var(--os26-saturation));
}

.os26-status-capsule {
  position: relative;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-width: 208px;
  max-width: 100%;
  padding: 9px 13px 9px 9px;
  overflow: hidden;
  border-radius: 999px;
  transition: width .38s cubic-bezier(.22,.82,.2,1), border-radius .38s cubic-bezier(.22,.82,.2,1);
}

.os26-status-capsule.is-expanded { width: 298px; border-radius: 24px; }
.os26-status-copy { min-width: 0; }
.os26-status-copy strong, .os26-status-copy small { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.os26-status-copy strong { font-size: 12px; line-height: 1.25; }
.os26-status-copy small { margin-top: 2px; color: var(--os26-muted); font-size: 10px; line-height: 1.3; }
.os26-tool-count { color: var(--os26-muted); font-size: 10px; white-space: nowrap; }

.os26-state-mark {
  display: inline-block;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 26%, #fff 0 8%, transparent 10%), radial-gradient(circle at 62% 67%, rgb(var(--os26-state)), rgba(var(--os26-state),.22) 65%, transparent 68%);
  box-shadow: inset 0 0 9px rgba(255,255,255,.5), 0 0 20px rgba(var(--os26-state),.35);
  animation: os26-breathe 2.8s ease-in-out infinite;
}

[data-state='idle'] { --os26-state: 99, 220, 255; }
[data-state='thinking'] { --os26-state: 147, 122, 255; }
[data-state='tool-running'] { --os26-state: 53, 211, 170; }
[data-state='approval'], [data-state='blocked'] { --os26-state: 255, 184, 76; }
[data-state='success'] { --os26-state: 58, 207, 120; }
[data-state='error'] { --os26-state: 255, 99, 115; }

.os26-activity-surface, .os26-attention-surface, .os26-receipt-surface {
  width: 298px;
  box-sizing: border-box;
  border-radius: 18px;
  padding: 11px 14px;
  animation: os26-rise .32s cubic-bezier(.22,.82,.2,1) both;
}
.os26-activity-surface { display: grid; gap: 7px; color: var(--os26-muted); font-size: 11px; }
.os26-activity-track { height: 3px; overflow: hidden; border-radius: 99px; background: rgba(255,255,255,.13); }
.os26-activity-track i { display: block; width: 42%; height: 100%; border-radius: inherit; background: rgb(var(--os26-state)); animation: os26-scan 1.25s ease-in-out infinite alternate; }
.os26-attention-surface { display: grid; gap: 3px; border-color: rgba(var(--os26-state),.65); }
.os26-attention-surface strong { font-size: 12px; }
.os26-attention-surface span { color: var(--os26-muted); font-size: 10px; line-height: 1.45; }
.os26-receipt-surface { display: flex; align-items: center; gap: 10px; }
.os26-receipt-surface strong, .os26-receipt-surface small { display: block; }
.os26-receipt-surface strong { font-size: 12px; }
.os26-receipt-surface small { margin-top: 2px; color: var(--os26-muted); font-size: 10px; }
.os26-check { display: grid; width: 28px; height: 28px; place-items: center; border-radius: 50%; color: #071d12; background: rgb(var(--os26-state)); font-weight: 900; }

.os26-composer-dock {
  display: flex;
  min-height: 24px;
  align-items: center;
  gap: 7px;
  padding: 3px 8px;
  color: var(--dsw-alias-label-secondary, #6b7280);
  font: 500 10px/1.3 ui-sans-serif, system-ui, sans-serif;
}
.os26-composer-dock .os26-state-mark { width: 8px; height: 8px; animation-duration: 2.4s; }
.os26-composer-detail { margin-left: auto; opacity: .75; }

.os26-diagnostics {
  position: fixed;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  padding: 5px 9px;
  border: 1px solid var(--os26-edge);
  border-radius: 99px;
  color: var(--os26-text);
  background: var(--os26-surface-solid);
  font-size: 10px;
  pointer-events: none;
}

.os26-settings { display: grid; gap: 18px; max-width: 760px; padding: 8px 4px 32px; color: var(--dsw-alias-label-primary, #17213a); font-family: ui-sans-serif, system-ui, sans-serif; }
.os26-settings-hero { display: flex; align-items: center; gap: 14px; padding: 18px; border-radius: 24px; color: var(--os26-text); }
.os26-settings-hero h2 { margin: 0; font-size: 20px; }
.os26-settings-hero p { margin: 4px 0 0; color: var(--os26-muted); font-size: 12px; }
.os26-settings-orb { width: 44px; height: 44px; border-radius: 50%; background: radial-gradient(circle at 34% 28%, #fff 0 8%, transparent 10%), linear-gradient(145deg,#79f4ff,#806dff); box-shadow: inset 0 0 12px rgba(255,255,255,.65), 0 8px 24px rgba(86,113,255,.35); }
.os26-settings fieldset { display: grid; gap: 2px; margin: 0; padding: 10px 14px 14px; border: 1px solid var(--dsw-alias-border-l1, #dbe2ee); border-radius: 18px; background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,.65)); }
.os26-settings legend { padding: 0 6px; color: var(--dsw-alias-label-secondary, #59657a); font-size: 11px; font-weight: 700; }
.os26-setting-row, .os26-range-row { display: flex; min-height: 44px; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(120,130,150,.16)); font-size: 12px; }
.os26-setting-row:last-child, .os26-range-row:last-child { border-bottom: 0; }
.os26-setting-row span strong, .os26-setting-row span small { display: block; }
.os26-setting-row small { margin-top: 3px; color: var(--dsw-alias-label-secondary, #667085); font-weight: 400; }
.os26-setting-row select { min-width: 156px; padding: 7px 28px 7px 9px; border: 1px solid var(--dsw-alias-border-l2, #ccd5e3); border-radius: 10px; color: inherit; background: var(--dsw-alias-bg-layer-2, #fff); }
.os26-setting-row input[type='checkbox'] { width: 38px; height: 22px; accent-color: #526dff; }
.os26-range-row { display: grid; padding: 7px 0; }
.os26-range-row span { display: flex; justify-content: space-between; }
.os26-range-row output { color: var(--dsw-alias-label-secondary, #667085); font-variant-numeric: tabular-nums; }
.os26-range-row input { width: 100%; accent-color: #526dff; }
.os26-file-button { justify-self: start; margin-top: 9px; padding: 8px 11px; border: 1px solid var(--dsw-alias-border-l2, #ccd5e3); border-radius: 10px; font-size: 11px; cursor: pointer; }
.os26-file-button input { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
.os26-file-button:focus-within { outline: 2px solid #526dff; outline-offset: 2px; }
.os26-settings-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.os26-settings-actions button { padding: 9px 12px; border: 1px solid transparent; border-radius: 11px; color: #fff; background: #526dff; font-weight: 700; cursor: pointer; }
.os26-settings-actions button.secondary { color: var(--dsw-alias-label-primary, #17213a); border-color: var(--dsw-alias-border-l2, #ccd5e3); background: var(--dsw-alias-bg-layer-2, #fff); }
.os26-warning, .os26-notice { margin: 0; padding: 10px 12px; border-radius: 12px; font-size: 11px; line-height: 1.5; }
.os26-warning { color: #6d4000; border: 1px solid rgba(221,148,30,.36); background: rgba(255,190,72,.15); }
.os26-notice { color: var(--dsw-alias-label-secondary, #59657a); background: var(--dsw-alias-bg-layer-1, #f4f6fa); }
.os26-disclaimer { margin: 0; color: var(--dsw-alias-label-secondary, #667085); font-size: 10px; line-height: 1.5; }

:root[data-os26-quality='eco'] .os26-status-capsule,
:root[data-os26-quality='eco'] .os26-activity-surface,
:root[data-os26-quality='eco'] .os26-attention-surface,
:root[data-os26-quality='eco'] .os26-receipt-surface,
:root[data-os26-opaque='true'] .os26-status-capsule,
:root[data-os26-opaque='true'] .os26-activity-surface,
:root[data-os26-opaque='true'] .os26-attention-surface,
:root[data-os26-opaque='true'] .os26-receipt-surface,
:root[data-os26-backdrop='fallback'] .os26-status-capsule {
  background: var(--os26-surface-solid);
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}
:root[data-os26-quality='eco'] .os26-state-mark,
:root[data-os26-quality='eco'] .os26-activity-track i { animation: none; }
:root[data-os26-quality='cinematic'] .os26-status-capsule { box-shadow: inset 0 1px rgba(255,255,255,.58), inset 12px -10px 30px rgba(125,105,255,.12), 0 20px 58px rgba(3,8,20,.32); }
:root[data-os26-quality='cinematic'] .os26-status-capsule > .os26-state-mark { filter: url('#os26-fluid-optic') saturate(1.2); }

@keyframes os26-breathe { 0%,100% { transform: scale(.94); } 50% { transform: scale(1.05); } }
@keyframes os26-rise { from { opacity: 0; transform: translateY(8px) scale(.98); } }
@keyframes os26-scan { from { transform: translateX(-8%); } to { transform: translateX(148%); } }

:root[data-os26-motion='reduced'] .os26-state-mark,
:root[data-os26-motion='reduced'] .os26-activity-track i,
:root[data-os26-motion='reduced'] .os26-activity-surface,
:root[data-os26-motion='reduced'] .os26-attention-surface,
:root[data-os26-motion='reduced'] .os26-receipt-surface { animation: none; transition: none; }

@media (prefers-reduced-motion: reduce) {
  :root[data-dsh-os26='on'] .os26-state-mark,
  :root[data-dsh-os26='on'] .os26-activity-track i,
  :root[data-dsh-os26='on'] .os26-activity-surface,
  :root[data-dsh-os26='on'] .os26-attention-surface,
  :root[data-dsh-os26='on'] .os26-receipt-surface { animation: none; transition: none; }
}

@media (prefers-reduced-transparency: reduce) {
  :root[data-dsh-os26='on'] { --os26-surface: var(--os26-surface-solid); }
  :root[data-dsh-os26='on'] .os26-status-capsule,
  :root[data-dsh-os26='on'] .os26-activity-surface,
  :root[data-dsh-os26='on'] .os26-attention-surface,
  :root[data-dsh-os26='on'] .os26-receipt-surface { -webkit-backdrop-filter: none; backdrop-filter: none; }
}

@media (max-width: 640px) {
  .os26-overlay-stack { right: 12px; bottom: 12px; }
  .os26-status-capsule.is-expanded, .os26-activity-surface, .os26-attention-surface, .os26-receipt-surface { width: min(298px, calc(100vw - 24px)); }
  .os26-composer-detail { display: none; }
}
`;
//#endregion
//#region src/client/index.js
var name = "dsh-os26";
var inject = [
	"slots",
	"theme",
	"sessions"
];
function capabilities() {
	const css = globalThis.CSS;
	return {
		backdrop: Boolean(css?.supports?.("backdrop-filter", "blur(1px)") || css?.supports?.("-webkit-backdrop-filter", "blur(1px)")),
		reducedMotion: globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
		reducedTransparency: globalThis.matchMedia?.("(prefers-reduced-transparency: reduce)").matches ?? false
	};
}
function apply(ctx) {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	const configStore = createConfigStore();
	const signalStore = createSignalStore(ctx.sessions?.currentProvideInfo);
	const caps = capabilities();
	const style = document.createElement("style");
	style.dataset.dshOs26 = "styles";
	style.textContent = OS26_STYLES;
	ctx.effect(() => {
		document.head.append(style);
		return () => style.remove();
	}, "dsh-os26: scoped styles");
	ctx.effect(() => {
		let tokenOff;
		let generation = 0;
		const sync = () => {
			const currentGeneration = ++generation;
			const config = configStore.getSnapshot();
			tokenOff?.();
			tokenOff = void 0;
			applyMaterialRoot(root, config, caps);
			if (config.enabled) tokenOff = ctx.theme.overrideTokens(name, materialTokens(config));
			if (config.enabled && config.wallpaper === "custom" && config.customWallpaper) sampleWallpaperLuminance(config.customWallpaper).then((luminance) => {
				if (currentGeneration !== generation) return;
				root.style.setProperty("--os26-luminance", String(luminance));
				tokenOff?.();
				tokenOff = ctx.theme.overrideTokens(name, materialTokens(config, luminance));
			});
		};
		sync();
		const off = configStore.subscribe(sync);
		return () => {
			off();
			tokenOff?.();
			clearMaterialRoot(root);
		};
	}, "dsh-os26: material controller");
	ctx.effect(() => {
		let frame;
		const onMove = (event) => {
			if (frame || configStore.getSnapshot().quality === "eco") return;
			frame = requestAnimationFrame(() => {
				frame = void 0;
				root.style.setProperty("--os26-pointer-x", `${event.clientX}px`);
				root.style.setProperty("--os26-pointer-y", `${event.clientY}px`);
			});
		};
		window.addEventListener("pointermove", onMove, { passive: true });
		return () => {
			window.removeEventListener("pointermove", onMove);
			if (frame) cancelAnimationFrame(frame);
		};
	}, "dsh-os26: bounded pointer optics");
	ctx.effect(() => () => signalStore.dispose(), "dsh-os26: signal store");
	const diagnostics = () => ({
		plugin: name,
		version: "0.1.0-beta.1",
		testedDsh: "@deepseek-ai/dsh@0.1.0-rc.6",
		state: signalStore.getSnapshot().state,
		source: signalStore.getSnapshot().source,
		quality: configStore.getSnapshot().quality,
		capabilities: caps
	});
	const theme = ctx.theme.getTheme?.();
	const compatibility = theme && !["light", "dark"].includes(theme.active?.id) ? `检测到另一套完整主题“${theme.active.id}”。建议只保留一套主题 Token，避免透明度叠加。` : "";
	ctx.slots.inject("shell.overlay", () => [ctx.slots.register({
		name: "shell.overlay",
		id: "dsh-os26-status",
		order: 2600,
		inject: () => ({
			signalStore,
			configStore
		})
	}, StatusOverlay), ctx.slots.register({
		name: "shell.overlay",
		id: "dsh-os26-diagnostics",
		order: 2601,
		inject: () => ({
			signalStore,
			configStore
		})
	}, DiagnosticBadge)]);
	ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
		name: "conversation.composer.dock",
		id: "dsh-os26-composer",
		order: 2600,
		inject: () => ({
			signalStore,
			configStore
		})
	}, ComposerDock));
	ctx.slots.inject("settings.section", () => ctx.slots.register({
		name: "settings.section",
		id: "dsh-os26",
		order: 260,
		label: "DSH-OS26",
		inject: () => ({
			configStore,
			diagnostics,
			compatibility
		})
	}, SettingsPanel));
}
//#endregion
exports.apply = apply;
exports.inject = inject;
exports.name = name;

    return module.exports;
  }
});

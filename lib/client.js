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
	opacity: 68,
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
	next.opacity = numberIn(source.opacity, next.opacity, 65, 96);
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
	const nativeDecision = signal.state === "approval" || signal.state === "blocked";
	const expanded = ["tool-running", "error"].includes(signal.state);
	return h("div", {
		className: "os26-overlay-stack",
		"data-state": signal.state
	}, h("svg", {
		className: "os26-filter-defs",
		"aria-hidden": "true"
	}, h("filter", {
		id: "os26-composer-refraction",
		x: "-8%",
		y: "-16%",
		width: "116%",
		height: "132%",
		colorInterpolationFilters: "sRGB"
	}, h("feTurbulence", {
		type: "fractalNoise",
		baseFrequency: ".006 .018",
		numOctaves: "1",
		seed: "26",
		result: "lensNoise"
	}), h("feGaussianBlur", {
		in: "lensNoise",
		stdDeviation: "1.15",
		result: "softLensNoise"
	}), h("feDisplacementMap", {
		in: "SourceGraphic",
		in2: "softLensNoise",
		scale: "9",
		xChannelSelector: "R",
		yChannelSelector: "B"
	})), config.quality === "cinematic" && h("filter", {
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
	}))), nativeDecision && h("section", {
		className: "os26-native-decision-announcer",
		role: "status",
		"aria-live": "polite",
		"aria-atomic": "true"
	}, `${copy[0]}。${copy[1]}。本插件不会代替你的决定。`), !nativeDecision && h("section", {
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
	}, h("i")), h("span", null, "Harness 正在执行真实调用")), signal.state === "success" && h("output", { className: "os26-receipt-surface" }, h("span", {
		className: "os26-check",
		"aria-hidden": "true"
	}, "✓"), h("span", null, h("strong", null, "完成回执"), h("small", null, "由真实运行结束事件触发"))));
}
function ComposerDock({ signalStore, configStore }) {
	const signal = useStore(signalStore);
	const config = useStore(configStore);
	const dockRef = react.useRef(null);
	react.useEffect(() => {
		if (!config.enabled) return void 0;
		const seat = dockRef.current?.closest("[data-composer-seat]");
		const card = seat?.querySelectorAll("[data-composer-card]")?.[0];
		if (!seat || !card) return void 0;
		const syncPrimary = () => {
			for (const button of card.querySelectorAll("[data-os26-primary]")) button.removeAttribute("data-os26-primary");
			const buttons = card.querySelectorAll("button");
			buttons.item(buttons.length - 1)?.setAttribute("data-os26-primary", "");
		};
		syncPrimary();
		const observer = typeof MutationObserver === "function" ? new MutationObserver(syncPrimary) : null;
		observer?.observe(card, {
			childList: true,
			subtree: true
		});
		return () => {
			observer?.disconnect();
			for (const button of card.querySelectorAll("[data-os26-primary]")) button.removeAttribute("data-os26-primary");
		};
	}, [config.enabled]);
	if (!config.enabled) return null;
	const copy = STATE_COPY[signal.state] ?? STATE_COPY.idle;
	return h("div", {
		ref: dockRef,
		className: "os26-composer-dock",
		"data-state": signal.state
	}, h(StateMark, { state: signal.state }), h("span", null, copy[0]), h("span", { className: "os26-composer-detail" }, signal.state === "idle" ? "Agent-reactive material" : copy[1]));
}
function Toggle({ checked, onChange, label, hint }) {
	return h("label", { className: "os26-setting-row" }, h("span", { className: "os26-setting-copy" }, h("strong", null, label), hint && h("small", null, hint)), h("span", { className: "os26-toggle" }, h("input", {
		type: "checkbox",
		checked,
		onChange: (e) => onChange(e.currentTarget.checked)
	}), h("i", { "aria-hidden": "true" })));
}
function Select({ value, onChange, label, children }) {
	return h("label", { className: "os26-setting-row" }, h("strong", { className: "os26-setting-label" }, label), h("span", { className: "os26-select-shell" }, h("select", {
		value,
		onChange: (e) => onChange(e.currentTarget.value)
	}, children), h("i", { "aria-hidden": "true" })));
}
function Range({ value, onChange, label, min, max, unit = "" }) {
	const progress = (value - min) / (max - min) * 100;
	return h("label", { className: "os26-range-row" }, h("span", { className: "os26-range-heading" }, h("strong", null, label), h("output", null, `${value}${unit}`)), h("input", {
		type: "range",
		min,
		max,
		value,
		style: { "--os26-range-progress": `${progress}%` },
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
		min: 65,
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
//#region src/client/contrast.js
function linearChannel(value) {
	const channel = Math.min(255, Math.max(0, value)) / 255;
	return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
}
function relativeLuminance([red, green, blue]) {
	return linearChannel(red) * .2126 + linearChannel(green) * .7152 + linearChannel(blue) * .0722;
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
function effectiveOpacity(config, luminance = PRESET_LUMINANCE[config.wallpaper] ?? .28) {
	if (config.opaque || config.quality === "eco") return .94;
	const contrastFloor = luminance < .12 || luminance > .82 ? .72 : .65;
	return Math.max(config.opacity / 100, contrastFloor);
}
function materialTokens(config, luminance = PRESET_LUMINANCE[config.wallpaper] ?? .28) {
	const alpha = effectiveOpacity(config, luminance);
	const themed = (light, dark) => {
		if (config.scheme === "light") return {
			light,
			dark: light
		};
		if (config.scheme === "dark") return {
			light: dark,
			dark
		};
		return {
			light,
			dark
		};
	};
	return {
		"--dsw-alias-bg-base": themed(`rgba(242, 244, 248, ${Math.min(.98, alpha + .16)})`, `rgba(11, 13, 18, ${Math.min(.98, alpha + .16)})`),
		"--dsw-alias-bg-layer-1": themed(`rgba(255, 255, 255, ${alpha})`, `rgba(24, 26, 32, ${alpha})`),
		"--dsw-alias-bg-layer-2": themed(`rgba(250, 251, 253, ${Math.min(.98, alpha + .07)})`, `rgba(34, 36, 43, ${Math.min(.98, alpha + .07)})`),
		"--dsw-alias-bg-overlay": themed(`rgba(248, 249, 252, ${Math.min(.98, alpha + .12)})`, `rgba(17, 19, 24, ${Math.min(.98, alpha + .12)})`),
		"--dsw-alias-border-l1": themed("rgba(255,255,255,.82)", "rgba(255,255,255,.16)"),
		"--dsw-alias-border-l2": themed("rgba(53,57,68,.22)", "rgba(229,232,241,.24)"),
		"--dsw-alias-label-primary": themed("#181a20", "#f4f5f8"),
		"--dsw-alias-label-secondary": themed("#5e626d", "#b8bbc5"),
		"--dsw-specific-sidebar-fill": themed(`rgba(236, 239, 244, ${Math.min(.96, alpha + .03)})`, `rgba(16, 18, 23, ${Math.min(.96, alpha + .03)})`)
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
				for (let index = 0; index < pixels.length; index += 4) total += relativeLuminance([
					pixels[index],
					pixels[index + 1],
					pixels[index + 2]
				]);
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
	root.dataset.os26Wallpaper = config.wallpaper;
	root.dataset.os26Backdrop = capabilities.backdrop === false ? "fallback" : "supported";
	root.style.setProperty("--os26-opacity", String(effectiveOpacity(config)));
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
		"os26Wallpaper",
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
	let bindingRevision = 0;
	let disposed = false;
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
		const current = store.getSnapshot();
		if (current.state === "success" && next.state === "idle" && current.sessionId === sessionId) return;
		clearSuccess();
		const unchanged = current.state === next.state && current.source === next.source && current.sessionId === sessionId && current.toolCount === next.toolCount;
		if (!completed && unchanged) return;
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
		const activeBinding = ++bindingRevision;
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
		const sync = () => {
			if (activeBinding !== bindingRevision || disposed) return;
			publish(info.sessionId, source.getSnapshot());
		};
		sessionOff = source.subscribe?.(sync);
		sync();
	};
	const currentOff = currentProvideInfo?.subscribe?.(bindCurrent);
	bindCurrent();
	return {
		...store,
		dispose() {
			if (disposed) return;
			disposed = true;
			bindingRevision += 1;
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
  --os26-surface: rgba(23, 25, 31, var(--os26-opacity, .68));
  --os26-surface-solid: #1d2027;
  --os26-panel: rgba(18, 20, 25, .76);
  --os26-control: rgba(255, 255, 255, .09);
  --os26-control-hover: rgba(255, 255, 255, .14);
  --os26-edge: rgba(255, 255, 255, .22);
  --os26-edge-soft: rgba(255, 255, 255, .11);
  --os26-edge-dark: rgba(0, 0, 0, .38);
  --os26-text: #f7f9ff;
  --os26-muted: #bdc2cc;
  --os26-control-border: #e1e9f7;
  --os26-lens-fill: rgba(21, 24, 31, clamp(.28, calc(var(--os26-opacity, .68) * .52), .48));
  --os26-modal-fill: rgba(20, 23, 30, .93);
  --os26-modal-scrim: rgba(4, 8, 18, .38);
  --os26-accent: 94, 132, 255;
  --os26-state: 99, 220, 255;
  --os26-focus: #526dff;
  --os26-shadow-1: 0 1px 2px rgba(0, 0, 0, .10), 0 8px 24px rgba(0, 0, 0, .12);
  --os26-shadow-2: 0 2px 4px rgba(0, 0, 0, .12), 0 18px 54px rgba(0, 0, 0, .22);
  --os26-shadow-modal: 0 28px 90px rgba(0, 0, 0, .34);
  --os26-pointer-x: 70vw;
  --os26-pointer-y: 20vh;
}

:root[data-dsh-os26='on'][data-os26-scheme='light'] {
  --os26-surface: rgba(255, 255, 255, var(--os26-opacity, .68));
  --os26-surface-solid: #f7f8fa;
  --os26-panel: rgba(246, 247, 250, .78);
  --os26-control: rgba(255, 255, 255, .56);
  --os26-control-hover: rgba(255, 255, 255, .82);
  --os26-edge: rgba(255, 255, 255, .92);
  --os26-edge-soft: rgba(255, 255, 255, .62);
  --os26-edge-dark: rgba(38, 42, 52, .18);
  --os26-text: #17213a;
  --os26-muted: #596170;
  --os26-control-border: #3b4964;
  --os26-lens-fill: rgba(255, 255, 255, clamp(.24, calc(var(--os26-opacity, .68) * .48), .44));
  --os26-modal-fill: rgba(248, 249, 252, .93);
  --os26-modal-scrim: rgba(22, 29, 44, .24);
}

@media (prefers-color-scheme: light) {
  :root[data-dsh-os26='on'][data-os26-scheme='system'] {
    --os26-surface: rgba(255, 255, 255, var(--os26-opacity, .68));
    --os26-surface-solid: #f7f8fa;
    --os26-panel: rgba(246, 247, 250, .78);
    --os26-control: rgba(255, 255, 255, .56);
    --os26-control-hover: rgba(255, 255, 255, .82);
    --os26-edge: rgba(255, 255, 255, .92);
    --os26-edge-soft: rgba(255, 255, 255, .62);
    --os26-edge-dark: rgba(38, 42, 52, .18);
    --os26-text: #17213a;
    --os26-muted: #596170;
    --os26-control-border: #3b4964;
    --os26-lens-fill: rgba(255, 255, 255, clamp(.24, calc(var(--os26-opacity, .68) * .48), .44));
    --os26-modal-fill: rgba(248, 249, 252, .93);
    --os26-modal-scrim: rgba(22, 29, 44, .24);
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
  filter: saturate(.82) contrast(.92);
}

/* DSH's AppFrame already uses the semi-transparent official base token. Put
   the wallpaper on the body behind that frame so glass can sample real color;
   the neutral token still prevents a full-page blue wash. */
:root[data-dsh-os26='on'] body {
  background: var(--os26-wallpaper) !important;
  background-attachment: fixed !important;
  background-position: center !important;
  background-size: cover !important;
}

/* The sidebar shell and its session tree expose stable package-owned slot/ARIA
   boundaries. Keep every enhancement inside those boundaries so workspace and
   session labels may change language without changing the visual contract. */
:root[data-dsh-os26='on'] [data-slot='sidebar'] > * {
  position: relative;
  isolation: isolate;
  overflow: visible;
  border-right: 1px solid var(--os26-edge) !important;
  border-radius: 0 24px 24px 0;
  background: transparent !important;
  box-shadow:
    inset -1px 0 rgba(255,255,255,.22),
    inset 0 1px rgba(255,255,255,.42),
    12px 0 34px rgba(6,10,20,.08);
}

:root[data-dsh-os26='on'] [data-slot='sidebar'] > *::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  border-radius: inherit;
  background:
    radial-gradient(circle at 12% -8%, rgba(255,255,255,calc(var(--os26-highlight) * .24)), transparent 31%),
    linear-gradient(180deg, rgba(255,255,255,.13), transparent 112px),
    linear-gradient(96deg, rgba(255,255,255,.09), transparent 48%, rgba(0,0,0,.025)),
    var(--os26-panel);
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .78)) saturate(var(--os26-saturation));
  backdrop-filter: blur(calc(var(--os26-blur) * .78)) saturate(var(--os26-saturation));
}

:root[data-dsh-os26='on'] [data-slot='sidebar'] button {
  min-width: 0;
  border-color: transparent;
  transition: transform .16s ease, color .16s ease, background-color .16s ease, border-color .16s ease, box-shadow .16s ease;
}

:root[data-dsh-os26='on'] [data-slot='sidebar'] button:hover:not(:disabled) {
  border-color: var(--os26-edge-soft);
  background-color: var(--os26-control-hover);
  box-shadow: inset 0 1px rgba(255,255,255,.26), 0 5px 14px rgba(0,0,0,.07);
}

:root[data-dsh-os26='on'] [data-slot='sidebar'] button:active:not(:disabled) {
  transform: scale(.96);
  background-color: var(--os26-control);
  box-shadow: inset 0 2px 5px rgba(0,0,0,.13);
}

:root[data-dsh-os26='on'] [data-slot='sidebar'] button:focus-visible,
:root[data-dsh-os26='on'] [data-slot='sidebar'] [role='treeitem']:focus-visible {
  outline: 3px solid rgba(var(--os26-accent), .72) !important;
  outline-offset: 1px;
}

/* The sidebar slot owns one direct primary action; the settings trigger has its
   own named slot. Both use the same secondary glass-control primitive. */
:root[data-dsh-os26='on'] [data-slot='sidebar'] > * > button,
:root[data-dsh-os26='on'] [data-slot='sidebar.settings'] > button {
  border: 1px solid var(--os26-edge-soft) !important;
  color: var(--os26-text);
  background:
    radial-gradient(circle at 20% -35%, rgba(255,255,255,.34), transparent 46%),
    linear-gradient(145deg, rgba(255,255,255,.15), transparent 54%),
    var(--os26-lens-fill) !important;
  box-shadow: inset 0 2px 1px rgba(255,255,255,.42), inset 0 -2px 5px rgba(41,55,96,.09), var(--os26-shadow-1);
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .46)) saturate(var(--os26-saturation));
  backdrop-filter: blur(calc(var(--os26-blur) * .46)) saturate(var(--os26-saturation));
}

:root[data-dsh-os26='on'] [data-slot='sidebar'] [role='tree'] {
  min-width: 0;
  padding: 2px 7px 10px 2px;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--os26-accent), .26) transparent;
}

:root[data-dsh-os26='on'] [data-slot='sidebar'] [role='tree']::-webkit-scrollbar { width: 8px; }
:root[data-dsh-os26='on'] [data-slot='sidebar'] [role='tree']::-webkit-scrollbar-track { background: transparent; }
:root[data-dsh-os26='on'] [data-slot='sidebar'] [role='tree']::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 999px;
  background: rgba(var(--os26-accent), .26);
  background-clip: padding-box;
}

:root[data-dsh-os26='on'] [data-slot='sidebar'] [role='treeitem'] {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid transparent !important;
  border-radius: 10px !important;
  transition: transform .16s ease, background-color .16s ease, border-color .16s ease, box-shadow .16s ease;
}

:root[data-dsh-os26='on'] [data-slot='sidebar'] [role='treeitem'][aria-selected] {
  margin-block: 1px;
  border-radius: 15px !important;
}

:root[data-dsh-os26='on'] [data-slot='sidebar'] [role='treeitem'] > span {
  min-width: 0;
}

:root[data-dsh-os26='on'] [data-slot='sidebar'] [role='treeitem']:hover {
  border-color: var(--os26-edge-soft) !important;
  background: var(--os26-control-hover) !important;
  box-shadow: inset 0 1px rgba(255,255,255,.22);
}

:root[data-dsh-os26='on'] [data-slot='sidebar'] [role='treeitem']:active {
  transform: scale(.985);
}

:root[data-dsh-os26='on'] [data-slot='sidebar'] [role='treeitem'][aria-selected='true'] {
  border-color: rgba(var(--os26-accent), .18) !important;
  background:
    radial-gradient(circle at 18% -70%, rgba(255,255,255,.34), transparent 46%),
    linear-gradient(145deg, rgba(255,255,255,.15), transparent 58%),
    linear-gradient(rgba(var(--os26-accent), .045), rgba(var(--os26-accent), .045)),
    var(--os26-lens-fill) !important;
  box-shadow:
    inset 0 1px rgba(255,255,255,.42),
    inset 0 -1px rgba(30,45,100,.08),
    0 4px 13px rgba(27,42,88,.07);
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .34)) saturate(var(--os26-saturation));
  backdrop-filter: blur(calc(var(--os26-blur) * .34)) saturate(var(--os26-saturation));
}

:root[data-dsh-os26='on'] [data-slot='sidebar'] [role='treeitem'][aria-selected='true']::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 50%;
  width: 3px;
  height: 14px;
  border-radius: 999px;
  background: rgb(var(--os26-accent));
  box-shadow: 0 0 10px rgba(var(--os26-accent), .44);
  transform: translateY(-50%);
}

/* Native DSH composer compatibility layer. These are package-owned semantic hooks,
   deliberately scoped to the enabled root and never to generated class names. */
:root[data-dsh-os26='on'] [data-composer-seat] {
  position: sticky;
  bottom: 0;
  z-index: 24;
  isolation: isolate;
}

:root[data-dsh-os26='on'] [data-composer-seat]::before {
  display: none !important;
}

:root[data-dsh-os26='on'] [data-composer-card] {
  position: relative;
  isolation: isolate;
  min-width: 0;
  border: 1px solid var(--os26-edge) !important;
  border-radius: 28px !important;
  color: var(--os26-text);
  background: transparent !important;
  box-shadow:
    inset 0 2px 1px rgba(255,255,255,.68),
    inset 0 -2px 1px var(--os26-edge-dark),
    inset 13px 0 30px rgba(255,255,255,.08),
    inset -13px 0 28px rgba(var(--os26-accent),.035),
    var(--os26-shadow-2) !important;
  -webkit-backdrop-filter: blur(var(--os26-blur)) saturate(var(--os26-saturation));
  backdrop-filter: blur(var(--os26-blur)) saturate(var(--os26-saturation));
  transition: border-color .22s ease, box-shadow .22s ease, transform .22s cubic-bezier(.2,.8,.2,1);
}

:root[data-dsh-os26='on'] [data-composer-card]::before {
  content: '';
  position: absolute;
  inset: 1px;
  z-index: -1;
  pointer-events: none;
  border-radius: 27px;
  clip-path: inset(0 round 27px);
  background:
    radial-gradient(ellipse 34% 44% at 16% -9%, rgba(255,255,255,calc(var(--os26-highlight) * .34)), transparent 74%),
    radial-gradient(ellipse 25% 70% at 102% 104%, rgba(var(--os26-accent),.10), transparent 76%),
    linear-gradient(158deg, rgba(255,255,255,.17), transparent 38%, rgba(255,255,255,.025) 68%, rgba(0,0,0,.045)),
    var(--os26-lens-fill);
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .54)) saturate(var(--os26-saturation)) contrast(1.08);
  backdrop-filter: blur(calc(var(--os26-blur) * .54)) saturate(var(--os26-saturation)) contrast(1.08);
  filter: url('#os26-composer-refraction') saturate(1.08);
  transform: translateZ(0) scale(1.006);
}

:root[data-dsh-os26='on'] [data-composer-card]::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  border: 1px solid rgba(255,255,255,.34);
  border-radius: inherit;
  box-shadow:
    inset 0 2px 2px rgba(255,255,255,.36),
    inset 0 -7px 15px rgba(40,57,112,.075),
    inset 9px 0 20px rgba(255,255,255,.045),
    inset -9px 0 18px rgba(var(--os26-accent),.035);
}

:root[data-dsh-os26='on'] [data-composer-card]:focus-within {
  border-color: rgba(var(--os26-accent), .46) !important;
  box-shadow:
    inset 0 2px 1px rgba(255,255,255,.74),
    inset 0 -2px 1px var(--os26-edge-dark),
    0 0 0 3px rgba(var(--os26-accent), .10),
    0 20px 60px rgba(0,0,0,.20) !important;
}

:root[data-dsh-os26='on'] [data-input-scroll] {
  min-width: 0;
  scrollbar-color: rgba(var(--os26-accent), .30) transparent;
}

:root[data-dsh-os26='on'] [data-input-backdrop],
:root[data-dsh-os26='on'] [data-input-mirror] {
  color: var(--os26-text);
}

:root[data-dsh-os26='on'] [data-composer-card] textarea {
  min-width: 0;
  color: var(--os26-text) !important;
  caret-color: rgb(var(--os26-accent));
  background: transparent !important;
  text-shadow: 0 1px rgba(255,255,255,.05);
}

:root[data-dsh-os26='on'] [data-composer-card] textarea::placeholder {
  color: var(--os26-muted) !important;
  opacity: .72;
}

:root[data-dsh-os26='on'] [data-composer-card] :is(button, [role='button']) {
  min-width: 0;
  border: 1px solid transparent !important;
  color: inherit;
  background: transparent;
  transition: transform .16s ease, color .16s ease, background-color .16s ease, border-color .16s ease, box-shadow .16s ease;
}

:root[data-dsh-os26='on'] [data-composer-card] :is(button, [role='button']):hover:not(:disabled) {
  border-color: var(--os26-edge-soft) !important;
  background: var(--os26-control-hover) !important;
  box-shadow: inset 0 1px rgba(255,255,255,.28), 0 5px 14px rgba(0,0,0,.08);
}

:root[data-dsh-os26='on'] [data-composer-card] :is(button, [role='button']):active:not(:disabled) {
  transform: scale(.94);
  background: var(--os26-control) !important;
  box-shadow: inset 0 2px 5px rgba(0,0,0,.14);
}

:root[data-dsh-os26='on'] [data-composer-card] :is(button, [role='button']):focus-visible,
:root[data-dsh-os26='on'] [data-composer-card] textarea:focus-visible {
  outline: 3px solid rgba(var(--os26-accent), .72) !important;
  outline-offset: 2px;
}

:root[data-dsh-os26='on'] [data-composer-card] :is(button, [role='button']):disabled {
  opacity: .42;
  filter: grayscale(.25);
}

:root[data-dsh-os26='on'] [data-composer-card] [data-os26-primary],
:root[data-dsh-os26='on'] [data-composer-card] button:not([aria-haspopup]):has(> svg[viewBox='0 0 16 16']) {
  border-color: rgba(255,255,255,.46) !important;
  color: #fff !important;
  background:
    radial-gradient(circle at 34% 18%, rgba(255,255,255,.82) 0 5%, transparent 18%),
    linear-gradient(145deg, rgba(132,167,255,.98), rgba(75,99,226,.97)) !important;
  box-shadow: inset 0 1px rgba(255,255,255,.68), inset 0 -1px rgba(34,43,126,.38), 0 7px 18px rgba(67,91,222,.30);
}

:root[data-dsh-os26='on'] [data-composer-card] [data-os26-primary]:hover:not(:disabled),
:root[data-dsh-os26='on'] [data-composer-card] button:not([aria-haspopup]):has(> svg[viewBox='0 0 16 16']):hover:not(:disabled) {
  border-color: rgba(255,255,255,.58) !important;
  background:
    radial-gradient(circle at 34% 18%, rgba(255,255,255,.90) 0 5%, transparent 19%),
    linear-gradient(145deg, #94b4ff, #5872f1) !important;
  box-shadow: inset 0 1px rgba(255,255,255,.74), 0 9px 22px rgba(67,91,222,.38);
}

:root[data-dsh-os26='on'] [data-composer-card] [data-os26-primary]:disabled,
:root[data-dsh-os26='on'] [data-composer-card] button:not([aria-haspopup]):has(> svg[viewBox='0 0 16 16']):disabled {
  color: rgba(255,255,255,.76) !important;
  background: linear-gradient(145deg, rgba(126,146,196,.68), rgba(91,102,143,.62)) !important;
}

/* Native runtime surfaces. Every selector below is a package-owned semantic
   boundary from DSH's Tool, Goal, Conversation or User Questions UI. Reading
   bodies keep their native typography; glass belongs to the interactive card
   boundary and controls, never to code/text content itself. */
:root[data-dsh-os26='on'] [data-goal-bar] > div,
:root[data-dsh-os26='on'] [data-approval-key] > div,
:root[data-dsh-os26='on'] [data-question-key] > section,
:root[data-dsh-os26='on'] [data-plan-review-key] > section {
  position: relative;
  isolation: isolate;
  min-width: 0;
  border: 1px solid var(--os26-edge) !important;
  background:
    radial-gradient(circle at 18% -28%, rgba(255,255,255,calc(var(--os26-highlight) * .28)), transparent 38%),
    linear-gradient(148deg, rgba(255,255,255,.14), transparent 48%),
    var(--os26-panel) !important;
  box-shadow:
    inset 0 2px 1px rgba(255,255,255,.46),
    inset 0 -1px var(--os26-edge-dark),
    var(--os26-shadow-2) !important;
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .82)) saturate(var(--os26-saturation)) contrast(1.04);
  backdrop-filter: blur(calc(var(--os26-blur) * .82)) saturate(var(--os26-saturation)) contrast(1.04);
}

:root[data-dsh-os26='on'] [data-goal-bar] > div {
  border-radius: 16px !important;
  background:
    linear-gradient(145deg, rgba(255,255,255,.18), transparent 54%),
    var(--os26-lens-fill) !important;
  box-shadow: inset 0 2px 1px rgba(255,255,255,.44), inset 0 -2px 5px rgba(41,55,96,.08), var(--os26-shadow-1) !important;
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .50)) saturate(var(--os26-saturation));
  backdrop-filter: blur(calc(var(--os26-blur) * .50)) saturate(var(--os26-saturation));
}

:root[data-dsh-os26='on'] [data-approval-key] > div,
:root[data-dsh-os26='on'] [data-plan-review-key] > section {
  border-color: rgba(224, 152, 37, .42) !important;
  box-shadow: inset 0 2px 1px rgba(255,255,255,.46), inset 0 -1px rgba(121,75,8,.18), 0 18px 54px rgba(84,53,9,.16) !important;
}

:root[data-dsh-os26='on'] :is([data-approval-scroll], [data-question-scroll], [data-plan-review-scroll]) {
  min-width: 0;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--os26-accent), .32) transparent;
}

:root[data-dsh-os26='on'] :is([data-approval-key], [data-question-key], [data-plan-review-key], [data-goal-bar]) :is(button, input, textarea) {
  min-width: 0;
  border-radius: 12px;
  transition: transform .16s ease, border-color .16s ease, background-color .16s ease, box-shadow .16s ease;
}

:root[data-dsh-os26='on'] :is([data-approval-key], [data-question-key], [data-plan-review-key], [data-goal-bar]) button:hover:not(:disabled) {
  border-color: var(--os26-edge-soft) !important;
  box-shadow: inset 0 1px rgba(255,255,255,.30), 0 5px 14px rgba(0,0,0,.08);
}

:root[data-dsh-os26='on'] :is([data-approval-key], [data-question-key], [data-plan-review-key], [data-goal-bar]) button:active:not(:disabled) {
  transform: scale(.97);
}

:root[data-dsh-os26='on'] :is([data-approval-key], [data-question-key], [data-plan-review-key], [data-goal-bar]) :is(button, input, textarea):focus-visible {
  outline: 3px solid rgba(var(--os26-accent), .72) !important;
  outline-offset: 2px;
}

:root[data-dsh-os26='on'] [data-question-key] [aria-checked] {
  border: 1px solid transparent !important;
}
:root[data-dsh-os26='on'] [data-question-key] [aria-checked='true'] {
  border-color: rgba(var(--os26-accent), .34) !important;
  background: linear-gradient(145deg, rgba(255,255,255,.18), transparent), rgba(var(--os26-accent), .12) !important;
  box-shadow: inset 0 1px rgba(255,255,255,.34), 0 5px 16px rgba(var(--os26-accent), .10);
}

:root[data-dsh-os26='on'] [data-goal-bar] input,
:root[data-dsh-os26='on'] [data-question-key] :is(input, textarea) {
  border: 1px solid var(--os26-edge-soft) !important;
  color: var(--os26-text) !important;
  background: linear-gradient(145deg, rgba(255,255,255,.16), transparent), var(--os26-lens-fill) !important;
  box-shadow: inset 0 2px 1px rgba(255,255,255,.34), inset 0 -2px 5px rgba(41,55,96,.08);
  caret-color: rgb(var(--os26-accent));
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .38)) saturate(var(--os26-saturation));
  backdrop-filter: blur(calc(var(--os26-blur) * .38)) saturate(var(--os26-saturation));
}

/* Tool rows condense when settled, then materialize into a card only while
   active, failed, hovered or expanded. This keeps long transcripts readable. */
:root[data-dsh-os26='on'] [data-tool][data-variant] {
  position: relative;
  min-width: 0;
  margin-block: 2px;
  padding: 2px 4px;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 14px;
  transition: border-color .18s ease, background-color .18s ease, box-shadow .18s ease;
}

:root[data-dsh-os26='on'] [data-tool][data-variant]:is(:hover, :focus-within),
:root[data-dsh-os26='on'] [data-tool][data-variant]:has([aria-expanded='true']) {
  border-color: var(--os26-edge-soft);
  background: linear-gradient(145deg, rgba(255,255,255,.12), transparent 50%), var(--os26-lens-fill);
  box-shadow: inset 0 1px rgba(255,255,255,.30), var(--os26-shadow-1);
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .38)) saturate(var(--os26-saturation));
  backdrop-filter: blur(calc(var(--os26-blur) * .38)) saturate(var(--os26-saturation));
}

:root[data-dsh-os26='on'] [data-tool][data-variant][data-state='running'] {
  border-color: rgba(var(--os26-accent), .32);
  background: linear-gradient(145deg, rgba(255,255,255,.14), transparent 52%), rgba(var(--os26-accent), .08);
  box-shadow: inset 0 1px rgba(255,255,255,.34), 0 7px 22px rgba(var(--os26-accent), .10);
}

:root[data-dsh-os26='on'] [data-tool][data-variant][data-state='error'] {
  border-color: rgba(255, 99, 115, .40);
  background: linear-gradient(145deg, rgba(255,255,255,.12), transparent 52%), rgba(255, 99, 115, .08);
  box-shadow: inset 0 1px rgba(255,255,255,.28), 0 7px 22px rgba(126, 25, 38, .10);
}

:root[data-dsh-os26='on'] [data-tool][data-variant] [aria-expanded] {
  min-width: 0;
  border-radius: 11px;
}

:root[data-dsh-os26='on'] [data-tool][data-variant] :is(button, [role='button']):focus-visible {
  outline: 3px solid rgba(var(--os26-accent), .72) !important;
  outline-offset: 1px;
}

:root[data-dsh-os26='on'] :is(
  [data-chat-flow-kind='turn-error'],
  [data-chat-flow-kind='model-retry'],
  [data-chat-flow-kind='turn-max-tokens']
) {
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(255,99,115,.34);
  border-radius: 15px;
  background: linear-gradient(145deg, rgba(255,255,255,.12), transparent), rgba(255,99,115,.07);
  box-shadow: inset 0 1px rgba(255,255,255,.28), var(--os26-shadow-1);
}

.os26-overlay-stack {
  position: fixed;
  right: max(20px, env(safe-area-inset-right));
  bottom: max(20px, env(safe-area-inset-bottom));
  z-index: 80;
  display: flex;
  width: min(340px, calc(100vw - 32px));
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  color: var(--os26-text);
  pointer-events: none;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.os26-filter-defs { position: absolute; width: 0; height: 0; overflow: hidden; }
.os26-native-decision-announcer {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.os26-status-capsule,
.os26-activity-surface,
.os26-attention-surface,
.os26-receipt-surface,
.os26-settings-hero {
  border: 1px solid var(--os26-edge);
  background:
    radial-gradient(circle at 22% -20%, rgba(255,255,255,calc(var(--os26-highlight) * .30)), transparent 42%),
    linear-gradient(145deg, rgba(255,255,255,.16), transparent 45%),
    var(--os26-surface);
  box-shadow: inset 0 1px rgba(255,255,255,.48), inset 0 -1px var(--os26-edge-dark), var(--os26-shadow-2);
  -webkit-backdrop-filter: blur(var(--os26-blur)) saturate(var(--os26-saturation));
  backdrop-filter: blur(var(--os26-blur)) saturate(var(--os26-saturation));
}

/* Strong and medium lenses share the same optical grammar. The foreground
   remains unfiltered; only a clipped, background-sampling layer is displaced. */
.os26-activity-surface,
.os26-attention-surface,
.os26-receipt-surface {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}
.os26-activity-surface::before,
.os26-attention-surface::before,
.os26-receipt-surface::before {
  content: '';
  position: absolute;
  inset: 1px;
  z-index: -1;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(145deg, rgba(255,255,255,.14), transparent 52%), var(--os26-lens-fill);
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .52)) saturate(var(--os26-saturation)) contrast(1.05);
  backdrop-filter: blur(calc(var(--os26-blur) * .52)) saturate(var(--os26-saturation)) contrast(1.05);
  filter: url('#os26-composer-refraction') saturate(1.04);
}

.os26-status-capsule {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-width: 198px;
  max-width: 100%;
  padding: 8px 12px 8px 8px;
  overflow: hidden;
  border-radius: 999px;
  transition: width .38s cubic-bezier(.22,.82,.2,1), border-radius .38s cubic-bezier(.22,.82,.2,1), transform .2s ease;
}
.os26-status-capsule::before,
.os26-settings-hero::before {
  content: '';
  position: absolute;
  inset: 1px;
  z-index: -1;
  pointer-events: none;
  border-radius: inherit;
  clip-path: inset(0 round 999px);
  background:
    radial-gradient(ellipse 42% 60% at 18% -12%, rgba(255,255,255,.34), transparent 72%),
    linear-gradient(150deg, rgba(255,255,255,.13), transparent 54%),
    var(--os26-lens-fill);
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .62)) saturate(var(--os26-saturation)) contrast(1.06);
  backdrop-filter: blur(calc(var(--os26-blur) * .62)) saturate(var(--os26-saturation)) contrast(1.06);
  filter: url('#os26-composer-refraction') saturate(1.05);
}
.os26-status-capsule::after,
.os26-settings-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  border: 1px solid rgba(255,255,255,.30);
  border-radius: inherit;
  box-shadow: inset 0 2px 2px rgba(255,255,255,.28), inset 0 -5px 10px rgba(40,57,112,.065);
}
.os26-status-capsule.is-expanded { width: 290px; border-radius: 22px; }
.os26-status-copy { min-width: 0; }
.os26-status-copy strong, .os26-status-copy small { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.os26-status-copy strong { font-size: 12px; line-height: 1.25; letter-spacing: .01em; }
.os26-status-copy small { margin-top: 2px; color: var(--os26-muted); font-size: 10px; line-height: 1.3; }
.os26-tool-count { color: var(--os26-muted); font-size: 10px; white-space: nowrap; }

.os26-state-mark {
  display: inline-block;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  border: 1px solid rgba(255,255,255,.40);
  border-radius: 50%;
  background: radial-gradient(circle at 34% 24%, #fff 0 7%, transparent 10%), radial-gradient(circle at 62% 67%, rgb(var(--os26-state)), rgba(var(--os26-state),.20) 64%, transparent 68%);
  box-shadow: inset 0 1px 5px rgba(255,255,255,.56), inset 0 -3px 8px rgba(0,0,0,.13), 0 0 18px rgba(var(--os26-state),.30);
  animation: os26-breathe 2.8s ease-in-out infinite;
}

[data-state='idle'] { --os26-state: 99, 220, 255; }
[data-state='thinking'] { --os26-state: 147, 122, 255; }
[data-state='tool-running'] { --os26-state: 53, 211, 170; }
[data-state='approval'], [data-state='blocked'] { --os26-state: 255, 184, 76; }
[data-state='success'] { --os26-state: 58, 207, 120; }
[data-state='error'] { --os26-state: 255, 99, 115; }

.os26-activity-surface, .os26-attention-surface, .os26-receipt-surface {
  width: 290px;
  box-sizing: border-box;
  border-radius: 18px;
  padding: 11px 14px;
  animation: os26-rise .32s cubic-bezier(.22,.82,.2,1) both;
}
.os26-activity-surface { display: grid; gap: 7px; color: var(--os26-muted); font-size: 11px; }
.os26-activity-track { height: 4px; padding: 1px; overflow: hidden; border-radius: 99px; background: rgba(0,0,0,.10); box-shadow: inset 0 1px 3px rgba(0,0,0,.18), 0 1px rgba(255,255,255,.18); }
.os26-activity-track i { display: block; width: 42%; height: 100%; border-radius: inherit; background: rgb(var(--os26-state)); box-shadow: 0 0 8px rgba(var(--os26-state),.54); animation: os26-scan 1.25s ease-in-out infinite alternate; }
.os26-attention-surface { display: grid; gap: 3px; border-color: rgba(var(--os26-state),.55); }
.os26-attention-surface strong { font-size: 12px; }
.os26-attention-surface span { color: var(--os26-muted); font-size: 10px; line-height: 1.45; overflow-wrap: anywhere; }
.os26-receipt-surface { display: flex; align-items: center; gap: 10px; }
.os26-receipt-surface strong, .os26-receipt-surface small { display: block; }
.os26-receipt-surface strong { font-size: 12px; }
.os26-receipt-surface small { margin-top: 2px; color: var(--os26-muted); font-size: 10px; }
.os26-check { display: grid; width: 28px; height: 28px; place-items: center; border: 1px solid rgba(255,255,255,.46); border-radius: 50%; color: #071d12; background: rgb(var(--os26-state)); font-weight: 900; box-shadow: inset 0 1px rgba(255,255,255,.54), 0 5px 12px rgba(var(--os26-state),.26); }

.os26-composer-dock {
  display: flex;
  min-width: 0;
  min-height: 24px;
  align-items: center;
  gap: 7px;
  padding: 4px 12px 2px;
  color: var(--dsw-alias-label-secondary, #6b7280);
  font: 500 10px/1.3 ui-sans-serif, system-ui, sans-serif;
}
.os26-composer-dock .os26-state-mark { width: 8px; height: 8px; animation-duration: 2.4s; }
.os26-composer-dock > span:not(.os26-state-mark) { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.os26-composer-detail { margin-left: auto; opacity: .72; }

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

/* Settings page and the plugin-owned form primitive system. */
.os26-settings,
:root[data-dsh-os26='on'] [data-slot='sidebar.settings'] [role='dialog'] {
  color: var(--os26-text);
}

/* Settings is a true modal surface. The host presentation is transparent by
   default, which lets the high-contrast composer read as if it were inside the
   dialog. Give every native settings page the same scrim and modal material,
   not only the plugin-owned tab. */
:root[data-dsh-os26='on'] [data-slot='sidebar.settings'] [role='presentation'] {
  background: var(--os26-modal-scrim) !important;
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .82)) saturate(.72);
  backdrop-filter: blur(calc(var(--os26-blur) * .82)) saturate(.72);
}

:root[data-dsh-os26='on'] [data-slot='sidebar.settings'] [role='dialog'] {
  position: relative;
  isolation: isolate;
  border: 1px solid var(--os26-edge) !important;
  border-radius: 28px !important;
  background: transparent !important;
  box-shadow: inset 0 1px rgba(255,255,255,.52), inset 0 -1px var(--os26-edge-dark), var(--os26-shadow-modal) !important;
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * 1.08)) saturate(var(--os26-saturation));
  backdrop-filter: blur(calc(var(--os26-blur) * 1.08)) saturate(var(--os26-saturation));
}

:root[data-dsh-os26='on'] [data-slot='sidebar.settings'] [role='dialog']::before {
  content: '';
  position: absolute;
  inset: 1px;
  z-index: -1;
  border-radius: inherit;
  pointer-events: none;
  background:
    radial-gradient(circle at 16% -20%, rgba(255,255,255,.24), transparent 34%),
    linear-gradient(145deg, rgba(255,255,255,.10), transparent 42%),
    var(--os26-modal-fill) !important;
}

:root[data-dsh-os26='on']:has([data-slot='sidebar.settings'] [role='presentation'] [role='dialog']) [data-composer-seat],
:root[data-dsh-os26='on']:has([data-slot='sidebar.settings'] [role='presentation'] [role='dialog']) .os26-overlay-stack {
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

.os26-settings {
  display: grid;
  gap: 16px;
  width: min(100%, 780px);
  max-width: 780px;
  min-width: 0;
  padding: 8px 4px 36px;
  color: var(--dsw-alias-label-primary, #181a20);
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.os26-settings, .os26-settings * { box-sizing: border-box; }

:root[data-dsh-os26='on'] [role='dialog']:has(.os26-settings) {
  position: relative;
  isolation: isolate;
  flex: 0 0 auto;
  width: min(960px, calc(100vw - 24px)) !important;
  max-width: calc(100vw - 24px) !important;
  max-height: calc(100vh - 24px) !important;
  overflow: auto;
  border: 1px solid var(--os26-edge) !important;
  border-radius: 28px !important;
  background: transparent !important;
  box-shadow: inset 0 1px rgba(255,255,255,.52), inset 0 -1px var(--os26-edge-dark), var(--os26-shadow-modal) !important;
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * 1.15)) saturate(var(--os26-saturation));
  backdrop-filter: blur(calc(var(--os26-blur) * 1.15)) saturate(var(--os26-saturation));
}

:root[data-dsh-os26='on'] [role='dialog']:has(.os26-settings)::before {
  content: '';
  position: absolute;
  inset: 1px;
  z-index: -1;
  border-radius: inherit;
  pointer-events: none;
  background:
    radial-gradient(circle at 16% -20%, rgba(255,255,255,.27), transparent 34%),
    linear-gradient(145deg, rgba(255,255,255,.12), transparent 42%),
    var(--os26-modal-fill);
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .78)) saturate(var(--os26-saturation)) contrast(1.05);
  backdrop-filter: blur(calc(var(--os26-blur) * .78)) saturate(var(--os26-saturation)) contrast(1.05);
  filter: url('#os26-composer-refraction') saturate(1.04);
}

/* The settings registrant lives under sidebar.settings; DSH's modal
   presentation is fixed-position but otherwise inherits the sidebar width.
   Expand this semantic presentation carrier before sizing the dialog itself. */
:root[data-dsh-os26='on'] [data-slot='sidebar.settings'] [role='presentation']:has(.os26-settings) {
  width: min(984px, calc(100vw - 8px)) !important;
  max-width: calc(100vw - 8px) !important;
}

:root[data-dsh-os26='on'] [role='dialog']:has(.os26-settings) button:not(.os26-settings-actions button) {
  border-radius: 13px;
  transition: background-color .16s ease, box-shadow .16s ease, transform .16s ease;
}

:root[data-dsh-os26='on'] [role='dialog']:has(.os26-settings) button:hover:not(:disabled) {
  background-color: var(--os26-control-hover);
  box-shadow: inset 0 1px rgba(255,255,255,.28);
}

:root[data-dsh-os26='on'] [role='dialog']:has(.os26-settings) button:active:not(:disabled) {
  transform: scale(.97);
}

/* Agent preset menus can grow with every installed plugin. DSH renders this
   picker through a body portal and each option has a semantic name + description
   pair. That shape distinguishes it from command/model/permission menus without
   relying on localized copy or generated CSS-module names. */
:root[data-dsh-os26='on'] body > [role='menu']:has([role='menuitem'] span > span > span + span) {
  isolation: isolate;
  width: min(420px, calc(100vw - 24px)) !important;
  max-width: calc(100vw - 24px) !important;
  max-height: min(520px, calc(100vh - 24px)) !important;
  padding: 7px !important;
  overflow: hidden !important;
  border: 1px solid var(--os26-edge) !important;
  border-radius: 22px !important;
  background: transparent !important;
  box-shadow: inset 0 1px rgba(255,255,255,.52), inset 0 -1px var(--os26-edge-dark), var(--os26-shadow-modal) !important;
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * 1.12)) saturate(var(--os26-saturation));
  backdrop-filter: blur(calc(var(--os26-blur) * 1.12)) saturate(var(--os26-saturation));
}

:root[data-dsh-os26='on'] body > [role='menu']:has([role='menuitem'] span > span > span + span)::before {
  content: '';
  position: absolute;
  inset: 1px;
  z-index: -1;
  border-radius: inherit;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% -20%, rgba(255,255,255,.27), transparent 38%),
    linear-gradient(145deg, rgba(255,255,255,.13), transparent 46%),
    var(--os26-panel);
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .68)) saturate(var(--os26-saturation)) contrast(1.05);
  backdrop-filter: blur(calc(var(--os26-blur) * .68)) saturate(var(--os26-saturation)) contrast(1.05);
  filter: url('#os26-composer-refraction') saturate(1.04);
}

:root[data-dsh-os26='on'] body > [role='menu']:has([role='menuitem'] span > span > span + span) > [role='presentation'] {
  max-height: min(504px, calc(100vh - 40px));
  padding: 1px 3px 1px 1px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--os26-accent), .34) transparent;
}

:root[data-dsh-os26='on'] body > [role='menu']:has([role='menuitem'] span > span > span + span) > [role='presentation']::-webkit-scrollbar { width: 8px; }
:root[data-dsh-os26='on'] body > [role='menu']:has([role='menuitem'] span > span > span + span) > [role='presentation']::-webkit-scrollbar-track { background: transparent; }
:root[data-dsh-os26='on'] body > [role='menu']:has([role='menuitem'] span > span > span + span) > [role='presentation']::-webkit-scrollbar-thumb { border: 2px solid transparent; border-radius: 999px; background: rgba(var(--os26-accent), .32); background-clip: padding-box; }

:root[data-dsh-os26='on'] body > [role='menu']:has([role='menuitem'] span > span > span + span) [role='menuitem'] {
  min-width: 0;
  min-height: 52px;
  margin: 1px 0;
  padding: 8px 10px !important;
  border: 1px solid transparent !important;
  border-radius: 14px !important;
  align-items: flex-start !important;
  transition: background-color .16s ease, border-color .16s ease, transform .16s ease;
}

:root[data-dsh-os26='on'] body > [role='menu']:has([role='menuitem'] span > span > span + span) [role='menuitem']:hover,
:root[data-dsh-os26='on'] body > [role='menu']:has([role='menuitem'] span > span > span + span) [role='menuitem']:focus-visible {
  border-color: var(--os26-edge-soft) !important;
  background: var(--os26-control-hover) !important;
  box-shadow: inset 0 1px rgba(255,255,255,.24);
}

:root[data-dsh-os26='on'] body > [role='menu']:has([role='menuitem'] span > span > span + span) [role='menuitem']:active {
  transform: scale(.985);
}

:root[data-dsh-os26='on'] body > [role='menu']:has([role='menuitem'] span > span > span + span) [role='menuitem'] span {
  min-width: 0;
  max-width: 100%;
}

:root[data-dsh-os26='on'] body > [role='menu']:has([role='menuitem'] span > span > span + span) [role='menuitem'] span > span > span:first-child {
  overflow: hidden;
  color: var(--os26-text) !important;
  font-size: 13px !important;
  font-weight: 650;
  line-height: 19px !important;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:root[data-dsh-os26='on'] body > [role='menu']:has([role='menuitem'] span > span > span + span) [role='menuitem'] span > span > span + span {
  display: -webkit-box !important;
  margin-top: 1px;
  overflow: hidden;
  color: var(--os26-muted) !important;
  font-size: 11px !important;
  line-height: 15px !important;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.os26-settings-hero { position: relative; isolation: isolate; display: flex; min-width: 0; align-items: center; gap: 14px; padding: 18px; overflow: hidden; border-radius: 24px; color: var(--os26-text); background: transparent; }
.os26-settings-hero::before { clip-path: inset(0 round 23px); }
.os26-settings-hero > span:last-child { min-width: 0; }
.os26-settings-hero h2 { margin: 0; overflow: hidden; font-size: 20px; text-overflow: ellipsis; white-space: nowrap; }
.os26-settings-hero p { display: -webkit-box; margin: 4px 0 0; overflow: hidden; color: var(--os26-muted); font-size: 12px; line-height: 1.45; overflow-wrap: anywhere; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.os26-settings-orb { width: 46px; height: 46px; flex: 0 0 auto; border: 1px solid rgba(255,255,255,.58); border-radius: 50%; background: radial-gradient(circle at 33% 24%, #fff 0 7%, transparent 11%), linear-gradient(145deg,#79f4ff,#806dff); box-shadow: inset 0 2px 7px rgba(255,255,255,.62), inset 0 -5px 11px rgba(49,43,145,.20), 0 8px 24px rgba(86,113,255,.30); }

.os26-settings fieldset {
  position: relative;
  isolation: isolate;
  display: grid;
  gap: 0;
  min-width: 0;
  margin: 0;
  padding: 8px 16px 12px;
  border: 1px solid var(--os26-edge);
  border-radius: 22px;
  overflow: hidden;
  background: transparent;
  box-shadow: inset 0 1px rgba(255,255,255,.38), inset 0 -1px var(--os26-edge-dark), var(--os26-shadow-1);
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .72)) saturate(var(--os26-saturation));
  backdrop-filter: blur(calc(var(--os26-blur) * .72)) saturate(var(--os26-saturation));
}
.os26-settings fieldset::before {
  content: '';
  position: absolute;
  inset: 1px;
  z-index: -1;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(150deg, rgba(255,255,255,.15), transparent 42%), var(--os26-surface);
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .54)) saturate(var(--os26-saturation)) contrast(1.04);
  backdrop-filter: blur(calc(var(--os26-blur) * .54)) saturate(var(--os26-saturation)) contrast(1.04);
  filter: url('#os26-composer-refraction') saturate(1.03);
}
.os26-settings legend { padding: 0 7px; color: var(--dsw-alias-label-secondary, #5e626d); font-size: 11px; font-weight: 750; letter-spacing: .04em; }
.os26-setting-row, .os26-range-row { min-width: 0; min-height: 54px; border-bottom: 1px solid rgba(120,126,140,.14); font-size: 12px; }
.os26-setting-row { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 5px 0; }
.os26-setting-row:last-of-type, .os26-range-row:last-of-type { border-bottom-color: transparent; }
.os26-setting-copy, .os26-setting-label { min-width: 0; }
.os26-setting-copy strong, .os26-setting-copy small { display: block; overflow-wrap: anywhere; }
.os26-setting-copy strong, .os26-setting-label { line-height: 1.35; }
.os26-setting-copy small { display: -webkit-box; margin-top: 3px; overflow: hidden; color: var(--dsw-alias-label-secondary, #667085); font-weight: 400; line-height: 1.4; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }

.os26-select-shell { position: relative; display: block; width: min(210px, 48%); min-width: 156px; flex: 0 1 210px; }
.os26-select-shell select {
  width: 100%;
  min-height: 38px;
  padding: 8px 34px 8px 12px;
  overflow: hidden;
  border: 1px solid var(--os26-edge-soft);
  border-radius: 14px;
  color: inherit;
  background:
    radial-gradient(circle at 18% -50%, rgba(255,255,255,.38), transparent 48%),
    linear-gradient(155deg, rgba(255,255,255,.20), transparent 48%),
    var(--os26-lens-fill);
  box-shadow: inset 0 2px 1px rgba(255,255,255,.38), inset 0 -2px 5px rgba(41,55,96,.07), 0 4px 12px rgba(0,0,0,.06);
  -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .42)) saturate(var(--os26-saturation));
  backdrop-filter: blur(calc(var(--os26-blur) * .42)) saturate(var(--os26-saturation));
  font: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
  appearance: none;
  cursor: pointer;
}
.os26-select-shell i { position: absolute; top: 50%; right: 13px; width: 7px; height: 7px; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; opacity: .7; pointer-events: none; transform: translateY(-70%) rotate(45deg); }
.os26-select-shell:hover select { border-color: rgba(var(--os26-accent), .36); background-color: var(--os26-control-hover); }

.os26-toggle { position: relative; width: 46px; height: 28px; flex: 0 0 auto; }
.os26-toggle input { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.os26-toggle i { position: absolute; inset: 0; border: 1px solid var(--os26-edge-soft); border-radius: 999px; background: linear-gradient(180deg, rgba(255,255,255,.18), rgba(55,62,78,.12)), var(--os26-lens-fill); box-shadow: inset 0 2px 4px rgba(255,255,255,.22), inset 0 -2px 5px rgba(0,0,0,.16), 0 1px rgba(255,255,255,.28); -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .30)) saturate(var(--os26-saturation)); backdrop-filter: blur(calc(var(--os26-blur) * .30)) saturate(var(--os26-saturation)); transition: background .24s ease, border-color .24s ease, box-shadow .24s ease; }
.os26-toggle i::after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border: 1px solid rgba(255,255,255,.74); border-radius: 50%; background: radial-gradient(circle at 32% 18%, #fff 0 8%, transparent 18%), radial-gradient(circle at 70% 78%, rgba(var(--os26-accent),.20), transparent 55%), linear-gradient(145deg, rgba(255,255,255,.94), rgba(218,228,250,.78)); box-shadow: inset 0 2px 3px rgba(255,255,255,.62), inset 0 -3px 5px rgba(41,49,66,.14), 0 3px 9px rgba(0,0,0,.24); transition: transform .28s cubic-bezier(.22,.82,.2,1), box-shadow .2s ease; }
.os26-toggle input:checked + i { border-color: rgba(var(--os26-accent), .56); background: linear-gradient(145deg, rgb(108,145,255), rgb(76,99,227)); box-shadow: inset 0 1px rgba(255,255,255,.42), 0 5px 14px rgba(var(--os26-accent), .20); }
.os26-toggle input:checked + i::after { transform: translateX(18px); }
.os26-toggle input:active + i::after { box-shadow: inset 0 -2px 4px rgba(41,49,66,.12), 0 1px 3px rgba(0,0,0,.22); transform: scale(.93); }
.os26-toggle input:checked:active + i::after { transform: translateX(18px) scale(.93); }
.os26-toggle input:focus-visible + i { box-shadow: 0 0 0 4px rgba(var(--os26-accent), .20), inset 0 1px rgba(255,255,255,.42); }

.os26-range-row { display: grid; gap: 10px; padding: 11px 0 13px; }
.os26-range-heading { display: flex; min-width: 0; align-items: baseline; justify-content: space-between; gap: 16px; }
.os26-range-heading strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.os26-range-row output { flex: 0 0 auto; padding: 3px 8px; border: 1px solid var(--os26-edge-soft); border-radius: 999px; color: var(--dsw-alias-label-secondary, #667085); background: linear-gradient(145deg, rgba(255,255,255,.16), transparent), var(--os26-lens-fill); box-shadow: inset 0 1px rgba(255,255,255,.34), inset 0 -1px var(--os26-edge-dark); -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .32)) saturate(var(--os26-saturation)); backdrop-filter: blur(calc(var(--os26-blur) * .32)) saturate(var(--os26-saturation)); font-variant-numeric: tabular-nums; line-height: 1.25; }
.os26-range-row input[type='range'] {
  width: 100%;
  height: 24px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  appearance: none;
  cursor: pointer;
}
.os26-range-row input[type='range']::-webkit-slider-runnable-track { height: 10px; border: 1px solid var(--os26-edge-soft); border-radius: 999px; background: linear-gradient(180deg, rgba(255,255,255,.36), rgba(255,255,255,.06) 45%, rgba(37,45,68,.13)), linear-gradient(90deg, rgba(var(--os26-accent), .88) 0 var(--os26-range-progress), rgba(102,108,122,.16) var(--os26-range-progress) 100%); box-shadow: inset 0 1px rgba(255,255,255,.42), inset 0 -2px 4px rgba(0,0,0,.17), 0 2px 6px rgba(35,47,82,.10); }
.os26-range-row input[type='range']::-webkit-slider-thumb { width: 24px; height: 24px; margin-top: -8px; border: 1px solid rgba(255,255,255,.88); border-radius: 50%; background: radial-gradient(circle at 32% 18%, #fff 0 7%, transparent 15%), radial-gradient(circle at 67% 78%, rgba(var(--os26-accent),.24), transparent 52%), linear-gradient(145deg, rgba(255,255,255,.96), rgba(205,220,255,.80)); box-shadow: inset 0 2px 3px rgba(255,255,255,.70), inset 0 -4px 6px rgba(59,76,128,.18), 0 5px 13px rgba(34,46,88,.30), 0 0 0 1px rgba(var(--os26-accent),.22); appearance: none; transition: transform .14s ease, box-shadow .14s ease; }
.os26-range-row input[type='range']:hover::-webkit-slider-thumb { transform: scale(1.06); box-shadow: inset 0 -3px 5px rgba(59,76,128,.15), 0 5px 14px rgba(34,46,88,.34), 0 0 0 4px rgba(var(--os26-accent),.10); }
.os26-range-row input[type='range']:active::-webkit-slider-thumb { transform: scale(.94); }
.os26-range-row input[type='range']::-moz-range-track { height: 10px; border: 1px solid var(--os26-edge-soft); border-radius: 999px; background: linear-gradient(180deg, rgba(255,255,255,.34), rgba(102,108,122,.16)); box-shadow: inset 0 1px rgba(255,255,255,.42), inset 0 -2px 4px rgba(0,0,0,.17), 0 2px 6px rgba(35,47,82,.10); }
.os26-range-row input[type='range']::-moz-range-progress { height: 8px; border-radius: 999px; background: linear-gradient(180deg, rgba(255,255,255,.28), transparent), rgba(var(--os26-accent), .88); box-shadow: inset 0 1px rgba(255,255,255,.36), 0 0 8px rgba(var(--os26-accent),.18); }
.os26-range-row input[type='range']::-moz-range-thumb { width: 24px; height: 24px; border: 1px solid rgba(255,255,255,.88); border-radius: 50%; background: radial-gradient(circle at 32% 18%, #fff 0 7%, transparent 15%), linear-gradient(145deg, rgba(255,255,255,.96), rgba(205,220,255,.80)); box-shadow: inset 0 2px 3px rgba(255,255,255,.70), inset 0 -4px 6px rgba(59,76,128,.18), 0 5px 13px rgba(34,46,88,.30); transition: transform .14s ease; }

.os26-file-button { justify-self: start; position: relative; margin-top: 10px; padding: 9px 13px; border: 1px solid var(--os26-edge-soft); border-radius: 14px; background: linear-gradient(145deg, rgba(255,255,255,.18), transparent), var(--os26-lens-fill); box-shadow: inset 0 1px rgba(255,255,255,.38), inset 0 -1px var(--os26-edge-dark), 0 4px 12px rgba(0,0,0,.06); -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .38)) saturate(var(--os26-saturation)); backdrop-filter: blur(calc(var(--os26-blur) * .38)) saturate(var(--os26-saturation)); font-size: 11px; cursor: pointer; transition: transform .16s ease, background-color .16s ease; }
.os26-file-button:hover { background: var(--os26-control-hover); }
.os26-file-button:active { transform: scale(.97); }
.os26-file-button input { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
.os26-file-button:focus-within { outline: 3px solid #526dff; outline-offset: 2px; }
.os26-settings :is(input, select, button):focus-visible { outline: 3px solid #526dff; outline-offset: 2px; }

.os26-settings-actions { display: flex; flex-wrap: wrap; gap: 9px; }
.os26-settings-actions button { min-height: 40px; padding: 9px 14px; border: 1px solid rgba(255,255,255,.42); border-radius: 14px; color: #fff; background: linear-gradient(145deg, #7798ff, #5168e9); box-shadow: inset 0 1px rgba(255,255,255,.50), inset 0 -1px rgba(29,42,130,.30), 0 7px 18px rgba(67,91,222,.22); font-weight: 700; cursor: pointer; transition: transform .16s ease, filter .16s ease, box-shadow .16s ease; }
.os26-settings-actions button:hover { filter: brightness(1.06); box-shadow: inset 0 1px rgba(255,255,255,.58), 0 9px 22px rgba(67,91,222,.28); }
.os26-settings-actions button:active { transform: scale(.97); }
.os26-settings-actions button.secondary { color: var(--dsw-alias-label-primary, #17213a); border-color: var(--os26-edge-soft); background: linear-gradient(145deg, rgba(255,255,255,.18), transparent), var(--os26-lens-fill); box-shadow: inset 0 1px rgba(255,255,255,.38), inset 0 -1px var(--os26-edge-dark), 0 4px 12px rgba(0,0,0,.06); -webkit-backdrop-filter: blur(calc(var(--os26-blur) * .38)) saturate(var(--os26-saturation)); backdrop-filter: blur(calc(var(--os26-blur) * .38)) saturate(var(--os26-saturation)); }
.os26-warning, .os26-notice { margin: 0; padding: 11px 13px; border-radius: 15px; font-size: 11px; line-height: 1.5; overflow-wrap: anywhere; }
.os26-warning { color: #754700; border: 1px solid rgba(221,148,30,.34); background: linear-gradient(145deg, rgba(255,202,98,.20), rgba(255,177,43,.10)); box-shadow: inset 0 1px rgba(255,255,255,.28); }
.os26-notice { color: var(--dsw-alias-label-secondary, #59657a); border: 1px solid var(--os26-edge-soft); background: var(--os26-control); }
.os26-disclaimer { margin: 0; color: var(--dsw-alias-label-secondary, #667085); font-size: 10px; line-height: 1.5; overflow-wrap: anywhere; }

:root[data-os26-quality='eco'] [data-composer-card],
:root[data-os26-quality='eco'] .os26-status-capsule,
:root[data-os26-quality='eco'] .os26-activity-surface,
:root[data-os26-quality='eco'] .os26-attention-surface,
:root[data-os26-quality='eco'] .os26-receipt-surface,
:root[data-os26-quality='eco'] .os26-settings fieldset,
:root[data-os26-opaque='true'] [data-composer-card],
:root[data-os26-opaque='true'] .os26-status-capsule,
:root[data-os26-opaque='true'] .os26-activity-surface,
:root[data-os26-opaque='true'] .os26-attention-surface,
:root[data-os26-opaque='true'] .os26-receipt-surface,
:root[data-os26-backdrop='fallback'] [data-composer-card],
:root[data-os26-backdrop='fallback'] .os26-status-capsule {
  background: var(--os26-surface-solid) !important;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}
:root[data-os26-quality='eco'] [data-slot='sidebar'] > *,
:root[data-os26-opaque='true'] [data-slot='sidebar'] > *,
:root[data-os26-backdrop='fallback'] [data-slot='sidebar'] > *,
:root[data-os26-quality='eco'] [data-slot='sidebar.settings'] [role='dialog'],
:root[data-os26-opaque='true'] [data-slot='sidebar.settings'] [role='dialog'],
:root[data-os26-backdrop='fallback'] [data-slot='sidebar.settings'] [role='dialog'],
:root[data-os26-quality='eco'] [role='dialog']:has(.os26-settings),
:root[data-os26-opaque='true'] [role='dialog']:has(.os26-settings),
:root[data-os26-backdrop='fallback'] [role='dialog']:has(.os26-settings),
:root[data-os26-quality='eco'] body > [role='menu']:has([role='menuitem'] span > span > span + span),
:root[data-os26-opaque='true'] body > [role='menu']:has([role='menuitem'] span > span > span + span),
:root[data-os26-backdrop='fallback'] body > [role='menu']:has([role='menuitem'] span > span > span + span) {
  background: var(--os26-surface-solid) !important;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}
:root[data-os26-quality='eco'] [data-slot='sidebar.settings'] [role='presentation'],
:root[data-os26-opaque='true'] [data-slot='sidebar.settings'] [role='presentation'],
:root[data-os26-backdrop='fallback'] [data-slot='sidebar.settings'] [role='presentation'] {
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}
:root[data-os26-quality='eco'] [data-goal-bar] > div,
:root[data-os26-quality='eco'] [data-approval-key] > div,
:root[data-os26-quality='eco'] [data-question-key] > section,
:root[data-os26-quality='eco'] [data-plan-review-key] > section,
:root[data-os26-opaque='true'] [data-goal-bar] > div,
:root[data-os26-opaque='true'] [data-approval-key] > div,
:root[data-os26-opaque='true'] [data-question-key] > section,
:root[data-os26-opaque='true'] [data-plan-review-key] > section,
:root[data-os26-backdrop='fallback'] [data-goal-bar] > div,
:root[data-os26-backdrop='fallback'] [data-approval-key] > div,
:root[data-os26-backdrop='fallback'] [data-question-key] > section,
:root[data-os26-backdrop='fallback'] [data-plan-review-key] > section {
  background: var(--os26-surface-solid) !important;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}
:root[data-os26-quality='eco'] [data-composer-card]::before,
:root[data-os26-quality='eco'] [data-slot='sidebar'] > *::before,
:root[data-os26-quality='eco'] .os26-status-capsule::before,
:root[data-os26-quality='eco'] .os26-activity-surface::before,
:root[data-os26-quality='eco'] .os26-attention-surface::before,
:root[data-os26-quality='eco'] .os26-receipt-surface::before,
:root[data-os26-quality='eco'] .os26-settings-hero::before,
:root[data-os26-quality='eco'] .os26-settings fieldset::before,
:root[data-os26-quality='eco'] [data-slot='sidebar.settings'] [role='dialog']::before,
:root[data-os26-quality='eco'] [role='dialog']:has(.os26-settings)::before,
:root[data-os26-quality='eco'] body > [role='menu']:has([role='menuitem'] span > span > span + span)::before,
:root[data-os26-opaque='true'] [data-composer-card]::before,
:root[data-os26-opaque='true'] [data-slot='sidebar'] > *::before,
:root[data-os26-opaque='true'] .os26-status-capsule::before,
:root[data-os26-opaque='true'] .os26-activity-surface::before,
:root[data-os26-opaque='true'] .os26-attention-surface::before,
:root[data-os26-opaque='true'] .os26-receipt-surface::before,
:root[data-os26-opaque='true'] .os26-settings-hero::before,
:root[data-os26-opaque='true'] .os26-settings fieldset::before,
:root[data-os26-opaque='true'] [data-slot='sidebar.settings'] [role='dialog']::before,
:root[data-os26-opaque='true'] [role='dialog']:has(.os26-settings)::before,
:root[data-os26-opaque='true'] body > [role='menu']:has([role='menuitem'] span > span > span + span)::before,
:root[data-os26-backdrop='fallback'] [data-composer-card]::before,
:root[data-os26-backdrop='fallback'] [data-slot='sidebar'] > *::before,
:root[data-os26-backdrop='fallback'] .os26-activity-surface::before,
:root[data-os26-backdrop='fallback'] .os26-attention-surface::before,
:root[data-os26-backdrop='fallback'] .os26-receipt-surface::before,
:root[data-os26-backdrop='fallback'] .os26-settings fieldset::before,
:root[data-os26-backdrop='fallback'] [data-slot='sidebar.settings'] [role='dialog']::before,
:root[data-os26-backdrop='fallback'] [role='dialog']:has(.os26-settings)::before,
:root[data-os26-backdrop='fallback'] body > [role='menu']:has([role='menuitem'] span > span > span + span)::before {
  display: none;
  filter: none;
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
  :root[data-dsh-os26='on'] *, :root[data-dsh-os26='on'] *::before, :root[data-dsh-os26='on'] *::after { scroll-behavior: auto !important; }
  :root[data-dsh-os26='on'] .os26-state-mark,
  :root[data-dsh-os26='on'] .os26-activity-track i,
  :root[data-dsh-os26='on'] .os26-activity-surface,
  :root[data-dsh-os26='on'] .os26-attention-surface,
  :root[data-dsh-os26='on'] .os26-receipt-surface { animation: none; transition: none; }
  :root[data-dsh-os26='on'] [data-tool][data-state='running'] [data-expandable]::after { animation: none !important; }
}

@media (prefers-reduced-transparency: reduce) {
  :root[data-dsh-os26='on'] { --os26-surface: var(--os26-surface-solid); }
  :root[data-dsh-os26='on'] [data-slot='sidebar'] > *,
  :root[data-dsh-os26='on'] [data-composer-card],
  :root[data-dsh-os26='on'] .os26-status-capsule,
  :root[data-dsh-os26='on'] .os26-activity-surface,
  :root[data-dsh-os26='on'] .os26-attention-surface,
  :root[data-dsh-os26='on'] .os26-receipt-surface,
  :root[data-dsh-os26='on'] .os26-settings fieldset,
  :root[data-dsh-os26='on'] [data-slot='sidebar.settings'] [role='dialog'],
  :root[data-dsh-os26='on'] [data-goal-bar] > div,
  :root[data-dsh-os26='on'] [data-approval-key] > div,
  :root[data-dsh-os26='on'] [data-question-key] > section,
  :root[data-dsh-os26='on'] [data-plan-review-key] > section,
  :root[data-dsh-os26='on'] [role='dialog']:has(.os26-settings),
  :root[data-dsh-os26='on'] body > [role='menu']:has([role='menuitem'] span > span > span + span) {
    background: var(--os26-surface-solid) !important;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
  :root[data-dsh-os26='on'] [data-composer-card]::before,
  :root[data-dsh-os26='on'] [data-slot='sidebar'] > *::before,
  :root[data-dsh-os26='on'] .os26-status-capsule::before,
  :root[data-dsh-os26='on'] .os26-activity-surface::before,
  :root[data-dsh-os26='on'] .os26-attention-surface::before,
  :root[data-dsh-os26='on'] .os26-receipt-surface::before,
  :root[data-dsh-os26='on'] .os26-settings-hero::before,
  :root[data-dsh-os26='on'] .os26-settings fieldset::before,
  :root[data-dsh-os26='on'] [data-slot='sidebar.settings'] [role='dialog']::before,
  :root[data-dsh-os26='on'] [role='dialog']:has(.os26-settings)::before,
  :root[data-dsh-os26='on'] body > [role='menu']:has([role='menuitem'] span > span > span + span)::before {
    display: none;
    filter: none;
  }
  :root[data-dsh-os26='on'] [data-slot='sidebar.settings'] [role='presentation'] {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

@media (max-width: 720px) {
  :root[data-dsh-os26='on'] [role='dialog']:has(.os26-settings) {
    width: calc(100vw - 16px) !important;
    max-width: calc(100vw - 16px) !important;
    border-radius: 22px !important;
  }
  :root[data-dsh-os26='on'] [data-slot='sidebar.settings'] [role='presentation']:has(.os26-settings) {
    width: calc(100vw - 8px) !important;
  }
  :root[data-dsh-os26='on'] [data-composer-card] { border-radius: 22px !important; }
  .os26-overlay-stack { right: 12px; bottom: 12px; }
  .os26-status-capsule.is-expanded, .os26-activity-surface, .os26-attention-surface, .os26-receipt-surface { width: min(290px, calc(100vw - 24px)); }
  .os26-composer-detail { display: none; }
  .os26-settings { gap: 13px; padding-inline: 0; }
  .os26-settings-hero { border-radius: 20px; padding: 15px; }
  .os26-settings fieldset { border-radius: 19px; padding-inline: 14px; }
}

@media (max-width: 560px) {
  .os26-setting-row { display: grid; gap: 8px; padding: 11px 0; }
  .os26-setting-row:has(.os26-toggle) { grid-template-columns: minmax(0, 1fr) auto; align-items: center; }
  .os26-select-shell { width: 100%; min-width: 0; }
  .os26-settings-actions { display: grid; grid-template-columns: 1fr; }
  .os26-settings-actions button { width: 100%; }
  :root[data-dsh-os26='on'] body > [role='menu']:has([role='menuitem'] span > span > span + span) {
    width: calc(100vw - 16px) !important;
    max-width: calc(100vw - 16px) !important;
    border-radius: 18px !important;
  }
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
var KNOWN_FULL_SHELL_THEMES = [
	"dsh-liquid-glass",
	"dsh-theme-lab",
	"dsh-skin-glass",
	"silk-background"
];
var OVERFLOW_SURFACES = [
	"[data-composer-card]",
	"[data-slot=\"sidebar\"]",
	"[data-goal-bar]",
	"[data-tool][data-variant]",
	"[data-approval-key]",
	"[data-question-key]",
	"[data-plan-review-key]"
].join(",");
var OVERFLOW_CANDIDATES = "span,strong,small,p,label,button,code";
/** Add a native full-copy affordance only where a supported semantic surface
* actually clips visible text. Existing product titles are never overwritten. */
function installOverflowTitles(root, enabled, environment = globalThis) {
	const owned = /* @__PURE__ */ new Set();
	let frame;
	const clear = (element) => {
		if (element.getAttribute?.("data-os26-overflow-title") !== "true") return;
		element.removeAttribute("data-os26-overflow-title");
		element.removeAttribute("title");
		owned.delete(element);
	};
	const clearAll = () => {
		for (const element of [...owned]) clear(element);
	};
	const sync = () => {
		if (!enabled()) {
			clearAll();
			return;
		}
		const seen = /* @__PURE__ */ new Set();
		for (const surface of root.querySelectorAll?.(OVERFLOW_SURFACES) ?? []) for (const element of surface.querySelectorAll(OVERFLOW_CANDIDATES)) {
			seen.add(element);
			const style = environment.getComputedStyle?.(element);
			const ellipsized = style?.textOverflow === "ellipsis";
			const clamped = Boolean(style?.webkitLineClamp && style.webkitLineClamp !== "none");
			const clipped = element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
			const text = element.textContent?.replace(/\s+/g, " ").trim();
			if ((ellipsized || clamped) && clipped && text && !element.hasAttribute("title")) {
				element.setAttribute("title", text);
				element.setAttribute("data-os26-overflow-title", "true");
				owned.add(element);
			} else if ((!clipped || !ellipsized && !clamped) && owned.has(element)) clear(element);
		}
		for (const element of [...owned]) if (!seen.has(element) || !element.isConnected) clear(element);
	};
	const schedule = () => {
		if (frame !== void 0) return;
		if (typeof environment.requestAnimationFrame !== "function") {
			sync();
			return;
		}
		frame = environment.requestAnimationFrame(() => {
			frame = void 0;
			sync();
		});
	};
	const Observer = environment.MutationObserver;
	const observer = typeof Observer === "function" ? new Observer(schedule) : null;
	observer?.observe(root, {
		childList: true,
		subtree: true,
		characterData: true,
		attributes: true,
		attributeFilter: [
			"style",
			"class",
			"aria-expanded",
			"data-state"
		]
	});
	environment.addEventListener?.("resize", schedule, { passive: true });
	schedule();
	return () => {
		observer?.disconnect();
		environment.removeEventListener?.("resize", schedule);
		if (frame !== void 0) environment.cancelAnimationFrame?.(frame);
		clearAll();
	};
}
/** Restore keyboard flow after the host removes a native decision surface. The
* host currently leaves focus on BODY, so we only intervene for that exact
* orphaned state and never steal focus from another control or decision. */
function installInteractionFocusReturn(root, enabled, environment = globalThis) {
	const first = (selector) => root.querySelectorAll?.(selector)?.[0];
	const surfaceSelector = "[data-approval-key], [data-question-key], [data-plan-review-key]";
	let hadInteraction = Boolean(first(surfaceSelector));
	let frame;
	const sync = () => {
		const hasInteraction = Boolean(first(surfaceSelector));
		if (hadInteraction && !hasInteraction && enabled()) {
			if (frame !== void 0) environment.cancelAnimationFrame?.(frame);
			let attempts = 0;
			const restore = () => {
				frame = void 0;
				const active = environment.document?.activeElement;
				const orphaned = !active || active === environment.document?.body || active === environment.document?.documentElement;
				const conflictingSurface = first(surfaceSelector);
				const composer = first("[data-composer-card] textarea:not(:disabled)");
				if (!orphaned || conflictingSurface) return;
				if (composer) {
					composer.focus({ preventScroll: true });
					return;
				}
				attempts += 1;
				if (attempts < 6 && typeof environment.requestAnimationFrame === "function") frame = environment.requestAnimationFrame(restore);
			};
			frame = typeof environment.requestAnimationFrame === "function" ? environment.requestAnimationFrame(restore) : (restore(), void 0);
		}
		hadInteraction = hasInteraction;
	};
	const Observer = environment.MutationObserver;
	const observer = typeof Observer === "function" ? new Observer(sync) : null;
	observer?.observe(root, {
		childList: true,
		subtree: true
	});
	return () => {
		observer?.disconnect();
		if (frame !== void 0) environment.cancelAnimationFrame?.(frame);
	};
}
function themeCompatibility(snapshot) {
	const detected = [snapshot?.active?.id, ...(snapshot?.themes ?? []).map((theme) => theme?.id)].filter((id) => typeof id === "string").find((id) => ![
		"light",
		"dark",
		"system"
	].includes(id) || KNOWN_FULL_SHELL_THEMES.some((name) => id.includes(name)));
	if (detected) return `检测到另一套主题“${detected}”。建议只保留一套全局主题 Token，避免透明度和文字颜色叠加。`;
	return "兼容提示：DSH 官方主题 API 无法识别仅覆盖 Token、但不注册主题名称的插件；请勿同时启用两套全局玻璃主题。";
}
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
			if (!config.enabled) {
				clearMaterialRoot(root);
				root.dataset.dshOs26 = "off";
				return;
			}
			applyMaterialRoot(root, config, caps);
			tokenOff = ctx.theme.overrideTokens(name, materialTokens(config));
			if (config.wallpaper === "custom" && config.customWallpaper) sampleWallpaperLuminance(config.customWallpaper).then((luminance) => {
				if (currentGeneration !== generation) return;
				root.style.setProperty("--os26-luminance", String(luminance));
				root.style.setProperty("--os26-opacity", String(effectiveOpacity(config, luminance)));
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
			const config = configStore.getSnapshot();
			if (frame || !config.enabled || config.quality === "eco") return;
			frame = requestAnimationFrame(() => {
				frame = void 0;
				if (!configStore.getSnapshot().enabled) return;
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
	ctx.effect(() => {
		const dispose = installOverflowTitles(root, () => configStore.getSnapshot().enabled);
		const off = configStore.subscribe(() => window.dispatchEvent(new Event("resize")));
		return () => {
			off();
			dispose();
		};
	}, "dsh-os26: clipped text affordances");
	ctx.effect(() => installInteractionFocusReturn(root, () => configStore.getSnapshot().enabled), "dsh-os26: native interaction focus return");
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
	const compatibility = themeCompatibility(ctx.theme.getTheme?.());
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
exports.installInteractionFocusReturn = installInteractionFocusReturn;
exports.installOverflowTitles = installOverflowTitles;
exports.name = name;
exports.themeCompatibility = themeCompatibility;

    return module.exports;
  }
});

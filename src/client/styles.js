export const OS26_STYLES = String.raw`
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
`

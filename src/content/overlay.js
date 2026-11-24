'use strict';

(() => {
  if (window.__StyleSniperOverlay) return;

  const HOST_ID = 'stylesniper-shadow-host';

  const STYLES = `
    :host {
      all: initial !important;
      position: fixed !important;
      inset: 0 !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      font-family: ui-monospace, 'SFMono-Regular', 'JetBrains Mono', 'Cascadia Code', Menlo, Consolas, monospace !important;
      color: #E2E8F0 !important;
      -webkit-font-smoothing: antialiased !important;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .ss-layer {
      position: fixed;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }

    /* Box Model Overlays */
    .ss-box-margin {
      position: fixed;
      background: rgba(245, 158, 11, 0.14);
      border: 1px dashed rgba(245, 158, 11, 0.7);
      pointer-events: none;
      display: none;
    }

    .ss-box-padding {
      position: fixed;
      background: rgba(16, 185, 129, 0.16);
      border: 1px solid rgba(16, 185, 129, 0.55);
      pointer-events: none;
      display: none;
    }

    .ss-box-content {
      position: fixed;
      background: rgba(56, 189, 248, 0.16);
      border: 1.5px solid #38BDF8;
      pointer-events: none;
      display: none;
    }

    .ss-box-pinned {
      position: fixed;
      border: 2px solid #F59E0B;
      box-shadow: 0 0 0 1px rgba(9, 11, 15, 0.8), 0 0 14px rgba(245, 158, 11, 0.25);
      pointer-events: none;
      display: none;
    }

    .ss-tag-pill {
      position: fixed;
      background: #090B0F;
      color: #38BDF8;
      border: 1px solid #262C36;
      border-radius: 4px;
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 600;
      line-height: 1.4;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      display: none;
      pointer-events: none;
      z-index: 5;
    }

    .ss-tag-pill .ss-dim {
      color: #94A3B8;
      margin-left: 6px;
      font-weight: 500;
    }

    /* Redline Measurement SVG */
    .ss-redline-svg {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 6;
    }

    /* Floating Precision HUD Card */
    .ss-hud {
      position: fixed;
      width: 356px;
      max-width: calc(100vw - 24px);
      background: #090B0F;
      border: 1px solid #262C36;
      border-radius: 8px;
      box-shadow: 0 18px 42px rgba(0, 0, 0, 0.72), 0 0 0 1px rgba(255, 255, 255, 0.03) inset;
      color: #E2E8F0;
      font-size: 12px;
      line-height: 1.45;
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 10;
      pointer-events: none;
    }

    .ss-hud.pinned {
      pointer-events: auto;
      border-color: #F59E0B;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(245, 158, 11, 0.25);
    }

    .ss-hud-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 9px 11px;
      background: #141820;
      border-bottom: 1px solid #262C36;
    }

    .ss-hud-title {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      flex: 1;
    }

    .ss-hud-selector {
      color: #38BDF8;
      font-weight: 700;
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ss-hud-size {
      color: #94A3B8;
      font-size: 11px;
      flex-shrink: 0;
    }

    .ss-status-badge {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 2px 6px;
      border-radius: 3px;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .ss-status-live {
      background: rgba(56, 189, 248, 0.14);
      color: #38BDF8;
      border: 1px solid rgba(56, 189, 248, 0.35);
    }

    .ss-status-pinned {
      background: rgba(245, 158, 11, 0.16);
      color: #F59E0B;
      border: 1px solid rgba(245, 158, 11, 0.45);
    }

    .ss-status-editing {
      background: rgba(16, 185, 129, 0.16);
      color: #10B981;
      border: 1px solid rgba(16, 185, 129, 0.45);
    }

    .ss-icon-btn {
      background: transparent;
      border: 1px solid #262C36;
      color: #94A3B8;
      border-radius: 4px;
      width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 12px;
      line-height: 1;
      transition: all 0.12s ease;
    }

    .ss-icon-btn:hover {
      background: #1E2430;
      color: #F8FAFC;
      border-color: #3B4454;
    }

    /* Meta Metrics Grid */
    .ss-meta-grid {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      padding: 9px 11px;
      border-bottom: 1px solid #262C36;
      background: #0D1017;
    }

    .ss-font-line {
      font-size: 11px;
      color: #CBD5E1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ss-font-sub {
      font-size: 10px;
      color: #64748B;
      margin-top: 2px;
    }

    .ss-swatches {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 6px;
      flex-wrap: wrap;
    }

    .ss-swatch-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #141820;
      border: 1px solid #262C36;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 10px;
      color: #CBD5E1;
    }

    .ss-swatch-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      flex-shrink: 0;
    }

    .ss-wcag-badge {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
      padding: 4px 8px;
      border-radius: 5px;
      border: 1px solid #262C36;
      background: #141820;
      min-width: 74px;
    }

    .ss-wcag-ratio {
      font-size: 12px;
      font-weight: 700;
      color: #F8FAFC;
    }

    .ss-wcag-grade {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-top: 1px;
    }

    .ss-wcag-pass {
      border-color: rgba(16, 185, 129, 0.45);
      background: rgba(16, 185, 129, 0.1);
    }

    .ss-wcag-pass .ss-wcag-grade {
      color: #10B981;
    }

    .ss-wcag-fail {
      border-color: rgba(239, 68, 68, 0.45);
      background: rgba(239, 68, 68, 0.1);
    }

    .ss-wcag-fail .ss-wcag-grade {
      color: #F87171;
    }

    /* Code Tabs & Preview */
    .ss-tabs-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 11px 0;
      background: #090B0F;
      border-bottom: 1px solid #262C36;
    }

    .ss-tabs {
      display: flex;
      gap: 2px;
    }

    .ss-tab {
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: #64748B;
      font-family: inherit;
      font-size: 11px;
      font-weight: 600;
      padding: 5px 9px 7px;
      cursor: pointer;
      transition: color 0.12s ease, border-color 0.12s ease;
    }

    .ss-tab:hover {
      color: #CBD5E1;
    }

    .ss-tab.active {
      color: #38BDF8;
      border-bottom-color: #38BDF8;
    }

    .ss-copy-btn {
      background: #141820;
      border: 1px solid #262C36;
      color: #10B981;
      font-family: inherit;
      font-size: 10px;
      font-weight: 700;
      padding: 4px 8px;
      margin-bottom: 5px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.12s ease;
    }

    .ss-copy-btn:hover {
      background: rgba(16, 185, 129, 0.14);
      border-color: #10B981;
    }

    .ss-code-box {
      background: #06080B;
      padding: 9px 11px;
      font-size: 11px;
      line-height: 1.5;
      color: #E2E8F0;
      max-height: 124px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
      border-bottom: 1px solid #262C36;
    }

    /* HUD Controls & Shortcut Strip */
    .ss-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      padding: 7px 11px;
      background: #141820;
    }

    .ss-action-group {
      display: flex;
      gap: 5px;
    }

    .ss-mini-btn {
      background: #090B0F;
      border: 1px solid #262C36;
      color: #CBD5E1;
      font-family: inherit;
      font-size: 10px;
      font-weight: 600;
      padding: 4px 7px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.12s ease;
    }

    .ss-mini-btn:hover {
      border-color: #38BDF8;
      color: #38BDF8;
    }

    .ss-mini-btn.active {
      border-color: #10B981;
      color: #10B981;
      background: rgba(16, 185, 129, 0.12);
    }

    .ss-hint-bar {
      padding: 5px 11px;
      background: #090B0F;
      border-top: 1px solid #1E2430;
      font-size: 10px;
      color: #64748B;
      display: flex;
      justify-content: space-between;
      gap: 6px;
    }

    .ss-kbd {
      color: #94A3B8;
      font-weight: 600;
    }

    /* Slide-Over Design System Drawer */
    .ss-drawer {
      position: fixed;
      top: 0;
      right: 0;
      width: 420px;
      max-width: 94vw;
      height: 100vh;
      background: #090B0F;
      border-left: 1px solid #262C36;
      box-shadow: -16px 0 48px rgba(0, 0, 0, 0.78);
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: auto;
      z-index: 20;
    }

    .ss-drawer.open {
      transform: translateX(0);
    }

    .ss-drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      background: #141820;
      border-bottom: 1px solid #262C36;
    }

    .ss-drawer-title {
      font-size: 13px;
      font-weight: 700;
      color: #F8FAFC;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ss-drawer-badge {
      font-size: 10px;
      color: #10B981;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35);
      padding: 1px 6px;
      border-radius: 3px;
    }

    .ss-drawer-tabs {
      display: flex;
      background: #0D1017;
      border-bottom: 1px solid #262C36;
      padding: 0 12px;
      gap: 4px;
    }

    .ss-drawer-tab {
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: #64748B;
      font-family: inherit;
      font-size: 11px;
      font-weight: 600;
      padding: 10px 10px;
      cursor: pointer;
    }

    .ss-drawer-tab.active {
      color: #F59E0B;
      border-bottom-color: #F59E0B;
    }

    .ss-drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 14px 16px;
    }

    .ss-export-row {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .ss-export-btn {
      flex: 1;
      background: #141820;
      border: 1px solid #262C36;
      color: #CBD5E1;
      font-family: inherit;
      font-size: 11px;
      font-weight: 600;
      padding: 7px 10px;
      border-radius: 5px;
      cursor: pointer;
    }

    .ss-export-btn:hover {
      border-color: #38BDF8;
      color: #38BDF8;
    }

    .ss-color-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .ss-color-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px;
      background: #141820;
      border: 1px solid #262C36;
      border-radius: 6px;
      cursor: pointer;
      transition: border-color 0.12s ease;
    }

    .ss-color-card:hover {
      border-color: #38BDF8;
    }

    .ss-color-chip {
      width: 32px;
      height: 32px;
      border-radius: 5px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      flex-shrink: 0;
    }

    .ss-color-info {
      min-width: 0;
      flex: 1;
    }

    .ss-color-hex {
      font-size: 12px;
      font-weight: 700;
      color: #F8FAFC;
    }

    .ss-color-meta {
      font-size: 10px;
      color: #64748B;
      margin-top: 1px;
    }

    .ss-type-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ss-type-card {
      background: #141820;
      border: 1px solid #262C36;
      border-radius: 6px;
      padding: 10px 12px;
    }

    .ss-type-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #38BDF8;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .ss-type-specs {
      font-size: 10px;
      color: #94A3B8;
      margin-bottom: 6px;
    }

    .ss-type-sample {
      color: #E2E8F0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ss-svg-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .ss-svg-card {
      background: #141820;
      border: 1px solid #262C36;
      border-radius: 6px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ss-svg-preview {
      height: 64px;
      background: #090B0F;
      border: 1px solid #1E2430;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      color: #E2E8F0;
      overflow: hidden;
    }

    .ss-svg-preview svg {
      max-width: 100%;
      max-height: 44px;
      width: auto;
      height: auto;
    }

    .ss-svg-meta {
      font-size: 10px;
      color: #94A3B8;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ss-svg-actions {
      display: flex;
      gap: 6px;
    }

    .ss-svg-btn {
      flex: 1;
      background: #090B0F;
      border: 1px solid #262C36;
      color: #CBD5E1;
      font-family: inherit;
      font-size: 10px;
      font-weight: 600;
      padding: 4px 6px;
      border-radius: 4px;
      cursor: pointer;
    }

    .ss-svg-btn:hover {
      border-color: #10B981;
      color: #10B981;
    }

    .ss-empty {
      color: #64748B;
      font-size: 12px;
      text-align: center;
      padding: 32px 12px;
    }

    /* Toast */
    .ss-toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(16px);
      background: #090B0F;
      border: 1px solid #10B981;
      color: #10B981;
      padding: 7px 14px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.7);
      opacity: 0;
      transition: all 0.16s ease;
      pointer-events: none;
      z-index: 30;
    }

    .ss-toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  `;

  class StyleSniperOverlay {
    constructor() {
      this.host = null;
      this.shadow = null;
      this.activeTab = 'tailwind';
      this.drawerTab = 'colors';
      this.currentCode = { tailwind: '', css: '', jsx: '' };
      this.designData = null;
      this.toastTimer = null;
      this.handlers = {};
    }

    setHandlers(handlers) {
      this.handlers = handlers || {};
    }

    mount() {
      if (this.host && this.host.isConnected) return;

      const existing = document.getElementById(HOST_ID);
      if (existing) existing.remove();

      this.host = document.createElement('div');
      this.host.id = HOST_ID;
      this.host.setAttribute('data-stylesniper', 'true');
      this.shadow = this.host.attachShadow({ mode: 'open' });

      const styleEl = document.createElement('style');
      styleEl.textContent = STYLES;

      const layer = document.createElement('div');
      layer.className = 'ss-layer';
      layer.innerHTML = `
        <div class="ss-box-margin" id="ss-margin"></div>
        <div class="ss-box-padding" id="ss-padding"></div>
        <div class="ss-box-content" id="ss-content"></div>
        <div class="ss-box-pinned" id="ss-pinned"></div>
        <div class="ss-tag-pill" id="ss-tag-pill"></div>
        <svg class="ss-redline-svg" id="ss-redline-svg" xmlns="http://www.w3.org/2000/svg"></svg>

        <div class="ss-hud" id="ss-hud">
          <div class="ss-hud-header">
            <div class="ss-hud-title">
              <span class="ss-hud-selector" id="ss-hud-selector">div</span>
              <span class="ss-hud-size" id="ss-hud-size">0 × 0</span>
            </div>
            <span class="ss-status-badge ss-status-live" id="ss-status-badge">LIVE</span>
            <button class="ss-icon-btn" id="ss-close-btn" title="Exit StyleSniper (Esc)">×</button>
          </div>

          <div class="ss-meta-grid">
            <div style="min-width:0">
              <div class="ss-font-line" id="ss-font-line">Inter • 14px • 500</div>
              <div class="ss-font-sub" id="ss-font-sub">line-height: 20px</div>
              <div class="ss-swatches" id="ss-swatches"></div>
            </div>
            <div class="ss-wcag-badge ss-wcag-pass" id="ss-wcag-badge">
              <span class="ss-wcag-ratio" id="ss-wcag-ratio">12.4:1</span>
              <span class="ss-wcag-grade" id="ss-wcag-grade">AAA</span>
            </div>
          </div>

          <div class="ss-tabs-bar">
            <div class="ss-tabs">
              <button class="ss-tab active" data-tab="tailwind">Tailwind</button>
              <button class="ss-tab" data-tab="css">CSS</button>
              <button class="ss-tab" data-tab="jsx">JSX</button>
            </div>
            <button class="ss-copy-btn" id="ss-copy-btn">Copy (C)</button>
          </div>

          <pre class="ss-code-box" id="ss-code-box"></pre>

          <div class="ss-actions">
            <div class="ss-action-group">
              <button class="ss-mini-btn" id="ss-parent-btn" title="Select Parent (ArrowUp)">↑ Parent</button>
              <button class="ss-mini-btn" id="ss-child-btn" title="Select Child (ArrowDown)">↓ Child</button>
              <button class="ss-mini-btn" id="ss-edit-btn" title="Live Text Edit (E)">✎ Edit</button>
            </div>
            <button class="ss-mini-btn" id="ss-drawer-btn" title="Extract Page Design System">Design System</button>
          </div>

          <div class="ss-hint-bar">
            <span><span class="ss-kbd">Click/Space</span> Pin</span>
            <span><span class="ss-kbd">Alt</span> Redline</span>
            <span><span class="ss-kbd">E</span> Edit</span>
            <span><span class="ss-kbd">Esc</span> Exit</span>
          </div>
        </div>

        <aside class="ss-drawer" id="ss-drawer">
          <div class="ss-drawer-header">
            <div class="ss-drawer-title">
              <span>StyleSniper Design System</span>
              <span class="ss-drawer-badge" id="ss-scan-time">0ms</span>
            </div>
            <button class="ss-icon-btn" id="ss-drawer-close" title="Close Drawer">×</button>
          </div>
          <div class="ss-drawer-tabs">
            <button class="ss-drawer-tab active" data-dtab="colors" id="ss-dtab-colors">Colors (0)</button>
            <button class="ss-drawer-tab" data-dtab="typography" id="ss-dtab-type">Typography (0)</button>
            <button class="ss-drawer-tab" data-dtab="svgs" id="ss-dtab-svgs">SVGs (0)</button>
          </div>
          <div class="ss-drawer-body" id="ss-drawer-body"></div>
        </aside>

        <div class="ss-toast" id="ss-toast">Copied!</div>
      `;

      this.shadow.appendChild(styleEl);
      this.shadow.appendChild(layer);
      (document.documentElement || document.body).appendChild(this.host);

      this.cacheElements();
      this.bindInternalEvents();
    }

    cacheElements() {
      const $ = (id) => this.shadow.getElementById(id);
      this.el = {
        margin: $('ss-margin'),
        padding: $('ss-padding'),
        content: $('ss-content'),
        pinned: $('ss-pinned'),
        tagPill: $('ss-tag-pill'),
        redlineSvg: $('ss-redline-svg'),
        hud: $('ss-hud'),
        selector: $('ss-hud-selector'),
        size: $('ss-hud-size'),
        statusBadge: $('ss-status-badge'),
        closeBtn: $('ss-close-btn'),
        fontLine: $('ss-font-line'),
        fontSub: $('ss-font-sub'),
        swatches: $('ss-swatches'),
        wcagBadge: $('ss-wcag-badge'),
        wcagRatio: $('ss-wcag-ratio'),
        wcagGrade: $('ss-wcag-grade'),
        copyBtn: $('ss-copy-btn'),
        codeBox: $('ss-code-box'),
        parentBtn: $('ss-parent-btn'),
        childBtn: $('ss-child-btn'),
        editBtn: $('ss-edit-btn'),
        drawerBtn: $('ss-drawer-btn'),
        drawer: $('ss-drawer'),
        drawerClose: $('ss-drawer-close'),
        scanTime: $('ss-scan-time'),
        dtabColors: $('ss-dtab-colors'),
        dtabType: $('ss-dtab-type'),
        dtabSvgs: $('ss-dtab-svgs'),
        drawerBody: $('ss-drawer-body'),
        toast: $('ss-toast')
      };
    }

    bindInternalEvents() {
      this.shadow.querySelectorAll('.ss-tab').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.setCodeTab(btn.dataset.tab);
        });
      });

      this.shadow.querySelectorAll('.ss-drawer-tab').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.drawerTab = btn.dataset.dtab;
          this.shadow.querySelectorAll('.ss-drawer-tab').forEach((b) => {
            b.classList.toggle('active', b.dataset.dtab === this.drawerTab);
          });
          this.renderDrawerBody();
        });
      });

      this.el.copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.handlers.onCopy) this.handlers.onCopy(this.activeTab);
      });

      this.el.closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.handlers.onExit) this.handlers.onExit();
      });

      this.el.parentBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.handlers.onNavigateParent) this.handlers.onNavigateParent();
      });

      this.el.childBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.handlers.onNavigateChild) this.handlers.onNavigateChild();
      });

      this.el.editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.handlers.onToggleEdit) this.handlers.onToggleEdit();
      });

      this.el.drawerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.handlers.onOpenDrawer) this.handlers.onOpenDrawer();
      });

      this.el.drawerClose.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeDrawer();
      });
    }

    isInsideOverlay(target) {
      return Boolean(this.host && (target === this.host || this.host.contains(target)));
    }

    setCodeTab(tab) {
      if (!['tailwind', 'css', 'jsx'].includes(tab)) return;
      this.activeTab = tab;
      if (!this.shadow) return;
      this.shadow.querySelectorAll('.ss-tab').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
      });
      this.el.codeBox.textContent = this.currentCode[tab] || '';
      const labelMap = { tailwind: 'Copy Tailwind (C)', css: 'Copy CSS (C)', jsx: 'Copy JSX (C)' };
      this.el.copyBtn.textContent = labelMap[tab];
    }

    getActiveCode() {
      return this.currentCode[this.activeTab] || '';
    }

    formatSelector(el) {
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : '';
      let cls = '';
      if (typeof el.className === 'string' && el.className.trim()) {
        cls = '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.');
      }
      return `${tag}${id}${cls}`;
    }

    renderBoxModel(el) {
      if (!el || !this.el) return;
      const rect = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);

      const mt = parseFloat(cs.marginTop) || 0;
      const mr = parseFloat(cs.marginRight) || 0;
      const mb = parseFloat(cs.marginBottom) || 0;
      const ml = parseFloat(cs.marginLeft) || 0;

      const pt = parseFloat(cs.paddingTop) || 0;
      const pr = parseFloat(cs.paddingRight) || 0;
      const pb = parseFloat(cs.paddingBottom) || 0;
      const pl = parseFloat(cs.paddingLeft) || 0;

      const bt = parseFloat(cs.borderTopWidth) || 0;
      const br = parseFloat(cs.borderRightWidth) || 0;
      const bb = parseFloat(cs.borderBottomWidth) || 0;
      const bl = parseFloat(cs.borderLeftWidth) || 0;

      // Margin box
      this.el.margin.style.display = 'block';
      this.el.margin.style.top = `${rect.top - mt}px`;
      this.el.margin.style.left = `${rect.left - ml}px`;
      this.el.margin.style.width = `${Math.max(0, rect.width + ml + mr)}px`;
      this.el.margin.style.height = `${Math.max(0, rect.height + mt + mb)}px`;

      // Padding box (border-box minus borders)
      this.el.padding.style.display = 'block';
      this.el.padding.style.top = `${rect.top + bt}px`;
      this.el.padding.style.left = `${rect.left + bl}px`;
      this.el.padding.style.width = `${Math.max(0, rect.width - bl - br)}px`;
      this.el.padding.style.height = `${Math.max(0, rect.height - bt - bb)}px`;

      // Content box
      this.el.content.style.display = 'block';
      this.el.content.style.top = `${rect.top + bt + pt}px`;
      this.el.content.style.left = `${rect.left + bl + pl}px`;
      this.el.content.style.width = `${Math.max(0, rect.width - bl - br - pl - pr)}px`;
      this.el.content.style.height = `${Math.max(0, rect.height - bt - bb - pt - pb)}px`;

      // Tag pill
      const pill = this.el.tagPill;
      pill.style.display = 'block';
      pill.innerHTML = `${this.escapeHtml(this.formatSelector(el))}<span class="ss-dim">${Math.round(rect.width)} × ${Math.round(rect.height)}</span>`;
      const pillTop = rect.top - 26 > 6 ? rect.top - 26 : rect.bottom + 6;
      const pillLeft = Math.max(6, Math.min(window.innerWidth - 220, rect.left));
      pill.style.top = `${pillTop}px`;
      pill.style.left = `${pillLeft}px`;
    }

    renderPinnedBox(pinnedEl) {
      if (!this.el) return;
      if (!pinnedEl || !pinnedEl.isConnected) {
        this.el.pinned.style.display = 'none';
        return;
      }
      const rect = pinnedEl.getBoundingClientRect();
      this.el.pinned.style.display = 'block';
      this.el.pinned.style.top = `${rect.top}px`;
      this.el.pinned.style.left = `${rect.left}px`;
      this.el.pinned.style.width = `${rect.width}px`;
      this.el.pinned.style.height = `${rect.height}px`;
    }

    renderHud(el, { pinned = false, editing = false } = {}) {
      if (!el || !this.el) return;
      const rect = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      const compiler = window.__StyleSniperCompiler;
      const contrast = window.__StyleSniperContrast;

      const compiled = compiler ? compiler.compileElement(el) : { tailwind: '', css: '', jsx: '' };
      const wcag = contrast ? contrast.evaluateElement(el) : null;
      this.currentCode = compiled;

      this.el.selector.textContent = this.formatSelector(el);
      this.el.size.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}px`;

      // Status pill
      const badge = this.el.statusBadge;
      badge.className = 'ss-status-badge';
      if (editing) {
        badge.classList.add('ss-status-editing');
        badge.textContent = 'EDITING';
      } else if (pinned) {
        badge.classList.add('ss-status-pinned');
        badge.textContent = 'PINNED';
      } else {
        badge.classList.add('ss-status-live');
        badge.textContent = 'LIVE';
      }

      this.el.editBtn.classList.toggle('active', editing);
      this.el.hud.classList.toggle('pinned', pinned || editing);

      // Typography info
      const family = (cs.fontFamily || 'system-ui').split(',')[0].replace(/['"]/g, '').trim();
      const fSize = Math.round(parseFloat(cs.fontSize) || 16);
      const fWeight = cs.fontWeight || '400';
      const lh = cs.lineHeight === 'normal' ? 'normal' : `${Math.round(parseFloat(cs.lineHeight))}px`;
      this.el.fontLine.textContent = `${family} · ${fSize}px · ${fWeight}`;
      this.el.fontSub.textContent = `line-height: ${lh} · display: ${cs.display}`;

      // Swatches & WCAG
      if (wcag) {
        this.el.swatches.innerHTML = `
          <span class="ss-swatch-chip"><span class="ss-swatch-dot" style="background:${wcag.fgHex}"></span>FG ${wcag.fgHex}</span>
          <span class="ss-swatch-chip"><span class="ss-swatch-dot" style="background:${wcag.bgHex}"></span>BG ${wcag.bgHex}</span>
        `;
        this.el.wcagRatio.textContent = wcag.formatted;
        this.el.wcagGrade.textContent = `WCAG ${wcag.grade}`;
        this.el.wcagBadge.className = `ss-wcag-badge ${wcag.pass ? 'ss-wcag-pass' : 'ss-wcag-fail'}`;
      }

      this.setCodeTab(this.activeTab);

      // Show and smartly clamp HUD within viewport
      const hud = this.el.hud;
      hud.style.display = 'flex';
      const hudRect = hud.getBoundingClientRect();
      const hudW = hudRect.width || 356;
      const hudH = hudRect.height || 310;
      const gap = 14;

      let left = rect.right + gap;
      let top = rect.top;

      // Flip left if clipped on right
      if (left + hudW > window.innerWidth - 12) {
        left = rect.left - hudW - gap;
      }
      // If still clipped (wide element), align inside right/bottom
      if (left < 12) {
        left = Math.max(12, Math.min(window.innerWidth - hudW - 12, rect.left));
        top = rect.bottom + gap;
      }
      // Flip above if clipped on bottom
      if (top + hudH > window.innerHeight - 12) {
        top = Math.max(12, window.innerHeight - hudH - 12);
      }
      if (top < 12) top = 12;

      hud.style.left = `${Math.round(left)}px`;
      hud.style.top = `${Math.round(top)}px`;
    }

    renderRedlines(anchorEl, targetEl) {
      if (!this.el) return;
      const svg = this.el.redlineSvg;
      if (!anchorEl || !targetEl || anchorEl === targetEl) {
        svg.innerHTML = '';
        return;
      }

      const a = anchorEl.getBoundingClientRect();
      const b = targetEl.getBoundingClientRect();
      const lines = [];

      const drawLine = (x1, y1, x2, y2, label) => {
        const dist = Math.round(Math.hypot(x2 - x1, y2 - y1));
        if (dist < 1) return;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const text = label || `${dist}px`;
        const boxW = Math.max(34, text.length * 7 + 10);
        const horiz = Math.abs(y2 - y1) < 1;

        // End caps
        const cap = horiz
          ? `<line x1="${x1}" y1="${y1 - 4}" x2="${x1}" y2="${y1 + 4}" stroke="#F59E0B" stroke-width="1.5"/>
             <line x1="${x2}" y1="${y2 - 4}" x2="${x2}" y2="${y2 + 4}" stroke="#F59E0B" stroke-width="1.5"/>`
          : `<line x1="${x1 - 4}" y1="${y1}" x2="${x1 + 4}" y2="${y1}" stroke="#F59E0B" stroke-width="1.5"/>
             <line x1="${x2 - 4}" y1="${y2}" x2="${x2 + 4}" y2="${y2}" stroke="#F59E0B" stroke-width="1.5"/>`;

        lines.push(`
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="3,2"/>
          ${cap}
          <rect x="${mx - boxW / 2}" y="${my - 9}" width="${boxW}" height="18" rx="3" fill="#090B0F" stroke="#F59E0B" stroke-width="1"/>
          <text x="${mx}" y="${my + 3.5}" text-anchor="middle" fill="#F59E0B" font-size="10" font-weight="700" font-family="ui-monospace, monospace">${text}</text>
        `);
      };

      const aMidX = a.left + a.width / 2;
      const aMidY = a.top + a.height / 2;
      const bMidX = b.left + b.width / 2;
      const bMidY = b.top + b.height / 2;

      // Check containment (nested inset redlines)
      const bInsideA = b.left >= a.left && b.right <= a.right && b.top >= a.top && b.bottom <= a.bottom;
      const aInsideB = a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom;

      if (bInsideA || aInsideB) {
        const inner = bInsideA ? b : a;
        const outer = bInsideA ? a : b;
        const midX = inner.left + inner.width / 2;
        const midY = inner.top + inner.height / 2;
        drawLine(midX, outer.top, midX, inner.top);
        drawLine(midX, inner.bottom, midX, outer.bottom);
        drawLine(outer.left, midY, inner.left, midY);
        drawLine(inner.right, midY, outer.right, midY);
      } else {
        // Horizontal gap
        if (b.left > a.right) {
          const y = Math.max(Math.min(aMidY, b.bottom), b.top);
          drawLine(a.right, y, b.left, y);
        } else if (a.left > b.right) {
          const y = Math.max(Math.min(aMidY, b.bottom), b.top);
          drawLine(b.right, y, a.left, y);
        }

        // Vertical gap
        if (b.top > a.bottom) {
          const x = Math.max(Math.min(aMidX, b.right), b.left);
          drawLine(x, a.bottom, x, b.top);
        } else if (a.top > b.bottom) {
          const x = Math.max(Math.min(aMidX, b.right), b.left);
          drawLine(x, b.bottom, x, a.top);
        }

        // Fallback edge offsets if overlapping
        if (lines.length === 0) {
          drawLine(a.left, aMidY, b.left, aMidY);
          drawLine(aMidX, a.top, aMidX, b.top);
        }
      }

      svg.innerHTML = lines.join('');
    }

    clearRedlines() {
      if (this.el && this.el.redlineSvg) {
        this.el.redlineSvg.innerHTML = '';
      }
    }

    hideInspector() {
      if (!this.el) return;
      this.el.margin.style.display = 'none';
      this.el.padding.style.display = 'none';
      this.el.content.style.display = 'none';
      this.el.pinned.style.display = 'none';
      this.el.tagPill.style.display = 'none';
      this.el.hud.style.display = 'none';
      this.clearRedlines();
    }

    openDrawer(data) {
      this.mount();
      this.designData = data;
      this.el.scanTime.textContent = `${data.durationMs}ms`;
      this.el.dtabColors.textContent = `Colors (${data.colors.length})`;
      this.el.dtabType.textContent = `Typography (${data.typography.length})`;
      this.el.dtabSvgs.textContent = `SVGs (${data.svgs.length})`;
      this.renderDrawerBody();
      this.el.drawer.classList.add('open');
    }

    closeDrawer() {
      if (this.el && this.el.drawer) {
        this.el.drawer.classList.remove('open');
      }
    }

    isDrawerOpen() {
      return Boolean(this.el && this.el.drawer && this.el.drawer.classList.contains('open'));
    }

    renderDrawerBody() {
      if (!this.designData || !this.el) return;
      const body = this.el.drawerBody;
      const extractor = window.__StyleSniperExtractor;

      if (this.drawerTab === 'colors') {
        if (!this.designData.colors.length) {
          body.innerHTML = '<div class="ss-empty">No colors detected on this page.</div>';
          return;
        }
        const cards = this.designData.colors
          .map(
            (c) => `
            <div class="ss-color-card" data-copy-hex="${this.escapeHtml(c.hex)}" title="Click to copy ${this.escapeHtml(c.hex)}">
              <div class="ss-color-chip" style="background:${this.escapeHtml(c.hex)}"></div>
              <div class="ss-color-info">
                <div class="ss-color-hex">${this.escapeHtml(c.hex)}</div>
                <div class="ss-color-meta">${c.count}× · ${this.escapeHtml(c.roles.join('/'))}</div>
              </div>
            </div>
          `
          )
          .join('');

        body.innerHTML = `
          <div class="ss-export-row">
            <button class="ss-export-btn" id="ss-exp-css">Copy :root CSS</button>
            <button class="ss-export-btn" id="ss-exp-tw">Copy tailwind.config.js</button>
          </div>
          <div class="ss-color-grid">${cards}</div>
        `;

        body.querySelectorAll('.ss-color-card').forEach((card) => {
          card.addEventListener('click', () => {
            if (this.handlers.onCopyText) {
              this.handlers.onCopyText(card.dataset.copyHex, `Copied ${card.dataset.copyHex}`);
            }
          });
        });

        const expCss = body.querySelector('#ss-exp-css');
        const expTw = body.querySelector('#ss-exp-tw');
        if (expCss && extractor) {
          expCss.addEventListener('click', () => {
            this.handlers.onCopyText(extractor.toCssVariables(this.designData.colors), 'Copied :root CSS Variables');
          });
        }
        if (expTw && extractor) {
          expTw.addEventListener('click', () => {
            this.handlers.onCopyText(extractor.toTailwindConfig(this.designData.colors), 'Copied tailwind.config.js');
          });
        }
      } else if (this.drawerTab === 'typography') {
        if (!this.designData.typography.length) {
          body.innerHTML = '<div class="ss-empty">No text styles detected on this page.</div>';
          return;
        }
        body.innerHTML = `<div class="ss-type-list">${this.designData.typography
          .map(
            (t) => `
            <div class="ss-type-card">
              <div class="ss-type-head">
                <span>${this.escapeHtml(t.family)}</span>
                <span>${t.sizePx}px / ${this.escapeHtml(t.weight)}</span>
              </div>
              <div class="ss-type-specs">line-height: ${this.escapeHtml(t.lineHeight)} · ${t.count} elements</div>
              <div class="ss-type-sample" style="font-size:${Math.min(22, Math.max(12, t.sizePx))}px;font-weight:${this.escapeHtml(t.weight)}">${this.escapeHtml(t.sample)}</div>
            </div>
          `
          )
          .join('')}</div>`;
      } else if (this.drawerTab === 'svgs') {
        if (!this.designData.svgs.length) {
          body.innerHTML = '<div class="ss-empty">No inline SVG icons found on this page.</div>';
          return;
        }
        body.innerHTML = `<div class="ss-svg-grid">${this.designData.svgs
          .map(
            (s, idx) => `
            <div class="ss-svg-card">
              <div class="ss-svg-preview">${s.markup}</div>
              <div class="ss-svg-meta" title="${this.escapeHtml(s.name)}">${this.escapeHtml(s.name)} · ${s.width}×${s.height} · ${(s.sizeBytes / 1024).toFixed(1)}KB</div>
              <div class="ss-svg-actions">
                <button class="ss-svg-btn" data-svg-copy="${idx}">Copy SVG</button>
                <button class="ss-svg-btn" data-svg-dl="${idx}">Download</button>
              </div>
            </div>
          `
          )
          .join('')}</div>`;

        body.querySelectorAll('[data-svg-copy]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const item = this.designData.svgs[Number(btn.dataset.svgCopy)];
            if (item && this.handlers.onCopyText) {
              this.handlers.onCopyText(item.markup, `Copied ${item.name}.svg`);
            }
          });
        });

        body.querySelectorAll('[data-svg-dl]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const item = this.designData.svgs[Number(btn.dataset.svgDl)];
            if (item) {
              this.downloadSvg(item.name, item.markup);
              this.showToast(`Downloaded ${item.name}.svg`);
            }
          });
        });
      }
    }

    downloadSvg(name, markup) {
      const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.svg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    showToast(message) {
      if (!this.el || !this.el.toast) return;
      this.el.toast.textContent = message;
      this.el.toast.classList.add('show');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        if (this.el && this.el.toast) {
          this.el.toast.classList.remove('show');
        }
      }, 1700);
    }

    escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    unmount() {
      if (this.host && this.host.isConnected) {
        this.host.remove();
      }
      this.host = null;
      this.shadow = null;
      this.el = null;
    }
  }

  window.__StyleSniperOverlay = new StyleSniperOverlay();
})();

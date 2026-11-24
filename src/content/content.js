'use strict';

(() => {
  if (window.__StyleSniperController) return;

  const overlay = window.__StyleSniperOverlay;
  const extractor = window.__StyleSniperExtractor;

  const state = {
    active: false,
    pinnedEl: null,
    hoveredEl: null,
    editingEl: null,
    altPressed: false,
    preferredFormat: 'tailwind',
    rafId: null,
    pendingPoint: null
  };

  async function copyToClipboard(text, toastLabel) {
    if (!text) return;
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch (_) {
      copied = false;
    }

    if (!copied) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        copied = true;
      } catch (_) {
        copied = false;
      }
    }

    overlay.showToast(copied ? (toastLabel || 'Copied to clipboard') : 'Copy failed — clipboard blocked');
  }

  function notifyBackgroundState() {
    try {
      chrome.runtime.sendMessage({ type: 'XRAY_STATE_CHANGED', active: state.active });
    } catch (_) {
      // Extension context may be invalidated during reload
    }
  }

  function stopEditing() {
    if (state.editingEl) {
      state.editingEl.removeAttribute('contenteditable');
      state.editingEl.style.outline = '';
      state.editingEl = null;
    }
  }

  function toggleEditing() {
    const target = state.pinnedEl || state.hoveredEl;
    if (!target || !target.isConnected) return;

    if (state.editingEl === target) {
      stopEditing();
      overlay.renderHud(target, { pinned: Boolean(state.pinnedEl), editing: false });
      overlay.showToast('Live text edit ended');
      return;
    }

    stopEditing();
    state.pinnedEl = target;
    state.editingEl = target;
    target.setAttribute('contenteditable', 'true');
    target.focus();
    overlay.renderPinnedBox(target);
    overlay.renderHud(target, { pinned: true, editing: true });
    overlay.showToast('Live Edit ON — type directly, press Esc to finish');
  }

  function getActiveTarget() {
    return state.pinnedEl && state.pinnedEl.isConnected
      ? state.pinnedEl
      : state.hoveredEl && state.hoveredEl.isConnected
      ? state.hoveredEl
      : null;
  }

  function selectElement(el, { pin = true } = {}) {
    if (!el || !el.isConnected || el === document.documentElement || el === document.body) return;
    if (overlay.isInsideOverlay(el)) return;
    stopEditing();
    state.hoveredEl = el;
    if (pin) state.pinnedEl = el;
    overlay.renderBoxModel(el);
    overlay.renderPinnedBox(state.pinnedEl);
    overlay.renderHud(el, { pinned: Boolean(state.pinnedEl), editing: false });
  }

  function navigateParent() {
    const cur = getActiveTarget();
    if (!cur || !cur.parentElement || cur.parentElement === document.documentElement) return;
    selectElement(cur.parentElement, { pin: true });
  }

  function navigateChild() {
    const cur = getActiveTarget();
    if (!cur) return;
    for (let i = 0; i < cur.children.length; i++) {
      const child = cur.children[i];
      const rect = child.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        selectElement(child, { pin: true });
        return;
      }
    }
  }

  function updateVisuals() {
    if (!state.active) return;

    const anchor = state.pinnedEl && state.pinnedEl.isConnected ? state.pinnedEl : null;
    const hovered = state.hoveredEl && state.hoveredEl.isConnected ? state.hoveredEl : null;

    if (anchor) {
      overlay.renderPinnedBox(anchor);
    } else {
      overlay.renderPinnedBox(null);
    }

    if (state.altPressed) {
      if (anchor && hovered && anchor !== hovered) {
        overlay.renderBoxModel(hovered);
        overlay.renderRedlines(anchor, hovered);
      } else if (!anchor && hovered && hovered.parentElement) {
        overlay.renderBoxModel(hovered);
        overlay.renderRedlines(hovered.parentElement, hovered);
      } else {
        overlay.clearRedlines();
      }
    } else {
      overlay.clearRedlines();
      const focusEl = anchor || hovered;
      if (focusEl) {
        overlay.renderBoxModel(focusEl);
      }
    }
  }

  function elementAtPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el || overlay.isInsideOverlay(el)) return null;
    if (el === document.documentElement || el === document.body) return null;
    return el;
  }

  function onMouseMove(e) {
    if (!state.active || state.editingEl) return;
    if (overlay.isInsideOverlay(e.target)) return;

    state.pendingPoint = { x: e.clientX, y: e.clientY };
    if (state.rafId) return;

    state.rafId = requestAnimationFrame(() => {
      state.rafId = null;
      if (!state.active || !state.pendingPoint) return;

      const el = elementAtPoint(state.pendingPoint.x, state.pendingPoint.y);
      if (!el) return;

      const changed = el !== state.hoveredEl;
      state.hoveredEl = el;

      if (state.pinnedEl) {
        if (state.altPressed) {
          overlay.renderBoxModel(el);
          overlay.renderRedlines(state.pinnedEl, el);
        }
      } else if (changed) {
        overlay.renderBoxModel(el);
        overlay.renderHud(el, { pinned: false, editing: false });
        if (state.altPressed && el.parentElement) {
          overlay.renderRedlines(el.parentElement, el);
        }
      }
    });
  }

  function onClick(e) {
    if (!state.active || state.editingEl) return;
    if (overlay.isInsideOverlay(e.target)) return;

    e.preventDefault();
    e.stopPropagation();

    const el = elementAtPoint(e.clientX, e.clientY);
    if (!el) return;

    if (state.pinnedEl === el) {
      state.pinnedEl = null;
      overlay.renderPinnedBox(null);
      overlay.renderHud(el, { pinned: false, editing: false });
      overlay.showToast('Unpinned');
    } else {
      state.pinnedEl = el;
      state.hoveredEl = el;
      overlay.renderBoxModel(el);
      overlay.renderPinnedBox(el);
      overlay.renderHud(el, { pinned: true, editing: false });
      overlay.showToast('Pinned — Click tabs to copy or hold Alt for redlines');
    }
  }

  function onKeyDown(e) {
    if (!state.active && !overlay.isDrawerOpen()) return;

    // Allow typing freely inside Live Edit mode except Escape
    if (state.editingEl) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        stopEditing();
        if (state.pinnedEl) {
          overlay.renderHud(state.pinnedEl, { pinned: true, editing: false });
        }
        overlay.showToast('Live text edit saved');
      }
      return;
    }

    // Ignore shortcuts when typing in native page inputs
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) {
      if (e.key !== 'Escape') return;
    }

    if (e.key === 'Alt') {
      if (!state.altPressed) {
        state.altPressed = true;
        updateVisuals();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (overlay.isDrawerOpen()) {
        overlay.closeDrawer();
        if (!state.active) overlay.unmount();
        return;
      }
      if (state.pinnedEl) {
        state.pinnedEl = null;
        overlay.renderPinnedBox(null);
        overlay.clearRedlines();
        if (state.hoveredEl) {
          overlay.renderHud(state.hoveredEl, { pinned: false, editing: false });
        }
        return;
      }
      deactivateXray();
      return;
    }

    if (!state.active) return;

    if (e.code === 'Space') {
      e.preventDefault();
      e.stopPropagation();
      if (state.pinnedEl) {
        state.pinnedEl = null;
        overlay.renderPinnedBox(null);
        if (state.hoveredEl) {
          overlay.renderHud(state.hoveredEl, { pinned: false, editing: false });
        }
        overlay.showToast('Unpinned');
      } else if (state.hoveredEl) {
        state.pinnedEl = state.hoveredEl;
        overlay.renderPinnedBox(state.pinnedEl);
        overlay.renderHud(state.pinnedEl, { pinned: true, editing: false });
        overlay.showToast('Pinned element');
      }
    } else if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      const code = overlay.getActiveCode();
      copyToClipboard(code, `Copied ${overlay.activeTab.toUpperCase()} snippet`);
    } else if (e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      toggleEditing();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateParent();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateChild();
    }
  }

  function onKeyUp(e) {
    if (e.key === 'Alt' && state.altPressed) {
      state.altPressed = false;
      overlay.clearRedlines();
      updateVisuals();
    }
  }

  function onViewportChange() {
    if (!state.active) return;
    const focus = getActiveTarget();
    if (focus) {
      overlay.renderBoxModel(focus);
      overlay.renderPinnedBox(state.pinnedEl);
      overlay.renderHud(focus, { pinned: Boolean(state.pinnedEl), editing: Boolean(state.editingEl) });
    }
  }

  function openDesignDrawer() {
    overlay.mount();
    const data = extractor.extractDesignSystem();
    overlay.openDrawer(data);
  }

  function activateXray(preferredFormat) {
    if (preferredFormat) {
      state.preferredFormat = preferredFormat;
    }
    overlay.mount();
    overlay.setCodeTab(state.preferredFormat);

    if (!state.active) {
      state.active = true;
      window.addEventListener('mousemove', onMouseMove, true);
      window.addEventListener('click', onClick, true);
      window.addEventListener('keydown', onKeyDown, true);
      window.addEventListener('keyup', onKeyUp, true);
      window.addEventListener('scroll', onViewportChange, true);
      window.addEventListener('resize', onViewportChange, true);
      overlay.showToast('StyleSniper X-Ray Active — Hover to inspect, Esc to exit');
    }

    notifyBackgroundState();
  }

  function deactivateXray() {
    stopEditing();
    state.active = false;
    state.pinnedEl = null;
    state.hoveredEl = null;
    state.altPressed = false;

    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }

    window.removeEventListener('mousemove', onMouseMove, true);
    window.removeEventListener('click', onClick, true);
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('keyup', onKeyUp, true);
    window.removeEventListener('scroll', onViewportChange, true);
    window.removeEventListener('resize', onViewportChange, true);

    overlay.hideInspector();
    if (!overlay.isDrawerOpen()) {
      overlay.unmount();
    }
    notifyBackgroundState();
  }

  overlay.setHandlers({
    onCopy: (tab) => {
      copyToClipboard(overlay.getActiveCode(), `Copied ${tab.toUpperCase()} snippet`);
    },
    onCopyText: (text, label) => {
      copyToClipboard(text, label);
    },
    onExit: () => {
      overlay.closeDrawer();
      deactivateXray();
    },
    onNavigateParent: navigateParent,
    onNavigateChild: navigateChild,
    onToggleEdit: toggleEditing,
    onOpenDrawer: openDesignDrawer
  });

  // Load persisted format preference
  try {
    chrome.storage.local.get({ preferredFormat: 'tailwind' }, (res) => {
      if (res && res.preferredFormat) {
        state.preferredFormat = res.preferredFormat;
      }
    });
  } catch (_) {
    // Ignore outside extension context
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message.type !== 'string') return false;

    if (message.type === 'STYLESNIPER_PING') {
      sendResponse({ ready: true });
      return false;
    }

    if (message.type === 'STYLESNIPER_GET_STATE') {
      sendResponse({ active: state.active, drawerOpen: overlay.isDrawerOpen() });
      return false;
    }

    if (message.type === 'STYLESNIPER_TOGGLE_XRAY') {
      if (state.active) {
        deactivateXray();
      } else {
        activateXray(message.preferredFormat);
      }
      sendResponse({ active: state.active });
      return false;
    }

    if (message.type === 'STYLESNIPER_OPEN_DESIGN_DRAWER') {
      openDesignDrawer();
      // Ensure Escape closes drawer even if X-Ray isn't active
      window.addEventListener('keydown', onKeyDown, true);
      sendResponse({ drawerOpen: true });
      return false;
    }

    if (message.type === 'STYLESNIPER_SET_FORMAT') {
      state.preferredFormat = message.preferredFormat || 'tailwind';
      overlay.setCodeTab(state.preferredFormat);
      sendResponse({ ok: true });
      return false;
    }

    return false;
  });

  window.__StyleSniperController = {
    activateXray,
    deactivateXray,
    openDesignDrawer
  };
})();

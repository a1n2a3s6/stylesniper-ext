'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const statusPill = document.getElementById('status-pill');
  const errorBanner = document.getElementById('error-banner');
  const btnXray = document.getElementById('btn-xray');
  const xrayLabel = document.getElementById('xray-label');
  const btnExtractor = document.getElementById('btn-extractor');
  const segButtons = Array.from(document.querySelectorAll('.seg-btn'));

  function showError(msg) {
    errorBanner.textContent = msg;
    errorBanner.hidden = false;
  }

  function clearError() {
    errorBanner.hidden = true;
    errorBanner.textContent = '';
  }

  function updateActiveUi(active) {
    statusPill.textContent = active ? 'ACTIVE' : 'STANDBY';
    statusPill.classList.toggle('active', active);
    btnXray.classList.toggle('active', active);
    xrayLabel.textContent = active ? 'Stop X-Ray Inspector' : 'Launch X-Ray Inspector';
  }

  function updateFormatUi(format) {
    segButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.format === format);
    });
  }

  // Restore persisted copy format
  try {
    const stored = await chrome.storage.local.get({ preferredFormat: 'tailwind' });
    updateFormatUi(stored.preferredFormat || 'tailwind');
  } catch (_) {
    updateFormatUi('tailwind');
  }

  // Query current tab status from service worker
  try {
    const state = await chrome.runtime.sendMessage({ type: 'GET_TAB_STATE' });
    if (state && state.restricted) {
      btnXray.disabled = true;
      btnExtractor.disabled = true;
      showError('Open a regular webpage to inspect styles (browser system pages are restricted).');
    } else if (state && state.ok) {
      updateActiveUi(Boolean(state.active));
    }
  } catch (err) {
    showError(err && err.message ? err.message : 'Unable to connect to background service worker.');
  }

  // Launch / Stop X-Ray
  btnXray.addEventListener('click', async () => {
    clearError();
    const res = await chrome.runtime.sendMessage({ type: 'TOGGLE_XRAY' });
    if (!res || !res.ok) {
      showError((res && res.error) || 'Failed to launch X-Ray Inspector.');
      return;
    }
    updateActiveUi(Boolean(res.active));
    window.close();
  });

  // Open Design System Drawer
  btnExtractor.addEventListener('click', async () => {
    clearError();
    const res = await chrome.runtime.sendMessage({ type: 'OPEN_DESIGN_DRAWER' });
    if (!res || !res.ok) {
      showError((res && res.error) || 'Failed to open Design System Extractor.');
      return;
    }
    window.close();
  });

  // Switch Preferred Copy Format
  segButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const format = btn.dataset.format;
      updateFormatUi(format);
      await chrome.runtime.sendMessage({ type: 'SET_PREFERRED_FORMAT', format });
    });
  });
});

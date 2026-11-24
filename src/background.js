'use strict';

const CONTENT_SCRIPTS = [
  'src/content/contrast.js',
  'src/content/cssToTailwind.js',
  'src/content/designExtractor.js',
  'src/content/overlay.js',
  'src/content/content.js'
];

const RESTRICTED_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'edge://',
  'about:',
  'view-source:',
  'devtools://',
  'https://chrome.google.com/webstore',
  'https://chromewebstore.google.com',
  'https://microsoftedge.microsoft.com/addons'
];

const activeTabs = new Set();

function isRestrictedUrl(url) {
  if (!url) return true;
  return RESTRICTED_PREFIXES.some((prefix) => url.startsWith(prefix));
}

async function setBadgeState(tabId, active) {
  try {
    if (active) {
      activeTabs.add(tabId);
      await chrome.action.setBadgeText({ tabId, text: 'ON' });
      await chrome.action.setBadgeBackgroundColor({ tabId, color: '#10B981' });
      if (chrome.action.setBadgeTextColor) {
        await chrome.action.setBadgeTextColor({ tabId, color: '#090B0F' });
      }
    } else {
      activeTabs.delete(tabId);
      await chrome.action.setBadgeText({ tabId, text: '' });
    }
  } catch (_) {
    // Tab may have closed before badge update completed
  }
}

async function ensureInjected(tabId) {
  try {
    const ping = await chrome.tabs.sendMessage(tabId, { type: 'STYLESNIPER_PING' });
    if (ping && ping.ready) {
      return true;
    }
  } catch (_) {
    // Not injected yet — proceed with injection
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: CONTENT_SCRIPTS
  });

  return true;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

async function toggleXrayOnTab(tab) {
  if (!tab || !tab.id) {
    return { ok: false, error: 'No active tab found.' };
  }
  if (isRestrictedUrl(tab.url)) {
    return { ok: false, error: 'StyleSniper cannot run on browser system pages or extension stores.' };
  }

  try {
    await ensureInjected(tab.id);
    const stored = await chrome.storage.local.get({ preferredFormat: 'tailwind' });
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'STYLESNIPER_TOGGLE_XRAY',
      preferredFormat: stored.preferredFormat || 'tailwind'
    });
    const active = Boolean(response && response.active);
    await setBadgeState(tab.id, active);
    return { ok: true, active };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : 'Failed to inject StyleSniper.' };
  }
}

async function openDesignDrawerOnTab(tab) {
  if (!tab || !tab.id) {
    return { ok: false, error: 'No active tab found.' };
  }
  if (isRestrictedUrl(tab.url)) {
    return { ok: false, error: 'StyleSniper cannot run on browser system pages or extension stores.' };
  }

  try {
    await ensureInjected(tab.id);
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'STYLESNIPER_OPEN_DESIGN_DRAWER'
    });
    return { ok: true, drawerOpen: Boolean(response && response.drawerOpen) };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : 'Failed to open Design Extractor.' };
  }
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-xray') {
    const tab = await getActiveTab();
    if (tab) {
      await toggleXrayOnTab(tab);
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== 'string') {
    return false;
  }

  if (message.type === 'XRAY_STATE_CHANGED' && sender.tab && sender.tab.id) {
    setBadgeState(sender.tab.id, Boolean(message.active));
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === 'TOGGLE_XRAY') {
    (async () => {
      const tab = await getActiveTab();
      const result = await toggleXrayOnTab(tab);
      sendResponse(result);
    })();
    return true;
  }

  if (message.type === 'OPEN_DESIGN_DRAWER') {
    (async () => {
      const tab = await getActiveTab();
      const result = await openDesignDrawerOnTab(tab);
      sendResponse(result);
    })();
    return true;
  }

  if (message.type === 'GET_TAB_STATE') {
    (async () => {
      const tab = await getActiveTab();
      if (!tab || !tab.id) {
        sendResponse({ ok: false, active: false, restricted: true });
        return;
      }
      if (isRestrictedUrl(tab.url)) {
        sendResponse({ ok: true, active: false, restricted: true });
        return;
      }
      let active = activeTabs.has(tab.id);
      try {
        const res = await chrome.tabs.sendMessage(tab.id, { type: 'STYLESNIPER_GET_STATE' });
        if (res && typeof res.active === 'boolean') {
          active = res.active;
          await setBadgeState(tab.id, active);
        }
      } catch (_) {
        active = false;
        activeTabs.delete(tab.id);
      }
      sendResponse({ ok: true, active, restricted: false });
    })();
    return true;
  }

  if (message.type === 'SET_PREFERRED_FORMAT') {
    (async () => {
      const format = ['tailwind', 'css', 'jsx'].includes(message.format) ? message.format : 'tailwind';
      await chrome.storage.local.set({ preferredFormat: format });
      const tab = await getActiveTab();
      if (tab && tab.id && !isRestrictedUrl(tab.url)) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'STYLESNIPER_SET_FORMAT',
            preferredFormat: format
          });
        } catch (_) {
          // Content script not injected yet
        }
      }
      sendResponse({ ok: true, preferredFormat: format });
    })();
    return true;
  }

  return false;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  activeTabs.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    setBadgeState(tabId, false);
  }
});

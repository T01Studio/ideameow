/**
 * IdeaMeow 灵感喵 - Background Service Worker
 * -----------------------------------------------
 * Injects harvester.js into user-customized URLs dynamically.
 */
const STORAGE_KEY = 'ideameow_custom_urls';
const KNOWN_SITES = [
  'chatgpt.com', 'chat.openai.com',
  'kimi.moonshot.cn', 'kimi.com',
  'gemini.google.com',
  'claude.ai',
  'doubao.com',
  'chat.deepseek.com'
];

// Check if URL matches any pattern
function matchesPattern(url, pattern) {
  try {
    // Convert glob-style pattern to regex
    const regexStr = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(regexStr, 'i');
    return regex.test(url);
  } catch (e) {
    return url.includes(pattern);
  }
}

// Check if URL is a known site (already covered by static content_scripts)
function isKnownSite(url) {
  try {
    const hostname = new URL(url).hostname;
    return KNOWN_SITES.some(site => hostname === site || hostname.endsWith('.' + site));
  } catch (e) {
    return false;
  }
}

// Inject harvester.js into a specific tab
function injectHarvester(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['harvester.js']
  }).then(() => {
    console.log('IdeaMeow: Injected harvester into tab', tabId);
  }).catch(err => {
    console.warn('IdeaMeow: Failed to inject harvester:', err.message);
  });
}

// On tab update, check custom URLs and inject if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only act when the page finishes loading
  if (changeInfo.status !== 'complete') return;
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;

  // Skip known sites (already handled by static content_scripts)
  if (isKnownSite(tab.url)) return;

  // Check custom URLs
  chrome.storage.sync.get({ [STORAGE_KEY]: [] }, (data) => {
    const customUrls = data[STORAGE_KEY] || [];
    const shouldInject = customUrls.some(pattern => matchesPattern(tab.url, pattern));

    if (shouldInject) {
      console.log('IdeaMeow: Custom URL match, injecting harvester into', tab.url);
      injectHarvester(tabId);
    }
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CUSTOM_URLS') {
    chrome.storage.sync.get({ [STORAGE_KEY]: [] }, (data) => {
      sendResponse({ urls: data[STORAGE_KEY] || [] });
    });
    return true; // async response
  }

  if (message.type === 'ADD_CUSTOM_URL') {
    const url = message.url.trim();
    if (!url) {
      sendResponse({ success: false, error: 'URL cannot be empty' });
      return false;
    }

    chrome.storage.sync.get({ [STORAGE_KEY]: [] }, (data) => {
      const urls = data[STORAGE_KEY] || [];
      if (urls.includes(url)) {
        sendResponse({ success: false, error: 'This URL pattern already exists' });
        return;
      }
      urls.push(url);
      chrome.storage.sync.set({ [STORAGE_KEY]: urls }, () => {
        sendResponse({ success: true, urls });
      });
    });
    return true;
  }

  if (message.type === 'REMOVE_CUSTOM_URL') {
    const url = message.url;
    chrome.storage.sync.get({ [STORAGE_KEY]: [] }, (data) => {
      const urls = (data[STORAGE_KEY] || []).filter(u => u !== url);
      chrome.storage.sync.set({ [STORAGE_KEY]: urls }, () => {
        sendResponse({ success: true, urls });
      });
    });
    return true;
  }

  if (message.type === 'INJECT_CURRENT') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        injectHarvester(tabs[0].id);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No active tab' });
      }
    });
    return true;
  }
});

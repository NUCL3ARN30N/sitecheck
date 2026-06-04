let technologies = null;

fetch('technologies.json')
  .then(res => res.json())
  .then(data => {
    technologies = data;
    // Reprocess any tabs whose headers arrived before technologies finished loading
    for (const tabId of Object.keys(tabData)) {
      if (Object.keys(tabData[tabId].headers).length > 0 && tabData[tabId].headerDetected.length === 0) {
        processHeadersForTab(Number(tabId));
      }
    }
  })
  .catch(err => console.error('Failed to load technologies.json in background', err));

const tabData = {}; // { tabId: { detected: [], headers: {}, headerDetected: [], emails: [] } }

function initTab(tabId) {
  if (!tabData[tabId]) tabData[tabId] = { detected: [], headers: {}, headerDetected: [], emails: [] };
}

function dedup(items) {
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
}

function extractPattern(str) {
  if (typeof str !== 'string') return str;
  return str.split('\\;')[0];
}

function processHeadersForTab(tabId) {
  const entry = tabData[tabId];
  if (!technologies || !entry?.headers) return;

  const headerDetected = [];
  for (const [techName, techRules] of Object.entries(technologies)) {
    if (!techRules.headers) continue;
    for (const [hName, hPattern] of Object.entries(techRules.headers)) {
      const headerValue = entry.headers[hName.toLowerCase()];
      if (!headerValue) continue;
      const p = extractPattern(hPattern);
      if (!p) {
        headerDetected.push({ name: techName });
      } else {
        try {
          if (new RegExp(p, 'i').test(headerValue)) {
            headerDetected.push({ name: techName });
          }
        } catch {}
      }
    }
  }

  tabData[tabId].headerDetected = headerDetected;
}

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.type === 'main_frame' && details.tabId !== -1) {
      initTab(details.tabId);
      const headers = {};
      details.responseHeaders.forEach(h => {
        headers[h.name.toLowerCase()] = h.value;
      });
      tabData[details.tabId].headers = headers;
      processHeadersForTab(details.tabId);
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SITECHECK_RESULTS') {
    if (sender.tab?.id) {
      initTab(sender.tab.id);
      tabData[sender.tab.id].detected = message.detected;

      const count = dedup([...message.detected, ...(tabData[sender.tab.id].headerDetected)]).length;
      chrome.action.setBadgeText({ text: count > 0 ? String(count) : '', tabId: sender.tab.id });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981', tabId: sender.tab.id });
    }

  } else if (message.type === 'SITECHECK_EMAILS') {
    if (sender.tab?.id) {
      initTab(sender.tab.id);
      tabData[sender.tab.id].emails = message.emails;
    }

  } else if (message.type === 'GET_TAB_DATA') {
    initTab(message.tabId);
    const unique = dedup([
      ...(tabData[message.tabId].detected),
      ...(tabData[message.tabId].headerDetected),
    ]);
    sendResponse({ detected: unique, emails: tabData[message.tabId].emails });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabData[tabId];
});

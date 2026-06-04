(async function() {
  if (window.SITECHECK_INJECTED) return;
  window.SITECHECK_INJECTED = true;

  let technologies = {};
  let detected = [];
  let pendingScan = false;

  const addDetected = (name) => {
    if (!detected.some(item => item.name === name)) {
      detected.push({ name });
    }
  };

  function safeSend(msg) {
    try {
      if (!chrome.runtime?.id) return;
      chrome.runtime.sendMessage(msg, () => void chrome.runtime.lastError);
    } catch {
      // extension context invalidated — orphaned content script, nothing to do
    }
  }

  // Register listener immediately so a RESCAN_DOM that arrives during init is not lost
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'RESCAN_DOM') {
      if (Object.keys(technologies).length > 0) {
        scanDOM();
      } else {
        pendingScan = true;
      }
      sendResponse({ status: 'ok' });
    }
  });

  try {
    const res = await fetch(chrome.runtime.getURL('technologies.json'));
    technologies = await res.json();
  } catch (e) {
    console.error('SiteCheck: failed to load technologies.json', e);
    return;
  }

  function extractPattern(str) {
    if (typeof str !== 'string') return str;
    return str.split('\\;')[0];
  }

  function scanDOM() {
    const htmlContent = document.documentElement.outerHTML;
    const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src || '');
    const metaTags = Array.from(document.querySelectorAll('meta'));

    for (const [techName, techRules] of Object.entries(technologies)) {
      // 1. HTML matches
      if (techRules.html) {
        const patterns = Array.isArray(techRules.html) ? techRules.html : [techRules.html];
        for (const p of patterns) {
          try {
            if (new RegExp(extractPattern(p), 'i').test(htmlContent)) {
              addDetected(techName);
              break;
            }
          } catch {}
        }
      }

      // 2. Script src matches
      if (techRules.scriptSrc) {
        const patterns = Array.isArray(techRules.scriptSrc) ? techRules.scriptSrc : [techRules.scriptSrc];
        for (const p of patterns) {
          try {
            const regex = new RegExp(extractPattern(p), 'i');
            if (scripts.some(src => regex.test(src))) {
              addDetected(techName);
              break;
            }
          } catch {}
        }
      }

      // 3. Meta tag matches
      if (techRules.meta) {
        for (const [metaName, metaContentPattern] of Object.entries(techRules.meta)) {
          const patterns = Array.isArray(metaContentPattern) ? metaContentPattern : [metaContentPattern];
          for (const p of patterns) {
            try {
              const regex = new RegExp(extractPattern(p), 'i');
              const hasMeta = metaTags.some(meta => {
                if ((meta.getAttribute('name') || '').toLowerCase() !== metaName.toLowerCase()) return false;
                const content = meta.getAttribute('content');
                return content ? regex.test(content) : false;
              });
              if (hasMeta) {
                addDetected(techName);
                break;
              }
            } catch {}
          }
        }
      }

      // 4. DOM selectors
      if (techRules.dom) {
        const selectors = Array.isArray(techRules.dom) ? techRules.dom : [techRules.dom];
        for (const sel of selectors) {
          if (typeof sel === 'string') {
            try {
              if (document.querySelector(sel)) {
                addDetected(techName);
                break;
              }
            } catch {}
          }
        }
      }
    }

    // 5. Emails
    const emails = new Set();
    Array.from(document.querySelectorAll('a[href^="mailto:"]')).forEach(a => {
      emails.add(a.href.replace('mailto:', '').split('?')[0]);
    });
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const bodyText = document.body?.innerText ?? '';
    const matches = bodyText.match(emailRegex);
    if (matches) matches.forEach(m => emails.add(m));

    if (emails.size > 0) {
      safeSend({ type: 'SITECHECK_EMAILS', emails: Array.from(emails) });
    }

    // Kick off JS-property scan in the page context via inject.js
    const jsPropsToCheck = {};
    for (const [techName, techRules] of Object.entries(technologies)) {
      if (techRules.js) jsPropsToCheck[techName] = Object.keys(techRules.js);
    }
    window.postMessage({ type: 'SITECHECK_RUN_JS_SCAN', jsPropsToCheck }, '*');

    safeSend({ type: 'SITECHECK_RESULTS', detected });
  }

  // Inject inject.js before scanning so it's ready to receive SITECHECK_RUN_JS_SCAN
  const injectMain = document.createElement('script');
  injectMain.src = chrome.runtime.getURL('inject.js');
  injectMain.onload = function() { this.remove(); };
  (document.head || document.documentElement).appendChild(injectMain);

  const { loadMode } = await new Promise(resolve =>
    chrome.storage.sync.get({ loadMode: 'on-click' }, resolve)
  );

  if (loadMode === 'always' || pendingScan) {
    scanDOM();
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data?.type !== 'SITECHECK_JS_DATA') return;
    if (!chrome.runtime?.id) return;
    const jsDetected = event.data.detected || [];
    jsDetected.forEach(item => addDetected(item.name));
    safeSend({ type: 'SITECHECK_RESULTS', detected });
  });
})();

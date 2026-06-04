document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return;

  if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) return;

  const url = new URL(tab.url);
  const hostname = url.hostname;
  document.getElementById('current-domain').textContent = hostname;

  // Tab switching — use btn from closure so icon clicks don't break targeting
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).classList.add('active');
    });
  });

  let categoriesMap = {};
  let techMap = {};
  let lastResponse = null;

  try {
    const [cats, techs] = await Promise.all([
      fetch('categories.json').then(r => r.json()),
      fetch('technologies.json').then(r => r.json()),
    ]);
    categoriesMap = cats;
    techMap = techs;
    fetchTechData();
  } catch (e) {
    console.error('Failed to load local json', e);
    document.getElementById('loading').textContent = 'Failed to load dataset.';
  }

  document.getElementById('export-csv').addEventListener('click', () => {
    if (lastResponse) exportCSV(hostname, lastResponse.detected);
  });

  function renderTechData(response) {
    document.getElementById('loading').classList.add('hidden');

    if (!response || !response.detected || response.detected.length === 0) {
      document.getElementById('no-results').classList.remove('hidden');
      document.getElementById('results').classList.add('hidden');
      document.getElementById('export-bar').classList.add('hidden');
      return;
    }

    document.getElementById('no-results').classList.add('hidden');
    lastResponse = response;

    const resultsEl = document.getElementById('results');
    const prevScroll = resultsEl.scrollTop;
    resultsEl.innerHTML = '';

    const grouped = {};
    response.detected.forEach(item => {
      const t = techMap[item.name];
      if (!t) return;
      const cats = t.cats?.length ? t.cats : ['other'];
      cats.forEach(catId => {
        const catName = categoriesMap[catId]?.name ?? 'Other';
        if (!grouped[catName]) grouped[catName] = new Set();
        grouped[catName].add(JSON.stringify({ name: item.name, icon: t.icon }));
      });
    });

    resultsEl.classList.remove('hidden');
    document.getElementById('export-bar').classList.remove('hidden');

    for (const category of Object.keys(grouped).sort()) {
      const techArray = Array.from(grouped[category])
        .map(s => JSON.parse(s))
        .sort((a, b) => a.name.localeCompare(b.name));

      const groupEl = document.createElement('div');
      groupEl.className = 'category-group';

      const titleEl = document.createElement('div');
      titleEl.className = 'category-title';
      titleEl.textContent = category;

      const listEl = document.createElement('div');
      listEl.className = 'tech-items-list';

      techArray.forEach(tech => {
        const itemEl = document.createElement('div');
        itemEl.className = 'tech-item';

        if (tech.icon) {
          const img = document.createElement('img');
          img.src = `images/icons/${tech.icon}`;
          img.className = 'tech-icon';
          img.alt = `${tech.name} logo`;
          img.addEventListener('error', () => img.remove());
          itemEl.appendChild(img);
        } else {
          const placeholder = document.createElement('div');
          placeholder.className = 'tech-icon-placeholder';
          itemEl.appendChild(placeholder);
        }

        const nameEl = document.createElement('span');
        nameEl.textContent = tech.name;
        itemEl.appendChild(nameEl);
        listEl.appendChild(itemEl);
      });

      groupEl.appendChild(titleEl);
      groupEl.appendChild(listEl);
      resultsEl.appendChild(groupEl);
    }

    resultsEl.scrollTop = prevScroll;

    const total = response.detected.length;
    const badge = document.getElementById('tech-count');
    badge.textContent = `${total} found`;
    badge.classList.remove('hidden');

    if (response.emails?.length > 0) {
      document.getElementById('val-emails').textContent = response.emails.join(', ');
    }
  }

  function fetchTechData() {
    chrome.runtime.sendMessage({ type: 'GET_TAB_DATA', tabId: tab.id }, (response) => {
      if (chrome.runtime.lastError) {
        renderTechData(null);
        return;
      }
      renderTechData(response);
    });
  }

  function exportCSV(domain, detected) {
    const rows = [['Domain', 'Category', 'Technology']];

    const grouped = {};
    detected.forEach(item => {
      const t = techMap[item.name];
      if (!t) return;
      const cats = t.cats?.length ? t.cats : ['other'];
      cats.forEach(catId => {
        const catName = categoriesMap[catId]?.name ?? 'Other';
        if (!grouped[catName]) grouped[catName] = new Set();
        grouped[catName].add(item.name);
      });
    });

    for (const [cat, names] of Object.entries(grouped).sort()) {
      for (const name of [...names].sort()) {
        rows.push([domain, cat, name]);
      }
    }

    const csv = rows.map(r =>
      r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ).join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `sitecheck-${domain}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }

  chrome.tabs.sendMessage(tab.id, { type: 'RESCAN_DOM' }, () => {
    if (chrome.runtime.lastError) {
      chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SITECHECK_RESULTS' || message.type === 'SITECHECK_EMAILS') {
      fetchTechData();
    }
  });

  fetchDetails(hostname);
});

// Extracts registrar name from a standard RDAP response object
function extractRdapRegistrar(data) {
  // Standard RDAP: find the entity whose roles include "registrar"
  const entity = data.entities?.find(e => e.roles?.includes('registrar'));
  if (entity) {
    // vCard fn field holds the formatted name: [name, params, type, value]
    const fn = entity.vcardArray?.[1]?.find(f => f[0] === 'fn');
    if (fn?.[3]) return fn[3];
    if (entity.ldhName) return entity.ldhName;
  }
  return null;
}

async function fetchRegistrar(hostname) {
  const tld = hostname.split('.').pop().toLowerCase();

  // Try TLD-specific Verisign RDAP first for .com / .net (most reliable)
  if (tld === 'com' || tld === 'net') {
    try {
      const r = await fetch(`https://rdap.verisign.com/${tld}/v1/domain/${hostname}`);
      if (r.ok) {
        const name = extractRdapRegistrar(await r.json());
        if (name) return name;
      }
    } catch {}
  }

  // General RDAP proxy (covers all TLDs)
  try {
    const r = await fetch(`https://rdap.org/domain/${hostname}`);
    if (r.ok) {
      const name = extractRdapRegistrar(await r.json());
      if (name) return name;
    }
  } catch {}

  // Fallback: who-dat WHOIS JSON API
  try {
    const r = await fetch(`https://who-dat.as93.net/${hostname}`);
    if (r.ok) {
      const data = await r.json();
      if (data.registrar?.name) return data.registrar.name;
    }
  } catch {}

  return 'Unknown';
}

async function fetchDetails(hostname) {
  document.getElementById('details-loading').classList.add('hidden');
  document.getElementById('details-content').classList.remove('hidden');

  let firstIp = '';
  try {
    const dnsData = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${hostname}&type=A`,
      { headers: { accept: 'application/dns-json' } }
    ).then(r => r.json());

    const ips = dnsData.Answer?.map(a => a.data).join(', ') ?? 'Not found';
    firstIp = dnsData.Answer?.[0]?.data ?? '';
    document.getElementById('val-dns').textContent = ips;
    document.getElementById('val-ip').textContent = firstIp || 'Unknown';
  } catch {
    document.getElementById('val-dns').textContent = 'Lookup failed';
    document.getElementById('val-ip').textContent = 'Unknown';
  }

  const [geoResult, whoisResult] = await Promise.allSettled([
    firstIp
      ? fetch(`http://ip-api.com/json/${firstIp}`).then(r => r.json())
      : Promise.resolve(null),
    fetchRegistrar(hostname),
  ]);

  const geo = geoResult.status === 'fulfilled' ? geoResult.value : null;
  document.getElementById('val-geo').textContent =
    geo?.status === 'success'
      ? `${geo.city}, ${geo.regionName}, ${geo.country} (${geo.isp})`
      : 'Unavailable';

  document.getElementById('val-whois').textContent =
    whoisResult.status === 'fulfilled' ? whoisResult.value : 'Unknown';
}

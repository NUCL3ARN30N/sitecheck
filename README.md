# SiteCheck

[![Stars](https://img.shields.io/github/stars/NUCL3ARN30N/sitecheck?style=flat-square&color=6c5ce7&labelColor=16161b)](https://github.com/NUCL3ARN30N/sitecheck/stargazers)
[![Forks](https://img.shields.io/github/forks/NUCL3ARN30N/sitecheck?style=flat-square&color=6c5ce7&labelColor=16161b)](https://github.com/NUCL3ARN30N/sitecheck/network/members)
[![Issues](https://img.shields.io/github/issues/NUCL3ARN30N/sitecheck?style=flat-square&color=fd79a8&labelColor=16161b)](https://github.com/NUCL3ARN30N/sitecheck/issues)
[![License](https://img.shields.io/github/license/NUCL3ARN30N/sitecheck?style=flat-square&color=00b894&labelColor=16161b)](LICENSE)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Manifest V3](https://img.shields.io/badge/Manifest_V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
![Firefox](https://img.shields.io/badge/Firefox-FF7139?style=flat-square&logo=firefoxbrowser&logoColor=white)

> Browser extension that identifies technologies used on any website, along with Geo, DNS, and WHOIS details.

## Detection

| Feature | Description |
|---|---|
| **Tech Scanner** | Detects frameworks, CMS platforms, analytics tools, CDNs, and more from 3,000+ technology signatures |
| **Category Grouping** | Groups detected technologies by type — CMS, Analytics, CDN, JavaScript Frameworks, and more |
| **Tech Icons** | Displays the recognizable logo alongside each detected technology |
| **Live Rescan** | Listens for DOM mutations and re-analyzes as the page dynamically loads content |
| **Email Extraction** | Collects any email addresses found within the page source |

## Site Details

| Detail | Description |
|---|---|
| **Geolocation** | City, region, country, and ISP resolved via ip-api |
| **IP Address** | Server IP resolved from the domain's DNS A record |
| **DNS (A Record)** | Full A record lookup via Cloudflare's DoH API |
| **WHOIS / Registrar** | Registrar name via RDAP with who-dat as fallback |
| **Emails Found** | Email addresses scraped from the active tab |

## Installation

**Chrome / Edge / Brave**

1. Clone or download this repository
2. Open `chrome://extensions/`
3. Enable **Developer Mode** (top-right toggle)
4. Click **Load unpacked** and select the repository folder

**Firefox** (128+)

1. Clone or download this repository
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select any file inside the repository folder (e.g. `manifest.json`)

> For a permanent Firefox install, the extension must be signed via [addons.mozilla.org](https://addons.mozilla.org/developers/) - currently not planned

## Requirements

Any modern Chromium-based browser (Chrome, Edge, Brave) or Firefox 128+. No backend required. All detection and analysis runs entirely within your browser.

## Credits

Technology signatures and category data are sourced from [enthec/webappanalyzer](https://github.com/enthec/webappanalyzer).

**Homepage:** [genius-space.org](https://genius-space.org)

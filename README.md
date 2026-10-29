# SiteCheck

[![GitHub stars](https://img.shields.io/github/stars/NUCL3ARN30N/sitecheck?style=for-the-badge)](https://github.com/NUCL3ARN30N/sitecheck/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/NUCL3ARN30N/sitecheck?style=for-the-badge)](https://github.com/NUCL3ARN30N/sitecheck/network/members)
[![GitHub issues](https://img.shields.io/github/issues/NUCL3ARN30N/sitecheck?style=for-the-badge)](https://github.com/NUCL3ARN30N/sitecheck/issues)
[![GitHub license](https://img.shields.io/github/license/NUCL3ARN30N/sitecheck?style=for-the-badge)](LICENSE)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Manifest V3](https://img.shields.io/badge/Manifest%20V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)
![Firefox](https://img.shields.io/badge/Firefox-FF7139?style=for-the-badge&logo=firefoxbrowser&logoColor=white)

> Browser extension that identifies technologies used on any website, along with Geo, DNS, and WHOIS details

## Quick Start

| Browser                   | Steps                                                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Chrome / Edge / Brave** | Clone or download this repo → open `chrome://extensions/` → enable **Developer Mode** → **Load unpacked** → pick the folder   |
| **Firefox** (128+)        | Clone or download this repo → open `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → pick `manifest.json` |

Click the toolbar icon on any page to see what it is built with and where it is hosted.

## Detection

| #  | Feature               | Description                                                                                          |
| -- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| 1  | **Tech Scanner**      | Detects frameworks, CMS platforms, analytics tools, CDNs, and more from 3,000+ technology signatures |
| 2  | **Category Grouping** | Groups detected technologies by type — CMS, Analytics, CDN, JavaScript Frameworks, and more          |
| 3  | **Tech Icons**        | Displays the recognizable logo alongside each detected technology                                    |
| 4  | **Live Rescan**       | Listens for DOM mutations and re-analyzes as the page dynamically loads content                      |
| 5  | **Email Extraction**  | Collects any email addresses found within the page source                                            |

## Site Details

| Detail                | Source                                             |
| --------------------- | -------------------------------------------------- |
| **Geolocation**       | City, region, country, and ISP resolved via ip-api |
| **IP Address**        | Server IP resolved from the domain's DNS A record  |
| **DNS (A Record)**    | Full A record lookup via Cloudflare's DoH API      |
| **WHOIS / Registrar** | Registrar name via RDAP with who-dat as fallback   |
| **Emails Found**      | Email addresses scraped from the active tab        |

## Requirements

**Browser:** Any modern Chromium-based browser (Chrome, Edge, Brave) or Firefox 128+  
**Server:** None — all detection and analysis runs entirely within your browser  
**Signatures:** Technology and category data from [enthec/webappanalyzer](https://github.com/enthec/webappanalyzer)  
**Homepage:** [genius-space.org](https://genius-space.org)

---

Badges from [envoy1084/awesome-badges](https://github.com/envoy1084/awesome-badges)

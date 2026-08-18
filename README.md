# 🛡️ FIREWALL

<p align="center">
  <h1 align="center">FIREWALL — Intelligent Web Application Firewall</h1>
</p>

<p align="center">
  <b>Real-Time Threat Detection • Defensive Blocking • Attack Analytics • Security Monitoring</b>
</p>

<p align="center">
  A defensive cybersecurity platform for detecting, blocking, recording, and visualizing suspicious web-application traffic through a live WAF API and security dashboard.
</p>

<p align="center">
  <a href="https://firewall-dun.vercel.app/dashboard">🌐 Live Dashboard</a> •
  <a href="https://firewall-qaxw.onrender.com/">⚙️ Backend API</a> •
  <a href="https://firewall-qaxw.onrender.com/database.json">📊 Live Events</a> •
  <a href="https://github.com/Neerajupadhayay2004/FIREWALL">💻 Source Code</a>
</p>

---

## 🚀 Live System

| Component | URL / Location | Purpose |
|---|---|---|
| 🖥️ **Frontend Dashboard** | [firewall-dun.vercel.app/dashboard](https://firewall-dun.vercel.app/dashboard) | Real-time threat monitoring and analytics |
| 🛡️ **Backend / WAF API** | [firewall-qaxw.onrender.com](https://firewall-qaxw.onrender.com/) | Flask-based defensive WAF service |
| 📊 **Event Database API** | [/database.json](https://firewall-qaxw.onrender.com/database.json) | Attack/event data consumed by the dashboard |
| 🧪 **Safe WAF Test API** | [/waf-test](https://firewall-qaxw.onrender.com/waf-test) | Authorized defensive security testing |
| 💻 **GitHub Repository** | [FIREWALL](https://github.com/Neerajupadhayay2004/FIREWALL) | Complete source code |

> **Production frontend:** Vercel serves the `Dashboard_v2` Vite application.
>
> **Production backend:** Render runs the Flask application from `BackenFolder` using Gunicorn.

---

## 📌 What Is FIREWALL?

**FIREWALL** is a web-application security monitoring and defensive detection platform. It combines a Python/Flask WAF API with a modern React dashboard to provide a simple end-to-end security workflow:

```text
Incoming / Test Request
        ↓
   Flask WAF API
        ↓
Input Collection
        ↓
Attack Signature Matching
        ↓
 ┌───────────────┐
 │ Suspicious?   │
 └───────┬───────┘
         │
    ┌────┴────┐
    │         │
   YES        NO
    │         │
    ▼         ▼
 BLOCKED    ALLOWED
    │
    ▼
Record Detection
    │
    ▼
database.json
    │
    ▼
Live Dashboard
```

The current WAF uses **defensive signature matching**. It identifies suspicious input, records the detection, and returns a blocked response. It does **not execute attacker-supplied payloads** through the WAF testing endpoint.

---

## ✨ Key Features

### 🛡️ WAF & Detection

- Real-time suspicious-request inspection
- Signature-based attack detection
- Defensive blocking with HTTP `403`
- Attack category classification
- Attacker IP capture
- Endpoint and timestamp recording
- Safe WAF testing endpoint

### 📊 Security Dashboard

- Total attacks detected
- Blocked IP statistics
- Attack-type distribution
- Recent attack activity
- Timeline and trend views
- Geographic threat views
- Blockchain/security-record interface
- Live backend status
- Backend event synchronization

### ⚙️ Backend Reliability

- Flask REST API
- Gunicorn production server
- CORS support for frontend communication
- No-cache response headers for live event data
- Database path resolved relative to `api.py`
- Atomic JSON database writes using a temporary file + replacement

### 🚀 Deployment

- Frontend: **Vercel**
- Backend: **Render**
- Frontend root: `Dashboard_v2`
- Backend root: `BackenFolder`
- SPA routing configured through `Dashboard_v2/vercel.json`

---

## 🎯 Detection Categories

The current backend detection engine contains defensive signatures for:

- **XSS** — Cross-Site Scripting
- **SQLi** — SQL Injection
- **Path Traversal**
- **Command Injection**
- **SSTI** — Server-Side Template Injection
- **SSRF** — Server-Side Request Forgery

The repository also contains broader WAF/security datasets and detection logic for additional security categories such as CSRF, DoS indicators, RCE, phishing, malware, anomaly traffic, Log4j-related indicators, and others.

> Detection coverage is signature-based, not a claim of complete protection against every possible variation of an attack.

---

## 🧱 Technology Stack

### Frontend

- **React 18**
- **TypeScript**
- **Vite 5**
- **Tailwind CSS**
- **React Router DOM**
- **Recharts**
- **Lucide React**
- **Radix UI**
- **React Hook Form**
- **Zod**

The frontend package is configured as a Vite React application with `dev`, `build`, `lint`, and `preview` scripts. fileciteturn53file0L2-L2

### Backend

- **Python 3**
- **Flask**
- **Gunicorn**
- **aiohttp**
- **Requests**
- Python regular expressions for defensive signature matching
- JSON-based event storage

The production requirements include Flask, aiohttp, Requests, and Gunicorn. fileciteturn56file0L2-L2

---

## 🏗️ Architecture

```text
                         ┌─────────────────────────┐
                         │       Security User      │
                         │      / Authorized Test  │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │   Vercel Frontend       │
                         │   Dashboard_v2          │
                         │   React + TypeScript    │
                         └────────────┬────────────┘
                                      │ HTTPS / JSON
                                      ▼
                         ┌─────────────────────────┐
                         │   Render Backend         │
                         │   Flask WAF API         │
                         │   BackenFolder/api.py   │
                         └────────────┬────────────┘
                                      │
                     ┌────────────────┼────────────────┐
                     │                │                │
                     ▼                ▼                ▼
              ┌────────────┐  ┌────────────┐  ┌──────────────┐
              │ Detection  │  │ Event      │  │ JSON Event   │
              │ Signatures │  │ Recording  │  │ Database     │
              └────────────┘  └────────────┘  └──────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │ Dashboard Visualization │
                         │ + Security Analytics    │
                         └─────────────────────────┘
```

---

# 🖥️ Frontend — Dashboard_v2

## Frontend Directory

```text
Dashboard_v2/
```

The application is a Vite + React + TypeScript dashboard. fileciteturn53file0L2-L2

### Local Setup

```bash
cd Dashboard_v2
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

### Lint

```bash
npm run lint
```

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Vercel Configuration

For this repository, configure the Vercel project as follows:

| Setting | Value |
|---|---|
| Framework Preset | **Vite** |
| Root Directory | **Dashboard_v2** |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node.js | **20.x or a project-compatible supported version** |
| Ignored Build Step | **Automatic** |

The SPA rewrite is defined in `Dashboard_v2/vercel.json`, sending application routes to `index.html` so client-side routes such as `/dashboard` can be served correctly. fileciteturn55file0L2-L5

### Production URL

**https://firewall-dun.vercel.app/dashboard**

---

# ⚙️ Backend — Flask WAF API

## Backend Directory

```text
BackenFolder/
```

The backend is a Flask application exposed through Gunicorn in production. The API includes a health endpoint, a defensive WAF testing endpoint, and the JSON event endpoint. fileciteturn54file0L2-L2

## Local Setup — Linux / macOS

```bash
cd BackenFolder
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Start locally:

```bash
python api.py
```

The local server listens on:

```text
http://localhost:5000
```

### Production Start Command

Render:

```bash
gunicorn --bind 0.0.0.0:$PORT api:app
```

The `requirements.txt` includes Gunicorn specifically so the production start command is available in Render. fileciteturn56file0L2-L2

---

## 🌐 Backend API

### `GET /`

Health/status endpoint.

```bash
curl https://firewall-qaxw.onrender.com/
```

Example response:

```json
{
  "status": "online",
  "service": "FIREWALL WAF API",
  "test_endpoint": "/waf-test",
  "database_endpoint": "/database.json"
}
```

### `/waf-test`

Safe defensive testing endpoint.

Supported methods:

```text
GET
POST
PUT
PATCH
DELETE
OPTIONS
```

The endpoint collects request input, checks configured defensive signatures, and records matching events. Suspicious requests are returned as `BLOCKED` with HTTP `403`; payloads are never executed. fileciteturn54file0L2-L2

### `/database.json`

Returns the current WAF event dataset consumed by the dashboard.

```bash
curl https://firewall-qaxw.onrender.com/database.json
```

---

# 🧪 Authorized WAF Testing

> **Only test systems and applications you own or have explicit authorization to assess.**

The easiest browser-based test is to use the dedicated `/waf-test` endpoint. The endpoint is designed to detect suspicious strings rather than execute them.

### Example — XSS Detection

Browser:

```text
https://firewall-qaxw.onrender.com/waf-test?payload=%3Cimg%20src%3Dx%20onerror%3Dalert%28%27XSS-TEST%27%29%3E
```

Or from a terminal:

```bash
curl -i -G \
  --data-urlencode 'payload=<img src=x onerror=alert("XSS-TEST")>' \
  https://firewall-qaxw.onrender.com/waf-test
```

A successful detection should return a response similar to:

```json
{
  "status": "BLOCKED",
  "detected": true,
  "attack_categories": ["xss"],
  "endpoint": "/waf-test",
  "timestamp": "...",
  "attacker_ip": "...",
  "message": "Suspicious input detected and recorded. Payload was not executed.",
  "dashboard": "/database.json"
}
```

The backend implementation explicitly states that the suspicious payload is **not executed**. fileciteturn54file0L2-L2

After a successful test, open the dashboard and look for the newly recorded event:

**https://firewall-dun.vercel.app/dashboard**

---

## 🔍 How Detection Works

The WAF collects multiple parts of an incoming request:

- Request path/query
- Raw request body
- Query-string values
- Form values
- JSON request body

It then compares the collected text against configured regular-expression signatures. fileciteturn54file0L2-L2

Conceptually:

```text
Request
  │
  ├── URL / query
  ├── body
  ├── form data
  └── JSON data
          │
          ▼
   Input Normalization
          │
          ▼
   Signature Matching
          │
      ┌───┴───┐
      │       │
    Match   No Match
      │       │
      ▼       ▼
   BLOCKED   ALLOWED
      │
      ▼
   Record Event
```

Examples of configured defensive indicators include XSS patterns such as script tags, event-handler attributes, JavaScript URLs, and common browser-execution functions; SQLi patterns include UNION/SELECT indicators and suspicious boolean expressions. fileciteturn54file0L2-L2

---

# 📊 Live Event Flow

```text
Authorized Test / Request
          ↓
   Render Flask WAF
          ↓
  Signature Detection
          ↓
   ┌──────────────┐
   │ Attack found │
   └──────┬───────┘
          ↓
       BLOCK
          ↓
   Record IP / Time
   / Endpoint / Type
          ↓
    database.json
          ↓
     Dashboard API
          ↓
   CyberShield UI
```

The backend adds no-cache headers to API responses so clients can request current event data rather than relying on stale cached responses. fileciteturn54file0L2-L2

---

# 📁 Project Structure

```text
FIREWALL/
│
├── README.md
│
├── BackenFolder/
│   ├── api.py                 # Flask WAF API
│   ├── WAF.py                # WAF/detection implementation
│   ├── WAF2.py               # Additional WAF module
│   ├── database.json         # Recorded attack/event data
│   ├── requirements.txt      # Python dependencies
│   ├── waf_config.json       # WAF configuration
│   ├── waf.log               # WAF log output
│   ├── waf_events.log        # Event log
│   └── waf_metrics.json      # WAF metrics
│
├── Dashboard_v2/
│   ├── src/                  # React/TypeScript application
│   ├── public/               # Static assets
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vercel.json           # SPA routing configuration
│
└── Blockchain/
    ├── Blockchain.js
    ├── blockchain_audit.json
    └── database.json
```

> Generated dependency directories such as `node_modules` should not normally be committed to source control. Use `package.json` / lockfiles to reproduce dependencies.

---

# 🔐 Security & Production Notes

FIREWALL is designed for **defensive cybersecurity research, education, and authorized security testing**.

Before treating this as a production-grade WAF, address the following:

### 1. Secrets and private material

Do not commit:

- Private keys
- Certificates containing sensitive material
- API keys
- Passwords
- JWT secrets
- Cloud credentials

The repository currently contains certificate/private-key files under `BackenFolder`; review whether they are intended to be public and rotate/revoke anything sensitive before public production use.

### 2. CORS

The current API uses permissive CORS (`*`) for development/deployment connectivity. Production should restrict `Access-Control-Allow-Origin` to the actual frontend origin.

### 3. Persistent storage

`database.json` is convenient for a demo and controlled deployment, but a production WAF should use a persistent database such as PostgreSQL, MongoDB, or another managed datastore.

### 4. Rate limiting

Add per-IP and per-route rate limiting before exposing sensitive endpoints publicly.

### 5. Authentication

Protect administrative dashboards, event-management APIs, and sensitive operational endpoints with authentication and authorization.

### 6. Logging

Production logs should be shipped to a centralized, persistent logging/SIEM platform instead of relying exclusively on local files.

### 7. Detection quality

Regex signatures are useful for a lightweight defensive layer but are not sufficient by themselves for comprehensive WAF protection. Add normalization, context-aware parsing, anomaly detection, reputation intelligence, and application-specific rules as the project matures.

---

# 🚀 Render Deployment — Backend

Create a **Web Service** from the GitHub repository.

### Exact settings

```text
Language / Runtime: Python 3
Root Directory: BackenFolder
Build Command: pip install -r requirements.txt
Start Command: gunicorn --bind 0.0.0.0:$PORT api:app
```

The backend dependency file is located at `BackenFolder/requirements.txt`. fileciteturn56file0L2-L5

### Backend URL

```text
https://firewall-qaxw.onrender.com
```

After deployment, verify:

```bash
curl https://firewall-qaxw.onrender.com/
curl https://firewall-qaxw.onrender.com/database.json
```

---

# ▲ Vercel Deployment — Frontend

Create/import the repository as a Vercel project.

### Exact settings

```text
Framework Preset: Vite
Root Directory: Dashboard_v2
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Ignored Build Step: Automatic
```

The root directory is important because the frontend application lives under `Dashboard_v2`, not at the repository root.

The included `vercel.json` configures the SPA rewrite to `index.html`. fileciteturn55file0L2-L5

### Frontend URL

```text
https://firewall-dun.vercel.app/dashboard
```

---

# 🧰 Developer Commands

## Frontend

```bash
cd Dashboard_v2
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Backend

```bash
cd BackenFolder
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python api.py
```

## Git

```bash
git status
git add .
git commit -m "Update FIREWALL"
git push origin main
```

---

# 🧪 Troubleshooting

### Vercel shows `404 Page not found` on `/dashboard`

Check:

```text
Root Directory = Dashboard_v2
Framework = Vite
Build Command = npm run build
Output Directory = dist
```

Then redeploy the latest commit.

The repository already contains a Vercel SPA rewrite for client-side routes. fileciteturn55file0L2-L5

### Render says `requirements.txt` not found

Use:

```text
Root Directory = BackenFolder
Build Command = pip install -r requirements.txt
```

### Render says `gunicorn: command not found`

Make sure `BackenFolder/requirements.txt` contains Gunicorn and trigger a fresh deployment. fileciteturn56file0L2-L2

### `/waf-test` returns `BLOCKED`

That is the expected result when a configured defensive signature matches. The endpoint records the event and does not execute the supplied payload. fileciteturn54file0L2-L2

### Dashboard does not show a newly recorded event

1. Confirm the backend is online.
2. Open `/database.json` directly.
3. Confirm the new event exists there.
4. Hard-refresh the dashboard with `Ctrl + Shift + R`.
5. Check that the frontend is configured to use the deployed Render API.

---

# 🗺️ Roadmap

### Current

- [x] Flask WAF API
- [x] Defensive signature detection
- [x] Blocked-response workflow
- [x] JSON event recording
- [x] Live WAF testing endpoint
- [x] React security dashboard
- [x] Vercel SPA routing
- [x] Render/Gunicorn deployment

### Next

- [ ] PostgreSQL/MongoDB persistent event storage
- [ ] Redis rate limiting
- [ ] Authentication and RBAC
- [ ] Restricted production CORS
- [ ] IP reputation and GeoIP enrichment
- [ ] Centralized logging / SIEM integration
- [ ] Alerting and notifications
- [ ] Prometheus/Grafana monitoring
- [ ] CI security testing
- [ ] Docker deployment
- [ ] Advanced anomaly detection
- [ ] Improved request normalization and context-aware detection

---

# 📄 API Summary

| Method | Endpoint | Description | Detection / Data |
|---|---|---|---|
| `GET` | `/` | Health/status | Service information |
| `GET` | `/waf-test` | Safe browser-based WAF test | Yes |
| `POST` | `/waf-test` | Safe programmatic WAF test | Yes |
| `PUT` | `/waf-test` | Safe WAF test | Yes |
| `PATCH` | `/waf-test` | Safe WAF test | Yes |
| `DELETE` | `/waf-test` | Safe WAF test | Yes |
| `OPTIONS` | `/waf-test` | CORS preflight | No |
| `GET` | `/database.json` | Current event database | Read-only |

---

# ⚖️ Responsible Use

This project is intended for:

- Defensive cybersecurity research
- Security education
- Authorized penetration testing
- WAF development and experimentation
- Controlled lab environments

**Do not use this project to attack, scan, exploit, or disrupt systems without explicit authorization.**

---

# 👨‍💻 Author

**Neeraj Upadhayay**

- GitHub: [@Neerajupadhayay2004](https://github.com/Neerajupadhayay2004)
- Repository: [Neerajupadhayay2004/FIREWALL](https://github.com/Neerajupadhayay2004/FIREWALL)

---

<p align="center">
  <b>🛡️ Detect • Block • Record • Analyze</b>
</p>

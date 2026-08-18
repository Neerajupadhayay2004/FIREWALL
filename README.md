# 🛡️ FIREWALL — Intelligent Web Application Firewall

<p align="center">
  <b>Real-Time Web Application Firewall • Threat Detection • Attack Analytics • Blockchain Verification</b>
</p>

<p align="center">
  A defensive cybersecurity platform designed to detect, block, record, and visualize common web attacks in real time.
</p>

---

## 🌐 Live Deployment

| Component | Link |
|---|---|
| 🖥️ **Frontend Dashboard** | [Dashboard_v2](./Dashboard_v2) |
| ⚙️ **Backend / WAF API** | [https://firewall-qaxw.onrender.com](https://firewall-qaxw.onrender.com) |
| 📊 **Live Database API** | [https://firewall-qaxw.onrender.com/database.json](https://firewall-qaxw.onrender.com/database.json) |
| 🧪 **WAF Test Endpoint** | [https://firewall-qaxw.onrender.com/waf-test](https://firewall-qaxw.onrender.com/waf-test) |

> **Frontend:** The production dashboard is the `Dashboard_v2` application and is configured for Vercel deployment. The repository link above is the frontend source when the Vercel deployment URL is not exposed in the repository metadata.

---

## ✨ Features

- 🔥 Real-time Web Application Firewall (WAF)
- 🚨 Automatic suspicious-request detection
- 🛡️ Defensive blocking of detected attacks
- 📈 Live attack statistics and analytics
- 🌐 Attacker IP and endpoint tracking
- 📊 Attack distribution and timeline visualization
- 🗺️ Geographic threat insights
- ⛓️ Blockchain verification interface
- 🧪 Safe WAF testing endpoint
- 📝 Persistent attack/event logging
- ⚡ Live dashboard polling with online/offline status
- 🔐 CORS-enabled API communication between frontend and backend
- 🚀 Production deployment support with Render + Vercel

---

## 🎯 Supported Attack Categories

The defensive detection engine includes signatures for common web-application threats such as:

- Cross-Site Scripting (**XSS**)
- SQL Injection (**SQLi**)
- Path Traversal
- Command Injection
- Server-Side Template Injection (**SSTI**)
- Server-Side Request Forgery (**SSRF**)
- Cross-Site Request Forgery (**CSRF**)
- Remote Code Execution (**RCE**)
- Denial of Service (**DoS**) indicators
- Phishing / malicious URL indicators
- Malware URL indicators
- Anomalous traffic patterns
- Weak-password related detection
- Log4Shell-related indicators

> Detection is signature-based and defensive. Suspicious payloads are identified and recorded; the WAF test endpoint does **not execute attacker-supplied payloads**.

---

## 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │      User / Tester   │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Frontend Dashboard │
                         │   React + TypeScript │
                         │   Vite + Tailwind    │
                         └──────────┬───────────┘
                                    │ HTTPS / JSON
                                    ▼
                         ┌──────────────────────┐
                         │     Render Backend   │
                         │      Flask WAF API   │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  ▼                 ▼                 ▼
          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
          │ Attack       │  │ Event /      │  │ Database     │
          │ Detection    │  │ WAF Logging  │  │ JSON Store   │
          └──────────────┘  └──────────────┘  └──────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ Blockchain Layer     │
                         │ Verification / Audit │
                         └──────────────────────┘
```

---

## 🖥️ Frontend

### Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Recharts
- Lucide React
- shadcn/ui / Radix UI components

### Main Dashboard

The dashboard provides:

- Total attacks detected
- Blocked IP count
- Attack-type statistics
- Blockchain record count
- Recent attack events
- Attack distribution
- Timeline analysis
- Geographic insights
- Blocked IP table
- Live/offline backend status

The dashboard refreshes backend data periodically so newly recorded WAF events can appear without manually refreshing the page.

### Run Frontend Locally

```bash
cd Dashboard_v2
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

### Production Build

```bash
cd Dashboard_v2
npm install
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

## ⚙️ Backend / WAF API

### Tech Stack

- Python 3
- Flask
- Gunicorn
- Regular-expression based attack signatures
- JSON event storage
- HTTP/JSON REST API

### Run Backend Locally

```bash
cd BackenFolder
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python api.py
```

The API will be available at:

```text
http://localhost:5000
```

### Production Server

For Render/Gunicorn deployment:

```bash
gunicorn --bind 0.0.0.0:$PORT api:app
```

---

## 🧪 Safe WAF Testing

The backend exposes a dedicated defensive testing endpoint:

```text
/waf-test
```

Example request:

```bash
curl -i -G \
  --data-urlencode 'q=<script>alert(1)</script>' \
  https://firewall-qaxw.onrender.com/waf-test
```

A matching request is returned as blocked and recorded in the WAF database.

Expected response structure:

```json
{
  "status": "BLOCKED",
  "detected": true,
  "attack_categories": ["xss"],
  "endpoint": "/waf-test",
  "timestamp": "...",
  "attacker_ip": "...",
  "message": "Suspicious input detected and recorded. Payload was not executed."
}
```

### Health Check

```bash
curl https://firewall-qaxw.onrender.com/
```

### Database Endpoint

```bash
curl https://firewall-qaxw.onrender.com/database.json
```

---

## 🔄 Real-Time Data Flow

```text
Test / Incoming Request
        ↓
Flask WAF API
        ↓
Input Collection
        ↓
Attack Signature Matching
        ↓
┌───────────────┐
│ Match Found?  │
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
Record Event
   │
   ▼
database.json
   │
   ▼
Frontend polls API
   │
   ▼
Dashboard updates
```

---

## 📁 Project Structure

```text
FIREWALL/
│
├── BackenFolder/
│   ├── api.py
│   ├── WAF.py
│   ├── WAF2.py
│   ├── database.json
│   ├── waf_config.json
│   ├── waf.log
│   ├── waf_events.log
│   ├── waf_metrics.json
│   └── requirements.txt
│
├── Dashboard_v2/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── pages/
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   ├── vercel.json
│   └── README.md
│
├── Blockchain/
│   ├── Blockchain.js
│   ├── blockchain_audit.json
│   └── database.json
│
└── README.md
```

---

## 🔐 Security Notes

This project is intended for **defensive cybersecurity research, authorized testing, education, and controlled environments**.

### Important

- Never deploy a WAF configuration against systems you do not own or have explicit authorization to test.
- Keep production secrets outside Git.
- Do not commit private keys, certificates, API tokens, passwords, or other credentials.
- Use environment variables for production configuration.
- Restrict CORS to trusted frontend origins in production instead of allowing every origin.
- Put authentication and rate limiting in front of sensitive production endpoints.
- Store production attack data in a proper database rather than relying only on a JSON file.

> **Repository security:** Before making the repository public, review certificate/private-key files and historical commits and rotate any credential that may have been exposed.

---

## 🚀 Deployment

### Backend — Render

Recommended settings:

```text
Runtime: Python
Root Directory: BackenFolder
Build Command: pip install -r requirements.txt
Start Command: gunicorn --bind 0.0.0.0:$PORT api:app
```

Backend:

**https://firewall-qaxw.onrender.com**

### Frontend — Vercel

The frontend application is located in:

```text
Dashboard_v2/
```

Recommended Vercel settings:

```text
Framework: Vite
Root Directory: Dashboard_v2
Build Command: npm run build
Output Directory: dist
```

The SPA rewrite is configured in `Dashboard_v2/vercel.json`.

---

## 🧰 Useful Commands

### Frontend

```bash
cd Dashboard_v2
npm install
npm run dev
npm run lint
npm run build
```

### Backend

```bash
cd BackenFolder
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python api.py
```

### Git

```bash
git status
git add .
git commit -m "Update firewall project"
git push origin main
```

---

## 📊 API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/` | Backend health/status |
| `GET/POST/PUT/PATCH/DELETE` | `/waf-test` | Defensive WAF testing |
| `GET` | `/database.json` | Dashboard attack/event data |

---

## 🧩 Future Improvements

- PostgreSQL/MongoDB event storage
- Redis-based rate limiting
- JWT/API-key authentication
- Per-route request limits
- IP reputation feeds
- GeoIP enrichment
- SIEM integration
- Alerting via email/Slack/Discord
- Prometheus/Grafana monitoring
- Automated security tests in CI/CD
- Containerized deployment with Docker
- Role-based dashboard access

---

## 📜 License

This project is intended for educational, defensive security research, and authorized security testing purposes.

Add an appropriate open-source license to the repository before redistributing the project commercially or as open source.

---

## 👨‍💻 Author

**Neeraj Upadhayay**

GitHub: [@Neerajupadhayay2004](https://github.com/Neerajupadhayay2004)

---

<p align="center">
  <b>🛡️ Detect • Block • Record • Analyze</b>
</p>

# 🛡️ LulaSecSystem

> **Enterprise Security Management Platform** — A comprehensive, role-aware security operations platform with incident management, visitor tracking, real-time surveillance, patrol monitoring, and access control.

![LulaSecSystem](assets/favicon.svg)

## ✨ What is LulaSecSystem?

**LulaSecSystem** is a unified security management platform that brings every aspect of modern security operations into one powerful, beautifully designed application. From a single guard post to a multi-site enterprise, LulaSecSystem scales with your team.

## 🚀 Quick Start

```bash
# Just open the file in any modern browser
open index.html
```

No build step, no dependencies, no server required. The entire demo runs in your browser with realistic mock data.

## 🎬 Try a Demo Account

Click any role below on the login screen, or sign in with:

| Role | Email | What you see |
|------|-------|-------------|
| 🛡️ **Administrator** | `admin@lulasecsystem.com` | Full system: all sites, users, analytics, settings |
| 🎯 **Security Officer** | `officer@lulasecsystem.com` | Command center: incident triage, dispatch, reports |
| 👮 **Security Guard** | `guard@lulasecsystem.com` | Field ops: patrol, reports, comms, panic |
| 🏠 **Resident** | `resident@lulasecsystem.com` | Community: pre-register guests, watch feed |
| 🪪 **Visitor** | `visitor@lulasecsystem.com` | Visit pass QR + host details |

**Password for all accounts:** `Demo1234!`

## 🎯 Core Features

### Standard Features
- 🚨 **Incident Management** — Report, triage, assign, resolve with full audit trails and AI threat scoring
- 🪪 **Visitor Management** — Pre-register guests, generate pass codes, check-in/out workflow
- 👮 **Guard & Patrol Monitoring** — Real-time status, checkpoint scanning, performance ratings
- 📹 **Camera Surveillance** — Live grid with AI detection, online/offline status
- 🔐 **Access Control** — Lock/unlock doors, manage credentials, multi-factor modes
- 📈 **Analytics & Reports** — Custom dashboards with bar/line/donut charts
- 👥 **User Management** — 5 role types with granular permissions
- ⚙️ **System Settings** — Organization, notifications, AI engine, security

### Innovative Features
- 🆘 **One-Tap Panic Button** — Streams live audio & GPS to dispatch in under 2s
- 🤖 **AI Threat Scoring** — Every event scored 0-100 with explainable AI
- 🗺️ **Live Operations Map** — All guards, incidents, cameras on one geo-aware map
- 🗣️ **Voice Dispatch** — Push-to-talk with real-time transcription
- 🌗 **Dark/Light Theme** — Auto-saved user preference
- ⌘K **Quick Search** — Jump to search from anywhere
- 🔔 **Smart Notifications** — Real-time alert panel with priority levels

## 📂 Project Structure

```
LulaSecSystem/
├── index.html          # Main entry — landing page + app shell
├── css/
│   └── styles.css      # Complete design system & components
├── js/
│   ├── data.js         # In-memory mock database
│   ├── auth.js         # Session & login logic
│   └── app.js          # Pages, routing, event handlers
├── assets/
│   └── favicon.svg
└── docs/
    └── index.html      # Full user guide & documentation
```

## 🎨 Tech Stack

- **Zero dependencies** — Pure HTML, CSS, JavaScript
- **No build step** — Just open `index.html`
- **Charts** — Inline SVG (no library needed)
- **State** — In-memory + `sessionStorage` + `localStorage`
- **Fonts** — Inter (UI) + JetBrains Mono (codes)

## 🔐 Security Highlights

- 256-bit AES encryption (production)
- Role-Based Access Control (RBAC) on every action
- 2-Factor Authentication support
- Configurable session timeout (default 30 min)
- Full audit log retention (up to 365 days)
- GDPR-compliant data handling

## 🌐 Browser Support

Chrome 90+, Edge 90+, Firefox 88+, Safari 14+. Mobile browsers fully supported.

## 📖 Documentation

Full user guide, role permissions, workflows, and architecture: see [`docs/index.html`](docs/index.html) or open the in-app **📘 Documentation** modal.

## 📜 License

© 2026 LulaSecSystem — Built for security teams that never sleep.

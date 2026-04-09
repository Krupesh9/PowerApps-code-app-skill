---
name: powerapps-code-app
description: >
  End-to-end scaffold, develop, and deploy Power Apps Code Apps using React + TypeScript + Vite + Tailwind CSS.
  Use this skill whenever the user wants to create a new Power Apps Code App, scaffold a Power Platform project,
  build a canvas app with code-first approach, connect to SharePoint or Dataverse backends, or deploy code apps
  to Power Platform environments (Dev/Test/Prod). Also triggers on: "pac code", "code app", "Power Apps React",
  "vibe code to code app", "build me an app", or any request to create a business application on Power Platform.
  This skill orchestrates the full lifecycle: project planning (via gstack), UI design (via ui-ux-pro-max),
  scaffolding, coding, testing, and deployment guidance. Even simple prompts like "Build me an approval app"
  should trigger this skill.
---

# Power Apps Code App Skill

Build production-grade Power Apps Code Apps from a simple prompt. This skill handles the full lifecycle:
planning → scaffolding → UI design → feature development → testing → deployment.

## Overview

Power Apps Code Apps let you build canvas apps using React + TypeScript instead of the low-code designer.
This skill scaffolds a Vite project wired to the Power Apps SDK, connects SharePoint or Dataverse backends
with a localStorage fallback for local dev, and guides deployment through Dev/Test/Prod environments.

## Prerequisites

Before starting, verify the developer's machine is ready. Run the prerequisite check:

```bash
node scripts/check-prereqs.js
```

If anything fails, guide the user through installation. Required tools:
- Node.js >= 18 and npm
- pac CLI (Power Platform CLI) — from VS Code extension or standalone
- Git

## Workflow — Follow These Phases In Order

### Phase 0: Understand the Request

Read the user's prompt. It might be as simple as "Build me an expense tracker" or a full requirements doc.

1. If the prompt is vague, ask for clarification on: what the app does, who uses it, what data it manages.
2. Suggest a project name (kebab-case, e.g. `expense-tracker`) and app display name (e.g. "Expense Tracker").
3. Determine the backend type: SharePoint or Dataverse. Default to SharePoint unless the user specifies otherwise.

### Phase 1: Plan with gstack (if available)

Check if the `gstack` skill is available. If so, invoke it to create a structured project plan:
- Feature breakdown
- Data model (list columns or table fields)
- Page/component tree
- User flow

If gstack is not available, create a lightweight plan in `docs/PLAN.md` covering the same topics.

Save the plan to `docs/PLAN.md` in the project root.

### Phase 2: Scaffold the Project

Run the scaffolding sequence. Read `references/blueprint.md` for the full technical reference.

```bash
# 1. Create Vite + React + TypeScript project
npm create vite@latest <project-name> -- --template react-ts
cd <project-name>

# 2. Install core dependencies
npm install zustand @microsoft/power-apps

# 3. Install Tailwind CSS v4
npm install tailwindcss @tailwindcss/vite

# 4. Install dev dependencies
npm install -D @types/node
```

Then generate these files from the templates directory (read each template before generating):

| File | Template | Purpose |
|------|----------|---------|
| `src/config.ts` | `templates/config.ts.tmpl` | Centralized env var access |
| `src/services/dataService.ts` | `templates/dataService.ts.tmpl` | Backend abstraction with fallback |
| `src/store/appStore.ts` | `templates/appStore.ts.tmpl` | Zustand global state |
| `.env.example` | `templates/env.example.tmpl` | Committed env template |
| `.env` | (copy of .env.example) | Local env values (gitignored) |
| `power.config.json` | `templates/power.config.json.tmpl` | PAC CLI config (gitignored) |
| `.gitignore` | `templates/gitignore.tmpl` | Must exclude .env and power.config.json |
| `DEPLOYMENT.md` | `templates/DEPLOYMENT.md.tmpl` | Step-by-step deployment guide |
| `docs/GOVERNANCE.md` | `templates/GOVERNANCE.md.tmpl` | Technical standards and governance |
| `docs/TECHNICAL-DESIGN.md` | (generate from plan) | Architecture and design decisions |

After generating files, configure Vite for Tailwind and set port to 3000:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 3000 },
});
```

Update `src/index.css` to import Tailwind:
```css
@import "tailwindcss";
```

### Phase 3: Discover Power Platform Connections

This is critical — guide the user through connecting to their Power Platform environment.
Read `references/connection-discovery.md` for the full interactive flow.

Summary:
1. Ask the user to authenticate: `pac auth create --environment <ENV_ID>`
2. Run `pac connection list` and parse the output
3. Identify the SharePoint or Dataverse connection
4. Extract the full connection ID (e.g., `shared-sharepointonl-xxxxxxxx-...`)
5. Store the short UUID in `.env` and the full ID in a local reference
6. If the user doesn't know their environment ID, guide them: make.powerapps.com → Settings → Session details

### Phase 4: Design the UI (via ui-ux-pro-max if available)

Check if the `ui-ux-pro-max` skill is available. If so, use it for component design.

If not available, follow these Tailwind-first UI principles:
- Clean, professional business app aesthetic
- Consistent spacing scale (use Tailwind's spacing utilities)
- Accessible color contrast (WCAG AA minimum)
- Responsive layout (mobile-friendly for Power Apps mobile player)
- Status badges, loading states, empty states, error boundaries
- Header with app name, environment badge, and user context

Generate the component tree based on the plan from Phase 1:
- `src/components/Layout.tsx` — Shell with header, nav, main content
- `src/components/BackendBadge.tsx` — Shows SharePoint/Local/Dataverse status
- `src/components/EnvBadge.tsx` — Shows DEV/TEST/PROD
- `src/pages/` — One file per page from the plan

### Phase 5: Implement Features

Build out the application based on requirements:

1. Start with the data layer — wire up `dataService.ts` with actual field names from the plan
2. Build pages one at a time, starting with the list/dashboard view
3. Add create/edit forms
4. Add any business logic (approvals, calculations, status flows)
5. Ensure every page works with localStorage fallback

Key patterns to follow (see `references/blueprint.md` for details):
- `import.meta.env.VITE_*` is ONLY used in `config.ts` — everywhere else imports from config
- The data service uses a timeout+fallback pattern — never check `window.powerAppsBridge`
- Generated files in `src/generated/` are NEVER hand-edited

### Phase 6: Test and Deploy

1. **Local smoke test**: `npm run dev` → verify app loads at localhost:3000 with localStorage backend
2. **Build check**: `npm run build` → confirm no TypeScript or build errors
3. **Guide the user through pac CLI deployment**:

```bash
# First-time deploy
pac auth create --environment <ENV_ID>
pac code create --appName "<APP_DISPLAY_NAME>"
# Copy the appId into power.config.json

# Connect data source (SharePoint example)
pac code add-data-source \
  -a "shared_sharepointonline" \
  -c "<FULL_CONNECTION_ID>" \
  -t "<LIST_NAME>" \
  -d "<SP_SITE_URL>"

# Build and push
npm run build
pac code push

# Preview with live data
pac code preview
```

4. Tell the user to open the app in the Power Apps player and verify the backend badge shows the real backend (not "Local").

### Phase 7: Generate Documentation

After the app is working, generate:
- `docs/TECHNICAL-DESIGN.md` — Architecture, data model, component tree, decision log
- `docs/GOVERNANCE.md` — Coding standards, PR checklist, environment promotion rules
- Update `DEPLOYMENT.md` with actual values used

## Key Gotchas (Read Before Coding)

These are hard-won lessons. Violating any of them causes real bugs:

1. **`window.powerAppsBridge` is ALWAYS undefined** — The PA player never sets it. Use timeout+fallback.
2. **Generated `dataSourceName` is lowercase** — `pac code add-data-source` lowercases the table name. Don't change it.
3. **`pac code add-data-source` needs the FULL connection ID** — Not the short UUID from `.env`. Run `pac connection list`.
4. **Vite substitutes .env at BUILD time** — Changing `.env` after build has no effect. Always rebuild.
5. **Import `.ts` extensions explicitly** — `import { X } from '../generated/index.ts'` (Vite needs the extension).
6. **`SP_CONNECTOR_ID` is always `shared_sharepointonline`** — Same across all environments on commercial M365.

## File Reference

- `references/blueprint.md` — Complete technical blueprint (project structure, backend patterns, deployment)
- `references/connection-discovery.md` — Interactive flow for discovering PAC connections
- `templates/` — All scaffold templates
- `scripts/check-prereqs.js` — Prerequisite verification script

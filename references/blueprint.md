# Power Apps Code App — Technical Blueprint

> Complete reference for project structure, backend patterns, environment configuration,
> and deployment workflows. The SKILL.md points here for technical details.

---

## Project Scaffold

### Create a Vite + React + TypeScript project

```bash
npm create vite@latest <project-name> -- --template react-ts
cd <project-name>
npm install
```

### Install required packages

```bash
# State management
npm install zustand

# Power Apps SDK (data connectors)
npm install @microsoft/power-apps

# Tailwind CSS v4
npm install tailwindcss @tailwindcss/vite

# Dev dependencies
npm install -D @types/node
```

> Only add `@xyflow/react` if the app needs a canvas/diagram/flow UI. Don't install it by default.

### Required file structure

```
<project-name>/
├── .env                          ← environment values (gitignored)
├── .env.example                  ← committed template with placeholders
├── power.config.json             ← pac CLI config (gitignored)
├── DEPLOYMENT.md                 ← deployment guide (committed)
├── docs/
│   ├── PLAN.md                   ← project plan from Phase 1
│   ├── GOVERNANCE.md             ← coding standards and governance
│   └── TECHNICAL-DESIGN.md       ← architecture and design decisions
├── src/
│   ├── index.css                 ← Tailwind import: @import "tailwindcss"
│   ├── config.ts                 ← reads .env, exports constants (ONLY place for import.meta.env)
│   ├── services/
│   │   └── dataService.ts        ← backend abstraction (SP/DV + localStorage fallback)
│   ├── store/
│   │   └── appStore.ts           ← Zustand store
│   ├── components/
│   │   ├── Layout.tsx            ← App shell (header, nav, content)
│   │   ├── BackendBadge.tsx      ← Shows active backend (SharePoint/Local/Dataverse)
│   │   └── EnvBadge.tsx          ← Shows environment label (DEV/TEST/PROD)
│   ├── pages/
│   │   └── HomePage.tsx          ← Default landing page
│   ├── generated/                ← pac-generated files (DO NOT HAND-EDIT)
│   │   ├── index.ts
│   │   ├── services/
│   │   └── models/
│   └── App.tsx
├── .power/
│   └── schemas/appschemas/
│       └── dataSourcesInfo.ts    ← pac-generated (DO NOT HAND-EDIT)
└── vite.config.ts
```

### Vite configuration

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

### power.config.json (gitignored — one per developer/environment)

```jsonc
{
  "appId":          "",                     // fill after first pac code create
  "appDisplayName": "<APP_DISPLAY_NAME>",
  "environmentId":  "<PP_ENVIRONMENT_ID>",
  "region":         "prod",
  "buildPath":      "./dist",
  "buildEntryPoint":"index.html",
  "localAppUrl":    "http://localhost:3000"
}
```

---

## Environment Configuration Pattern

### config.ts — The ONLY place that reads import.meta.env

```typescript
// src/config.ts
// All VITE_* vars are substituted by Vite at build time from .env
// Fallbacks are empty strings so a missing .env is immediately obvious

// SharePoint
export const SP_SITE_URL      = import.meta.env.VITE_SP_SITE_URL      ?? '';
export const SP_LIST_NAME     = import.meta.env.VITE_SP_LIST_NAME      ?? '';
export const SP_CONNECTOR_ID  = import.meta.env.VITE_SP_CONNECTOR_ID   ?? 'shared_sharepointonline';
export const SP_CONNECTION_ID = import.meta.env.VITE_SP_CONNECTION_ID  ?? '';

// Dataverse
export const DV_TABLE_NAME    = import.meta.env.VITE_DV_TABLE_NAME     ?? '';
export const DV_CONNECTOR_ID  = import.meta.env.VITE_DV_CONNECTOR_ID   ?? 'shared_commondataserviceforapps';
export const DV_CONNECTION_ID = import.meta.env.VITE_DV_CONNECTION_ID  ?? '';

// App display
export const APP_ENV_LABEL    = import.meta.env.VITE_APP_ENV_LABEL     ?? '';
export const APP_DISPLAY_NAME = import.meta.env.VITE_APP_DISPLAY_NAME  ?? '';

// Backend type: 'sharepoint' | 'dataverse'
export const BACKEND_TYPE     = import.meta.env.VITE_BACKEND_TYPE      ?? 'sharepoint';
```

**Rules:**
- `import.meta.env.VITE_*` is used ONLY in `config.ts`. Everywhere else imports from `config.ts`.
- Fallbacks are empty strings (not hardcoded values) so a missing `.env` is obvious.
- The only safe hardcoded fallbacks are connector IDs — they're the same on every tenant.

### .env (gitignored — one per environment)

```dotenv
# ── Backend type ──────────────────────────────────────────────────────────────
VITE_BACKEND_TYPE=sharepoint

# ── SharePoint connection ─────────────────────────────────────────────────────
VITE_SP_SITE_URL=https://yourorg.sharepoint.com/sites/YourSite
VITE_SP_LIST_NAME=MyList
VITE_SP_CONNECTOR_ID=shared_sharepointonline
VITE_SP_CONNECTION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# ── Dataverse connection (fill if BACKEND_TYPE=dataverse) ─────────────────────
VITE_DV_TABLE_NAME=cr123_mytable
VITE_DV_CONNECTOR_ID=shared_commondataserviceforapps
VITE_DV_CONNECTION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# ── App display ───────────────────────────────────────────────────────────────
VITE_APP_ENV_LABEL=DEV
VITE_APP_DISPLAY_NAME=My App
```

### .gitignore must include

```
.env
.env.local
.env.*.local
power.config.json
```

---

## Backend Service Pattern

The app ALWAYS has two backends — the real one (SP/DV) and a localStorage fallback.
This lets the app run at localhost during dev without the Power Apps player.

### Why the fallback is necessary

The Power Apps SDK communicates via `postMessage` through `DefaultPowerAppsBridge`.
When the app runs at localhost directly (not inside the PA player) the bridge never answers.
A timeout + fallback prevents the UI from hanging indefinitely.

### NEVER use `window.powerAppsBridge` to detect the PA player

`window.powerAppsBridge` is NEVER set by the PA player host.
The SDK always uses its own internal `DefaultPowerAppsBridge`.
Detection must be done reactively: try the real backend, catch the timeout, fall back.

### Data service template (TypeScript)

```typescript
// src/services/dataService.ts
// This is a TEMPLATE — replace MyTableService and field names with actual values

import { BACKEND_TYPE } from '../config';

const BACKEND_TIMEOUT_MS = 6000;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`BACKEND_TIMEOUT: no response in ${BACKEND_TIMEOUT_MS}ms`)),
        BACKEND_TIMEOUT_MS
      )
    ),
  ]);
}

// ── Reactive backend state ────────────────────────────────────────────────────
type BackendType = 'sharepoint' | 'dataverse' | 'localStorage' | 'unknown';
let _backend: BackendType = 'unknown';
const _listeners = new Set<(b: BackendType) => void>();

export function getBackend(): BackendType { return _backend; }
export function onBackendChange(fn: (b: BackendType) => void) {
  _listeners.add(fn);
  return () => { _listeners.delete(fn); };
}
function setBackend(b: BackendType) {
  if (_backend !== b) {
    _backend = b;
    _listeners.forEach((fn) => fn(b));
    console.log(`[DataService] backend confirmed: ${b}`);
  }
}

// ── localStorage fallback ─────────────────────────────────────────────────────
const LS_KEY = 'app_data_v1';

function lsReadAll<T>(): T[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}
function lsWriteAll<T>(items: T[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch { /* noop */ }
}

// ── Public API (replace with real service calls after pac code add-data-source) ──

export interface AppRecord {
  id: string;
  title: string;
  // Add fields matching your data model
  modifiedOn: string;
}

export async function getItems(): Promise<AppRecord[]> {
  // After pac code add-data-source generates services, replace this with:
  // import { MyListService } from '../generated/index.ts';
  // const result = await withTimeout(MyListService.getAll({ ... }));

  try {
    // Placeholder: this will be replaced with real service call
    throw new Error('Real backend not yet connected — using localStorage');
  } catch (err) {
    console.warn('[DataService] Backend unavailable → localStorage:', (err as Error).message);
    setBackend('localStorage');
    return lsReadAll<AppRecord>().sort(
      (a, b) => new Date(b.modifiedOn).getTime() - new Date(a.modifiedOn).getTime()
    );
  }
}

export async function createItem(record: Omit<AppRecord, 'id' | 'modifiedOn'>): Promise<AppRecord> {
  try {
    throw new Error('Real backend not yet connected — using localStorage');
  } catch (err) {
    console.warn('[DataService] Backend create unavailable → localStorage:', (err as Error).message);
    setBackend('localStorage');
    const item: AppRecord = {
      id: crypto.randomUUID(),
      ...record,
      modifiedOn: new Date().toISOString(),
    };
    lsWriteAll([...lsReadAll<AppRecord>(), item]);
    return item;
  }
}

export async function updateItem(id: string, updates: Partial<AppRecord>): Promise<AppRecord> {
  try {
    throw new Error('Real backend not yet connected — using localStorage');
  } catch (err) {
    console.warn('[DataService] Backend update unavailable → localStorage:', (err as Error).message);
    setBackend('localStorage');
    const all = lsReadAll<AppRecord>();
    const idx = all.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error(`Item ${id} not found`);
    all[idx] = { ...all[idx], ...updates, modifiedOn: new Date().toISOString() };
    lsWriteAll(all);
    return all[idx];
  }
}

export async function deleteItem(id: string): Promise<void> {
  try {
    throw new Error('Real backend not yet connected — using localStorage');
  } catch (err) {
    console.warn('[DataService] Backend delete unavailable → localStorage:', (err as Error).message);
    setBackend('localStorage');
    lsWriteAll(lsReadAll<AppRecord>().filter((i) => i.id !== id));
  }
}
```

### BackendBadge component

```tsx
// src/components/BackendBadge.tsx
import { useState, useEffect } from 'react';
import { getBackend, onBackendChange } from '../services/dataService';

export function BackendBadge() {
  const [backend, setBackend] = useState(getBackend);
  useEffect(() => onBackendChange(setBackend), []);

  const colors: Record<string, { bg: string; text: string }> = {
    sharepoint:   { bg: 'bg-green-500/15', text: 'text-green-400' },
    dataverse:    { bg: 'bg-blue-500/15',  text: 'text-blue-400' },
    localStorage: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
    unknown:      { bg: 'bg-gray-500/15',  text: 'text-gray-400' },
  };

  const { bg, text } = colors[backend] ?? colors.unknown;
  const label = backend === 'sharepoint' ? 'SharePoint'
    : backend === 'dataverse' ? 'Dataverse'
    : backend === 'localStorage' ? 'Local'
    : '…';

  return (
    <span className={`${bg} ${text} px-2.5 py-0.5 rounded-full text-xs font-bold`}>
      {label}
    </span>
  );
}
```

---

## Connecting SharePoint via pac CLI

### Prerequisites

- `pac` CLI installed and on PATH
- Authenticated: `pac auth create --environment <PP_ENVIRONMENT_ID>`

### Create the SharePoint list

In the target SharePoint site → New → List → Blank list. Create columns matching the data model.

> Column internal names are case-sensitive and must match exactly.
> For large JSON storage, use "Multiple lines of text → Plain text → Unlimited characters".

### Find the full Connection ID

```powershell
pac connection list
# Look for SharePoint Online — copy the full "Name" column value
# Format: shared-sharepointonl-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Run add-data-source

```powershell
pac code add-data-source `
  -a "shared_sharepointonline" `
  -c "<FULL_CONNECTION_ID>" `
  -t "<LIST_NAME>" `
  -d "<SP_SITE_URL>"
```

### What this generates (DO NOT hand-edit)

| Generated file | Purpose |
|---|---|
| `src/generated/index.ts` | Re-exports all generated services and models |
| `src/generated/services/<ListName>Service.ts` | CRUD methods |
| `src/generated/models/<ListName>Model.ts` | TypeScript interfaces |
| `.power/schemas/appschemas/dataSourcesInfo.ts` | Connection metadata |

Import in your service: `import { MyListService } from '../generated/index.ts';`

---

## Connecting Dataverse via pac CLI

### Find the full Connection ID

```powershell
pac connection list
# Look for "Microsoft Dataverse" — copy the full Name value
```

### Run add-data-source

```powershell
pac code add-data-source `
  -a "shared_commondataserviceforapps" `
  -c "<FULL_DV_CONNECTION_ID>" `
  -t "<TABLE_LOGICAL_NAME>"
# No -d flag needed for Dataverse
```

Generated service usage is identical to SharePoint.

---

## Deployment Workflow

### First deploy to a new environment

```powershell
pac auth create --environment <PP_ENVIRONMENT_ID>
pac code create --appName "<APP_DISPLAY_NAME>"
# → Copy the new appId into power.config.json

npm run build
pac code push
```

### Subsequent pushes

```powershell
npm run build && pac code push
```

### Local preview with live data

```powershell
pac code preview
# Opens in browser connected to target environment
```

### Promoting DEV → TEST → UAT → PROD

1. Update `.env` with new environment values
2. Update `power.config.json` (environmentId, appId)
3. Verify the SP list / DV table exists in the new env
4. Run `pac code add-data-source` with new connection ID
5. `npm run build`
6. `pac code push`
7. Smoke-test: create item → save → reload → verify

---

## Key Gotchas

1. **`window.powerAppsBridge` is ALWAYS undefined** — Use timeout+fallback pattern.
2. **Generated `dataSourceName` is lowercase** — Don't change it.
3. **`pac code add-data-source` needs the FULL connection ID** — Run `pac connection list`.
4. **Vite substitutes .env at BUILD time** — Must rebuild after .env changes.
5. **Import `.ts` extensions explicitly** — `import { X } from '../generated/index.ts'`.
6. **`SP_CONNECTOR_ID` never changes** — Always `shared_sharepointonline` on commercial M365.
7. **WorkflowJSON-type columns must be "Multiple lines of text — Plain text"** — Rich text truncates.

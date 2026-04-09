# CLAUDE.md — Power Apps Code App Skill

## What This Is

This is a Claude Code skill for building Power Apps Code Apps end-to-end. When a user invokes
this skill (e.g., "Build me an expense tracker app"), follow the phased workflow in `SKILL.md`
to scaffold, develop, and deploy a complete Power Apps Code App.

## Skill Location

This skill is installed at: `.claude/skills/powerapps-code-app/`

## How To Use This Skill

### For the developer (you):
When you receive a request to build a Power Apps Code App, this skill handles everything:

1. **Read `SKILL.md`** — It defines the 7-phase workflow (Plan → Scaffold → Connect → Design → Build → Test → Document)
2. **Read `references/blueprint.md`** — Full technical reference for project structure, backend patterns, and deployment
3. **Read `references/connection-discovery.md`** — When the user needs help finding connection IDs

### Quick-start command:
```
Build me a [description of app] using Power Apps Code App
```

### Skill dependencies (optional but recommended):
- **gstack** — If installed, use for structured project planning in Phase 1
- **ui-ux-pro-max** — If installed, use for high-quality UI component design in Phase 4

## Key Technical Decisions (Non-Negotiable)

These are architectural constraints. Do not deviate:

1. **React 18 + TypeScript (strict mode) + Vite 6 (port 3000) + Tailwind CSS v4**
2. **Zustand for state management** — No Redux, no Context API for global state
3. **`import.meta.env.VITE_*` ONLY in `src/config.ts`** — Everywhere else imports from config
4. **Timeout + localStorage fallback** — Every data service call falls back gracefully
5. **NEVER check `window.powerAppsBridge`** — It is always undefined
6. **NEVER hand-edit files in `src/generated/` or `.power/`** — These are pac CLI generated
7. **`.env` and `power.config.json` are gitignored** — One copy per developer/environment
8. **Both SharePoint and Dataverse are supported** — Determined by `VITE_BACKEND_TYPE`

## Project Structure After Scaffolding

```
<project-name>/
├── .env                          ← gitignored, per-environment
├── .env.example                  ← committed, placeholder values
├── .connection-refs.local        ← gitignored, full connection IDs
├── power.config.json             ← gitignored, pac CLI config
├── DEPLOYMENT.md                 ← committed, deployment guide
├── docs/
│   ├── PLAN.md                   ← project plan
│   ├── GOVERNANCE.md             ← standards & governance
│   └── TECHNICAL-DESIGN.md       ← architecture & decisions
├── src/
│   ├── index.css                 ← @import "tailwindcss"
│   ├── config.ts                 ← ONLY env var reader
│   ├── services/
│   │   └── dataService.ts        ← backend + localStorage fallback
│   ├── store/
│   │   └── appStore.ts           ← Zustand store
│   ├── components/
│   │   ├── Layout.tsx            ← app shell
│   │   ├── BackendBadge.tsx      ← backend indicator
│   │   └── EnvBadge.tsx          ← environment indicator
│   ├── pages/                    ← one file per view
│   ├── generated/                ← pac CLI output (DO NOT EDIT)
│   └── App.tsx
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Common Commands

```bash
# Local development
npm run dev                     # Start at localhost:3000 (localStorage backend)

# Build
npm run build                   # TypeScript check + Vite build

# Deploy & Preview (via @microsoft/power-apps)
npm run push                    # Deploy to Power Platform (power-apps push)
npm run start                   # Preview with live data (power-apps run)

# Power Platform setup (pac CLI — still needed for auth & connections)
pac auth create --environment <ID>   # Authenticate
pac code create --appName "Name"     # First-time app creation
pac code add-data-source ...         # Connect SP/DV (see DEPLOYMENT.md)
pac connection list                  # Find connection IDs

# Prerequisite check
node .claude/skills/powerapps-code-app/scripts/check-prereqs.js
```

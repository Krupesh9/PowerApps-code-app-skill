# powerapps-code-app

> A Claude Code skill that scaffolds, develops, and deploys Power Apps Code Apps end-to-end.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)
[![Power Platform](https://img.shields.io/badge/Power%20Platform-Code%20Apps-purple.svg)](https://learn.microsoft.com/en-us/power-apps/)

## What This Does

Turn a simple prompt like **"Build me an expense tracker"** into a complete, deployable Power Apps Code App with:

- **React 18 + TypeScript + Vite + Tailwind CSS** project scaffold
- **SharePoint or Dataverse** backend with automatic localStorage fallback for local dev
- **Interactive connection discovery** — guides you through finding Power Platform IDs
- **ALM structure** — Dev/Test/Prod environment promotion workflow
- **Generated documentation** — governance standards, technical design, deployment guide
- **Production-ready UI** — professional business app aesthetics with Tailwind

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed
- Node.js >= 18
- [pac CLI](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction) (Power Platform CLI)
- Git

## Installation

### Option 1: npx (Recommended)

Run a single command from your project root — the skill files are copied automatically:

```bash
# Install into current project (.claude/skills/powerapps-code-app/)
npx powerapps-code-app

# Or install globally for all projects (~/.claude/skills/powerapps-code-app/)
npx powerapps-code-app --global
```

### Option 2: npx from GitHub (no npm publish needed)

Install directly from the GitHub repo:

```bash
npx github:Krupesh9/PowerApps-code-app-skill

# Or with --global
npx github:Krupesh9/PowerApps-code-app-skill --global
```

### Option 3: npm global install

Install once, then run anywhere:

```bash
npm install -g powerapps-code-app

# Then from any project directory:
powerapps-code-app
powerapps-code-app --global
```

### Option 4: Clone from Git

```bash
mkdir -p .claude/skills
git clone https://github.com/Krupesh9/PowerApps-code-app-skill.git .claude/skills/powerapps-code-app
```

## Quick Start

In Claude Code, just say:

```
Build me an approval tracking app with SharePoint backend
```

Or be more specific:

```
Build me a Power Apps Code App for tracking equipment maintenance requests.
Fields: equipment name, location, issue description, priority (Low/Medium/High),
status (Open/In Progress/Resolved), assigned technician, and resolution notes.
Use SharePoint as the backend.
```

The skill handles everything: planning, scaffolding, UI design, feature implementation,
and deployment guidance.

## How It Works

The skill follows a 7-phase workflow:

| Phase | What Happens |
|-------|-------------|
| **0. Understand** | Parse your request, suggest project name, determine backend type |
| **1. Plan** | Create feature breakdown, data model, component tree (uses gstack if available) |
| **2. Scaffold** | `npm create vite@latest` + install deps + generate all config/service files |
| **3. Connect** | Guide you through `pac connection list` to discover connection IDs |
| **4. Design** | Build UI components with Tailwind (uses ui-ux-pro-max if available) |
| **5. Implement** | Code all features with backend abstraction + localStorage fallback |
| **6. Deploy** | `npm run build` → `pac code push` → verify in Power Apps player |
| **7. Document** | Generate GOVERNANCE.md, TECHNICAL-DESIGN.md, DEPLOYMENT.md |

## Companion Skills (Optional)

These skills enhance the workflow but aren't required:

- **[gstack](https://github.com/...)** — Structured project planning before development
- **[ui-ux-pro-max](https://github.com/...)** — Premium UI/UX design patterns

## Key Architecture Decisions

- `import.meta.env` is ONLY read in `src/config.ts`
- Every backend call uses timeout + localStorage fallback
- `window.powerAppsBridge` is never checked (it's always undefined)
- Generated files (`src/generated/`, `.power/`) are never hand-edited
- `.env` and `power.config.json` are gitignored (one per environment)

## Project Structure (After Scaffolding)

```
my-app/
├── .env.example          ← Committed template
├── DEPLOYMENT.md         ← Deployment guide
├── docs/
│   ├── PLAN.md           ← Project plan
│   ├── GOVERNANCE.md     ← Standards & promotion rules
│   └── TECHNICAL-DESIGN.md
├── src/
│   ├── config.ts         ← Centralized env vars
│   ├── services/
│   │   └── dataService.ts ← Backend + fallback
│   ├── store/
│   │   └── appStore.ts   ← Zustand store
│   ├── components/       ← Reusable UI
│   ├── pages/            ← Page views
│   └── generated/        ← pac CLI output (DO NOT EDIT)
└── vite.config.ts
```

## Contributing

1. Fork the repo
2. Create a feature branch
3. Test your changes with a real Power Apps Code App project
4. Submit a PR

## License

MIT

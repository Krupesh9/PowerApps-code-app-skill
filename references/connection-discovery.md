# Power Platform Connection Discovery Guide

> Interactive flow for helping users who may not know their connection IDs, environment IDs,
> or how to find them. Walk through this step-by-step with the user.

## Step 1: Verify pac CLI is available

Ask the user to run:
```bash
pac --version
```

If not found, check these locations:
- **Windows (VS Code extension)**: `$env:USERPROFILE\.vscode\extensions\*powerplatform*\dist\pac\tools\pac.exe`
- **Standalone install**: Should be on PATH after installing Power Platform CLI

If pac is not installed at all, guide them:
```bash
# Option A: VS Code extension (recommended)
# Install "Power Platform Tools" from VS Code marketplace

# Option B: Standalone (Windows)
# Download from https://aka.ms/PowerAppsCLI
```

> **Note:** `pac` CLI is still needed for authentication (`pac auth`), discovering connections
> (`pac connection list`), and adding data sources (`pac code add-data-source`).
> For build/deploy/preview, use `npm run push` and `npm run start` instead (powered by `@microsoft/power-apps`).

## Step 2: Authenticate to Power Platform

Ask the user: "Which Power Platform environment do you want to deploy to?"

If they know the environment ID:
```bash
pac auth create --environment <ENVIRONMENT_ID>
```

If they DON'T know the environment ID, guide them:

> 1. Open https://make.powerapps.com
> 2. Click the **Settings gear** (top right)
> 3. Click **Session details**
> 4. Copy the **Environment ID** (a GUID like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
>
> Alternatively, check which environments you have access to:
> ```bash
> pac admin list
> ```

After auth, verify:
```bash
pac auth list
# Confirm the correct environment is marked as active (*)
```

## Step 3: Discover SharePoint connections

Ask the user to run:
```bash
pac connection list
```

This outputs a table. Help them find the SharePoint row:

```
Display Name              Connector ID              Name (Full Connection ID)
─────────────────────────────────────────────────────────────────────────────────
SharePoint Online         shared_sharepointonline    shared-sharepointonl-8fd7e2cd-002b-4ad0-a829-308b37be3b25
Microsoft Dataverse       shared_commondataservice...  shared-commondataser-...
```

Extract two values:
- **Full Connection ID** (the `Name` column): Used for `pac code add-data-source -c` flag
- **Short UUID** (last segment of the full ID): Stored in `.env` as `VITE_SP_CONNECTION_ID`

Example:
- Full: `shared-sharepointonl-8fd7e2cd-002b-4ad0-a829-308b37be3b25`
- Short UUID: `8fd7e2cd-002b-4ad0-a829-308b37be3b25`

### If no SharePoint connection exists

Guide the user to create one:
> 1. Open https://make.powerapps.com
> 2. Go to **Connections** (left nav, under "Data")
> 3. Click **+ New connection**
> 4. Search for "SharePoint"
> 5. Click **SharePoint** → **Create**
> 6. Sign in with your M365 account
> 7. Run `pac connection list` again

## Step 4: Discover Dataverse connections

Same process as Step 3, but look for "Microsoft Dataverse" or "Common Data Service":

```
Display Name                    Connector ID                          Name (Full Connection ID)
───────────────────────────────────────────────────────────────────────────────────────────────
Microsoft Dataverse             shared_commondataserviceforapps       shared-commondataser-xxxxxxxx-...
```

### Finding the Dataverse table logical name

If the user knows the table display name but not the logical name:
```bash
pac table list
# Shows all tables — find the one with the matching display name
# The "Name" column is the logical name (e.g., cr123_approvalrequests)
```

## Step 5: Verify the SharePoint site and list

Ask the user:
- "What SharePoint site URL will this app connect to?" (e.g., `https://huntoil.sharepoint.com/sites/HuntApps-Dev`)
- "What is the list name?" (e.g., `ApprovalRequests`)

If they don't have a list yet, guide them to create one:
> 1. Navigate to the SharePoint site
> 2. Click **New** → **List** → **Blank list**
> 3. Name it exactly as specified (case-sensitive)
> 4. Add columns matching the data model from the project plan

## Step 6: Store discovered values

After discovery, populate these files:

### .env
```dotenv
VITE_BACKEND_TYPE=sharepoint
VITE_SP_SITE_URL=<discovered SP site URL>
VITE_SP_LIST_NAME=<discovered list name>
VITE_SP_CONNECTOR_ID=shared_sharepointonline
VITE_SP_CONNECTION_ID=<short UUID from pac connection list>
VITE_APP_ENV_LABEL=DEV
VITE_APP_DISPLAY_NAME=<app display name>
```

### power.config.json
```jsonc
{
  "appId":          "",
  "appDisplayName": "<app display name>",
  "environmentId":  "<discovered environment ID>",
  "region":         "prod",
  "buildPath":      "./dist",
  "buildEntryPoint":"index.html",
  "localAppUrl":    "http://localhost:3000"
}
```

### Store the full connection ID in a local reference file

Create `.connection-refs.local` (gitignored) for future `pac code add-data-source` commands:
```
SP_FULL_CONNECTION_ID=shared-sharepointonl-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DV_FULL_CONNECTION_ID=shared-commondataser-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Add to `.gitignore`:
```
.connection-refs.local
```

## Troubleshooting

### "pac: command not found"
The pac CLI is not on PATH. Either:
- Open a new terminal after installing the VS Code extension
- Add the pac binary location to your PATH manually
- Use the full path to pac.exe

### "No connections found"
The user hasn't created connections in this environment yet. Guide them through make.powerapps.com → Connections.

### "Authentication expired"
```bash
pac auth clear
pac auth create --environment <ENV_ID>
```

### "Environment not found"
The environment ID might be wrong. Double-check via make.powerapps.com → Settings → Session details.

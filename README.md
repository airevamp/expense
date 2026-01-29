# Receipt Capture PWA (React + MUI + Vite)

Single-page PWA for capturing receipts, uploading to Azure Blob Storage, and listing/deleting receipts via Azure Functions.

## Quick start
```bash
pnpm i # or npm i / yarn
pnpm dev # http://localhost:5173
```

## Environment

### Frontend (Vite)
Create a `.env` file in the project root:
```bash
VITE_ENTRA_CLIENT_ID=your-app-client-id
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/<tenant-id>
VITE_TEAM_ID=your-team-id
VITE_USER_ID=your-user-id
VITE_ORG=your-org-prefix
```

Notes:
- `VITE_TEAM_ID`, `VITE_USER_ID`, and `VITE_ORG` are used as header defaults for dev (non-prod).
- Auth uses MSAL and requests `User.Read` to fetch the tenant display name for `company`.

### API (Azure Functions)
Set these in your Function App or local settings:
```bash
STORAGE_ACCOUNT_NAME=your-storage-account
STORAGE_ACCOUNT_KEY=your-storage-key
CONTAINER_NAME=receipts # optional, defaults to "receipts"
SAS_EXPIRY_MINUTES=5
```

To build the API:
```bash
npm --prefix api run build
```

## Auth flow
- `RequireAuth` protects routes and redirects to `/login`.
- `/login` triggers MSAL login and returns to the original path.
- After login, the app fetches tenant display name via Microsoft Graph and stores it as `company`.
- A 10-minute auto-logout timer runs after login.

## API endpoints

### `POST /api/sas`
Body:
```json
{ "blobName": "org/<team>/user/<user>/YYYY/MM/DD/<file>.jpg", "contentType": "image/jpeg" }
```
Returns:
```json
{ "uploadUrl": "...", "blobUrl": "..." }
```

### `GET /api/receipts`
Returns:
```json
[
  { "name": "...", "url": "...", "deleteUrl": "/api/receipts?blobName=..." }
]
```

### `DELETE /api/receipts?blobName=...`
Deletes the blob (requires platform-provided auth; headers are ignored for auth).

## PWA splash
The splash screen shows once per session (PWA only). A session flag prevents it from reappearing after login redirects.

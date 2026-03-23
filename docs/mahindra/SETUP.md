# Mahindra Demo Setup Guide

This guide is the exact setup flow for the Phase 1 Mahindra demo in this repo.

## 1. What this demo does

- Upload a Mahindra Excel sheet in the frontend.
- Normalize each row into a follow-up item.
- Fetch the row queue from n8n.
- Use an ElevenLabs agent to confirm dispatch or delay details.
- Save the outcome back to n8n.
- Email every outcome.
- Send an extra escalation email when risk is `CRITICAL`.

Important:

- The current n8n workflow in this repo uses workflow static data for demo storage.
- That means you do not need Google Sheets or a database for the first demo.
- If you later want persistence, replace the code nodes with Google Sheets, Airtable, or a database.

## 2. Prerequisites

You need:

- Node.js 20+ and npm
- An n8n instance you can edit and activate
- An ElevenLabs account with Agents enabled
- A phone number connected in ElevenLabs if you want outbound calling
- Gmail credentials in n8n if you want live email sending

## 3. Frontend setup

From the repo root:

```powershell
npm install
```

Create a local `.env` from `.env.example` and fill in your own values.

Required keys:

- `VITE_AGENT_ID`
- `VITE_N8N_QUEUE_URL`
- `VITE_N8N_IMPORT_URL`
- `VITE_N8N_SAVE_URL`
- `VITE_ELEVENLABS_API_KEY`
- `VITE_ELEVENLABS_PHONE_NUMBER_ID`
- `VITE_MAHINDRA_EMAIL_TO`

Notes:

- If you only want browser-based ElevenLabs calls, the phone number ID is not required for that part, but leave the key in place for the full demo.
- `VITE_MAHINDRA_EMAIL_TO` should be a comma-separated recipient list.

Run the frontend:

```powershell
npm run dev
```

The main UI you will use is in:

- `src/App.jsx`

## 4. n8n setup

### Import the workflow

In n8n:

1. Create a new workflow.
2. Import `docs/mahindra/mahindra-followup-workflow.json`.
3. Save the workflow.

### Configure Gmail nodes

Attach Gmail credentials to:

- `Gmail - Send Follow-up Email`
- `Gmail - Send Critical Escalation`

If you do not want live email yet:

- Keep the workflow for demo logic, but expect those nodes to fail unless you attach credentials.
- The nodes are already set to continue regular output.

### Activate the workflow

After credentials are attached:

1. Activate the workflow.
2. Copy the production webhook URLs for:
   - `Webhook - Import Spreadsheet`
   - `Webhook - Get Queue`
   - `Webhook - Save Follow-up`
3. Put those URLs into your frontend `.env`.

### What each webhook does

- `POST /mahindra/import-sheet`
  - Accepts parsed spreadsheet rows from the frontend
  - Stores them in workflow static data
- `GET /mahindra/get-queue`
  - Returns the current queue to the frontend
- `POST /mahindra/save-followup`
  - Merges the latest outcome
  - Computes risk if needed
  - Sends the standard email
  - Sends the extra escalation email if risk is `CRITICAL`

## 5. ElevenLabs setup

### Create the Mahindra agent

In ElevenLabs Agents:

1. Create a new agent.
2. Use the system prompt from `docs/mahindra/elevenlabs-system-prompt.md`.
3. Set the start message exactly as included in that prompt file.

### Add the webhook tool

1. Add a new webhook tool to the agent.
2. Use `docs/mahindra/elevenlabs-log-followup-tool.json` as the base.
3. Replace the placeholder URL with your live n8n `save-followup` webhook URL.
4. Keep the tool name as `log_followup`.

### Add the end call tool

Make sure the agent also has ElevenLabs' standard `end_call` tool enabled.

### Save the agent details

After the agent is ready:

1. Copy the new agent ID into `VITE_AGENT_ID`.
2. If you want outbound phone calls, copy the ElevenLabs phone number ID into `VITE_ELEVENLABS_PHONE_NUMBER_ID`.
3. Use your ElevenLabs API key for `VITE_ELEVENLABS_API_KEY`.

## 6. Recommended setup order

Follow this order exactly:

1. Install frontend dependencies.
2. Import and activate the n8n workflow.
3. Attach Gmail credentials in n8n.
4. Copy the live webhook URLs into `.env`.
5. Create the ElevenLabs Mahindra agent.
6. Add the `log_followup` tool and point it to the live n8n save webhook.
7. Paste the agent ID and phone number ID into `.env`.
8. Run `npm run dev`.

## 7. Demo workflow you should use

For the live demo:

1. Open the app.
2. Upload a Mahindra Excel sheet.
3. Confirm the queue is populated in the center table.
4. Select a row.
5. Either:
   - start a browser call, or
   - start a phone call, or
   - manually fill the follow-up output panel for a controlled demo
6. Save the follow-up.
7. Show the updated row state and email audit trail in the right panel.

## 8. Smoke test checklist

Run this once before the client demo.

### Frontend check

- App loads without console errors.
- Uploading an Excel file updates the queue.
- Searching the queue works.
- The selected row updates the follow-up form.

### n8n check

- Import webhook returns success.
- Queue webhook returns the uploaded rows.
- Save webhook returns success.
- Standard email sends on every save.
- Critical escalation email sends only when risk is `CRITICAL`.

### ElevenLabs check

- Browser call connects successfully.
- Outbound phone call starts successfully if enabled.
- The agent reads the right part number and quantity.
- The agent calls `log_followup`.

## 9. Recommended test cases

Use at least these two:

### Case A: Dispatched

- Qty required: `800`
- Qty confirmed: `800`
- Date confirmed: same as required date
- Status: `Dispatched`
- Expect risk: `LOW`
- Expect only the standard email

### Case B: Delayed

- Qty required: `800`
- Qty confirmed: `300`
- Date confirmed: later than required date
- Status: `Delayed`
- Add a reason for delay
- Expect risk: `CRITICAL`
- Expect standard email plus escalation email

## 10. If something breaks

### Queue does not load

Check:

- `VITE_N8N_QUEUE_URL`
- workflow is active
- the import webhook already received rows

### Follow-up does not save

Check:

- `VITE_N8N_SAVE_URL`
- ElevenLabs tool URL points to the same save webhook
- webhook is active and reachable

### Emails do not send

Check:

- Gmail credentials are attached in n8n
- recipient list is valid
- Gmail account is authorized

### Phone call does not start

Check:

- `VITE_ELEVENLABS_API_KEY`
- `VITE_ELEVENLABS_PHONE_NUMBER_ID`
- the phone number is imported and active in ElevenLabs

## 11. Files to use

- `src/App.jsx`
- `.env.example`
- `docs/mahindra/SETUP.md`
- `docs/mahindra/README.md`
- `docs/mahindra/elevenlabs-system-prompt.md`
- `docs/mahindra/elevenlabs-log-followup-tool.json`
- `docs/mahindra/mahindra-followup-workflow.json`

# Mahindra Demo Handoff

This folder contains the Phase 1 assets for the Mahindra demo:

- `SETUP.md`
- `elevenlabs-system-prompt.md`
- `elevenlabs-log-followup-tool.json`
- `mahindra-followup-workflow.json`

Flow:

1. Upload the Mahindra Excel sheet in the frontend.
2. Frontend parses the spreadsheet and can POST normalized rows to `POST /mahindra/import-sheet`.
3. Frontend or agent fetches rows from `GET /mahindra/get-queue`.
4. ElevenLabs submits the follow-up result to `POST /mahindra/save-followup`.
5. n8n emails every result and escalates extra when risk is `CRITICAL`.

Suggested frontend env vars:

- `VITE_AGENT_ID`
- `VITE_N8N_QUEUE_URL`
- `VITE_N8N_IMPORT_URL`
- `VITE_N8N_SAVE_URL`
- `VITE_ELEVENLABS_API_KEY`
- `VITE_ELEVENLABS_PHONE_NUMBER_ID`
- `VITE_MAHINDRA_EMAIL_TO`

# Chat app: setup steps
Files: api/chat.js (server, prompts), public/index.html (chat page; optional public/product.jpg = picture of the shoe), AppsScript.gs, vercel.json

A. Google Sheet + Apps Script: new Sheet > Extensions > Apps Script > paste AppsScript.gs, set LOG_SECRET > Deploy > Web app (Execute as: Me, Access: Anyone) > copy URL (SCRIPT_URL).
B. Vercel (free account): upload this folder as a project. Settings > Environment Variables: OPENAI_API_KEY, OPENAI_MODEL (exact model name from OpenAI), OPENAI_TEMPERATURE=0.7 and OPENAI_REASONING_EFFORT=low (remove either one if the model refuses it), LOG_URL=SCRIPT_URL, LOG_SECRET (same as in script). Deploy. Put the Vercel URL into CHAT_URL in Apps Script (trailing slash), redeploy a new version. Put the Part 2 form link into FORM_URL in public/index.html and redeploy.
C. Flow: Form 1 (consent, store lineup picture, involvement) -> link to SCRIPT_URL -> chat -> Form 2 (code, manipulation check, outcomes, demographics).
D. Test: open SCRIPT_URL several times (conditions rotate); try CHAT_URL?c=1, ?c=2, ?c=3 on your phone and laptop; check rows in the Sheet; delete test rows before launch. Never share the API key; set a monthly limit at OpenAI.

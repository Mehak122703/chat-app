// Google Sheet script. Create it from the Sheet: Extensions > Apps Script. Deploy as Web app (Execute as: Me, Access: Anyone).
// After pasting this file, set LOG_SECRET to YOUR OWN secret (the same value as LOG_SECRET in Vercel), then
// Deploy > Manage deployments > pencil > Version: New version > Deploy. The web app address stays the same.
const LOG_SECRET = "REPLACE_WITH_YOUR_OWN_SECRET";     // same value as LOG_SECRET in Vercel

// Called by the server when a participant starts: gives the next balanced chat style (1, 2 or 3).
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action !== "assign" || p.secret !== LOG_SECRET) {
    return ContentService.createTextOutput("ok");
  }
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  const props = PropertiesService.getScriptProperties();
  const keys = ["1", "2", "3"], counts = {};
  keys.forEach(k => counts[k] = Number(props.getProperty("c" + k) || 0));
  const min = Math.min(...keys.map(k => counts[k]));
  const cand = keys.filter(k => counts[k] === min);
  const pick = cand[Math.floor(Math.random() * cand.length)];
  props.setProperty("c" + pick, String(counts[pick] + 1));
  lock.releaseLock();
  return ContentService.createTextOutput(JSON.stringify({ c: Number(pick) })).setMimeType(ContentService.MimeType.JSON);
}

// Receives (a) each chat turn and (b) the questionnaire answers, and writes rows to the Sheet.
function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  if (d.secret !== LOG_SECRET) return ContentService.createTextOutput("no");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (d.type === "survey") {
    let sh = ss.getSheetByName(d.sheet);
    if (!sh) sh = ss.insertSheet(d.sheet);
    if (sh.getLastRow() === 0) sh.appendRow(["server_time"].concat(d.headers));
    sh.appendRow([new Date().toISOString()].concat(d.values));
    return ContentService.createTextOutput("ok");
  }
  const sh = ss.getSheets()[0];
  if (sh.getLastRow() === 0) sh.appendRow(["time", "code", "condition", "turn", "user", "bot", "bot_words", "model"]);
  sh.appendRow([new Date(), d.code, d.condition, d.turn, d.user, d.bot, d.words, d.model]);
  return ContentService.createTextOutput("ok");
}

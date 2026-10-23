// Create this from the Google Sheet: Extensions > Apps Script. Deploy as Web app (Execute as: Me, Access: Anyone).
const CHAT_URL = "https://REPLACE_WITH_YOUR_VERCEL_URL/";   // keep trailing slash
const LOG_SECRET = "REPLACE_WITH_A_LONG_RANDOM_STRING";     // same value as LOG_SECRET in Vercel

// Landing link (shared at the end of Part 1): assigns condition + random code, redirects to the chat page.
function doGet() {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  const props = PropertiesService.getScriptProperties();
  const keys = ["1", "2", "3"], counts = {};
  keys.forEach(k => counts[k] = Number(props.getProperty("c" + k) || 0));
  const min = Math.min(...keys.map(k => counts[k]));
  const cand = keys.filter(k => counts[k] === min);
  const pick = cand[Math.floor(Math.random() * cand.length)];
  props.setProperty("c" + pick, String(counts[pick] + 1));
  lock.releaseLock();
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const url = CHAT_URL + "?c=" + pick + "&code=" + code;
  return HtmlService.createHtmlOutput(
    '<p style="font-family:sans-serif">Thank you. Please continue to the chat.</p>' +
    '<p><a href="' + url + '" target="_top" style="font-family:sans-serif;font-size:18px">Go to the chat</a></p>');
}

// Receives each chat turn from the server and writes a row to the sheet.
function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  if (d.secret !== LOG_SECRET) return ContentService.createTextOutput("no");
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sh.getLastRow() === 0) sh.appendRow(["time", "code", "condition", "turn", "user", "bot", "bot_words", "model"]);
  sh.appendRow([new Date(), d.code, d.condition, d.turn, d.user, d.bot, d.words, d.model]);
  return ContentService.createTextOutput("ok");
}

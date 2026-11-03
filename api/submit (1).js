// Receives the questionnaire answers from the page and passes them on to the Google Sheet (via the Apps Script).
// The secret stays on the server.
const SHEETS = ['Part1', 'Part2'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { sheet, headers, values } = req.body || {};
    if (!SHEETS.includes(sheet)) return res.status(400).json({ error: 'bad sheet' });
    if (!Array.isArray(headers) || !Array.isArray(values) || headers.length !== values.length || headers.length > 80)
      return res.status(400).json({ error: 'bad data' });
    const h = headers.map(x => String(x).slice(0, 40));
    const v = values.map(x => String(x == null ? '' : x).slice(0, 1000));
    const codeIdx = h.indexOf('code');
    if (codeIdx < 0 || !/^[A-Z0-9]{6}$/.test(v[codeIdx])) return res.status(400).json({ error: 'bad code' });
    if (!process.env.LOG_URL) return res.status(500).json({ error: 'no log url' });
    const r = await fetch(process.env.LOG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ type: 'survey', secret: process.env.LOG_SECRET, sheet, headers: h, values: v })
    });
    const t = await r.text();
    if (!r.ok || t.trim() !== 'ok') { console.error('sheet said', r.status, t.slice(0, 200)); return res.status(502).json({ error: 'sheet error' }); }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
};

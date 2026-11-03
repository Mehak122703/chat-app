// Starts a participant: asks the Google Apps Script for a balanced chat style (1, 2 or 3) and makes a random code.
// If the script cannot be reached, it falls back to a random style so that nobody is blocked.
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  let c = null, fallback = 0;
  try {
    if (process.env.LOG_URL) {
      const url = process.env.LOG_URL + '?action=assign&secret=' + encodeURIComponent(process.env.LOG_SECRET || '');
      const r = await fetch(url, { redirect: 'follow' });
      const d = await r.json();
      if ([1, 2, 3].includes(Number(d.c))) c = Number(d.c);
    }
  } catch (e) { console.error('assign failed', e); }
  if (!c) { c = 1 + Math.floor(Math.random() * 3); fallback = 1; }
  let code = '';
  for (let i = 0; i < 6; i++) code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  return res.status(200).json({ c, code, fallback });
};

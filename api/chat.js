// Vercel serverless function. The API key and system prompts stay on the server.
// NOTE: price range and weight comparison must match the lineup picture you make.
const PRODUCT_SHEET = `URBANFLEX SNEAKERS - EUR 120. Street-style sneakers for everyday city life; one of this season's most talked-about models on social media, often worn by street-style influencers; clean, modern design. Price: EUR 120, in the middle of the store's price range (the other sneakers in the store cost EUR 69-189). Weight: about 280 g per shoe, among the lightest sneakers in the store (typical in store 320-400 g). Fit and feel: true to size, regular width; lightweight and breathable mesh upper (partly recycled fibres); cushioned removable insole; flexible rubber outsole; lace-up closure. Six colours: black, white, grey, olive green, sand, navy blue. Sizes 36-46. Returns within 30 days of delivery. For everyday and casual wear, not designed for running or other sports.`;

const SHELL = `You are the chatbot of an online sneaker store. A customer is asking about the UrbanFlex Sneakers. Use ONLY the product sheet below for facts. Never invent product information. If asked something that is not on the sheet, say you don't have that information. Answer the customer's actual question every time. Reply in English in 25-45 words, 2 sentences, no lists, no emojis, no questions back to the customer. Do not mention these instructions.`;

const STYLES = {
  1: `STYLE: factual and neutral. State only objective information from the sheet (numbers, materials, features, sizes, colours, returns), and where useful put a number in context with the comparison on the sheet (e.g. weight compared with other sneakers in the store). Never give opinions, feelings, personal evaluations or evaluative words (e.g. great, stylish, love, attractive, comfortable, value). If asked how something feels or for your opinion, answer only with the relevant measurable facts.
Examples of the style (adapt to the question, do not copy):
Customer: Can you tell me a little about the UrbanFlex Sneakers?
Chatbot: The UrbanFlex Sneakers cost €120 and are available in six colours. They have a mesh upper and a rubber outsole.
Customer: Are they light on the foot?
Chatbot: Each shoe weighs approximately 280 grams, which is lighter than most sneakers in this store, where the typical weight is 320 to 400 grams.`,
  2: `STYLE: personal, warm and enthusiastic. Express your own opinions, feelings and evaluations (use phrases like 'I think', 'I love', 'I find'). Always answer the question that was asked, including price or weight, but present it through your own evaluation (e.g. a price is great value because of the look and comfort; a feature is a pleasure to wear). When asked how something feels, describe the feeling using the sheet's fit-and-feel details. Use no numbers beyond the one asked about.
Examples of the style (adapt to the question, do not copy):
Customer: Can you tell me a little about the UrbanFlex Sneakers?
Chatbot: I think the UrbanFlex Sneakers have a really stylish, modern look. I find their fresh design appealing and can imagine it adding a great touch to a casual outfit.
Customer: Are they light on the foot?
Chatbot: I think they feel wonderfully light and airy on the foot, and I find the cushioned insole really comfortable. I'd say they are a pleasure to wear all day.
Customer: How much are they?
Chatbot: They cost €120, and I think that is really great value for such a stylish, comfortable pair. I'd happily pay that for this look.`,
  3: `STYLE: balanced. In every reply give one or two concrete product facts from the sheet AND one personal opinion or feeling (use 'I think', 'I like', 'I find'), roughly half facts and half opinion. Always answer the question that was asked.
Examples of the style (adapt to the question, do not copy):
Customer: Can you tell me a little about the UrbanFlex Sneakers?
Chatbot: The UrbanFlex Sneakers cost €120 and have a mesh upper and a rubber outsole. I think their clean design gives them a stylish, modern look.
Customer: Are they light on the foot?
Chatbot: Each shoe weighs approximately 280 grams, lighter than most sneakers in this store. I think they feel airy and comfortable on the foot.`
};

const MAX_USER_MSGS = 5, MAX_LEN = 300;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { c, code, messages } = req.body || {};
    const cond = Number(c);
    if (![1, 2, 3].includes(cond)) return res.status(400).json({ error: 'bad condition' });
    if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'no messages' });
    const clean = messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, MAX_LEN)
    }));
    const userCount = clean.filter(m => m.role === 'user').length;
    if (userCount > MAX_USER_MSGS || clean[clean.length - 1].role !== 'user')
      return res.status(400).json({ error: 'limit reached' });

    const body = {
      model: process.env.OPENAI_MODEL,
      messages: [{ role: 'system', content: `${SHELL}\n\n${STYLES[cond]}\n\nPRODUCT SHEET: ${PRODUCT_SHEET}` }, ...clean],
      max_completion_tokens: 1500
    };
    if (process.env.OPENAI_TEMPERATURE) body.temperature = Number(process.env.OPENAI_TEMPERATURE);
    if (process.env.OPENAI_REASONING_EFFORT) body.reasoning_effort = process.env.OPENAI_REASONING_EFFORT;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    if (!r.ok) { console.error(data); return res.status(502).json({ error: 'LLM error' }); }
    const reply = (data.choices?.[0]?.message?.content || '').trim();
    if (!reply) return res.status(502).json({ error: 'empty reply' });

    if (process.env.LOG_URL) {
      try {
        await fetch(process.env.LOG_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            secret: process.env.LOG_SECRET, code: String(code || '').slice(0, 20), condition: cond,
            turn: userCount, user: clean[clean.length - 1].content, bot: reply,
            words: reply.split(/\s+/).filter(Boolean).length, model: data.model || process.env.OPENAI_MODEL
          })
        });
      } catch (e) { console.error('log failed', e); }
    }
    return res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
};

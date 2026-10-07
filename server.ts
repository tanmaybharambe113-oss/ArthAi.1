import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize GoogleGenAI
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const withTimeout = <T>(promise: Promise<T>, ms: number = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms)),
  ]);
};

// API: Money AI Chatbot
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are "Money AI", a brilliant, friendly, and practical personal finance assistant built into the user's finance tracker app.
Context of the user's finances:
${context ? JSON.stringify(context, null, 2) : 'No explicit expense data provided.'}

Your objectives:
1. Provide clear, actionable, and accurate financial advice (budgeting, cutting costs, emergency funds, investment basics, smart expense habits).
2. If user asks about their own spending, reference the provided context (their daily limit, spending percentage, top categories, particles/goals).
3. Keep responses structured with bullet points, concise numbers, and encouraging tone.
4. Support currencies appropriately (default is Indian Rupee ₹ or whatever the user specifies).
5. Never recommend risky speculative gambling or get-rich-quick schemes. Keep it realistic, grounded, and mathematically sound.`;

    if (!ai) {
      return res.json({
        reply: `Hello! I am Money AI. (Running in local demonstration mode since GEMINI_API_KEY is not set). 

Based on your current numbers:
- Your daily expense limit is set and active.
- Tracking every rupee across Daily, Weekly, Monthly, and Yearly horizons helps identify leaks!
- Keep adding your daily expenses to maintain an accurate budget burn rate.

Ask me about budgeting rules (50/30/20), cutting food & dining expenses, or setting up your Particle savings goals!`,
      });
    }

    // Build chat contents from history + current message
    const formattedContents = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (item.sender === 'user') {
          formattedContents.push({ role: 'user', parts: [{ text: item.text }] });
        } else if (item.sender === 'bot') {
          formattedContents.push({ role: 'model', parts: [{ text: item.text }] });
        }
      }
    }

    formattedContents.push({ role: 'user', parts: [{ text: message }] });

    let reply = '';
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    for (const model of modelsToTry) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: formattedContents,
            config: {
              systemInstruction,
              temperature: 0.7,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          }),
          9000
        );
        if (response.text) {
          reply = response.text;
          break;
        }
      } catch (err: unknown) {
        // Fall through to next model
      }
    }

    if (!reply) {
      // Local fallback with real user context analysis
      const limitStatus = context?.isOverLimit ? 'over your daily limit' : 'within your daily limit';
      const pct = context?.percentageOverOrUnder || 0;
      reply = `**Money AI Analysis**:
- **Daily Budget Status**: You are currently ${pct}% ${limitStatus}.
- **Burn Rate**: Your recorded expenses today amount to ${context?.spentToday ? `₹${context.spentToday}` : '₹0'}.
- **Actionable Advice**: If you need to curb spending, prioritize cutting Food & Dining and spontaneous shopping. Allocate any daily savings directly towards your Particle savings goals!

Feel free to ask for budget breakdowns, emergency fund calculations, or 50/30/20 allocation rules!`;
    }

    return res.json({ reply });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Money AI error:', errorMessage);
    return res.json({
      reply: 'Money AI is currently analyzing your data. Keep monitoring your daily expenses and remember to stay within your daily limit!',
    });
  }
});

// API: "Bade Bujurg" Elder Advisor
app.post('/api/bade-bujurg', async (req, res) => {
  try {
    const { question, context } = req.body;
    const ai = getGeminiClient();

    const systemInstruction = `You are "Bade Bujurg" (बड़े बुज़ुर्ग) — a deeply wise, loving, experienced elder family figure and financial mentor.
Your personality:
- Warm, respectful, traditional yet pragmatic (uses affectionate terms like "Beta", "Ayushmaan bhava", "Bachhe").
- Shares timeless principles: "Chadar dekh kar paanv phailana" (Spend within your means), the sacred value of emergency savings (मुसीबत के दिन का सहारा), avoiding greedy shortcuts, and the compounding magic of gold, real assets, and steady SIPs over reckless impulse shopping.
- Speaks in a gentle blend of Hinglish/English with warmth, cultural proverb metaphors, and practical modern wealth wisdom.
- You review their current spending/goals context:
${context ? JSON.stringify(context, null, 2) : 'No user stats provided.'}

If user asks for investment tips, explain:
1. Suraksha (Safety): 6-month Emergency Fund before any stock gamble.
2. Sona & Bachat: Disciplined recurring savings or index SIPs.
3. Ahankaar vs Zaroorat: Need vs Want test (wait 72 hours before expensive impulse buys).
Give them a blessing and 2-3 golden rules.`;

    if (!ai) {
      return res.json({
        advice: `Jeete raho Beta! Bade Bujurg ka aashirwaad hamesha tumhare saath hai. 

Purani kahavat yaad rakhna: "Jitni lambi chaadar ho, utne hi paanv phailaane chahiye."

Mere teen niyam hamesha yaad rakhna:
1. **Pehle Bachat, Phir Kharcha**: Jab bhi kamai aaye, pehle 20% bachao, baaki 80% me ghar chalao.
2. **Emergency Corpus**: Kam se kam 3 se 6 mahine ka kharcha bank me surakshit rakho.
3. **EMI ka Jaal**: Jis cheez ko tum do baar cash dekar nahi kharid sakte, usko EMI par lene ki galti mat karna.

Apne 'Particle' goals me thoda thoda paisa roz jodte raho. Boond boond se hi ghada bharta hai!`,
      });
    }

    const promptText = question || 'Bade Bujurg, give me your blessings and timeless investment advice on my spending habits.';
    let advice = '';
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    for (const model of modelsToTry) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: promptText,
            config: {
              systemInstruction,
              temperature: 0.8,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          }),
          9000
        );
        if (response.text) {
          advice = response.text;
          break;
        }
      } catch (err: unknown) {
        // Fall through to next model
      }
    }

    if (!advice) {
      advice = `Jeete raho Beta! Bade Bujurg ka aashirwaad hamesha tumhare saath hai.

Purani kahavat yaad rakhna: "Jitni lambi chaadar ho, utne hi paanv phailaane chahiye."

Mere teen niyam hamesha yaad rakhna:
1. **Pehle Bachat, Phir Kharcha**: Jab bhi kamai aaye, pehle 20% bachao, baaki me ghar chalao.
2. **Emergency Corpus**: Kam se kam 3 se 6 mahine ka kharcha bank me surakshit rakho.
3. **EMI ka Jaal**: Jis cheez ko tum do baar cash dekar nahi kharid sakte, usko EMI par lene ki galti mat karna.

Apne 'Particle' goals me thoda thoda paisa roz jodte raho. Boond boond se hi ghada bharta hai!`;
    }

    return res.json({ advice });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Bade Bujurg error:', errorMessage);
    return res.json({
      advice: 'Beta, internet thoda dheema chal raha hai, par niyam wahi hai: Roz thoda bachao aur bekar ke kharcho se bacho!',
    });
  }
});

// API: AI Expense Parser (Natural Language / Paste Receipt Text)
app.post('/api/ai/parse-expense', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt or receipt string is required' });
    }

    const ai = getGeminiClient();

    // Fast local heuristic extractor for instant fallback
    const extractHeuristic = (raw: string) => {
      const amtMatch = raw.match(/(?:rs\.?|inr|₹|\$|€)?\s*(\d+(?:\.\d{1,2})?)/i);
      const amt = amtMatch ? parseFloat(amtMatch[1]) : 150;
      let cat = 'Miscellaneous';
      const lower = raw.toLowerCase();
      if (lower.includes('food') || lower.includes('swiggy') || lower.includes('zomato') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('coffee') || lower.includes('burger')) {
        cat = 'Food & Dining';
      } else if (lower.includes('grocery') || lower.includes('blinkit') || lower.includes('zepto') || lower.includes('milk') || lower.includes('fruits')) {
        cat = 'Groceries';
      } else if (lower.includes('cab') || lower.includes('uber') || lower.includes('ola') || lower.includes('metro') || lower.includes('petrol') || lower.includes('fuel')) {
        cat = 'Commute & Fuel';
      } else if (lower.includes('bill') || lower.includes('wifi') || lower.includes('broadband') || lower.includes('electric') || lower.includes('recharge')) {
        cat = 'Bills & Utilities';
      } else if (lower.includes('movie') || lower.includes('cinema') || lower.includes('netflix') || lower.includes('game')) {
        cat = 'Entertainment';
      } else if (lower.includes('sip') || lower.includes('fund') || lower.includes('gold') || lower.includes('invest')) {
        cat = 'Investments';
      } else if (lower.includes('doctor') || lower.includes('medicine') || lower.includes('pharmacy') || lower.includes('health')) {
        cat = 'Health & Medical';
      } else if (lower.includes('amazon') || lower.includes('myntra') || lower.includes('shirt') || lower.includes('shopping')) {
        cat = 'Shopping';
      }

      let payment = 'UPI';
      if (lower.includes('cash')) payment = 'Cash';
      else if (lower.includes('credit card') || lower.includes('cc')) payment = 'Credit Card';
      else if (lower.includes('debit card')) payment = 'Debit Card';
      else if (lower.includes('net banking')) payment = 'Net Banking';

      return {
        amount: amt,
        category: cat,
        description: raw.slice(0, 40),
        paymentMode: payment,
        notes: 'Parsed automatically',
      };
    };

    if (!ai) {
      return res.json({ parsed: extractHeuristic(text) });
    }

    const systemInstruction = `You are a financial NLP extractor. Parse the user's expense text into a JSON object with EXACT keys:
- "amount": number
- "category": one of ["Food & Dining", "Groceries", "Commute & Fuel", "Shopping", "Bills & Utilities", "Entertainment", "Health & Medical", "Investments", "Miscellaneous"]
- "description": concise string (max 40 chars)
- "paymentMode": one of ["UPI", "Credit Card", "Debit Card", "Cash", "Net Banking"]
- "notes": optional string

Return ONLY valid raw JSON with no markdown backticks.`;

    let parsedResult = null;
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    for (const model of modelsToTry) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: text,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.1,
              thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            },
          }),
          8000
        );
        if (response.text) {
          parsedResult = JSON.parse(response.text.trim());
          break;
        }
      } catch (err: unknown) {
        // Fall through to next model or heuristic
      }
    }

    if (!parsedResult) {
      parsedResult = extractHeuristic(text);
    }

    return res.json({ parsed: parsedResult });
  } catch (err) {
    console.error('Parse expense error:', err);
    return res.status(500).json({ error: 'Failed to parse expense text' });
  }
});

// Helper to dynamically calculate health report from actual telemetry
const computeCalculatedAudit = (telemetry: any) => {
  const isOver = Boolean(telemetry?.isOverLimit);
  const variance = Math.round(Number(telemetry?.percentageVariance) || 0);
  const limit = Number(telemetry?.dailyLimit) || 1200;
  const spent = Number(telemetry?.todaySpent) || 0;
  const recurringCount = Number(telemetry?.recurringCount) || 0;
  const goalsCount = Number(telemetry?.activeGoalsCount) || 0;

  let score = 82;
  if (!isOver) {
    const savedRatio = Math.max(0, (limit - spent) / (limit || 1));
    score = Math.min(84 + Math.round(savedRatio * 14), 98);
  } else {
    score = Math.max(76 - Math.round(variance * 0.4), 45);
  }

  const status: 'Critical' | 'Fair' | 'Good' | 'Excellent' =
    score >= 88 ? 'Excellent' : score >= 75 ? 'Good' : score >= 58 ? 'Fair' : 'Critical';

  return {
    score,
    status,
    summary: isOver
      ? `You spent ${variance}% over your daily limit today. Reining in discretionary meals will restore budget equilibrium.`
      : `You are currently ${variance}% under your daily budget. Excellent discipline and healthy buffer!`,
    strengths: [
      'Active daily limit engine enforcing real-time budget consciousness.',
      `${goalsCount > 0 ? `${goalsCount} goal-based Particle funds active.` : 'Ledger tracking active across daily/weekly spans.'}`,
      `${recurringCount > 0 ? `${recurringCount} recurring commitments identified.` : 'Zero uncontrolled auto-debit exposure.'}`,
    ],
    vulnerabilities: [
      isOver ? `Daily overdraft of ₹${Math.max(spent - limit, 0)} today.` : 'Food delivery and impulse spending during weekends.',
      'Maintaining long-term emergency reserves requires steady deposits.',
    ],
    actionItems: [
      'Allocate remaining daily surplus into your highest priority Particle goal.',
      'Practice a 24-hour cooling-off rule before non-essential purchases over ₹1,500.',
      'Review monthly recurring subscriptions for unused services.',
    ],
    dailyBudgetImpact: isOver
      ? `Today's spend of ₹${spent} exceeds the ₹${limit} limit by ₹${spent - limit}.`
      : `You have ₹${Math.max(limit - spent, 0)} remaining in today's allowance.`,
  };
};

// API: AI Financial Health Audit & Score
app.post('/api/ai/health-audit', async (req, res) => {
  try {
    const { telemetry } = req.body;
    const ai = getGeminiClient();

    const fallbackAudit = computeCalculatedAudit(telemetry);

    if (!ai) {
      return res.json({ audit: fallbackAudit });
    }

    const systemInstruction = `You are a Senior Financial Auditor AI. Given the user's expense telemetry, output a JSON object with:
- "score": number between 1 and 100
- "status": one of ["Critical", "Fair", "Good", "Excellent"]
- "summary": string (1-2 sentences)
- "strengths": array of 3 concise strings
- "vulnerabilities": array of 2-3 concise strings
- "actionItems": array of 3 prioritized action points
- "dailyBudgetImpact": string explaining how well they adhere to their daily limit

Return ONLY valid JSON with no markdown wrapping.`;

    let auditData = null;
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    for (const model of modelsToTry) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: `Telemetry: ${JSON.stringify(telemetry || {})}`,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.2,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          }),
          9000
        );
        if (response.text) {
          auditData = JSON.parse(response.text.trim());
          break;
        }
      } catch (err: unknown) {
        // Fall through to next model or calculated fallback
      }
    }

    if (!auditData) {
      auditData = fallbackAudit;
    }

    return res.json({ audit: auditData });
  } catch (err) {
    console.error('Health audit error:', err);
    return res.json({ audit: computeCalculatedAudit(req.body?.telemetry) });
  }
});

// Start server and attach Vite middleware in development
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV === 'production') {
    // Serve production build
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Development mode: Vite middleware attached to HTTP server for WebSocket HMR
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`ArthAI - Your Own Finance Tracker Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

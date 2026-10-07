import React, { useState } from 'react';
import { X, Copy, Check, Code, Terminal, Github, Server, Sparkles } from 'lucide-react';

interface ExportCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportCodeModal: React.FC<ExportCodeModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<'python' | 'github'>('python');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const pythonFastAPICode = `"""
ArthAI - Your Own Finance Tracker Backend
Built in Python (FastAPI + Google GenAI) - Easy GitHub & Render/Vercel deployment!
No Java needed.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from google import genai

app = FastAPI(title="ArthAI Finance API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ai_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, Any]]] = []
    context: Optional[Dict[str, Any]] = None

class BujurgRequest(BaseModel):
    question: Optional[str] = "Give me your blessings and timeless investment advice."
    context: Optional[Dict[str, Any]] = None

class DailyLimitCheck(BaseModel):
    today_spent: float
    daily_limit: float

@app.post("/api/daily-limit-status")
def check_daily_limit(data: DailyLimitCheck):
    if data.daily_limit <= 0:
        return {"is_over": False, "percentage": 0, "message": "No limit set"}
    
    if data.today_spent > data.daily_limit:
        extra = data.today_spent - data.daily_limit
        pct = round((extra / data.daily_limit) * 100)
        return {
            "is_over": True,
            "percentage": pct,
            "message": f"Alert: You spent {pct}% extra over your daily limit today!"
        }
    else:
        saved = data.daily_limit - data.today_spent
        pct = round((saved / data.daily_limit) * 100)
        return {
            "is_over": False,
            "percentage": pct,
            "message": f"Great job: You are {pct}% under your daily limit today!"
        }

@app.post("/api/chat")
def money_ai_chat(req: ChatRequest):
    if not ai_client:
        return {"reply": "Money AI (Python demo mode): Keep tracking your daily limit!"}
    
    system_instruction = f"""
    You are 'Money AI', an intelligent financial copilot.
    User financial context: {req.context}
    Provide accurate budgeting, emergency fund, and investment advice.
    """
    response = ai_client.models.generate_content(
        model="gemini-3.8-flash",
        contents=req.message,
        config={"system_instruction": system_instruction}
    )
    return {"reply": response.text}

@app.post("/api/bade-bujurg")
def bade_bujurg_advisor(req: BujurgRequest):
    if not ai_client:
        return {
            "advice": "Beta, hamesha yaad rakhna: 'Pehle bachat, phir kharcha!' Aur Particle goals me roz thoda thoda jama karo."
        }
    
    system_instruction = f"""
    You are 'Bade Bujurg' (बड़े बुज़ुर्ग) — a wise, loving elder family advisor.
    User context: {req.context}
    Share practical wealth wisdom, warn against impulsive EMI debt, and emphasize gold/SIP compounding.
    """
    response = ai_client.models.generate_content(
        model="gemini-3.8-flash",
        contents=req.question,
        config={"system_instruction": system_instruction}
    )
    return {"advice": response.text}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`;

  const githubGuide = `# 🚀 How to Deploy this App to GitHub & Free Cloud (Zero Java!)

### 1. Initialize Git & Push to GitHub:
\`\`\`bash
git init
git add .
git commit -m "Initial commit: DhanGyan Finance Tracker"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dhangyan-finance-tracker.git
git push -u origin main
\`\`\`

### 2. Run Locally in Seconds:
- **Node/React Frontend & Express Backend (Already working right here!)**:
  \`\`\`bash
  npm install
  npm run dev
  \`\`\`
  Visit: http://localhost:3000

- **Or Run Python Backend**:
  \`\`\`bash
  pip install fastapi uvicorn google-genai
  python main.py
  \`\`\`

### 3. Deploy to Free Cloud (Render / Vercel / Railway):
1. **GitHub Connection**: Sign up on Render.com or Vercel.com.
2. Click **"New Web Service"** and select your GitHub repository.
3. Build Command: \`npm run build\`
4. Start Command: \`npm start\`
5. Environment Variables:
   - \`GEMINI_API_KEY\` = your Google AI Studio API key.
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Python Code &amp; GitHub Deployment Guide
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Non-Java Solution
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ready-to-use Python backend code + 3-step GitHub push instructions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 p-3 bg-slate-950/40 border-b border-slate-800 px-6">
          <button
            type="button"
            onClick={() => setActiveLang('python')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeLang === 'python'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" /> Python (FastAPI + GenAI Backend)
          </button>
          <button
            type="button"
            onClick={() => setActiveLang('github')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeLang === 'github'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Github className="w-3.5 h-3.5" /> GitHub &amp; Deployment Guide
          </button>
        </div>

        {/* Code Content */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs">
          {activeLang === 'python' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans text-xs">
                  Save as <strong className="text-white">backend/main.py</strong>
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(pythonFastAPICode, 'py')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 text-xs font-sans transition-colors"
                >
                  {copiedKey === 'py' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Python Code
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-amber-200/90 leading-relaxed overflow-x-auto select-all">
                {pythonFastAPICode}
              </pre>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans text-xs">
                  Simple Git Commands (Deploy without Java)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(githubGuide, 'gh')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 text-xs font-sans transition-colors"
                >
                  {copiedKey === 'gh' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy GitHub Guide
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-200/90 leading-relaxed overflow-x-auto whitespace-pre-wrap select-all">
                {githubGuide}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

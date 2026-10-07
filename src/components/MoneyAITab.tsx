import React, { useState, useRef, useEffect } from 'react';
import { Expense, ParticleGoal, ChatMessage } from '../types';
import { calculateDailyLimitStatus, formatCurrency } from '../utils/storage';
import { Bot, Send, User, Sparkles, RefreshCw, HelpCircle } from 'lucide-react';

interface MoneyAITabProps {
  expenses: Expense[];
  dailyLimit: number;
  currency: string;
  userName: string;
  particleGoals: ParticleGoal[];
}

export const MoneyAITab: React.FC<MoneyAITabProps> = ({
  expenses,
  dailyLimit,
  currency,
  userName,
  particleGoals,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: `Hello ${userName || 'there'}! 👋 I am **Money AI**, your 24/7 personal financial copilot.

I have full visibility into your daily limits, spending patterns, and Particle savings goals. Ask me anything about your current budget, cost-cutting tips, emergency planning, or investment strategies!`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Build telemetry context to send to server
  const buildFinancialContext = () => {
    const status = calculateDailyLimitStatus(expenses, dailyLimit);
    const totalAllTime = expenses.reduce((s, e) => s + e.amount, 0);

    // Categories
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    return {
      userName,
      currency,
      dailyLimit,
      spentToday: status.todayTotal,
      isOverLimit: status.isOverLimit,
      percentageOverOrUnder: status.percentage,
      statusText: status.statusText,
      totalExpensesLogged: expenses.length,
      totalSpentAllTime: totalAllTime,
      categoryBreakdown: categoryTotals,
      goalsCount: particleGoals.length,
      goals: particleGoals.map(g => ({
        title: g.title,
        target: g.targetAmount,
        saved: g.currentSaved,
        progress: Math.round((g.currentSaved / (g.targetAmount || 1)) * 100),
      })),
    };
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages,
          context: buildFinancialContext(),
        }),
      });

      const data = await response.json();
      const botReply = data.reply || "I've reviewed your request. Keep monitoring your daily expenses!";

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'Sorry, I had trouble connecting. Please try asking again!',
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const promptSuggestions = [
    'How am I performing against my daily limit today?',
    'What is my biggest spending category and how to trim it?',
    'Explain the 50/30/20 budget framework for my income',
    'How much should I save daily for my Particle goals?',
    'Safe investment options (SIP, FD, Index Funds)',
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[750px]">
      {/* Header */}
      <div className="p-4 md:p-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-indigo-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Money AI
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold">
                Gemini Powered
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Personalized financial reasoning tuned to your spending data
            </p>
          </div>
        </div>

        {/* Live sync badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Limit: {formatCurrency(dailyLimit, currency)}/day
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto flex gap-2 no-scrollbar">
        {promptSuggestions.map((prompt, i) => (
          <button
            key={i}
            type="button"
            disabled={isLoading}
            onClick={() => handleSend(prompt)}
            className="shrink-0 text-xs py-1.5 px-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors flex items-center gap-1.5"
          >
            <HelpCircle className="w-3 h-3 text-indigo-400" />
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'bot' && (
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'bg-slate-800/90 border border-slate-700/70 text-slate-200 shadow-sm'
              }`}
            >
              {/* Basic markdown renderer */}
              <div className="whitespace-pre-wrap space-y-1.5">
                {msg.text.split('\n').map((line, idx) => {
                  // Bold lines or bullet points
                  if (line.startsWith('- ') || line.startsWith('* ')) {
                    return (
                      <div key={idx} className="flex items-start gap-2 ml-1">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{line.replace(/^[-*]\s+/, '')}</span>
                      </div>
                    );
                  }
                  return <p key={idx}>{line}</p>;
                })}
              </div>
              <div
                className={`text-[10px] mt-2 font-mono text-right ${
                  msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            </div>
            <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl p-3.5 text-xs text-slate-400 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              Money AI is crunching financial data...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div className="p-3 md:p-4 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask Money AI anything (e.g. 'Can I afford dining out tonight?')..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-800/90 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-bold disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

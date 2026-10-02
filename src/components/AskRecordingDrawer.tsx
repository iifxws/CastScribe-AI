import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Sparkles,
  ShieldCheck,
  Clock,
  Loader2,
  Copy,
  Check,
  HelpCircle,
  FileQuestion,
} from 'lucide-react';
import { ChatMessage, Recording } from '../types';
import { chatWithRecording } from '../services/api';

interface AskRecordingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recording: Recording;
  onJumpToTimestamp: (timestamp: string) => void;
}

export const AskRecordingDrawer: React.FC<AskRecordingDrawerProps> = ({
  isOpen,
  onClose,
  recording,
  onJumpToTimestamp,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(
    recording.chatHistory || [
      {
        id: 'msg-init',
        sender: 'assistant',
        text: `Welcome! Ask me anything about **"${recording.title}"**.\n\nI am strictly grounded in this transcript and will cite the exact timestamp for every answer. If something was not mentioned in the audio, I will explicitly tell you.`,
        createdAt: new Date().toISOString(),
      },
    ]
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await chatWithRecording({
        transcript: recording.transcript,
        question: q,
      });

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        citations: res.citations?.map((c) => ({
          timestamp: c.timestamp,
          seconds: 0,
          quote: c.quote,
        })),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Error processing question: ${e.message || 'Please try again.'}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  const samplePrompts = [
    'What was the primary objection to the $19 pricing model?',
    'Turn the main lesson into a 4-tweet thread with timestamps.',
    'Write a 2-paragraph YouTube description with chapter markers.',
    'What specific outbound sales tactic was used?',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col backdrop-blur-xl animate-slideLeft">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Ask This Recording</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% Grounded
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 truncate max-w-[260px]">
              {recording.title}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        <span className="text-slate-500 shrink-0 font-semibold text-[10px] uppercase">
          Try:
        </span>
        {samplePrompts.slice(0, 2).map((sp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sp)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 shrink-0 truncate max-w-[200px] border border-slate-700/60"
          >
            {sp}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[90%] ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {/* Citations chip */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      Sources:
                    </span>
                    {m.citations.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => onJumpToTimestamp(c.timestamp)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 font-mono text-[10px] transition-colors"
                      >
                        <Clock className="w-2.5 h-2.5" />
                        <span>{c.timestamp}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!isUser && (
                <div className="flex items-center gap-2 px-1 text-[11px] text-slate-500">
                  <button
                    onClick={() => handleCopy(m.text, m.id)}
                    className="hover:text-slate-300 flex items-center gap-1"
                  >
                    {copiedId === m.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Copy</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 max-w-[80%] animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Consulting transcript timecodes...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or request a custom format..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

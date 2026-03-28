"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";

interface Message { role: "user" | "assistant"; content: string; }
type Mode = "compact" | "detailed";

export default function InvestigatePage() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("detailed");
  const bottomRef = useRef<HTMLDivElement>(null);
  const didAutoSubmit = useRef(false);

  // Auto-submit query from URL param (from "Utred vidare" on map)
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !didAutoSubmit.current) {
      didAutoSubmit.current = true;
      handleSubmit(q);
    }
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const suggestedQuestions = [
    "Vad är kopplingen mellan vapenexport och barnadödlighet i Jemen?",
    "Hur påverkar krig barns hjärnutveckling långsiktigt?",
    "Vilka länder exporterar mest vapen till konfliktområden?",
    "Hur används barn som soldater av ISIS och Boko Haram?",
  ];

  async function handleSubmit(question?: string) {
    const q = question || input.trim();
    if (!q || loading) return;
    setInput("");
    const userMsg: Message = { role: "user", content: q };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, mode, history: messages.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.answer || data.error }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Något gick fel. Försök igen." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <div className="border-b border-zinc-800/80 px-8 py-4 md:px-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/sv" className="text-zinc-600 hover:text-zinc-400 text-xs font-mono transition-colors">← Krigets Arv</Link>
          <span className="text-zinc-800">/</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">AI-Utredaren</span>
          </div>
        </div>
        <div className="flex items-center gap-1 border border-zinc-800 bg-zinc-900/40 p-0.5">
          <button onClick={() => setMode("compact")}
            className={`px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase transition-colors ${mode === "compact" ? "bg-red-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
            Kompakt
          </button>
          <button onClick={() => setMode("detailed")}
            className={`px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase transition-colors ${mode === "detailed" ? "bg-red-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
            Utförlig
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 md:px-14 py-8 max-w-3xl w-full mx-auto">
        {messages.length === 0 && !loading && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Georgia', serif" }}>Ställ en fråga</h1>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-lg">
                AI-utredaren svarar baserat på 366 kuraterade källdokument. Välj <span className="text-zinc-300">Kompakt</span> för snabba fakta eller <span className="text-zinc-300">Utförlig</span> för djupanalys.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-mono tracking-widest text-zinc-600 uppercase">Föreslagna frågor</p>
              {suggestedQuestions.map((q) => (
                <button key={q} onClick={() => handleSubmit(q)}
                  className="block w-full text-left px-4 py-3 border border-zinc-800 hover:border-zinc-600 bg-zinc-900/30 hover:bg-zinc-900/60 text-zinc-300 hover:text-white text-sm transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
              {msg.role === "assistant" && (
                <div className="mr-3 mt-1 h-5 w-5 shrink-0 rounded-sm bg-red-900 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-red-200">AI</span>
                </div>
              )}
              <div className={`max-w-[85%] rounded-sm px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-zinc-800 text-zinc-100" : "bg-zinc-900/60 border border-zinc-800 text-zinc-200"}`}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown components={{
                    strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
                    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3">{children}</ul>,
                    li: ({ children }) => <li className="text-zinc-300">{children}</li>,
                    h2: ({ children }) => <h2 className="text-sm font-bold text-red-400 mb-2 mt-3 first:mt-0">{children}</h2>,
                  }}>{msg.content}</ReactMarkdown>
                ) : msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="mr-3 mt-1 h-5 w-5 shrink-0 rounded-sm bg-red-900 flex items-center justify-center">
                <span className="text-[9px] font-bold text-red-200">AI</span>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 px-4 py-3 rounded-sm">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-zinc-800/80 px-8 md:px-14 py-5 bg-black/40 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Skriv din fråga om krigets konsekvenser för barn..."
            disabled={loading}
            className="flex-1 bg-zinc-900/60 border border-zinc-700 hover:border-zinc-600 focus:border-red-700 outline-none text-zinc-100 placeholder:text-zinc-600 px-4 py-3 text-sm transition-colors"
          />
          <button onClick={() => handleSubmit()} disabled={loading || !input.trim()}
            className="bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold tracking-widest uppercase px-6 py-3 transition-colors">
            Fråga
          </button>
        </div>
        <p className="text-center text-[10px] text-zinc-700 font-mono mt-3">
          Svar baseras på kuraterat källmaterial · UNICEF · SIPRI · ICRC · FN · Läge: {mode === "compact" ? "Kompakt" : "Utförlig"}
        </p>
      </div>
    </div>
  );
}

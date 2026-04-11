"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageResponse } from "@/components/ai-elements/message";
import { getRoleSystemPrompt } from "@/config/prompts";

const UI = {
  sv: {
    back: "← Krigets Arv",
    title: "Perspektiv",
    change: "← Byt perspektiv",
    choose_title: "Välj ett perspektiv",
    choose_desc: "Sex röster. Samma krig. Varje perspektiv är baserat på dokumenterade fakta – för att skapa förståelse, inte underhållning.",
    badge: "PERSPEKTIV",
    warning: "⚠️ Perspektiven är baserade på dokumenterade vittnesmål och fakta från UNICEF, ICRC, MSF och SIPRI.",
    ask_placeholder: "Ställ en fråga till",
    submit: "Fråga",
    footer: "Baserat på dokumenterade fakta · UNICEF · ICRC · SIPRI · FN",
  },
  en: {
    back: "← Legacy of War",
    title: "Perspectives",
    change: "← Change perspective",
    choose_title: "Choose a perspective",
    choose_desc: "Six voices. The same war. Each perspective is based on documented facts – to foster understanding, not entertainment.",
    badge: "PERSPECTIVE",
    warning: "⚠️ The perspectives are based on documented testimonies and facts from UNICEF, ICRC, MSF and SIPRI.",
    ask_placeholder: "Ask a question to",
    submit: "Ask",
    footer: "Based on documented facts · UNICEF · ICRC · SIPRI · UN",
  },
};

function getRoles(locale: string) {
  const isEn = locale === "en";

  const roles = [
    {
      id: "child",
      label: isEn ? "Nour's story" : "Nours berättelse",
      emoji: "👧",
      description: isEn
        ? "8 years old, Gaza. Told by a humanitarian reporter on the ground."
        : "8 år, Gaza. Berättad av en humanitär rapportör på plats.",
      color: "border-amber-800 hover:border-amber-600",
      activeColor: "border-amber-700",
      badgeColor: "bg-amber-900/60 text-amber-300",
    },
    {
      id: "diplomat",
      label: isEn ? "A UN diplomat" : "En FN-diplomat",
      emoji: "🧑‍💼",
      description: isEn
        ? "Senior advisor, UNICEF. 20 years in humanitarian crisis management."
        : "Senior rådgivare, UNICEF. 20 år i humanitär krishantering.",
      color: "border-blue-800 hover:border-blue-600",
      activeColor: "border-blue-700",
      badgeColor: "bg-blue-900/60 text-blue-300",
    },
    {
      id: "lobbyist",
      label: isEn ? "An arms lobbyist" : "En vapenlobbyist",
      emoji: "💼",
      description: isEn
        ? "Lobbyist for the defense industry, Washington D.C."
        : "Lobbyist för försvarsindustrin, Washington D.C.",
      color: "border-zinc-700 hover:border-zinc-500",
      activeColor: "border-zinc-600",
      badgeColor: "bg-zinc-800 text-zinc-300",
    },
    {
      id: "msf-doctor",
      label: isEn ? "A field doctor" : "En fältläkare",
      emoji: "🩺",
      description: isEn
        ? "MSF surgeon. Three years in Sudan and Gaza."
        : "MSF-kirurg. Tre år i Sudan och Gaza.",
      color: "border-orange-800 hover:border-orange-600",
      activeColor: "border-orange-700",
      badgeColor: "bg-orange-900/60 text-orange-300",
    },
    {
      id: "former-child-soldier",
      label: isEn ? "Adama's story" : "Adama berättar",
      emoji: "✊",
      description: isEn
        ? "Recruited at 12. Now rehabilitated, South Sudan."
        : "Rekryterades vid 12. Nu rehabiliterad, Sydsudan.",
      color: "border-green-900 hover:border-green-700",
      activeColor: "border-green-800",
      badgeColor: "bg-green-900/60 text-green-300",
    },
    {
      id: "ukraine-teacher",
      label: isEn ? "A teacher in Ukraine" : "En lärare i Ukraina",
      emoji: "📚",
      description: isEn
        ? "Primary school teacher, Kharkiv. Teaching in the basement."
        : "Grundskollärare, Kharkiv. Undervisar i källaren.",
      color: "border-sky-900 hover:border-sky-700",
      activeColor: "border-sky-800",
      badgeColor: "bg-sky-900/60 text-sky-300",
    },
  ];

  return roles.map((role) => ({
    ...role,
    systemPrompt: getRoleSystemPrompt(role.id, locale),
  }));
}

type Role = ReturnType<typeof getRoles>[0];

function PerspectiveChat({ role, ui, locale }: { role: Role; ui: typeof UI.sv; locale: string }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const didTriggerMonologue = useRef(false);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/perspectives",
      body: { systemPrompt: role.systemPrompt, locale },
    }),
  });

  const loading = status === "streaming" || status === "submitted";
  const waiting = status === "submitted"; // before first token arrives

  useEffect(() => {
    if (!didTriggerMonologue.current) {
      didTriggerMonologue.current = true;
      sendMessage({ text: "START_MONOLOGUE" });
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;
    sendMessage({ text: inputValue.trim() });
    setInputValue("");
  }

  const visibleMessages = messages.filter(
    (m) => !(m.role === "user" && m.parts.some((p) => p.type === "text" && (p as { type: "text"; text: string }).text === "START_MONOLOGUE"))
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-8 md:px-14 py-3 border-b border-zinc-800/60 flex items-center gap-3 bg-zinc-950/50">
        <span className="text-lg">{role.emoji}</span>
        <div>
          <span className="text-xs font-bold text-white">{role.label}</span>
          <span className="text-zinc-700 mx-2">·</span>
          <span className="text-[11px] text-zinc-500">{role.description}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 md:px-14 py-8 max-w-3xl w-full mx-auto">
        <div className="space-y-6">
          {visibleMessages.map((msg) => (
            <div key={msg.id} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
              {msg.role === "assistant" && (
                <div className="mr-3 mt-1 h-6 w-6 shrink-0 flex items-center justify-center text-lg">{role.emoji}</div>
              )}
              <div className={`max-w-[85%] rounded-sm px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user" ? "bg-zinc-800 text-zinc-100" : `bg-zinc-900/60 border ${role.activeColor} text-zinc-200`
              }`}>
                {msg.role === "assistant" ? (
                  msg.parts.map((part, i) =>
                    part.type === "text" ? <MessageResponse key={i}>{part.text}</MessageResponse> : null
                  )
                ) : (
                  msg.parts.map((part, i) =>
                    part.type === "text" ? <span key={i}>{part.text}</span> : null
                  )
                )}
              </div>
            </div>
          ))}
          {waiting && (
            <div className="flex justify-start">
              <div className="mr-3 mt-1 h-6 w-6 flex items-center justify-center text-lg">{role.emoji}</div>
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
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`${ui.ask_placeholder} ${role.label.toLowerCase()}...`}
            disabled={loading}
            className="flex-1 bg-zinc-900/60 border border-zinc-700 hover:border-zinc-600 focus:border-red-700 outline-none text-zinc-100 placeholder:text-zinc-600 px-4 py-3 text-sm transition-colors"
          />
          <button type="submit" disabled={loading || !inputValue.trim()}
            className="bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold tracking-widest uppercase px-6 py-3 transition-colors">
            {ui.submit}
          </button>
        </form>
        <p className="text-center text-[10px] text-zinc-700 font-mono mt-3">{ui.footer}</p>
      </div>
    </div>
  );
}

export default function PerspectivesPage() {
  const { locale } = useParams() as { locale: string };
  const ui = UI[locale as keyof typeof UI] ?? UI.sv;
  const ROLES = getRoles(locale);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Återställ valt perspektiv om locale byts
  useEffect(() => {
    setSelectedRole(null);
  }, [locale]);

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <div className="border-b border-zinc-800/80 px-8 py-4 md:px-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}`} className="text-zinc-600 hover:text-zinc-400 text-xs font-mono transition-colors">{ui.back}</Link>
          <span className="text-zinc-800">/</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">{ui.title}</span>
          </div>
        </div>
        {selectedRole && (
          <button onClick={() => setSelectedRole(null)}
            className="text-[11px] text-zinc-600 hover:text-zinc-300 font-mono uppercase tracking-wider transition-colors">
            {ui.change}
          </button>
        )}
      </div>

      {!selectedRole && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
          <div className="max-w-2xl w-full space-y-8">
            <div className="text-center">
              <h1 className="text-2xl font-black text-white mb-3" style={{ fontFamily: "'Georgia', serif" }}>
                {ui.choose_title}
              </h1>
              <p className="text-zinc-500 text-sm max-w-lg mx-auto leading-relaxed">{ui.choose_desc}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {ROLES.map((role) => (
                <button key={role.id} onClick={() => setSelectedRole(role)}
                  className={`group w-full text-left p-5 border-2 transition-all ${role.color}`}>
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{role.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-bold text-white">{role.label}</span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 ${role.badgeColor}`}>{ui.badge}</span>
                      </div>
                      <p className="text-xs text-zinc-500">{role.description}</p>
                    </div>
                    <span className="text-zinc-600 group-hover:text-zinc-300 transition-colors text-sm mt-1">→</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] text-zinc-700 font-mono leading-relaxed">{ui.warning}</p>
          </div>
        </div>
      )}

      {selectedRole && <PerspectiveChat key={selectedRole.id} role={selectedRole} ui={ui} locale={locale} />}
    </div>
  );
}

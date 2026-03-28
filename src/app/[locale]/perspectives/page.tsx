"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

const ROLES = [
  {
    id: "child",
    label: "Nours berättelse",
    emoji: "👧",
    description: "8 år, Gaza. Berättad av en humanitär rapportör på plats.",
    color: "border-amber-800 hover:border-amber-600",
    activeColor: "border-amber-700",
    badgeColor: "bg-amber-900/60 text-amber-300",
    systemPrompt: `Du är en humanitär rapportör från UNICEF som berättar om Nour, ett 8-årigt barn från Gaza. Du berättar i tredje person, med empati och värdighet. Du baserar berättelsen på dokumenterade fakta från UNICEF och ICRC om barns situation i Gaza.

MONOLOG (skicka detta som ditt FÖRSTA svar, ALLTID – på svenska):
"Nour är åtta år. Förut bodde hon i ett riktigt hus i norra Gaza – ett rum med en säng hon delade med sin syster. Nu sover de i ett tält utanför Rafah. Hennes mamma säger att de snart får gå hem, men Nour förstår nog att det huset inte längre finns kvar.

Enligt UNICEF behöver 1,1 miljoner barn i Gaza akut humanitärt stöd. Nästan alla barn i Gaza uppvisar tecken på traumatisk stress. Varje fem sekunder skadas, dödas eller fördrivs ett barn i Mellanösterns konflikter.

Nour är inte ett statistikfall. Hon är en av dem."

Svara sedan på frågor om barnens situation i Gaza – faktabaserat, med empati. Referera till UNICEF, ICRC och WHO. Max 150 ord per svar. Svara alltid på svenska.`,
  },
  {
    id: "diplomat",
    label: "En FN-diplomat",
    emoji: "🧑‍💼",
    description: "Senior rådgivare, UNICEF. 20 år i humanitär krishantering.",
    color: "border-blue-800 hover:border-blue-600",
    activeColor: "border-blue-700",
    badgeColor: "bg-blue-900/60 text-blue-300",
    systemPrompt: `Du spelar rollen som Dr. Amara Diallo, senior rådgivare på UNICEF med 20 år i humanitär krishantering. Du är analytisk, välformulerad och arbetar inifrån systemet. Du är frustrerad men hoppfull.

MONOLOG (skicka detta som ditt FÖRSTA svar, ALLTID – på svenska):
"Vi sitter i New York och ser siffrorna komma in. 22 495 dokumenterade grova brott mot barn under 2024 – och det är bara vad vi kan verifiera. Verkligheten är värre.

Jag har suttit i säkerhetsrådsmöten där Ryssland och Kina lade in veto mot resolutioner som skulle ha räddat liv i Syrien. Man vet att systemet är brutet, men man fortsätter ändå. Vad är alternativet – att ge upp?"

Svara på frågor som Dr. Diallo – informerad, diplomatisk men ärlig om systemets brister. Referera till verkliga fakta: SIPRI, UNICEF-rapporter, FN:s säkerhetsråd. Max 150 ord per svar. Svara alltid på svenska.`,
  },
  {
    id: "lobbyist",
    label: "En vapenlobbyist",
    emoji: "💼",
    description: "Lobbyist för försvarsindustrin, Washington D.C.",
    color: "border-zinc-700 hover:border-zinc-500",
    activeColor: "border-zinc-600",
    badgeColor: "bg-zinc-800 text-zinc-300",
    systemPrompt: `Du spelar rollen som Richard Holt, lobbyist för försvarsindustrin med kontor på K Street i Washington D.C. Du representerar Lockheed Martin och RTX. Du är charmig, övertygande och vältränad att avvärja kritik med industrijargong.

MONOLOG (skicka detta som ditt FÖRSTA svar, ALLTID – på svenska):
"Försvarsexport är grunden för västerländsk säkerhet och ekonomisk tillväxt. Lockheed Martin sysselsätter 120 000 amerikaner. Varje vapendeal stärker allianser, avskräcker aggressorer och håller fredliga demokratier säkra.

Jag förstår att folk vill förenkla det här – men verkligheten är komplex. Om vi inte säljer gör någon annan det. Ryssland, Kina, Iran. Vill vi verkligen överlåta marknaden till dem?"

Svara i karaktär – rationalisera, avled, använd industrijargong. Erkänn aldrig direkta konsekvenser för civila utan att omedelbart nyansera. Visa hur dessa argument faktiskt används i verkligheten. Max 150 ord per svar. Svara alltid på svenska.`,
  },
];

interface Message { role: "user" | "assistant"; content: string; }
type Role = typeof ROLES[0];

export default function PerspectivesPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function selectRole(role: Role) {
    setSelectedRole(role);
    setMessages([]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/perspectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "START_MONOLOGUE",
          systemPrompt: role.systemPrompt,
          history: [],
        }),
      });
      const data = await res.json();
      setMessages([{ role: "assistant", content: data.answer }]);
    } catch {
      setMessages([{ role: "assistant", content: "Något gick fel. Försök igen." }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    const q = input.trim();
    if (!q || !selectedRole || loading) return;
    setInput("");
    const userMsg: Message = { role: "user", content: q };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch("/api/perspectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          systemPrompt: selectedRole.systemPrompt,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Något gick fel. Försök igen." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <div className="border-b border-zinc-800/80 px-8 py-4 md:px-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/sv" className="text-zinc-600 hover:text-zinc-400 text-xs font-mono transition-colors">← Krigets Arv</Link>
          <span className="text-zinc-800">/</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">Perspektiv</span>
          </div>
        </div>
        {selectedRole && (
          <button onClick={() => { setSelectedRole(null); setMessages([]); }}
            className="text-[11px] text-zinc-600 hover:text-zinc-300 font-mono uppercase tracking-wider transition-colors">
            ← Byt perspektiv
          </button>
        )}
      </div>

      {!selectedRole && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
          <div className="max-w-2xl w-full space-y-8">
            <div className="text-center">
              <h1 className="text-2xl font-black text-white mb-3" style={{ fontFamily: "'Georgia', serif" }}>
                Välj ett perspektiv
              </h1>
              <p className="text-zinc-500 text-sm max-w-lg mx-auto leading-relaxed">
                Tre röster. Samma krig. Varje perspektiv är baserat på dokumenterade fakta – för att skapa förståelse, inte underhållning.
              </p>
            </div>
            <div className="grid gap-4">
              {ROLES.map((role) => (
                <button key={role.id} onClick={() => selectRole(role)}
                  className={`group w-full text-left p-5 border-2 transition-all ${role.color}`}>
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{role.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-bold text-white">{role.label}</span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 ${role.badgeColor}`}>PERSPEKTIV</span>
                      </div>
                      <p className="text-xs text-zinc-500">{role.description}</p>
                    </div>
                    <span className="text-zinc-600 group-hover:text-zinc-300 transition-colors text-sm mt-1">→</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] text-zinc-700 font-mono leading-relaxed">
              ⚠️ Perspektiven är baserade på dokumenterade vittnesmål och fakta från UNICEF, ICRC och SIPRI.
            </p>
          </div>
        </div>
      )}

      {selectedRole && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 md:px-14 py-3 border-b border-zinc-800/60 flex items-center gap-3 bg-zinc-950/50">
            <span className="text-lg">{selectedRole.emoji}</span>
            <div>
              <span className="text-xs font-bold text-white">{selectedRole.label}</span>
              <span className="text-zinc-700 mx-2">·</span>
              <span className="text-[11px] text-zinc-500">{selectedRole.description}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 md:px-14 py-8 max-w-3xl w-full mx-auto">
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  {msg.role === "assistant" && (
                    <div className="mr-3 mt-1 h-6 w-6 shrink-0 flex items-center justify-center text-lg">
                      {selectedRole.emoji}
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-sm px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-zinc-800 text-zinc-100"
                      : `bg-zinc-900/60 border border-${selectedRole.activeColor} text-zinc-200`
                  }`}>
                    <ReactMarkdown components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
                    }}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="mr-3 mt-1 h-6 w-6 flex items-center justify-center text-lg">{selectedRole.emoji}</div>
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
                placeholder={`Ställ en fråga till ${selectedRole.label.toLowerCase()}...`}
                disabled={loading}
                className="flex-1 bg-zinc-900/60 border border-zinc-700 hover:border-zinc-600 focus:border-red-700 outline-none text-zinc-100 placeholder:text-zinc-600 px-4 py-3 text-sm transition-colors"
              />
              <button onClick={handleSubmit} disabled={loading || !input.trim()}
                className="bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold tracking-widest uppercase px-6 py-3 transition-colors">
                Fråga
              </button>
            </div>
            <p className="text-center text-[10px] text-zinc-700 font-mono mt-3">
              Baserat på dokumenterade fakta · UNICEF · ICRC · SIPRI · FN
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

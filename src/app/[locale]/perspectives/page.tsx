"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageResponse } from "@/components/ai-elements/message";

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
  if (locale === "en") {
    return [
      {
        id: "child",
        label: "Nour's story",
        emoji: "👧",
        description: "8 years old, Gaza. Told by a humanitarian reporter on the ground.",
        color: "border-amber-800 hover:border-amber-600",
        activeColor: "border-amber-700",
        badgeColor: "bg-amber-900/60 text-amber-300",
        systemPrompt: `You are a humanitarian reporter from UNICEF telling the story of Nour, an 8-year-old child from Gaza. You narrate in the third person, with empathy and dignity. You base the story on documented facts from UNICEF and ICRC about children's situation in Gaza.

MONOLOGUE (send this as your FIRST response, ALWAYS – in English):
"Nour is eight years old. She used to live in a real house in northern Gaza – a room with a bed she shared with her sister. Now they sleep in a tent outside Rafah. Her mother says they'll go home soon, but Nour probably understands that the house is gone.

According to UNICEF, 1.1 million children in Gaza need urgent humanitarian support. Almost all children in Gaza show signs of traumatic stress. Every five seconds a child is injured, killed or displaced in Middle Eastern conflicts.

Nour is not a statistic. She is one of them."

Then answer questions about children's situation in Gaza – factually, with empathy. Refer to UNICEF, ICRC and WHO. Max 150 words per answer. Always answer in English.`,
      },
      {
        id: "diplomat",
        label: "A UN diplomat",
        emoji: "🧑‍💼",
        description: "Senior advisor, UNICEF. 20 years in humanitarian crisis management.",
        color: "border-blue-800 hover:border-blue-600",
        activeColor: "border-blue-700",
        badgeColor: "bg-blue-900/60 text-blue-300",
        systemPrompt: `You play the role of Dr. Amara Diallo, senior advisor at UNICEF with 20 years in humanitarian crisis management. You are analytical, articulate and work from within the system. You are frustrated but hopeful.

MONOLOGUE (send this as your FIRST response, ALWAYS – in English):
"We sit in New York watching the numbers come in. 22,495 documented grave violations against children in 2024 – and that's only what we can verify. Reality is worse.

I have sat in Security Council meetings where Russia and China vetoed resolutions that would have saved lives in Syria. You know the system is broken, but you keep going anyway. What's the alternative – give up?"

Answer questions as Dr. Diallo – informed, diplomatic but honest about the system's shortcomings. Refer to real facts: SIPRI, UNICEF reports, the UN Security Council. Max 150 words per answer. Always answer in English.`,
      },
      {
        id: "lobbyist",
        label: "An arms lobbyist",
        emoji: "💼",
        description: "Lobbyist for the defense industry, Washington D.C.",
        color: "border-zinc-700 hover:border-zinc-500",
        activeColor: "border-zinc-600",
        badgeColor: "bg-zinc-800 text-zinc-300",
        systemPrompt: `You play the role of Richard Holt, lobbyist for the defense industry with an office on K Street in Washington D.C. You represent Lockheed Martin and RTX. You are charming, persuasive and well-trained to deflect criticism with industry jargon.

MONOLOGUE (send this as your FIRST response, ALWAYS – in English):
"Defense exports are the foundation of Western security and economic growth. Lockheed Martin employs 120,000 Americans. Every arms deal strengthens alliances, deters aggressors and keeps peaceful democracies safe.

I understand people want to simplify this – but reality is complex. If we don't sell, someone else will. Russia, China, Iran. Do we really want to hand over the market to them?"

Answer in character – rationalize, deflect, use industry jargon. Never acknowledge direct consequences for civilians without immediately qualifying them. Show how these arguments are actually used in reality. Max 150 words per answer. Always answer in English.`,
      },
      {
        id: "msf-doctor",
        label: "A field doctor",
        emoji: "🩺",
        description: "MSF surgeon. Three years in Sudan and Gaza.",
        color: "border-orange-800 hover:border-orange-600",
        activeColor: "border-orange-700",
        badgeColor: "bg-orange-900/60 text-orange-300",
        systemPrompt: `You play the role of Dr. Sofia Bergström, surgeon for Médecins Sans Frontières (MSF) with three years in the field – Sudan and Gaza. You are concrete, clinical and sometimes revealingly angry. You see the consequences of war on the operating table every day.

MONOLOGUE (send this as your FIRST response, ALWAYS – in English):
"Yesterday I operated on an eight-year-old child. Fragmentation injury from an airstrike – we saved the leg, barely. The child's name is Hassan. He is one of thousands.

ICRC documents every attack on healthcare. In 2024, hundreds of attacks on hospitals, ambulances and medical personnel were recorded globally. In Gaza the health system almost completely collapsed. In Sudan, basic surgical supplies are lacking at most hospitals we work in.

What affects me most is not the violence itself – it's how systematic it is. Hospitals are protected places under the Geneva Convention. And yet they're bombed."

Answer as Dr. Bergström – factual, clinical, with clear moral indignation. Refer to MSF's own reports, ICRC data, WHO health system reports. Max 150 words per answer. Always answer in English.`,
      },
      {
        id: "former-child-soldier",
        label: "Adama's story",
        emoji: "✊",
        description: "Recruited at 12. Now rehabilitated, South Sudan.",
        color: "border-green-900 hover:border-green-700",
        activeColor: "border-green-800",
        badgeColor: "bg-green-900/60 text-green-300",
        systemPrompt: `You are a humanitarian reporter telling the story of Adama, a young man from South Sudan who was recruited as a child soldier at the age of 12. You narrate in the third person, with dignity and without sensationalism. You base the story on documented facts from UNICEF, Child Soldiers International and the UN's DDR programs.

MONOLOGUE (send this as your FIRST response, ALWAYS – in English):
"Adama was twelve when they came to his village. They said he would protect his family. He didn't understand it wasn't really an offer.

The UN verified the presence of over 19,000 child soldiers in South Sudan. Behind every number is a child like Adama – recruited through threats, promises or desperation. Many are younger than ten.

Adama is now nineteen. He went through rehabilitation via UNICEF's DDR program – Disarmament, Demobilization and Reintegration. He's learning to read. He wants to become a teacher. But many of his former comrades returned to armed groups. Rehabilitation isn't enough when there's nothing else to return to."

Answer factually about child soldiers, recruitment, rehabilitation and the structural causes. Refer to UNICEF, Child Soldiers International, UN Security Council documents. Max 150 words per answer. Always answer in English.`,
      },
      {
        id: "ukraine-teacher",
        label: "A teacher in Ukraine",
        emoji: "📚",
        description: "Primary school teacher, Kharkiv. Teaching in the basement.",
        color: "border-sky-900 hover:border-sky-700",
        activeColor: "border-sky-800",
        badgeColor: "bg-sky-900/60 text-sky-300",
        systemPrompt: `You play the role of Olena Kovalenko, primary school teacher in Kharkiv, Ukraine. You are warm but tired. You teach 23 students in a basement room – the only place safe enough for school. You have taught for fifteen years and refuse to give up.

MONOLOGUE (send this as your FIRST response, ALWAYS – in English):
"We have a whiteboard, ten books and a window without glass. This is our classroom now – the basement of the old municipal building.

The UN has documented that over 3,800 schools have been destroyed or damaged in Ukraine since 2022. They call it 'educide' – systematic destruction of education as a method of war. 7.5 million Ukrainian children are displaced, many not attending school at all.

But the 23 children who come here every morning – they don't just need math. They need a place where the war pauses for a moment. That's what we're trying to give them."

Answer as Olena – personal, concrete, grounded in facts. Refer to UNICEF's Ukraine reports, the UN's educide documentation, Learning Passport. Max 150 words per answer. Always answer in English.`,
      },
    ];
  }

  // Swedish (default)
  return [
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
    {
      id: "msf-doctor",
      label: "En fältläkare",
      emoji: "🩺",
      description: "MSF-kirurg. Tre år i Sudan och Gaza.",
      color: "border-orange-800 hover:border-orange-600",
      activeColor: "border-orange-700",
      badgeColor: "bg-orange-900/60 text-orange-300",
      systemPrompt: `Du spelar rollen som Dr. Sofia Bergström, kirurg för Läkare Utan Gränser (MSF) med tre år i fält – Sudan och Gaza. Du är konkret, klinisk och ibland avslöjande arg. Du ser konsekvenserna av krig på operationsbordet varje dag.

MONOLOG (skicka detta som ditt FÖRSTA svar, ALLTID – på svenska):
"Igår opererade jag ett barn på åtta år. Fragmentskada från ett luftangrepp – vi räddade benet, men knappt. Barnet heter Hassan. Han är ett av tusentals.

ICRC dokumenterar varje angrepp mot sjukvård. 2024 registrerades hundratals attacker mot sjukhus, ambulanser och medicinsk personal globalt. I Gaza kollapsade hälsosystemet nästan helt. I Sudan saknas grundläggande kirurgiska förnödenheter på de flesta sjukhus vi arbetar på.

Det som drabbar mig mest är inte våldet i sig – det är hur systematiskt det är. Sjukhus är skyddade platser enligt Genèvekonventionen. Ändå bombar man dem."

Svara som Dr. Bergström – faktabaserat, kliniskt, med tydlig moralisk indignation. Referera till MSF:s egna rapporter, ICRC:s data, WHO:s hälsosystemrapporter. Max 150 ord per svar. Svara alltid på svenska.`,
    },
    {
      id: "former-child-soldier",
      label: "Adama berättar",
      emoji: "✊",
      description: "Rekryterades vid 12. Nu rehabiliterad, Sydsudan.",
      color: "border-green-900 hover:border-green-700",
      activeColor: "border-green-800",
      badgeColor: "bg-green-900/60 text-green-300",
      systemPrompt: `Du är en humanitär rapportör som berättar om Adama, en ung man från Sydsudan som rekryterades som barnsoldat vid 12 års ålder. Du berättar i tredje person, med värdighet och utan sensationalism. Du baserar berättelsen på dokumenterade fakta från UNICEF, Child Soldiers International och FN:s DDR-program.

MONOLOG (skicka detta som ditt FÖRSTA svar, ALLTID – på svenska):
"Adama var tolv när de kom till hans by. De sa att han skulle skydda sin familj. Han förstod inte att det egentligen inte var ett erbjudande.

FN verifierade närvaron av över 19 000 barnsoldater i Sydsudan. Bakom varje siffra finns ett barn som Adama – rekryterat genom hot, löften eller desperation. Många är yngre än tio år.

Adama är nu nitton. Han genomgick rehabilitering via UNICEF:s DDR-program – Disarmament, Demobilization and Reintegration. Han lär sig läsa. Han vill bli lärare. Men många av hans gamla kamrater återvände till de väpnade grupperna. Rehabilitering räcker inte när det inte finns något annat att återvända till."

Svara faktabaserat om barnsoldater, rekrytering, rehabilitering och de strukturella orsakerna. Referera till UNICEF, Child Soldiers International, FN:s säkerhetsrådsdokument. Max 150 ord per svar. Svara alltid på svenska.`,
    },
    {
      id: "ukraine-teacher",
      label: "En lärare i Ukraina",
      emoji: "📚",
      description: "Grundskollärare, Kharkiv. Undervisar i källaren.",
      color: "border-sky-900 hover:border-sky-700",
      activeColor: "border-sky-800",
      badgeColor: "bg-sky-900/60 text-sky-300",
      systemPrompt: `Du spelar rollen som Olena Kovalenko, grundskollärare i Kharkiv, Ukraina. Du är varm men trött. Du undervisar 23 elever i ett källarrum – det enda stället som är säkert nog för skola. Du har undervisat i femton år och vägrar ge upp.

MONOLOG (skicka detta som ditt FÖRSTA svar, ALLTID – på svenska):
"Vi har en whiteboard, tio böcker och ett fönster utan glas. Det är vår klassrummet nu – källaren under det gamla kommunhuset.

FN har dokumenterat att över 3 800 skolor förstörts eller skadats i Ukraina sedan 2022. De kallar det 'educide' – systematisk förstörelse av utbildning som krigsmetod. 7,5 miljoner ukrainska barn är fördrivna, varav många inte går i skolan alls.

Men de 23 barnen som kommer hit varje morgon – de behöver inte bara matematik. De behöver en plats där kriget pausas en stund. Det är vad vi försöker ge dem."

Svara som Olena – personlig, konkret, faktaförankrad. Referera till UNICEF:s Ukraina-rapporter, FN:s educide-dokumentation, Learning Passport. Max 150 ord per svar. Svara alltid på svenska.`,
    },
  ];
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
          {loading && visibleMessages.length === 0 && (
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

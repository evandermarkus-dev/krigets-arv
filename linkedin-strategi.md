# LinkedIn-strategi för Krigets Arv

## Övergripande approach

Krigets Arv är ovanligt i att det kombinerar **tech-ambition** med **samhällsnytta**. Det ger dig möjlighet att nå två olika LinkedIn-bubblor med ett och samma projekt — vilket är sällsynt och kraftfullt. Nyckelorden är äkthet, konkrethet och mod att prata om varför du byggde det.

---

## Fas 1 — Förberedelser innan publicering

### 1. Se till att projektet är redo att visas
- Ha en live-länk (Vercel-deploy) klar att dela
- Ta 3–4 skärmdumpar som visar:
  - Kartsidan (Explore) med en öppen konfliktzon
  - AI-utredaren (Investigate) med ett svar
  - Rollspelssidan (Perspectives) med en karaktär
  - Faktabanken (Factbank)
- Alternativt: spela in en kort skärmvideo (30–60 sek) med Loom eller liknande

### 2. Uppdatera din LinkedIn-profil
- Lägg till projektet under **Featured** på din profil med en länk och skärmdump
- Lägg till det i din **Experience**-sektion som t.ex. "Självständigt projekt — fullstack-webbutvecklare"
- Bio: Se till att du nämner att du arbetar med teknik för samhällsnytta

---

## Fas 2 — Publiceringsstrategi (3 inlägg)

Istället för ett enda inlägg rekommenderas **tre inlägg spridda över 2–3 veckor**. Varje inlägg vänder sig till en lite annorlunda del av din nätverk och förstärker varandra.

| Inlägg | Timing | Fokus | Primär målgrupp |
|--------|--------|-------|-----------------|
| #1 — Lanseringen | Dag 1 | Projektet + syfte + länk | Alla — bred räckvidd |
| #2 — Bakom kulisserna | +10 dagar | Tekniska val och lärdomar | Utvecklare |
| #3 — Reflektionen | +3 veckor | Varför det spelar roll | NGOs, lärare, journalister |

---

## Fas 3 — Färdiga inläggstexter

---

### INLÄGG #1 — Lanseringen

> **Tips:** Posta på tisdag–torsdag, kl. 08–10 eller 17–19. Inkludera 2–3 skärmdumpar.

---

**Alternativ A (mer personlig ton):**

Jag har byggt något som jag inte riktigt visste hur jag skulle prata om.

Det heter Krigets Arv — en webbapplikation som dokumenterar vad väpnade konflikter gör mot barn. Inte som ett nyhetsflöde, utan som ett verktyg. Du kan utforska konfliktzoner på en interaktiv karta, ställa frågor till en AI tränad på data från UNICEF, SIPRI och FN, och ta perspektivet av ett barn i Gaza, en FN-diplomat eller en vapenlobbyist.

Jag byggde det i Next.js 15 med Mapbox för kartorna och Claude Sonnet som AI-motor. Men det är inte primärt ett tech-projekt. Det är ett försök att göra svår, komplex information tillgänglig för den som vill förstå.

Länk i kommentarerna.

#NextJS #AI #DataVisualization #WebDevelopment #HumanRights

---

**Alternativ B (mer direkt och koncis):**

Ny applikation live: Krigets Arv 🌍

Ett interaktivt verktyg som dokumenterar väpnade konflikters konsekvenser för barn — med AI-forskning, kartvisualisering och rollspelsperspektiv.

Byggd med:
→ Next.js 15 + React 19
→ Mapbox GL för kartorna
→ Claude Sonnet (Anthropic) som AI-motor
→ Datakällor: UNICEF, SIPRI, ICRC, Save the Children

Riktar sig till journalister, NGO-forskare, lärare och nyfikna medborgare.

Länk i kommentarerna — feedback välkommen.

#WebDevelopment #AI #HumanRights #NextJS #OpenSource

---

### INLÄGG #2 — Bakom kulisserna (tech-fokus)

> **Tips:** Posta ~10 dagar efter #1. Bra att inkludera ett kodsnippet eller arkitekturdiagram.

---

Vad lär man sig av att bygga en AI-chatbot med ett humanitärt syfte? Ganska mycket, visar det sig.

Några tekniska val jag gjort i Krigets Arv och varför:

**Direkt Claude API istället för LangChain**
Jag valde @anthropic-ai/sdk direkt framför abstraktionslager. Det gav mer kontroll över systemprompten och tokens — viktigt när kunskapsbasen är 366 verifierade fakta inbäddade i varje anrop.

**next-intl för i18n från dag 1**
Projektet finns på svenska och engelska. Att bygga in lokaliseringen tidigt sparade mycket tid. Feature-sidor har hårdkodad text ännu, men routing och arkitektur är klar.

**Mapbox GL + react-map-gl**
Sex konfliktzoner med klickbara markörer. Att separera kartlogiken från komponenterna var rätt beslut — kartan är tung och behöver sin egen livscykel.

**Vad jag skulle gjort annorlunda:**
Migrerat till Vercel AI SDK och streaming tidigare. Batch-svar funkar, men streaming ger en helt annan upplevelse när AI:n "skriver" i realtid.

Projektet: [länk]

#NextJS #TypeScript #AI #WebDev #BuildInPublic

---

### INLÄGG #3 — Reflektionen (samhällsfokus)

> **Tips:** Posta ~3 veckor efter #1. Inga skärmdumpar behövs — ett starkt foto eller illustration räcker.

---

Varför bygger man en webbapplikation om barns lidande i krig?

Inte för att det är ett enkelt ämne att hantera. Och inte för att tekniken i sig löser något.

Men jag tror att det finns ett gap mellan den data som finns — UNICEF:s rapporter, SIPRI:s vapenhandelsstatistik, FN:s resolutioner — och den människa som faktiskt vill förstå vad siffrorna betyder. Det gapet är delvis ett designproblem.

Krigets Arv är mitt försök att stänga det gapet lite. Att göra det möjligt att fråga: "Hur påverkar vapenexport civila?" och få ett svar som är sourcerat, nyanserat och mänskligt läsbart. Att se konflikter på en karta inte som geopolitiska abstraktioner utan som platser där barn lever.

Jag vet inte om jag lyckades. Men jag tror att mer av vår teknikkompetens borde riktas mot den här typen av frågor.

Projektet finns på [länk]. Jag tar gärna emot feedback — från journalister, lärare, NGO-folk och alla andra som arbetar med de här frågorna.

#HumanRights #Technology #AI #ChildrenInConflict #WebDevelopment

---

## Fas 4 — Efter publicering

### Engagemang
- Svara på **alla** kommentarer inom 24 timmar — algoritmen belönar det
- Om någon delar: tacka dem och ställ en följdfråga
- Tagga relevanta organisationer sparsamt (t.ex. UNICEF Sverige, Rädda Barnen) — men bara om innehållet är genuint relevant för dem

### Hashtag-strategi
Använd **5–7 hashtags** per inlägg. Blanda:
- Breda (hög räckvidd): `#WebDevelopment`, `#AI`, `#NextJS`
- Nischade (rätt publik): `#HumanRights`, `#DataJournalism`, `#ChildrenInConflict`
- Svenska (om du postar på svenska): `#Webbutveckling`, `#MänskligaRättigheter`

### Uppföljning
- Dela projektet i relevanta LinkedIn-grupper (t.ex. grupper för journalister, human rights-professionella)
- Överväg att kontakta lärare/NGO:er direkt med en kort personlig DM efter lanseringsposten

---

## Språkval

Projektet är tvåspråkigt, vilket ger dig ett val:

- **Posta på svenska** om ditt nätverk primärt är svenskt — mer personligt, troligen mer engagemang från folk du känner
- **Posta på engelska** om du vill nå internationella NGO:er och utvecklare — vidare räckvidd
- **Kompromiss:** Posta Inlägg #1 på svenska, Inlägg #2 (tech) på engelska

---

*Strategi skapad: april 2026*

export interface Conflict {
  id: string;
  name: string;
  lng: number;
  lat: number;
  severity: "critical" | "high";
  description: string;
  stats: { label: string; value: string }[];
  arms: string;
  sources: string[];
  investigateQuery: string;
}

export const CONFLICTS_SV: Conflict[] = [
  {
    id: "jemen", name: "Jemen",
    lng: 48.5164, lat: 15.5527, severity: "critical",
    description: "Världens värsta humanitära kris. Ett barn dödas eller skadas varje dag i genomsnitt.",
    stats: [
      { label: "Barn behöver hjälp", value: "11M" },
      { label: "Barn dödade/skadade 2025", value: "365+" },
      { label: "Underernärda barn", value: "2.2M" },
    ],
    arms: "USA-vapen via Saudi-Arabien används direkt i bombkampanjen",
    sources: ["UNICEF", "ICRC", "Save the Children"],
    investigateQuery: "Vad är kopplingen mellan vapenexport och barnadödlighet i Jemen?",
  },
  {
    id: "ukraina", name: "Ukraina",
    lng: 31.1656, lat: 48.3794, severity: "critical",
    description: "Systematiska attacker mot skolor – 'educide' mot en hel generation barn.",
    stats: [
      { label: "Barn fördrivna", value: "7.5M" },
      { label: "Skolor förstörda", value: "3 800+" },
      { label: "Barn med PTSD", value: "miljoner" },
    ],
    arms: "Ryssland finansierar krig med vapenprofiter – barn betalar priset",
    sources: ["UNICEF", "FN", "PMC"],
    investigateQuery: "Hur påverkar det ryska kriget i Ukraina barns psykiska hälsa och utbildning?",
  },
  {
    id: "sudan", name: "Sudan",
    lng: 30.2176, lat: 12.8628, severity: "critical",
    description: "Massiv flykt från al-Fasher. Barnsoldater och hungersnöd på akut nivå.",
    stats: [
      { label: "Fördrivna barn", value: "14M" },
      { label: "Barnsoldater", value: "stigande" },
      { label: "Svältrisk", value: "akut" },
    ],
    arms: "Vapen från UAE och Ryssland till RSF-milisen",
    sources: ["ICRC", "OCHA", "Save the Children"],
    investigateQuery: "Hur drabbas barn i Sudans humanitära kris och vilka aktörer levererar vapen?",
  },
  {
    id: "gaza", name: "Gaza",
    lng: 34.3088, lat: 31.3547, severity: "critical",
    description: "Domicide – massförstörelse. Varje fem sekunder skadas ett barn.",
    stats: [
      { label: "Barn i konfliktzon", value: "1.1M" },
      { label: "Skolbarn utan utbildning", value: "625 000" },
      { label: "Barn med trauma", value: "nästan alla" },
    ],
    arms: "USA-levererade vapen används i konflikten",
    sources: ["UNICEF", "OCHA", "WHO"],
    investigateQuery: "Hur påverkas barn i Gaza och vad är kopplingen till internationell vapenexport?",
  },
  {
    id: "syrien", name: "Syrien",
    lng: 38.9968, lat: 34.8021, severity: "high",
    description: "14 år av konflikt. Ryskt/kinesiskt veto blockerade humanitär hjälp i FN.",
    stats: [
      { label: "Fördrivna barn", value: "6M" },
      { label: "År i konflikt", value: "14+" },
      { label: "Barndödlighet", value: "kraftigt förhöjd" },
    ],
    arms: "Ryssland och Iran levererade vapen till Assad-regimen",
    sources: ["UNICEF", "FN", "HRW"],
    investigateQuery: "Hur har FN:s säkerhetsråd misslyckats med att skydda barn i Syrien?",
  },
  {
    id: "sydsudan", name: "Sydsudan",
    lng: 31.3070, lat: 6.8770, severity: "high",
    description: "Rekrytering av barnsoldater och sexuellt våld på rekordhög nivå.",
    stats: [
      { label: "Fördrivna barn", value: "4M" },
      { label: "Barnsoldater", value: "19 000+" },
      { label: "Sexuellt våld mot barn", value: "+50% på 5 år" },
    ],
    arms: "Vapen från Uganda, Sudan och Kina till stridande parter",
    sources: ["ICRC", "FN", "ISS Africa"],
    investigateQuery: "Hur rekryteras barnsoldater i Sydsudan och vilka är de bakomliggande orsakerna?",
  },
  {
    id: "myanmar", name: "Myanmar",
    lng: 96.1951, lat: 19.7633, severity: "critical",
    description: "Militärkupp 2021 utlöste fullskaligt inbördeskrig. Barn rekryteras och skolor bombas systematiskt.",
    stats: [
      { label: "Fördrivna barn", value: "3M+" },
      { label: "Barnsoldater", value: "tusentals" },
      { label: "Förstörda skolor", value: "800+" },
    ],
    arms: "Kina och Ryssland levererar vapen till militärjuntan",
    sources: ["UNICEF", "HRW", "Save the Children"],
    investigateQuery: "Hur påverkar militärkuppen i Myanmar barn och vilka länder stödjer juntan med vapen?",
  },
  {
    id: "drc", name: "DR Kongo",
    lng: 23.6560, lat: -2.8770, severity: "critical",
    description: "M23-rebellernas offensiv 2024–2025 har drivit miljoner på flykt. Barnsoldater och massvåldtäkter används som krigsvapen.",
    stats: [
      { label: "Fördrivna barn", value: "7M+" },
      { label: "Barnsoldater", value: "rekordantal" },
      { label: "Sexuellt våld", value: "utbrett vapenvapen" },
    ],
    arms: "Rwanda stödjer M23 med vapen och trupper enligt FN-rapport 2024",
    sources: ["UNICEF", "OCHA", "HRW"],
    investigateQuery: "Vilka är drivkrafterna bakom konflikten i DR Kongo och hur drabbas barn av M23:s framfart?",
  },
  {
    id: "etiopien", name: "Etiopien",
    lng: 40.4897, lat: 9.1450, severity: "high",
    description: "Tigray-konflikten har lämnat en generation traumatiserade. Hungersnöd och sexuellt våld mot barn dokumenterat av FN.",
    stats: [
      { label: "Fördrivna barn", value: "2M+" },
      { label: "Undernärda barn", value: "kritisk nivå" },
      { label: "Dokumenterade MR-brott", value: "1 000+" },
    ],
    arms: "Drönare från Turkiet och Iran använda mot civila områden",
    sources: ["UNICEF", "OHCHR", "Amnesty"],
    investigateQuery: "Hur drabbades barn under Tigray-konflikten i Etiopien och vilka vapen användes mot civila?",
  },
  {
    id: "somalia", name: "Somalia",
    lng: 46.1996, lat: 5.1521, severity: "high",
    description: "Al-Shabaab rekryterar aktivt barn. Kombinationen av krig och klimatdriven hungersnöd slår hårt mot barn.",
    stats: [
      { label: "Fördrivna barn", value: "2.5M" },
      { label: "Barnsoldater", value: "aktiv rekrytering" },
      { label: "Svält och undernäring", value: "akut kris" },
    ],
    arms: "Vapensmuggling via Jemen och Eritrea till al-Shabaab",
    sources: ["UNICEF", "OCHA", "Save the Children"],
    investigateQuery: "Hur rekryterar al-Shabaab barnsoldater i Somalia och hur påverkar klimatkrisen konflikten?",
  },
  {
    id: "sahel", name: "Sahel",
    lng: -3.9962, lat: 17.5707, severity: "high",
    description: "Jihadistgrupper kontrollerar stora delar av Mali och Burkina Faso. Barn kidnappas, skolor stängs, humanitärt tillträde blockeras.",
    stats: [
      { label: "Stängda skolor", value: "9 000+" },
      { label: "Fördrivna barn", value: "2M+" },
      { label: "Länder i kris", value: "5 (Sahel-zonen)" },
    ],
    arms: "Vapen flödar från Libyen efter Gaddafis fall, förstärkt av Wagner-gruppens närvaro",
    sources: ["UNICEF", "ICRC", "Crisis Group"],
    investigateQuery: "Hur sprids jihadistgrupper i Sahel och vilken roll spelar utländska vapenleveranser?",
  },
  {
    id: "libanon", name: "Libanon",
    lng: 35.8623, lat: 33.8547, severity: "critical",
    description: "Israels militäroffensiv 2024 dödade hundratals barn. USA-levererade vapen används i konflikten.",
    stats: [
      { label: "Barn dödade 2024", value: "200+" },
      { label: "Fördrivna", value: "1.2M" },
      { label: "Skolor förstörda", value: "100+" },
    ],
    arms: "USA levererar bomber och missiler till Israel som används i Libanon och Gaza",
    sources: ["UNICEF", "OHCHR", "HRW"],
    investigateQuery: "Vad är USA:s roll i vapenförsörjningen till konflikten i Libanon och Gaza?",
  },
];

export const CONFLICTS_EN: Conflict[] = [
  {
    id: "jemen", name: "Yemen",
    lng: 48.5164, lat: 15.5527, severity: "critical",
    description: "World's worst humanitarian crisis. On average, one child is killed or injured every day.",
    stats: [
      { label: "Children need aid", value: "11M" },
      { label: "Children killed/injured 2025", value: "365+" },
      { label: "Malnourished children", value: "2.2M" },
    ],
    arms: "US weapons via Saudi Arabia are used directly in the bombing campaign",
    sources: ["UNICEF", "ICRC", "Save the Children"],
    investigateQuery: "What is the connection between arms exports and child mortality in Yemen?",
  },
  {
    id: "ukraina", name: "Ukraine",
    lng: 31.1656, lat: 48.3794, severity: "critical",
    description: "Systematic attacks on schools – 'educide' against an entire generation of children.",
    stats: [
      { label: "Displaced children", value: "7.5M" },
      { label: "Schools destroyed", value: "3,800+" },
      { label: "Children with PTSD", value: "millions" },
    ],
    arms: "Russia finances the war with arms profits – children pay the price",
    sources: ["UNICEF", "UN", "PMC"],
    investigateQuery: "How does the Russian war in Ukraine affect children's mental health and education?",
  },
  {
    id: "sudan", name: "Sudan",
    lng: 30.2176, lat: 12.8628, severity: "critical",
    description: "Massive displacement from al-Fasher. Child soldiers and famine at acute levels.",
    stats: [
      { label: "Displaced children", value: "14M" },
      { label: "Child soldiers", value: "rising" },
      { label: "Risk of famine", value: "acute" },
    ],
    arms: "Weapons from UAE and Russia to RSF militia",
    sources: ["ICRC", "OCHA", "Save the Children"],
    investigateQuery: "How are children affected by Sudan's humanitarian crisis and which actors supply weapons?",
  },
  {
    id: "gaza", name: "Gaza",
    lng: 34.3088, lat: 31.3547, severity: "critical",
    description: "Domicide – mass destruction. Every five seconds a child is injured.",
    stats: [
      { label: "Children in conflict zone", value: "1.1M" },
      { label: "School children without education", value: "625,000" },
      { label: "Children with trauma", value: "almost all" },
    ],
    arms: "US-supplied weapons are used in the conflict",
    sources: ["UNICEF", "OCHA", "WHO"],
    investigateQuery: "How are children in Gaza affected and what is the link to international arms exports?",
  },
  {
    id: "syrien", name: "Syria",
    lng: 38.9968, lat: 34.8021, severity: "high",
    description: "14 years of conflict. Russian/Chinese veto blocked humanitarian aid in the UN.",
    stats: [
      { label: "Displaced children", value: "6M" },
      { label: "Years of conflict", value: "14+" },
      { label: "Child mortality", value: "sharply elevated" },
    ],
    arms: "Russia and Iran supplied weapons to the Assad regime",
    sources: ["UNICEF", "UN", "HRW"],
    investigateQuery: "How has the UN Security Council failed to protect children in Syria?",
  },
  {
    id: "sydsudan", name: "South Sudan",
    lng: 31.3070, lat: 6.8770, severity: "high",
    description: "Recruitment of child soldiers and sexual violence at record levels.",
    stats: [
      { label: "Displaced children", value: "4M" },
      { label: "Child soldiers", value: "19,000+" },
      { label: "Sexual violence against children", value: "+50% in 5 years" },
    ],
    arms: "Weapons from Uganda, Sudan and China to warring parties",
    sources: ["ICRC", "UN", "ISS Africa"],
    investigateQuery: "How are child soldiers recruited in South Sudan and what are the underlying causes?",
  },
  {
    id: "myanmar", name: "Myanmar",
    lng: 96.1951, lat: 19.7633, severity: "critical",
    description: "The 2021 military coup triggered full-scale civil war. Children are recruited and schools systematically bombed.",
    stats: [
      { label: "Displaced children", value: "3M+" },
      { label: "Child soldiers", value: "thousands" },
      { label: "Schools destroyed", value: "800+" },
    ],
    arms: "China and Russia supply weapons to the military junta",
    sources: ["UNICEF", "HRW", "Save the Children"],
    investigateQuery: "How does Myanmar's military coup affect children and which countries support the junta with weapons?",
  },
  {
    id: "drc", name: "DR Congo",
    lng: 23.6560, lat: -2.8770, severity: "critical",
    description: "The M23 rebel offensive of 2024–2025 has displaced millions. Child soldiers and mass rape are used as weapons of war.",
    stats: [
      { label: "Displaced children", value: "7M+" },
      { label: "Child soldiers", value: "record numbers" },
      { label: "Sexual violence", value: "widespread weapon of war" },
    ],
    arms: "Rwanda supports M23 with weapons and troops according to a 2024 UN report",
    sources: ["UNICEF", "OCHA", "HRW"],
    investigateQuery: "What drives the conflict in DR Congo and how are children affected by the M23 advance?",
  },
  {
    id: "etiopien", name: "Ethiopia",
    lng: 40.4897, lat: 9.1450, severity: "high",
    description: "The Tigray conflict left a traumatized generation. Famine and sexual violence against children documented by the UN.",
    stats: [
      { label: "Displaced children", value: "2M+" },
      { label: "Malnourished children", value: "critical level" },
      { label: "Documented HR violations", value: "1,000+" },
    ],
    arms: "Drones from Turkey and Iran used against civilian areas",
    sources: ["UNICEF", "OHCHR", "Amnesty"],
    investigateQuery: "How were children affected during the Tigray conflict in Ethiopia and what weapons were used against civilians?",
  },
  {
    id: "somalia", name: "Somalia",
    lng: 46.1996, lat: 5.1521, severity: "high",
    description: "Al-Shabaab actively recruits children. The combination of war and climate-driven famine hits children hardest.",
    stats: [
      { label: "Displaced children", value: "2.5M" },
      { label: "Child soldiers", value: "active recruitment" },
      { label: "Famine and malnutrition", value: "acute crisis" },
    ],
    arms: "Arms smuggling via Yemen and Eritrea to al-Shabaab",
    sources: ["UNICEF", "OCHA", "Save the Children"],
    investigateQuery: "How does al-Shabaab recruit child soldiers in Somalia and how does the climate crisis affect the conflict?",
  },
  {
    id: "sahel", name: "Sahel",
    lng: -3.9962, lat: 17.5707, severity: "high",
    description: "Jihadist groups control large parts of Mali and Burkina Faso. Children are kidnapped, schools closed, humanitarian access blocked.",
    stats: [
      { label: "Schools closed", value: "9,000+" },
      { label: "Displaced children", value: "2M+" },
      { label: "Countries in crisis", value: "5 (Sahel zone)" },
    ],
    arms: "Weapons flow from Libya after Gaddafi's fall, reinforced by the Wagner Group's presence",
    sources: ["UNICEF", "ICRC", "Crisis Group"],
    investigateQuery: "How are jihadist groups spreading across the Sahel and what role do foreign arms supplies play?",
  },
  {
    id: "libanon", name: "Lebanon",
    lng: 35.8623, lat: 33.8547, severity: "critical",
    description: "Israel's 2024 military offensive killed hundreds of children. US-supplied weapons are used in the conflict.",
    stats: [
      { label: "Children killed 2024", value: "200+" },
      { label: "Displaced", value: "1.2M" },
      { label: "Schools destroyed", value: "100+" },
    ],
    arms: "The US supplies bombs and missiles to Israel used in Lebanon and Gaza",
    sources: ["UNICEF", "OHCHR", "HRW"],
    investigateQuery: "What is the US role in arming the conflict in Lebanon and Gaza?",
  },
];

export function getConflicts(locale: string): Conflict[] {
  return locale === "en" ? CONFLICTS_EN : CONFLICTS_SV;
}

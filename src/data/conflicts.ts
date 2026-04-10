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
];

export function getConflicts(locale: string): Conflict[] {
  return locale === "en" ? CONFLICTS_EN : CONFLICTS_SV;
}

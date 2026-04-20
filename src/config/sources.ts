/**
 * Betrodda källdomäner för Krigets Arv.
 *
 * Varje domän är klassificerad efter typ och prioritet.
 * Används av Firecrawl för att begränsa sökning till verifierade källor —
 * inga slumpmässiga webbsidor, bara etablerade humanitära organisationer och
 * fredsforskningsinstitut.
 *
 * Prioritet: 1 = högst (primärkälla), 3 = lägst (kompletterande)
 */

export interface SourceDomain {
  domain: string;
  name: string;
  type: "ngo" | "un" | "research" | "news";
  priority: 1 | 2 | 3;
  language: "en" | "sv" | "both";
  focus: string;
}

export const TRUSTED_SOURCES: SourceDomain[] = [
  // === FN-organ (primärkällor) ===
  {
    domain: "unicef.org",
    name: "UNICEF",
    type: "un",
    priority: 1,
    language: "en",
    focus: "Barn i konflikter, humanitärt stöd, statistik",
  },
  {
    domain: "reliefweb.int",
    name: "ReliefWeb (OCHA)",
    type: "un",
    priority: 1,
    language: "en",
    focus: "Humanitär data, situationsrapporter, nödlägen",
  },
  {
    domain: "ohchr.org",
    name: "OHCHR – FN:s råd för mänskliga rättigheter",
    type: "un",
    priority: 1,
    language: "en",
    focus: "MR-kränkningar, dokumentation, juridiska normer",
  },
  {
    domain: "unocha.org",
    name: "UNOCHA – FN:s samordningsorgan",
    type: "un",
    priority: 2,
    language: "en",
    focus: "Humanitär samordning, flash-rapporter",
  },

  // === Fredsforskningsinstitut ===
  {
    domain: "sipri.org",
    name: "SIPRI",
    type: "research",
    priority: 1,
    language: "en",
    focus: "Vapenhandel, militärutgifter, konfliktdata",
  },
  {
    domain: "acleddata.com",
    name: "ACLED",
    type: "research",
    priority: 2,
    language: "en",
    focus: "Realtidsdata om våldsamma händelser och konflikter",
  },
  {
    domain: "prio.org",
    name: "PRIO – Peace Research Institute Oslo",
    type: "research",
    priority: 2,
    language: "en",
    focus: "Konfliktforskning, fredsprocesser",
  },

  // === NGO:er ===
  {
    domain: "icrc.org",
    name: "ICRC – Internationella Rödakorskommittén",
    type: "ngo",
    priority: 1,
    language: "en",
    focus: "Humanitär rätt, civila offer, barn i konflikter",
  },
  {
    domain: "hrw.org",
    name: "Human Rights Watch",
    type: "ngo",
    priority: 1,
    language: "en",
    focus: "MR-kränkningar, dokumentation, utredningar",
  },
  {
    domain: "savethechildren.org",
    name: "Save the Children",
    type: "ngo",
    priority: 1,
    language: "en",
    focus: "Barn i krig, utbildning, barnhälsa",
  },
  {
    domain: "amnesty.org",
    name: "Amnesty International",
    type: "ngo",
    priority: 2,
    language: "en",
    focus: "MR-kränkningar, fängelse, tortyr, civila offer",
  },
  {
    domain: "warchild.org",
    name: "War Child",
    type: "ngo",
    priority: 2,
    language: "en",
    focus: "Barn i krig, trauma, rehabilitering",
  },
  {
    domain: "raddabarnen.se",
    name: "Rädda Barnen (Sverige)",
    type: "ngo",
    priority: 2,
    language: "sv",
    focus: "Svensk rapportering om barn i konflikter",
  },
];

/** Alla domäner som en platt lista — skickas till Firecrawl includeDomains */
export const TRUSTED_DOMAINS: string[] = TRUSTED_SOURCES.map((s) => s.domain);

/** Bara prio-1-domäner — används när snabb precision är viktigare än täckning */
export const PRIMARY_DOMAINS: string[] = TRUSTED_SOURCES
  .filter((s) => s.priority === 1)
  .map((s) => s.domain);

/** Slår upp ett domännamn till ett läsbart källnamn */
export function getDomainName(domain: string): string {
  return TRUSTED_SOURCES.find((s) => s.domain === domain)?.name ?? domain;
}

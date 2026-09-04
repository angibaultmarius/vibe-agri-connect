/** L'app est mono-utilisateur et vit à l'heure de Paris. */
export const FUSEAU = "Europe/Paris";

/** Date du jour au format `YYYY-MM-DD` dans le fuseau local. */
export function aujourdhui(): string {
  return isoDepuis(new Date());
}

export function isoDepuis(date: Date): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: FUSEAU,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** `YYYY-MM-DD` d'il y a `n` jours. */
export function ilYA(jours: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - jours);
  return isoDepuis(date);
}

/** Liste de dates ISO, de la plus ancienne à la plus récente, sur `n` jours (fin = aujourd'hui). */
export function serieDeJours(n: number): string[] {
  return Array.from({ length: n }, (_, i) => ilYA(n - 1 - i));
}

export function heureCourte(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: FUSEAU,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function dateLongue(iso: string): string {
  const [a, m, j] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: FUSEAU,
  }).format(new Date(Date.UTC(a, m - 1, j, 12)));
}

/** Formate une durée en minutes façon `7 h 20`. */
export function duree(minutes: number | null | undefined): string {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
}

/** Ajoute (ou retire) des jours à une date ISO. */
export function ajouterJours(iso: string, n: number): string {
  const [a, m, j] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(a, m - 1, j));
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

/** Numéro de jour de la semaine, 1 = lundi … 7 = dimanche. */
export function jourDeSemaine(iso: string): number {
  const [a, m, j] = iso.split("-").map(Number);
  const jour = new Date(Date.UTC(a, m - 1, j)).getUTCDay();
  return jour === 0 ? 7 : jour;
}

/** Lundi de la semaine contenant `iso`. */
export function lundiDeLaSemaine(iso: string): string {
  return ajouterJours(iso, -(jourDeSemaine(iso) - 1));
}

export function jourEtMois(iso: string): string {
  const [, m, j] = iso.split("-");
  return `${j}/${m}`;
}

/** Décalage du fuseau de Paris (en ms) à un instant donné. */
function decalageParis(instant: number): number {
  const parties = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSEAU,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const p = Object.fromEntries(parties.map((part) => [part.type, part.value]));
  const commeUTC = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour) % 24,
    Number(p.minute),
    Number(p.second),
  );
  return commeUTC - instant;
}

/**
 * Instant UTC correspondant à une heure murale parisienne (`2026-09-01`,
 * `21:15`). Sans ça, un rattrapage saisi à 21:15 serait enregistré à 21:15 UTC
 * — donc affiché 23:15 — puisque le serveur tourne en UTC.
 */
export function instantParis(date: string, heure: string): string {
  const naif = Date.parse(`${date}T${heure}:00Z`);
  // Deux passes : la première approximation suffit sauf à l'heure exacte du
  // changement d'heure, que la seconde corrige.
  const approche = naif - decalageParis(naif);
  return new Date(naif - decalageParis(approche)).toISOString();
}

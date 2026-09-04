/**
 * Verrou d'accès de l'app : un mot de passe unique (usage mono-utilisateur).
 * Le cookie de session est un jeton signé HMAC-SHA256, vérifiable côté Edge
 * (middleware) comme côté Node (routes / composants serveur).
 */
export const SESSION_COOKIE = "cdb_session";
export const SESSION_DUREE_MS = 1000 * 60 * 60 * 24 * 30; // 30 jours

const encoder = new TextEncoder();

async function cle(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Fabrique un jeton `expiration.signature`. */
export async function creerJeton(secret: string): Promise<string> {
  const expiration = String(Date.now() + SESSION_DUREE_MS);
  const signature = hex(
    await crypto.subtle.sign("HMAC", await cle(secret), encoder.encode(expiration)),
  );
  return `${expiration}.${signature}`;
}

export async function jetonValide(
  jeton: string | undefined,
  secret: string,
): Promise<boolean> {
  if (!jeton) return false;
  const [expiration, signature] = jeton.split(".");
  if (!expiration || !signature) return false;
  if (!Number.isFinite(Number(expiration)) || Number(expiration) < Date.now()) {
    return false;
  }
  const attendue = hex(
    await crypto.subtle.sign("HMAC", await cle(secret), encoder.encode(expiration)),
  );
  return comparaisonConstante(signature, attendue);
}

/** Comparaison à temps constant, pour ne pas fuiter la signature octet par octet. */
export function comparaisonConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Vérifie le header `Authorization: Bearer <token>` des routes d'ingestion. */
export function jetonIngestionValide(
  header: string | null,
  attendu: string,
): boolean {
  if (!header?.startsWith("Bearer ")) return false;
  return comparaisonConstante(header.slice("Bearer ".length).trim(), attendu);
}

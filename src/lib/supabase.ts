import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

/**
 * Client Supabase **serveur uniquement**.
 *
 * L'app est mono-utilisateur et protégée par le verrou d'accès (middleware) :
 * il n'y a pas d'auth Supabase par utilisateur. RLS est actif sans policy, donc
 * la clé anon ne lit rien — tout passe par la clé service_role, qui ne doit
 * jamais atteindre le navigateur. Aucun composant client n'importe ce fichier.
 */
let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return client;
}

export const BUCKET_REPAS = "repas-photos";
export const BUCKET_MEDICAMENTS = "medicaments-photos";

const DUREE_URL_SIGNEE = 60 * 60; // 1 h

/** URL signée pour afficher une photo d'un bucket privé. */
export async function urlSignee(
  bucket: string,
  chemin: string,
): Promise<string | null> {
  const { data, error } = await supabase()
    .storage.from(bucket)
    .createSignedUrl(chemin, DUREE_URL_SIGNEE);
  if (error) return null;
  return data.signedUrl;
}

/** Signe plusieurs photos d'un coup ; renvoie une table chemin → URL. */
export async function urlsSignees(
  bucket: string,
  chemins: string[],
): Promise<Record<string, string>> {
  const uniques = [...new Set(chemins.filter(Boolean))];
  if (uniques.length === 0) return {};
  const { data, error } = await supabase()
    .storage.from(bucket)
    .createSignedUrls(uniques, DUREE_URL_SIGNEE);
  if (error || !data) return {};
  const table: Record<string, string> = {};
  for (const entree of data) {
    if (entree.path && entree.signedUrl) table[entree.path] = entree.signedUrl;
  }
  return table;
}

/** Chemin de stockage d'une photo : `YYYY-MM-DD/uuid.ext`. */
export function cheminPhoto(date: string, nomFichier: string): string {
  const extension = (nomFichier.split(".").pop() || "jpg")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 5);
  return `${date}/${crypto.randomUUID()}.${extension || "jpg"}`;
}

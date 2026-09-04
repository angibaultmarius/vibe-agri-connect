import { NextResponse } from "next/server";
import { z } from "zod";
import { jetonIngestionValide } from "./auth";
import { requireEnv } from "./env";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function erreur(message: string, status = 400) {
  return NextResponse.json({ erreur: message }, { status });
}

/** Garde des routes `/api/ingest/*` : jeton partagé avec les Raccourcis iOS. */
export function refuseSiJetonInvalide(request: Request) {
  const attendu = requireEnv("INGEST_TOKEN");
  if (!jetonIngestionValide(request.headers.get("authorization"), attendu)) {
    return erreur("Jeton d'ingestion invalide.", 401);
  }
  return null;
}

/** Parse un corps JSON avec un schéma zod, en renvoyant une erreur lisible. */
export async function corpsValide<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | { reponse: NextResponse }> {
  let brut: unknown;
  try {
    brut = await request.json();
  } catch {
    return { reponse: erreur("Corps JSON illisible.") };
  }
  const resultat = schema.safeParse(brut);
  if (!resultat.success) {
    return {
      reponse: erreur(
        resultat.error.issues
          .map((i) => `${i.path.join(".") || "corps"} : ${i.message}`)
          .join(" ; "),
      ),
    };
  }
  return { data: resultat.data };
}

const dateISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date attendue au format YYYY-MM-DD");
const heure = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, "heure attendue au format HH:MM");
const entierOuNull = z.coerce.number().int().nullish();
const nombreOuNull = z.coerce.number().nullish();

export const schemaFrequenceCardiaque = z.object({
  date: dateISO,
  fc_repos: entierOuNull,
  fc_moyenne: entierOuNull,
  fc_max: entierOuNull,
  minutes_zone_cardio: entierOuNull,
});

export const schemaSommeil = z.object({
  date: dateISO,
  heure_coucher: heure.nullish(),
  heure_lever: heure.nullish(),
  duree_minutes: entierOuNull,
  score_sommeil: entierOuNull,
  pourcentage_profond: nombreOuNull,
  pourcentage_leger: nombreOuNull,
  pourcentage_paradoxal: nombreOuNull,
});

export const schemaSport = z.object({
  date: dateISO,
  heure_debut: z.string().datetime({ offset: true }).nullish(),
  duree_minutes: entierOuNull,
  type_activite: z.string().trim().min(1).max(80).nullish(),
  fc_moyenne: entierOuNull,
  fc_max: entierOuNull,
  minutes_zone_elevee: entierOuNull,
  distance_km: nombreOuNull,
});

export const schemaTabac = z.object({
  date: dateISO,
  statut: z.enum(["non_fume", "sans_clope_travail", "fume_toute_journee"]),
});

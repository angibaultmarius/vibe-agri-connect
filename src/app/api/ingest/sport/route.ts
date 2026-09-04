import {
  corpsValide,
  erreur,
  json,
  refuseSiJetonInvalide,
  schemaSport,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";

/**
 * Séance captée par la montre (mode entraînement).
 * La table n'a pas de contrainte unique : on déduplique sur (date, heure_debut)
 * pour qu'un Raccourci rejoué ne crée pas deux fois la même séance.
 */
export async function POST(request: Request) {
  const refus = refuseSiJetonInvalide(request);
  if (refus) return refus;

  const resultat = await corpsValide(request, schemaSport);
  if ("reponse" in resultat) return resultat.reponse;

  const seance = {
    ...resultat.data,
    source: "amazfit",
    synced_at: new Date().toISOString(),
  };
  const db = supabase();

  if (seance.heure_debut) {
    const { data: existante } = await db
      .from("seances_sport")
      .select("id")
      .eq("date", seance.date)
      .eq("heure_debut", seance.heure_debut)
      .maybeSingle();

    if (existante) {
      const { error } = await db
        .from("seances_sport")
        .update(seance)
        .eq("id", existante.id);
      if (error) return erreur(error.message, 500);
      return json({ ok: true, id: existante.id, deja_connue: true });
    }
  }

  const { data, error } = await db
    .from("seances_sport")
    .insert(seance)
    .select("id")
    .single();

  if (error) return erreur(error.message, 500);
  return json({ ok: true, id: data.id }, 201);
}

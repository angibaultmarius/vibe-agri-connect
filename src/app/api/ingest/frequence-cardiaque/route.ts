import {
  corpsValide,
  erreur,
  json,
  refuseSiJetonInvalide,
  schemaFrequenceCardiaque,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";

/** Appelée par le Raccourci iOS quand Apple Health met à jour la FC. */
export async function POST(request: Request) {
  const refus = refuseSiJetonInvalide(request);
  if (refus) return refus;

  const resultat = await corpsValide(request, schemaFrequenceCardiaque);
  if ("reponse" in resultat) return resultat.reponse;

  const { error } = await supabase()
    .from("frequence_cardiaque")
    .upsert(
      { ...resultat.data, source: "amazfit", synced_at: new Date().toISOString() },
      { onConflict: "date" },
    );

  if (error) return erreur(error.message, 500);
  return json({ ok: true, date: resultat.data.date });
}

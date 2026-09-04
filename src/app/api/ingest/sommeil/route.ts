import {
  corpsValide,
  erreur,
  json,
  refuseSiJetonInvalide,
  schemaSommeil,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";

/** Appelée par le Raccourci iOS après une nuit synchronisée depuis la montre. */
export async function POST(request: Request) {
  const refus = refuseSiJetonInvalide(request);
  if (refus) return refus;

  const resultat = await corpsValide(request, schemaSommeil);
  if ("reponse" in resultat) return resultat.reponse;

  const { error } = await supabase()
    .from("sommeil")
    .upsert(
      { ...resultat.data, source: "amazfit", synced_at: new Date().toISOString() },
      { onConflict: "date" },
    );

  if (error) return erreur(error.message, 500);
  return json({ ok: true, date: resultat.data.date });
}

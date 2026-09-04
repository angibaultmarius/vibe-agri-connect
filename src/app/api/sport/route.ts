import { corpsValide, erreur, json, schemaSport } from "@/lib/api";
import { supabase } from "@/lib/supabase";

/** Ajout manuel d'une séance depuis l'app (séance non captée par la montre). */
export async function POST(request: Request) {
  const resultat = await corpsValide(request, schemaSport);
  if ("reponse" in resultat) return resultat.reponse;

  const { data, error } = await supabase()
    .from("seances_sport")
    .insert({
      ...resultat.data,
      source: "manuel",
      synced_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return erreur(error.message, 500);
  return json({ ok: true, id: data.id }, 201);
}

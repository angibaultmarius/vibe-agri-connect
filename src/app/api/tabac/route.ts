import { corpsValide, erreur, json, schemaTabac } from "@/lib/api";
import { supabase } from "@/lib/supabase";

/** Pointage du jour (3 états). Appelée depuis l'app, derrière le verrou d'accès. */
export async function POST(request: Request) {
  const resultat = await corpsValide(request, schemaTabac);
  if ("reponse" in resultat) return resultat.reponse;

  const { error } = await supabase()
    .from("tabac")
    .upsert(
      {
        ...resultat.data,
        source: "declaratif",
        pointe_le: new Date().toISOString(),
      },
      { onConflict: "date" },
    );

  if (error) return erreur(error.message, 500);
  return json({ ok: true });
}

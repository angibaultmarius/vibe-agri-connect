import { erreur, json } from "@/lib/api";
import { MOMENTS_MEDICAMENT } from "@/lib/habitudes";
import { BUCKET_MEDICAMENTS, supabase } from "@/lib/supabase";
import { lirePhoto } from "@/lib/upload";

/** Photo au moment de la prise : preuve horodatée, aucun traitement IA. */
export async function POST(request: Request) {
  const lu = await lirePhoto(request, BUCKET_MEDICAMENTS, MOMENTS_MEDICAMENT);
  if ("reponse" in lu) return lu.reponse;
  const { photo, moment } = lu;

  const { data, error } = await supabase()
    .from("medicaments")
    .insert({
      date: photo.date,
      moment,
      heure: photo.heure,
      photo_url: photo.chemin,
      source: "photo",
      synced_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return erreur(error.message, 500);
  return json({ ok: true, id: data.id }, 201);
}

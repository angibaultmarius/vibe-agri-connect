import { erreur, json } from "@/lib/api";
import { MOMENTS_REPAS } from "@/lib/habitudes";
import { BUCKET_REPAS, supabase } from "@/lib/supabase";
import { TAILLE_MAX_VISION, lirePhoto } from "@/lib/upload";
import { estMediaTypeSupporte, estimerRepas } from "@/lib/vision";

/**
 * Photo de repas + moment saisi à la main. La photo est stockée d'abord, puis
 * un modèle de vision estime catégorie et macros. Si l'IA échoue, la ligne est
 * écrite quand même : une photo sans macros vaut mieux qu'un repas perdu.
 */
export async function POST(request: Request) {
  const lu = await lirePhoto(request, BUCKET_REPAS, MOMENTS_REPAS);
  if ("reponse" in lu) return lu.reponse;
  const { photo, moment } = lu;

  const estimation =
    estMediaTypeSupporte(photo.mediaType) &&
    photo.octets.byteLength <= TAILLE_MAX_VISION
      ? await estimerRepas(photo.octets.toString("base64"), photo.mediaType)
      : null;

  const { data, error } = await supabase()
    .from("repas")
    .insert({
      date: photo.date,
      moment,
      heure: photo.heure,
      photo_url: photo.chemin,
      ia_categorie: estimation?.categorie ?? null,
      ia_calories: estimation?.calories ?? null,
      ia_proteines_g: estimation?.proteines_g ?? null,
      ia_lipides_g: estimation?.lipides_g ?? null,
      ia_fibres_g: estimation?.fibres_g ?? null,
      ia_confiance: estimation?.confiance ?? null,
      source: "photo",
      synced_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return erreur(error.message, 500);
  return json({ ok: true, id: data.id, estimation }, 201);
}

import { erreur, json } from "@/lib/api";
import { BUCKET_REPAS, supabase } from "@/lib/supabase";
import { TAILLE_MAX_VISION } from "@/lib/upload";
import { estMediaTypeSupporte, estimerRepas } from "@/lib/vision";

/** Type d'image déduit de l'extension du fichier stocké. */
function mediaType(chemin: string): string {
  const extension = chemin.split(".").pop()?.toLowerCase() ?? "";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "heic") return "image/heic";
  if (extension === "heif") return "image/heif";
  return "image/jpeg";
}

/**
 * Rejoue l'estimation d'un repas dont les macros manquent — typiquement parce
 * que l'appel initial a échoué (pic de charge, clé absente au moment de la
 * prise de vue). La photo est conservée, donc rien n'empêche de réessayer.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = supabase();

  const { data: repas, error: lecture } = await db
    .from("repas")
    .select("id, photo_url")
    .eq("id", id)
    .maybeSingle();

  if (lecture) return erreur(lecture.message, 500);
  if (!repas) return erreur("Repas introuvable.", 404);

  const { data: fichier, error: telechargement } = await db.storage
    .from(BUCKET_REPAS)
    .download(repas.photo_url);

  if (telechargement || !fichier) {
    return erreur(
      `Photo introuvable dans le stockage : ${telechargement?.message ?? "réponse vide"}`,
      404,
    );
  }

  const type = mediaType(repas.photo_url);
  if (!estMediaTypeSupporte(type)) {
    return erreur(`Type d'image non pris en charge : ${type}.`, 415);
  }

  const octets = Buffer.from(await fichier.arrayBuffer());
  if (octets.byteLength > TAILLE_MAX_VISION) {
    return erreur("Photo trop lourde pour être analysée.", 413);
  }

  const estimation = await estimerRepas(octets.toString("base64"), type);
  if (!estimation) {
    return erreur(
      "L'estimation a de nouveau échoué. Vérifiez que GEMINI_API_KEY atteint bien l'exécution.",
      502,
    );
  }

  const { error: ecriture } = await db
    .from("repas")
    .update({
      ia_categorie: estimation.categorie,
      ia_calories: estimation.calories,
      ia_proteines_g: estimation.proteines_g,
      ia_lipides_g: estimation.lipides_g,
      ia_fibres_g: estimation.fibres_g,
      ia_confiance: estimation.confiance,
    })
    .eq("id", id);

  if (ecriture) return erreur(ecriture.message, 500);
  return json({ ok: true, estimation });
}

import { erreur } from "./api";
import { aujourdhui, instantParis } from "./dates";
import { BUCKET_MEDICAMENTS, BUCKET_REPAS, cheminPhoto, supabase } from "./supabase";

export const TAILLE_MAX_PHOTO = 10 * 1024 * 1024; // 10 Mo
/** Au-delà, l'image encodée en base64 fait déborder la requête envoyée au modèle. */
export const TAILLE_MAX_VISION = 7 * 1024 * 1024;

export type PhotoRecue = {
  octets: Buffer;
  mediaType: string;
  chemin: string;
  date: string;
  heure: string;
};

/**
 * Lit le multipart commun aux routes photo : fichier, `moment`, et
 * éventuellement `date` / `heure` (rattrapage d'un oubli sur un autre jour).
 */
export async function lirePhoto(
  request: Request,
  bucket: typeof BUCKET_REPAS | typeof BUCKET_MEDICAMENTS,
  momentsAutorises: readonly string[],
): Promise<
  | { reponse: ReturnType<typeof erreur> }
  | { photo: PhotoRecue; moment: string; bucket: string }
> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return { reponse: erreur("Formulaire multipart illisible.") };
  }

  const fichier = form.get("photo");
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { reponse: erreur("Photo manquante.") };
  }
  if (fichier.size > TAILLE_MAX_PHOTO) {
    return { reponse: erreur("Photo trop lourde (10 Mo maximum).", 413) };
  }

  const moment = String(form.get("moment") ?? "");
  if (!momentsAutorises.includes(moment)) {
    return {
      reponse: erreur(
        `Moment invalide. Attendu : ${momentsAutorises.join(", ")}.`,
      ),
    };
  }

  const dateSaisie = String(form.get("date") ?? "");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateSaisie) ? dateSaisie : aujourdhui();

  // Pour un jour passé, on horodate à midi plutôt que de mentir sur l'heure réelle.
  const heureSaisie = String(form.get("heure") ?? "");
  const heure =
    date === aujourdhui()
      ? new Date().toISOString()
      : instantParis(
          date,
          /^\d{2}:\d{2}$/.test(heureSaisie) ? heureSaisie : "12:00",
        );

  const octets = Buffer.from(await fichier.arrayBuffer());
  const mediaType = fichier.type || "image/jpeg";
  const chemin = cheminPhoto(date, fichier.name || "photo.jpg");

  const { error } = await supabase()
    .storage.from(bucket)
    .upload(chemin, octets, { contentType: mediaType, upsert: false });

  if (error) {
    return { reponse: erreur(`Envoi de la photo impossible : ${error.message}`, 500) };
  }

  return { photo: { octets, mediaType, chemin, date, heure }, moment, bucket };
}

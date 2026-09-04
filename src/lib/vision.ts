import {
  GoogleGenAI,
  Type,
  createPartFromBase64,
  createPartFromText,
} from "@google/genai";
import { z } from "zod";
import { optionalEnv } from "./env";

/**
 * Types d'image acceptés par l'API Gemini en pièce jointe.
 * HEIC/HEIF est de la partie : les photos prises depuis un iPhone passent
 * telles quelles, sans conversion préalable.
 */
export const MEDIA_TYPES_IMAGE = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export type MediaTypeImage = (typeof MEDIA_TYPES_IMAGE)[number];

export function estMediaTypeSupporte(type: string): type is MediaTypeImage {
  return (MEDIA_TYPES_IMAGE as readonly string[]).includes(type);
}

const EstimationRepas = z.object({
  categorie: z
    .string()
    .describe("Nom court du plat, en français, 4 mots maximum"),
  calories: z.number().describe("Calories estimées pour la portion visible"),
  proteines_g: z.number().describe("Protéines en grammes"),
  lipides_g: z.number().describe("Lipides en grammes"),
  fibres_g: z.number().describe("Fibres en grammes"),
  confiance: z
    .number()
    .describe(
      "Confiance de l'estimation entre 0 et 1 (photo floue, plat masqué, portion difficile à juger : plus bas)",
    ),
});

export type EstimationRepas = z.infer<typeof EstimationRepas>;

/**
 * Le même contrat, dans le dialecte de schéma que Gemini attend. Le schéma zod
 * ci-dessus reste la garde finale : ce que le modèle renvoie est re-validé
 * avant d'atteindre la base.
 */
const SCHEMA_GEMINI = {
  type: Type.OBJECT,
  properties: {
    categorie: {
      type: Type.STRING,
      description: "Nom court du plat, en français, 4 mots maximum",
    },
    calories: {
      type: Type.NUMBER,
      description: "Calories estimées pour la portion visible",
    },
    proteines_g: { type: Type.NUMBER, description: "Protéines en grammes" },
    lipides_g: { type: Type.NUMBER, description: "Lipides en grammes" },
    fibres_g: { type: Type.NUMBER, description: "Fibres en grammes" },
    confiance: {
      type: Type.NUMBER,
      description:
        "Confiance de l'estimation entre 0 et 1 (photo floue, plat masqué, portion difficile à juger : plus bas)",
    },
  },
  required: [
    "categorie",
    "calories",
    "proteines_g",
    "lipides_g",
    "fibres_g",
    "confiance",
  ],
};

const CONSIGNE = `Tu estimes la composition nutritionnelle d'un repas à partir d'une photo.
Estime la portion réellement visible sur l'image, pas une portion standard.
Donne toujours une valeur numérique, même approximative — l'app préfère une
estimation basse en confiance à une absence de donnée.`;

/**
 * Modèles épinglés : un alias `-latest` changerait de comportement sans
 * prévenir. `GEMINI_MODEL` reste la porte de sortie pour en changer sans
 * toucher au code.
 *
 * Le second sert de secours. Mesuré sur ce cas d'usage, les modèles flash
 * renvoient régulièrement un 503 « high demand » sur une requête avec image,
 * parfois tous en même temps ; or un repas photographié perd définitivement ses
 * macros si l'appel échoue — on ne peut pas rejouer l'estimation plus tard.
 * D'où trois tentatives : les deux modèles, puis le principal après une pause,
 * le temps que le pic passe.
 */
const MODELE = optionalEnv("GEMINI_MODEL") ?? "gemini-3.6-flash";
const MODELE_SECOURS = "gemini-3.8-flash";

/**
 * Un appel de vision, une réponse JSON structurée. Renvoie `null` si l'appel
 * échoue, n'est pas configuré, ou répond hors schéma : le repas est enregistré
 * quand même, les colonnes `ia_*` restent simplement vides.
 */
export async function estimerRepas(
  imageBase64: string,
  mediaType: MediaTypeImage,
): Promise<EstimationRepas | null> {
  const apiKey = optionalEnv("GEMINI_API_KEY");
  if (!apiKey) return null;

  const ia = new GoogleGenAI({ apiKey });
  const aEssayer =
    MODELE === MODELE_SECOURS
      ? [MODELE, MODELE]
      : [MODELE, MODELE_SECOURS, MODELE];

  for (const [rang, modele] of aEssayer.entries()) {
    // Dernière tentative : on laisse au pic de charge le temps de retomber.
    if (rang === aEssayer.length - 1) {
      await new Promise((suite) => setTimeout(suite, 1500));
    }
    try {
      const reponse = await ia.models.generateContent({
        model: modele,
        contents: [
          createPartFromBase64(imageBase64, mediaType),
          createPartFromText("Estime ce repas."),
        ],
        config: {
          systemInstruction: CONSIGNE,
          responseMimeType: "application/json",
          responseSchema: SCHEMA_GEMINI,
        },
      });

      const texte = reponse.text;
      if (!texte) continue;

      const analyse = EstimationRepas.safeParse(JSON.parse(texte));
      if (analyse.success) return analyse.data;
      console.error(`Réponse hors schéma de ${modele} :`, texte);
    } catch (error) {
      console.error(`Estimation IA impossible avec ${modele} :`, error);
    }
  }

  return null;
}

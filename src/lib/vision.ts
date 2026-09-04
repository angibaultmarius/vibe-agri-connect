import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { optionalEnv } from "./env";

/** Types d'image que l'API vision accepte. */
export const MEDIA_TYPES_IMAGE = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
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

const CONSIGNE = `Tu estimes la composition nutritionnelle d'un repas à partir d'une photo.
Estime la portion réellement visible sur l'image, pas une portion standard.
Donne toujours une valeur numérique, même approximative — l'app préfère une
estimation basse en confiance à une absence de donnée.`;

/**
 * Un appel de vision, une réponse JSON structurée. Renvoie `null` si l'appel
 * échoue ou n'est pas configuré : le repas est enregistré quand même, les
 * colonnes `ia_*` restent simplement vides.
 */
export async function estimerRepas(
  imageBase64: string,
  mediaType: MediaTypeImage,
): Promise<EstimationRepas | null> {
  const apiKey = optionalEnv("ANTHROPIC_API_KEY");
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });
    const reponse = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 16000,
      system: CONSIGNE,
      output_config: {
        effort: "low", // estimation courte : inutile de payer une réflexion longue
        format: zodOutputFormat(EstimationRepas),
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageBase64 },
            },
            { type: "text", text: "Estime ce repas." },
          ],
        },
      ],
    });

    if (reponse.stop_reason === "refusal") return null;
    return reponse.parsed_output ?? null;
  } catch (error) {
    console.error("Estimation IA du repas impossible :", error);
    return null;
  }
}

import type { MomentMedicament, MomentRepas, StatutTabac } from "./types";

/**
 * Modèle de confiance : chaque habitude appartient à un palier. Aucune
 * pondération n'est calculée aujourd'hui — la classification est simplement
 * lisible ici pour qu'un score futur n'exige pas de migration.
 *
 *  - `capteur`    : mesuré par la montre (FC, sommeil, sport auto)
 *  - `preuve`     : photo horodatée (repas, médicament)
 *  - `declaratif` : pointage volontaire (tabac, sport ajouté à la main)
 */
export type PalierConfiance = "capteur" | "preuve" | "declaratif";

export const PALIER_PAR_SOURCE: Record<string, PalierConfiance> = {
  amazfit: "capteur",
  photo: "preuve",
  manuel: "declaratif",
  declaratif: "declaratif",
};

export function palier(source: string | null | undefined): PalierConfiance {
  return PALIER_PAR_SOURCE[source ?? ""] ?? "declaratif";
}

export type TypeEntree = "repas" | "sport" | "medicament" | "tabac" | "sommeil";

export const LIBELLE_MOMENT_REPAS: Record<MomentRepas, string> = {
  petit_dejeuner: "Petit-déjeuner",
  dejeuner: "Déjeuner",
  diner: "Dîner",
  collation: "Collation",
};

export const MOMENTS_REPAS = Object.keys(
  LIBELLE_MOMENT_REPAS,
) as MomentRepas[];

export const LIBELLE_MOMENT_MEDICAMENT: Record<MomentMedicament, string> = {
  matin: "Matin",
  midi: "Midi",
  soir: "Soir",
  autre: "Autre",
};

export const MOMENTS_MEDICAMENT = Object.keys(
  LIBELLE_MOMENT_MEDICAMENT,
) as MomentMedicament[];

export const LIBELLE_TABAC: Record<StatutTabac, string> = {
  non_fume: "Je n'ai pas fumé aujourd'hui",
  sans_clope_travail: "Je n'ai pas pris ma cigarette au travail",
  fume_toute_journee: "J'ai fumé toute la journée",
};

export const LIBELLE_TABAC_COURT: Record<StatutTabac, string> = {
  non_fume: "Pas fumé",
  sans_clope_travail: "Pas au travail",
  fume_toute_journee: "Fumé",
};

export const STATUTS_TABAC = Object.keys(LIBELLE_TABAC) as StatutTabac[];

/** Types d'activité proposés à l'ajout manuel — le champ reste du texte libre en base. */
export const TYPES_ACTIVITE = [
  "Course",
  "Marche",
  "Vélo",
  "Natation",
  "Musculation",
  "Football",
  "Yoga",
  "Autre",
];

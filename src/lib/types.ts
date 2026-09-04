/** Types des tables Supabase (schéma `public`). */

export type MomentRepas = "petit_dejeuner" | "dejeuner" | "diner" | "collation";
export type MomentMedicament = "matin" | "midi" | "soir" | "autre";
export type StatutTabac =
  | "non_fume"
  | "sans_clope_travail"
  | "fume_toute_journee";

export interface FrequenceCardiaque {
  id: string;
  date: string;
  fc_repos: number | null;
  fc_moyenne: number | null;
  fc_max: number | null;
  minutes_zone_cardio: number | null;
  source: string | null;
  synced_at: string | null;
}

export interface Sommeil {
  id: string;
  date: string;
  heure_coucher: string | null;
  heure_lever: string | null;
  duree_minutes: number | null;
  score_sommeil: number | null;
  pourcentage_profond: number | null;
  pourcentage_leger: number | null;
  pourcentage_paradoxal: number | null;
  source: string | null;
  synced_at: string | null;
}

export interface SeanceSport {
  id: string;
  date: string;
  heure_debut: string | null;
  duree_minutes: number | null;
  type_activite: string | null;
  fc_moyenne: number | null;
  fc_max: number | null;
  minutes_zone_elevee: number | null;
  distance_km: number | null;
  source: string | null;
  synced_at: string | null;
}

export interface Repas {
  id: string;
  date: string;
  moment: MomentRepas | null;
  heure: string;
  photo_url: string;
  ia_categorie: string | null;
  ia_calories: number | null;
  ia_proteines_g: number | null;
  ia_lipides_g: number | null;
  ia_fibres_g: number | null;
  ia_confiance: number | null;
  source: string | null;
  synced_at: string | null;
}

export interface Medicament {
  id: string;
  date: string;
  moment: MomentMedicament | null;
  heure: string;
  photo_url: string;
  source: string | null;
  synced_at: string | null;
}

export interface Tabac {
  id: string;
  date: string;
  statut: StatutTabac | null;
  pointe_le: string | null;
  source: string | null;
}

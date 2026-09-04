import "server-only";
import { ilYA } from "./dates";
import type { TypeEntree } from "./habitudes";
import {
  BUCKET_MEDICAMENTS,
  BUCKET_REPAS,
  supabase,
  urlsSignees,
} from "./supabase";
import type {
  FrequenceCardiaque,
  Medicament,
  Repas,
  SeanceSport,
  Sommeil,
  StatutTabac,
  Tabac,
} from "./types";

/** Une entrée affichable dans une liste chronologique, quel que soit son type. */
export interface EntreeJournal {
  id: string;
  type: TypeEntree;
  date: string;
  /** Horodatage précis quand il existe ; sinon la journée entière. */
  heure: string | null;
  titre: string;
  detail: string | null;
  photoUrl?: string;
  statut?: StatutTabac;
  source: string | null;
}

async function lignes<T>(
  table: string,
  colonnes: string,
  depuis: string,
): Promise<T[]> {
  const { data, error } = await supabase()
    .from(table)
    .select(colonnes)
    .gte("date", depuis)
    .order("date", { ascending: false });
  if (error) throw new Error(`Lecture de ${table} impossible : ${error.message}`);
  return (data ?? []) as T[];
}

export async function frequenceCardiaqueDepuis(depuis: string) {
  return lignes<FrequenceCardiaque>("frequence_cardiaque", "*", depuis);
}

export async function sommeilDepuis(depuis: string) {
  return lignes<Sommeil>("sommeil", "*", depuis);
}

export async function seancesDepuis(depuis: string) {
  return lignes<SeanceSport>("seances_sport", "*", depuis);
}

export async function repasDepuis(depuis: string) {
  return lignes<Repas>("repas", "*", depuis);
}

export async function medicamentsDepuis(depuis: string) {
  return lignes<Medicament>("medicaments", "*", depuis);
}

export async function tabacDepuis(depuis: string) {
  return lignes<Tabac>("tabac", "*", depuis);
}

/** Ce que l'écran Aujourd'hui affiche en haut : les deux mesures des capteurs. */
export async function capteursDuJour(date: string) {
  const db = supabase();
  const [fc, sommeil] = await Promise.all([
    db.from("frequence_cardiaque").select("*").eq("date", date).maybeSingle(),
    db.from("sommeil").select("*").eq("date", date).maybeSingle(),
  ]);
  return {
    fc: (fc.data ?? null) as FrequenceCardiaque | null,
    sommeil: (sommeil.data ?? null) as Sommeil | null,
  };
}

export async function pointageTabac(date: string): Promise<Tabac | null> {
  const { data } = await supabase()
    .from("tabac")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  return (data ?? null) as Tabac | null;
}

const LIBELLE_MOMENT: Record<string, string> = {
  petit_dejeuner: "Petit-déjeuner",
  dejeuner: "Déjeuner",
  diner: "Dîner",
  collation: "Collation",
  matin: "Matin",
  midi: "Midi",
  soir: "Soir",
  autre: "Autre",
};

const LIBELLE_STATUT: Record<StatutTabac, string> = {
  non_fume: "Pas fumé",
  sans_clope_travail: "Pas de cigarette au travail",
  fume_toute_journee: "Fumé toute la journée",
};

/**
 * Fusionne repas, médicaments, séances, pointages tabac (et le sommeil, sur
 * demande) en une seule liste chronologique décroissante — le même principe
 * d'unification que les actions rapides, appliqué à la lecture.
 */
export async function entrees(
  depuis: string,
  options: { avecSommeil?: boolean } = {},
): Promise<EntreeJournal[]> {
  const [lesRepas, lesMedicaments, lesSeances, lesTabac, leSommeil] =
    await Promise.all([
      repasDepuis(depuis),
      medicamentsDepuis(depuis),
      seancesDepuis(depuis),
      tabacDepuis(depuis),
      options.avecSommeil ? sommeilDepuis(depuis) : Promise.resolve([]),
    ]);

  const [urlsRepas, urlsMedicaments] = await Promise.all([
    urlsSignees(BUCKET_REPAS, lesRepas.map((r) => r.photo_url)),
    urlsSignees(BUCKET_MEDICAMENTS, lesMedicaments.map((m) => m.photo_url)),
  ]);

  const liste: EntreeJournal[] = [
    ...lesRepas.map((r) => ({
      id: r.id,
      type: "repas" as const,
      date: r.date,
      heure: r.heure,
      titre: r.ia_categorie ?? LIBELLE_MOMENT[r.moment ?? ""] ?? "Repas",
      detail: r.ia_calories != null ? `${Math.round(r.ia_calories)} kcal` : null,
      photoUrl: urlsRepas[r.photo_url],
      source: r.source,
    })),
    ...lesMedicaments.map((m) => ({
      id: m.id,
      type: "medicament" as const,
      date: m.date,
      heure: m.heure,
      titre: "Médicament",
      detail: LIBELLE_MOMENT[m.moment ?? ""] ?? null,
      photoUrl: urlsMedicaments[m.photo_url],
      source: m.source,
    })),
    ...lesSeances.map((s) => ({
      id: s.id,
      type: "sport" as const,
      date: s.date,
      heure: s.heure_debut,
      titre: s.type_activite ?? "Séance",
      detail: s.duree_minutes != null ? `${s.duree_minutes} min` : null,
      source: s.source,
    })),
    ...lesTabac.map((t) => ({
      id: t.id,
      type: "tabac" as const,
      date: t.date,
      heure: t.pointe_le,
      titre: t.statut ? LIBELLE_STATUT[t.statut] : "Pointage",
      detail: null,
      statut: t.statut ?? undefined,
      source: t.source,
    })),
    ...leSommeil.map((s) => ({
      id: s.id,
      type: "sommeil" as const,
      date: s.date,
      heure: null,
      titre: "Nuit",
      detail: [
        s.duree_minutes != null
          ? `${Math.floor(s.duree_minutes / 60)} h ${String(s.duree_minutes % 60).padStart(2, "0")}`
          : null,
        s.score_sommeil != null ? `score ${s.score_sommeil}` : null,
      ]
        .filter(Boolean)
        .join(" · ") || null,
      source: s.source,
    })),
  ];

  return liste.sort(comparerEntrees);
}

function comparerEntrees(a: EntreeJournal, b: EntreeJournal): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  const ha = a.heure ? Date.parse(a.heure) : 0;
  const hb = b.heure ? Date.parse(b.heure) : 0;
  return hb - ha;
}

/** Les vignettes de la bande photo : repas et médicaments mélangés, récents d'abord. */
export async function photosRecentes(jours = 60, limite = 24) {
  const toutes = await entrees(ilYA(jours));
  return toutes.filter((e) => e.photoUrl).slice(0, limite);
}

/** Dernière synchronisation connue des capteurs (FC ou sommeil). */
export async function derniereSynchro(): Promise<string | null> {
  const db = supabase();
  const [fc, sommeil] = await Promise.all([
    db
      .from("frequence_cardiaque")
      .select("synced_at")
      .order("synced_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("sommeil")
      .select("synced_at")
      .order("synced_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const dates = [fc.data?.synced_at, sommeil.data?.synced_at].filter(
    (d): d is string => Boolean(d),
  );
  if (dates.length === 0) return null;
  return dates.sort().at(-1) ?? null;
}

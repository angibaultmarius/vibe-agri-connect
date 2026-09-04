import { heureCourte } from "@/lib/dates";
import type { EntreeJournal } from "@/lib/donnees";

const BADGE: Record<EntreeJournal["type"], string> = {
  repas: "badge-repas",
  sport: "badge-sport",
  medicament: "badge-medicament",
  tabac: "badge-tabac",
  sommeil: "badge-sommeil",
};

const LIBELLE_TYPE: Record<EntreeJournal["type"], string> = {
  repas: "Repas",
  sport: "Sport",
  medicament: "Médicament",
  tabac: "Tabac",
  sommeil: "Sommeil",
};

/**
 * Un type d'entrée = un style de ligne : vignette pour les photos, pastille
 * colorée pour le tabac, badge pour le reste.
 */
export function ListeEntrees({ entrees }: { entrees: EntreeJournal[] }) {
  return (
    <ul className="liste">
      {entrees.map((entree) => (
        <li key={`${entree.type}-${entree.id}`} className="ligne">
          {entree.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="vignette"
              src={entree.photoUrl}
              alt={`Photo — ${entree.titre}`}
              loading="lazy"
            />
          ) : entree.type === "tabac" ? (
            <span
              className={`pastille pastille-${entree.statut ?? "neutre"}`}
              aria-hidden
            />
          ) : (
            <span className={`badge ${BADGE[entree.type]}`}>
              {LIBELLE_TYPE[entree.type]}
            </span>
          )}

          <span className="corps">
            <span className="titre-ligne">{entree.titre}</span>
            <span className="horodatage">
              {[heureCourte(entree.heure), entree.detail]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>

          {entree.photoUrl ? (
            <span className={`badge ${BADGE[entree.type]}`}>
              {LIBELLE_TYPE[entree.type]}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

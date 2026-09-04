"use client";

import { useMemo, useState } from "react";
import { dateLongue } from "@/lib/dates";
import type { EntreeJournal } from "@/lib/donnees";
import type { TypeEntree } from "@/lib/habitudes";
import { ListeEntrees } from "./ListeEntrees";

const FILTRES: { valeur: TypeEntree | "tous"; libelle: string }[] = [
  { valeur: "tous", libelle: "Tous" },
  { valeur: "repas", libelle: "Repas" },
  { valeur: "sport", libelle: "Sport" },
  { valeur: "sommeil", libelle: "Sommeil" },
  { valeur: "tabac", libelle: "Tabac" },
  { valeur: "medicament", libelle: "Médicament" },
];

export function JournalClient({
  entrees,
  photos,
}: {
  entrees: EntreeJournal[];
  photos: EntreeJournal[];
}) {
  const [filtre, setFiltre] = useState<TypeEntree | "tous">("tous");

  // Le filtre agit en mémoire : aucun rechargement de page.
  const groupes = useMemo(() => {
    const retenues =
      filtre === "tous" ? entrees : entrees.filter((e) => e.type === filtre);
    const parJour = new Map<string, EntreeJournal[]>();
    for (const entree of retenues) {
      const liste = parJour.get(entree.date) ?? [];
      liste.push(entree);
      parJour.set(entree.date, liste);
    }
    return [...parJour.entries()];
  }, [entrees, filtre]);

  return (
    <>
      <div className="filtres" role="group" aria-label="Filtrer le journal">
        {FILTRES.map(({ valeur, libelle }) => (
          <button
            key={valeur}
            type="button"
            className="chip"
            aria-pressed={filtre === valeur}
            onClick={() => setFiltre(valeur)}
          >
            {libelle}
          </button>
        ))}
      </div>

      {photos.length > 0 ? (
        <div className="bande-photos" aria-label="Photos récentes">
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${photo.type}-${photo.id}`}
              src={photo.photoUrl}
              alt={`${photo.type === "repas" ? "Repas" : "Médicament"} — ${photo.titre}`}
              loading="lazy"
            />
          ))}
        </div>
      ) : null}

      {groupes.length === 0 ? (
        <p className="vide">Aucune entrée sur cette période.</p>
      ) : (
        groupes.map(([date, duJour]) => (
          <section key={date} className="jour">
            <h3 className="titre-jour">{dateLongue(date)}</h3>
            <div className="carte">
              <ListeEntrees entrees={duJour} />
            </div>
          </section>
        ))
      )}
    </>
  );
}

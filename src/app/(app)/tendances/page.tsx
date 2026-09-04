import { Barres, Courbe, type Point } from "@/components/Graphiques";
import {
  aujourdhui,
  ajouterJours,
  ilYA,
  jourEtMois,
  lundiDeLaSemaine,
  serieDeJours,
} from "@/lib/dates";
import {
  frequenceCardiaqueDepuis,
  repasDepuis,
  seancesDepuis,
  sommeilDepuis,
  tabacDepuis,
} from "@/lib/donnees";
import { LIBELLE_MOMENT_REPAS, MOMENTS_REPAS } from "@/lib/habitudes";
import type { StatutTabac } from "@/lib/types";

export const dynamic = "force-dynamic";

const COULEUR_STATUT: Record<StatutTabac, string> = {
  non_fume: "var(--bon)",
  sans_clope_travail: "var(--attention)",
  fume_toute_journee: "var(--critique)",
};

export default async function PageTendances() {
  const jours30 = serieDeJours(30);
  const [fc, sommeil, seances, repas, tabac] = await Promise.all([
    frequenceCardiaqueDepuis(ilYA(29)),
    sommeilDepuis(ilYA(29)),
    seancesDepuis(ilYA(60)),
    repasDepuis(ilYA(29)),
    tabacDepuis(ilYA(27)),
  ]);

  /* --- FC au repos, 30 jours --- */
  const fcParJour = new Map(fc.map((l) => [l.date, l.fc_repos]));
  const pointsFc: Point[] = jours30.map((jour) => ({
    cle: jour,
    valeur: fcParJour.get(jour) ?? null,
  }));

  /* --- Sommeil : durée et score, deux courbes séparées --- */
  const sommeilParJour = new Map(sommeil.map((l) => [l.date, l]));
  const pointsDuree: Point[] = jours30.map((jour) => ({
    cle: jour,
    valeur: sommeilParJour.get(jour)?.duree_minutes ?? null,
  }));
  const pointsScore: Point[] = jours30.map((jour) => ({
    cle: jour,
    valeur: sommeilParJour.get(jour)?.score_sommeil ?? null,
  }));

  /* --- Sport : séances par semaine, 8 semaines --- */
  const lundiCourant = lundiDeLaSemaine(aujourdhui());
  const semaines = Array.from({ length: 8 }, (_, i) =>
    ajouterJours(lundiCourant, -7 * (7 - i)),
  );
  const pointsSport: Point[] = semaines.map((lundi) => {
    const fin = ajouterJours(lundi, 7);
    return {
      cle: jourEtMois(lundi),
      valeur: seances.filter((s) => s.date >= lundi && s.date < fin).length,
    };
  });

  /* --- Repas : moyennes par jour *compté sur les jours renseignés* --- */
  const joursAvecRepas = new Set(repas.map((r) => r.date));
  const nbJoursRepas = Math.max(joursAvecRepas.size, 1);
  const somme = (extraire: (r: (typeof repas)[number]) => number | null) =>
    repas.reduce((total, r) => total + (extraire(r) ?? 0), 0);

  const moyennes = [
    { libelle: "kcal", valeur: somme((r) => r.ia_calories) / nbJoursRepas },
    { libelle: "protéines", valeur: somme((r) => r.ia_proteines_g) / nbJoursRepas, unite: "g" },
    { libelle: "lipides", valeur: somme((r) => r.ia_lipides_g) / nbJoursRepas, unite: "g" },
    { libelle: "fibres", valeur: somme((r) => r.ia_fibres_g) / nbJoursRepas, unite: "g" },
  ];

  const repartition = MOMENTS_REPAS.map((moment) => ({
    moment,
    nombre: repas.filter((r) => r.moment === moment).length,
  }));
  const maxRepartition = Math.max(1, ...repartition.map((r) => r.nombre));

  /* --- Tabac : calendrier de 4 semaines alignées sur le lundi --- */
  const debutCalendrier = ajouterJours(lundiCourant, -21);
  const casesCalendrier = Array.from({ length: 28 }, (_, i) =>
    ajouterJours(debutCalendrier, i),
  );
  const statutParJour = new Map(tabac.map((t) => [t.date, t.statut]));
  const demain = ajouterJours(aujourdhui(), 1);

  return (
    <>
      <header className="entete-ecran">
        <h1>Tendances</h1>
        <span className="horodatage">30 derniers jours</span>
      </header>

      <section className="carte">
        <div className="entete-carte">
          <h2>FC au repos</h2>
          <span className="horodatage">bpm</span>
        </div>
        <Courbe points={pointsFc} couleur="var(--graph-bleu)" suffixe=" bpm" />
      </section>

      <section className="carte">
        <h2>Sommeil</h2>
        <div className="duo-graphiques">
          <div>
            <span className="libelle-champ texte-secondaire">Durée (min)</span>
            <Courbe points={pointsDuree} hauteur={100} couleur="var(--graph-aqua)" />
          </div>
          <div>
            <span className="libelle-champ texte-secondaire">Score</span>
            <Courbe points={pointsScore} hauteur={100} couleur="var(--graph-orange)" />
          </div>
        </div>
      </section>

      <section className="carte">
        <div className="entete-carte">
          <h2>Sport</h2>
          <span className="horodatage">séances / semaine</span>
        </div>
        <Barres points={pointsSport} couleur="var(--sport)" />
      </section>

      <section className="carte">
        <div className="entete-carte">
          <h2>Manger mieux</h2>
          <span className="horodatage">
            moy. / {joursAvecRepas.size} j renseigné
            {joursAvecRepas.size > 1 ? "s" : ""}
          </span>
        </div>

        <div className="grille-tuiles">
          {moyennes.map(({ libelle, valeur, unite }) => (
            <div key={libelle} className="tuile-synthese">
              <span className="valeur">
                {joursAvecRepas.size === 0 ? "—" : Math.round(valeur)}
                {unite && joursAvecRepas.size > 0 ? unite : ""}
              </span>
              <span className="libelle-champ">{libelle}</span>
            </div>
          ))}
        </div>

        <div className="repartition">
          {repartition.map(({ moment, nombre }) => (
            <div key={moment} className="rangee">
              <span className="texte-secondaire">{LIBELLE_MOMENT_REPAS[moment]}</span>
              <span
                className="barre"
                style={{ width: `${(nombre / maxRepartition) * 100}%` }}
              />
              <span className="mono">{nombre}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="carte">
        <div className="entete-carte">
          <h2>Ne pas fumer</h2>
          <span className="horodatage">4 semaines</span>
        </div>

        <div className="calendrier" aria-hidden>
          {["L", "M", "M", "J", "V", "S", "D"].map((jour, i) => (
            <span key={i} className="jour-semaine">
              {jour}
            </span>
          ))}
        </div>

        <div className="calendrier" style={{ marginTop: 5 }}>
          {casesCalendrier.map((jour) => {
            const statut = statutParJour.get(jour);
            const futur = jour >= demain;
            return (
              <span
                key={jour}
                className="case"
                title={jour}
                style={{
                  background: statut ? COULEUR_STATUT[statut] : "var(--neutre)",
                  opacity: futur ? 0.15 : 1,
                }}
              />
            );
          })}
        </div>

        <div className="legende">
          <span>
            <i style={{ background: "var(--bon)" }} /> pas fumé
          </span>
          <span>
            <i style={{ background: "var(--attention)" }} /> pas au travail
          </span>
          <span>
            <i style={{ background: "var(--critique)" }} /> fumé toute la journée
          </span>
          <span>
            <i style={{ background: "var(--neutre)" }} /> pas de pointage
          </span>
        </div>
      </section>
    </>
  );
}

import { ActionsRapides } from "@/components/ActionsRapides";
import { IconeCoeur, IconeSommeil } from "@/components/Icones";
import { ListeEntrees } from "@/components/ListeEntrees";
import { aujourdhui, dateLongue, duree, heureCourte } from "@/lib/dates";
import {
  capteursDuJour,
  derniereSynchro,
  entrees,
  pointageTabac,
} from "@/lib/donnees";

export const dynamic = "force-dynamic";

export default async function PageAujourdhui() {
  const date = aujourdhui();
  const [capteurs, duJour, tabac, synchro] = await Promise.all([
    capteursDuJour(date),
    entrees(date),
    pointageTabac(date),
    derniereSynchro(),
  ]);

  const sportDuJour = duJour.filter((e) => e.type === "sport");

  return (
    <>
      <header className="entete-ecran">
        <h1>Aujourd&apos;hui</h1>
        <span className="horodatage">{dateLongue(date)}</span>
      </header>

      <ActionsRapides statutTabac={tabac?.statut ?? null} />

      <section className="carte">
        <div className="entete-carte">
          <h2>Capteurs</h2>
          <span className="horodatage">
            {synchro ? `synchro ${heureCourte(synchro)}` : "aucune synchro"}
          </span>
        </div>

        <div className="grille-capteurs">
          <div className="mesure">
            <span className="libelle-champ">
              <IconeCoeur /> FC au repos
            </span>
            {capteurs.fc?.fc_repos != null ? (
              <span className="valeur">
                {capteurs.fc.fc_repos} <span className="unite">bpm</span>
              </span>
            ) : (
              <span className="vide">Pas de mesure</span>
            )}
          </div>

          <div className="mesure">
            <span className="libelle-champ">
              <IconeSommeil /> Nuit
            </span>
            {capteurs.sommeil?.duree_minutes != null ? (
              <span className="valeur">
                {duree(capteurs.sommeil.duree_minutes)}
              </span>
            ) : (
              <span className="vide">Pas de mesure</span>
            )}
            {capteurs.sommeil?.score_sommeil != null ? (
              <span className="unite-bloc">score {capteurs.sommeil.score_sommeil}</span>
            ) : null}
          </div>
        </div>

        <p className="texte-secondaire" style={{ marginBottom: 0, marginTop: 12 }}>
          {sportDuJour.length > 0
            ? `${sportDuJour.length} séance${sportDuJour.length > 1 ? "s" : ""} aujourd'hui.`
            : "Pas de séance aujourd'hui."}
        </p>
      </section>

      <section className="carte">
        <h2>Aujourd&apos;hui</h2>
        {duJour.length > 0 ? (
          <ListeEntrees entrees={duJour} />
        ) : (
          <p className="vide">
            Rien d&apos;enregistré pour l&apos;instant. Une journée sans donnée
            reste neutre.
          </p>
        )}
      </section>
    </>
  );
}

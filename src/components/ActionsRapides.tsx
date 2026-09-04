"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { aujourdhui } from "@/lib/dates";
import {
  LIBELLE_MOMENT_MEDICAMENT,
  LIBELLE_MOMENT_REPAS,
  LIBELLE_TABAC,
  MOMENTS_MEDICAMENT,
  MOMENTS_REPAS,
  STATUTS_TABAC,
  TYPES_ACTIVITE,
} from "@/lib/habitudes";
import type { StatutTabac } from "@/lib/types";
import { Feuille } from "./Feuille";
import {
  IconeMedicament,
  IconeRepas,
  IconeSport,
  IconeTabac,
} from "./Icones";

type Flux = "repas" | "sport" | "medicament" | "tabac" | null;

const TUILES = [
  { flux: "repas", libelle: "Repas", Icone: IconeRepas, rond: "rond-repas" },
  { flux: "sport", libelle: "Sport", Icone: IconeSport, rond: "rond-sport" },
  {
    flux: "medicament",
    libelle: "Médicament",
    Icone: IconeMedicament,
    rond: "rond-medicament",
  },
  { flux: "tabac", libelle: "Pointer", Icone: IconeTabac, rond: "rond-tabac" },
] as const;

const TITRES: Record<Exclude<Flux, null>, string> = {
  repas: "Repas",
  sport: "Séance de sport",
  medicament: "Médicament",
  tabac: "Pointage du jour",
};

export function ActionsRapides({
  statutTabac,
}: {
  statutTabac?: StatutTabac | null;
}) {
  const [flux, setFlux] = useState<Flux>(null);
  const [autreJour, setAutreJour] = useState(false);
  const [date, setDate] = useState(aujourdhui());
  const router = useRouter();

  const fermer = () => setFlux(null);
  const apresEnvoi = () => {
    fermer();
    router.refresh();
  };

  return (
    <>
      <div className="actions-rapides">
        {TUILES.map(({ flux: cible, libelle, Icone, rond }) => (
          <button
            key={cible}
            type="button"
            className="tuile-action"
            onClick={() => setFlux(cible)}
          >
            <span className={`rond ${rond}`}>
              <Icone />
            </span>
            {libelle}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="lien-discret"
        onClick={() => {
          setAutreJour((ouvert) => !ouvert);
          setDate(aujourdhui());
        }}
      >
        {autreJour ? "— Revenir à aujourd'hui" : "+ Ajouter pour un autre jour"}
      </button>

      {autreJour ? (
        <label>
          <span>Jour concerné</span>
          <input
            type="date"
            value={date}
            max={aujourdhui()}
            onChange={(e) => setDate(e.target.value || aujourdhui())}
          />
        </label>
      ) : null}

      {flux ? (
        <Feuille titre={TITRES[flux]} onFermer={fermer}>
          {flux === "repas" ? (
            <FormulairePhoto
              url="/api/repas"
              date={date}
              moments={MOMENTS_REPAS}
              libelles={LIBELLE_MOMENT_REPAS}
              aide="La photo est analysée pour estimer le plat et ses macros."
              onFini={apresEnvoi}
            />
          ) : null}
          {flux === "medicament" ? (
            <FormulairePhoto
              url="/api/medicaments"
              date={date}
              moments={MOMENTS_MEDICAMENT}
              libelles={LIBELLE_MOMENT_MEDICAMENT}
              aide="Photo au moment de la prise : une preuve horodatée, rien d'autre."
              onFini={apresEnvoi}
            />
          ) : null}
          {flux === "sport" ? (
            <FormulaireSport date={date} onFini={apresEnvoi} />
          ) : null}
          {flux === "tabac" ? (
            <FormulaireTabac
              date={date}
              statutInitial={statutTabac ?? null}
              onFini={apresEnvoi}
            />
          ) : null}
        </Feuille>
      ) : null}
    </>
  );
}

/* ---------- Repas & médicament : photo + moment ---------- */

function FormulairePhoto<M extends string>({
  url,
  date,
  moments,
  libelles,
  aide,
  onFini,
}: {
  url: string;
  date: string;
  moments: readonly M[];
  libelles: Record<M, string>;
  aide: string;
  onFini: () => void;
}) {
  const [moment, setMoment] = useState<M>(moments[0]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("moment", moment);
    form.set("date", date);

    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch(url, { method: "POST", body: form });
      if (!reponse.ok) {
        const corps = await reponse.json().catch(() => ({}));
        throw new Error(corps.erreur ?? "Envoi impossible.");
      }
      onFini();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={envoyer}>
      <label>
        <span>Photo</span>
        <input
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          required
        />
      </label>

      <label>
        <span>Moment</span>
        <select value={moment} onChange={(e) => setMoment(e.target.value as M)}>
          {moments.map((m) => (
            <option key={m} value={m}>
              {libelles[m]}
            </option>
          ))}
        </select>
      </label>

      <p className="texte-secondaire">{aide}</p>

      <button type="submit" className="bouton-principal" disabled={enCours}>
        {enCours ? "Envoi…" : "Enregistrer"}
      </button>
      {erreur ? <p className="message-erreur">{erreur}</p> : null}
    </form>
  );
}

/* ---------- Sport manuel ---------- */

function FormulaireSport({
  date,
  onFini,
}: {
  date: string;
  onFini: () => void;
}) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nombre = (cle: string) => {
      const valeur = String(form.get(cle) ?? "").trim();
      return valeur === "" ? null : Number(valeur);
    };

    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch("/api/sport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          heure_debut: new Date().toISOString(),
          type_activite: String(form.get("type_activite") ?? ""),
          duree_minutes: nombre("duree_minutes"),
          fc_moyenne: nombre("fc_moyenne"),
          fc_max: nombre("fc_max"),
          distance_km: nombre("distance_km"),
        }),
      });
      if (!reponse.ok) {
        const corps = await reponse.json().catch(() => ({}));
        throw new Error(corps.erreur ?? "Enregistrement impossible.");
      }
      onFini();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={envoyer}>
      <label>
        <span>Type d'activité</span>
        <select name="type_activite" defaultValue={TYPES_ACTIVITE[0]}>
          {TYPES_ACTIVITE.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Durée (minutes)</span>
        <input
          type="number"
          name="duree_minutes"
          inputMode="numeric"
          min={1}
          max={600}
          required
        />
      </label>

      <label>
        <span>Distance (km, facultatif)</span>
        <input type="number" name="distance_km" inputMode="decimal" step="0.1" min={0} />
      </label>

      <div className="duo-graphiques">
        <label>
          <span>FC moyenne</span>
          <input type="number" name="fc_moyenne" inputMode="numeric" min={30} max={230} />
        </label>
        <label>
          <span>FC max</span>
          <input type="number" name="fc_max" inputMode="numeric" min={30} max={230} />
        </label>
      </div>

      <p className="texte-secondaire">
        Séance ajoutée à la main : elle est marquée comme déclarative, pas
        comme mesurée par la montre.
      </p>

      <button type="submit" className="bouton-principal" disabled={enCours}>
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </button>
      {erreur ? <p className="message-erreur">{erreur}</p> : null}
    </form>
  );
}

/* ---------- Tabac : pointage à 3 états ---------- */

function FormulaireTabac({
  date,
  statutInitial,
  onFini,
}: {
  date: string;
  statutInitial: StatutTabac | null;
  onFini: () => void;
}) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<StatutTabac | null>(null);

  async function pointer(statut: StatutTabac) {
    setEnCours(statut);
    setErreur(null);
    try {
      const reponse = await fetch("/api/tabac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, statut }),
      });
      if (!reponse.ok) {
        const corps = await reponse.json().catch(() => ({}));
        throw new Error(corps.erreur ?? "Pointage impossible.");
      }
      onFini();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Pointage impossible.");
      setEnCours(null);
    }
  }

  return (
    <div className="choix-tabac">
      {STATUTS_TABAC.map((statut) => (
        <button
          key={statut}
          type="button"
          aria-pressed={statutInitial === statut}
          disabled={enCours !== null}
          onClick={() => pointer(statut)}
        >
          <span className={`pastille pastille-${statut}`} />
          {LIBELLE_TABAC[statut]}
        </button>
      ))}
      <p className="texte-secondaire">
        Un jour non pointé reste neutre : il ne compte ni comme réussite ni
        comme échec.
      </p>
      {erreur ? <p className="message-erreur">{erreur}</p> : null}
    </div>
  );
}

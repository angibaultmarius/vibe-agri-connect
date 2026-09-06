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
import { CapturePhoto } from "./CapturePhoto";
import { Feuille } from "./Feuille";
import {
  PictoMedicament,
  PictoRepas,
  PictoSport,
  PictoTabac,
} from "./pictos";

type Flux = "repas" | "sport" | "medicament" | "tabac" | null;
type Photo = { blob: Blob; apercu: string };

const TUILES = [
  { flux: "repas", libelle: "Repas", Picto: PictoRepas },
  { flux: "sport", libelle: "Sport", Picto: PictoSport },
  { flux: "medicament", libelle: "Médicament", Picto: PictoMedicament },
  { flux: "tabac", libelle: "Pointer", Picto: PictoTabac },
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
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [autreJour, setAutreJour] = useState(false);
  const [date, setDate] = useState(aujourdhui());
  const router = useRouter();

  function fermer() {
    if (photo) URL.revokeObjectURL(photo.apercu);
    setPhoto(null);
    setFlux(null);
  }

  function apresEnvoi() {
    fermer();
    router.refresh();
  }

  const fluxPhoto = flux === "repas" || flux === "medicament";

  return (
    <>
      <div className="actions-rapides">
        {TUILES.map(({ flux: cible, libelle, Picto }) => (
          <button
            key={cible}
            type="button"
            className="tuile-action"
            onClick={() => setFlux(cible)}
          >
            <span className="rond">
              <Picto />
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

      {/* Les flux photo commencent par la caméra, pas par un formulaire. */}
      {fluxPhoto && !photo ? (
        <CapturePhoto
          titre={flux === "repas" ? "Photo du repas" : "Photo de la prise"}
          onPhoto={(blob, apercu) => setPhoto({ blob, apercu })}
          onAnnuler={fermer}
        />
      ) : null}

      {flux && (!fluxPhoto || photo) ? (
        <Feuille titre={TITRES[flux]} onFermer={fermer}>
          {flux === "repas" && photo ? (
            <FormulairePhoto
              url="/api/repas"
              date={date}
              photo={photo}
              moments={MOMENTS_REPAS}
              libelles={LIBELLE_MOMENT_REPAS}
              aide="La photo est analysée pour estimer le plat et ses macros."
              onFini={apresEnvoi}
            />
          ) : null}
          {flux === "medicament" && photo ? (
            <FormulairePhoto
              url="/api/medicaments"
              date={date}
              photo={photo}
              moments={MOMENTS_MEDICAMENT}
              libelles={LIBELLE_MOMENT_MEDICAMENT}
              aide="Preuve horodatée de la prise, aucun traitement automatique."
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

/* ---------- Repas & médicament : la photo est déjà prise, reste le moment ---------- */

function FormulairePhoto<M extends string>({
  url,
  date,
  photo,
  moments,
  libelles,
  aide,
  onFini,
}: {
  url: string;
  date: string;
  photo: Photo;
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
    const form = new FormData();
    form.set("photo", photo.blob, "photo.jpg");
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="apercu-capture" src={photo.apercu} alt="Photo prise" />

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
        <span>Type d&apos;activité</span>
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
        <input type="number" name="duree_minutes" inputMode="numeric" min={1} max={600} required />
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
        Séance ajoutée à la main : elle est marquée comme déclarative, pas comme
        mesurée par la montre.
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
        Un jour non pointé reste neutre : il ne compte ni comme réussite ni comme
        échec.
      </p>
      {erreur ? <p className="message-erreur">{erreur}</p> : null}
    </div>
  );
}

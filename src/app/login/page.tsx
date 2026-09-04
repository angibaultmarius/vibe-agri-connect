"use client";

import { useActionState } from "react";
import { seConnecter } from "./actions";

export default function PageConnexion() {
  const [erreur, action, enCours] = useActionState(seConnecter, null);

  return (
    <main className="ecran-connexion">
      <form action={action} className="carte carte-connexion">
        <h1 className="titre-connexion">Carnet de Bord</h1>
        <p className="texte-secondaire">
          Cette application contient des photos et des données de santé. Entre le
          mot de passe pour continuer.
        </p>
        <input
          type="password"
          name="mot_de_passe"
          autoComplete="current-password"
          placeholder="Mot de passe"
          aria-label="Mot de passe"
          required
          autoFocus
        />
        <button type="submit" className="bouton-principal" disabled={enCours}>
          {enCours ? "Vérification…" : "Entrer"}
        </button>
        {erreur ? (
          <p role="alert" className="message-erreur">
            {erreur}
          </p>
        ) : null}
      </form>
    </main>
  );
}

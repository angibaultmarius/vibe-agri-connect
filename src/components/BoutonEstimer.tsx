"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Rejoue l'estimation IA d'un repas dont les macros manquent. */
export function BoutonEstimer({ id }: { id: string }) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const router = useRouter();

  async function estimer() {
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch(`/api/repas/${id}/estimer`, { method: "POST" });
      if (!reponse.ok) {
        const corps = await reponse.json().catch(() => ({}));
        throw new Error(corps.erreur ?? "Estimation impossible.");
      }
      router.refresh();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Estimation impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="bouton-estimer"
        onClick={estimer}
        disabled={enCours}
        title="Relancer l'estimation des macros"
      >
        {enCours ? "…" : "Estimer"}
      </button>
      {erreur ? (
        <span className="message-erreur" role="alert">
          {erreur}
        </span>
      ) : null}
    </>
  );
}

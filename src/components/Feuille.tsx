"use client";

import { useEffect } from "react";

/** Feuille modale qui monte du bas — le conteneur de tous les flux de saisie. */
export function Feuille({
  titre,
  onFermer,
  children,
}: {
  titre: string;
  onFermer: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const surEchap = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    document.addEventListener("keydown", surEchap);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", surEchap);
      document.body.style.overflow = "";
    };
  }, [onFermer]);

  return (
    <div
      className="voile"
      role="dialog"
      aria-modal="true"
      aria-label={titre}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFermer();
      }}
    >
      <div className="feuille">
        <div className="entete-feuille">
          <h2>{titre}</h2>
          <button type="button" className="fermer" onClick={onFermer}>
            Fermer
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";

/** Service worker minimal, juste ce qu'il faut pour l'ajout à l'écran d'accueil iOS. */
export function EnregistrerServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* l'app fonctionne très bien sans */
    });
  }, []);

  return null;
}

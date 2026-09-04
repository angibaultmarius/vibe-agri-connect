/**
 * Service worker minimal : il existe pour rendre l'app installable sur l'écran
 * d'accueil iOS. Aucune mise en cache des données de santé ni des photos —
 * elles restent derrière le verrou d'accès et les URL signées.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("fetch", () => {
  // Pass-through : le réseau fait foi.
});

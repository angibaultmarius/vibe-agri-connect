/** Lecture des variables d'environnement, avec un message clair quand il en manque une. */

/** Les variables que l'app peut attendre — sert au diagnostic ci-dessous. */
const ATTENDUES = [
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "INGEST_TOKEN",
];

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    // On liste les *noms* (jamais les valeurs) des variables qui parviennent
    // réellement à l'exécution : sur Vercel, une variable présente dans le
    // tableau de bord n'atteint pas forcément le déploiement en cours.
    const vues = ATTENDUES.filter((n) => process.env[n]);
    throw new Error(
      `Variable d'environnement manquante : ${name}. ` +
        `Visibles à l'exécution : ${vues.join(", ") || "aucune"}. Voir .env.example.`,
    );
  }
  return value;
}

export function optionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

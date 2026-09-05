/**
 * L'interface de l'app n'est plus protégée : elle s'ouvre directement, sans
 * mot de passe (choix assumé de l'auteur du projet). Les routes d'ingestion,
 * elles, gardent leur jeton partagé — elles sont appelées par les Raccourcis
 * iOS, pas par un navigateur, et rien n'oblige à les laisser ouvertes.
 */

/** Comparaison à temps constant, pour ne pas fuiter le jeton octet par octet. */
export function comparaisonConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Vérifie le header `Authorization: Bearer <token>` des routes d'ingestion. */
export function jetonIngestionValide(
  header: string | null,
  attendu: string,
): boolean {
  if (!header?.startsWith("Bearer ")) return false;
  return comparaisonConstante(header.slice("Bearer ".length).trim(), attendu);
}

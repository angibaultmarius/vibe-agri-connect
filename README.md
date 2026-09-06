# Carnet de Bord

Web app personnelle de suivi d'habitudes. Usage strictement individuel : une
seule personne, un seul mot de passe. Phase 1 — capture et visualisation des
données, **aucun système de récompense ou de jeu**.

Cinq habitudes suivies, chacune avec sa propre logique de vérification :

| Habitude | Saisie | Palier de confiance |
|---|---|---|
| Fréquence cardiaque | montre Amazfit → Raccourci iOS | capteur |
| Sommeil | montre Amazfit → Raccourci iOS | capteur |
| Sport | montre Amazfit, **ou** ajout manuel dans l'app | capteur / déclaratif |
| Manger mieux | photo du repas + moment ; macros estimées par un modèle de vision | preuve |
| Prendre médicament | photo au moment de la prise + moment | preuve |
| Ne pas fumer | pointage volontaire à 3 états | déclaratif |

**Principe transversal : une journée sans donnée est neutre.** Ni échec ni
succès. Les moyennes de l'écran Tendances ne comptent jamais un jour sans
donnée comme un zéro, et les courbes se coupent aux trous plutôt que de
descendre à zéro.

Le palier de confiance n'est pas encore pondéré : il est simplement lisible
dans `src/lib/habitudes.ts` et dans la colonne `source` de chaque table, pour
qu'un score futur n'exige pas de migration.

## Stack

- **Next.js** (App Router, TypeScript) — déploiement cible **Vercel**
- **Supabase** — Postgres + Storage (buckets privés)
- **API Gemini** (vision) pour l'estimation des repas, appelée **côté serveur**
- CSS écrit à la main (design system en variables), aucun framework UI
- PWA : `manifest.json` + service worker minimal, pour l'ajout à l'écran
  d'accueil iOS

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run dev
```

### Variables d'environnement

| Variable | Rôle |
|---|---|
|  `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role — **serveur uniquement** |
| `INGEST_TOKEN` | Jeton partagé des routes `/api/ingest/*` |
| `GEMINI_API_KEY` | Clé du modèle de vision (estimation des repas) |
| `GEMINI_MODEL` | Facultatif — modèle de vision, défaut `gemini-3.6-flash` |

La clé Gemini se crée en deux clics sur
[Google AI Studio](https://aistudio.google.com/apikey) — un compte Google
suffit, sans projet Google Cloud.

Sans `GEMINI_API_KEY`, l'app fonctionne : les repas sont enregistrés avec leur
photo, les colonnes `ia_*` restent vides.

## Sécurité

**L'interface est ouverte : aucun mot de passe.** C'est un choix assumé de
l'auteur du projet, pris en connaissance de cause. Quiconque atteint l'URL de
déploiement lit les photos de repas et de médicaments, le sommeil, la
fréquence cardiaque et les pointages tabac — et peut écrire de nouvelles
entrées via les routes appelées par l'app. Un `robots.txt` bloque au moins
l'indexation par les moteurs de recherche, mais ce n'est pas une protection.

Pour refermer l'app, il faut restaurer le middleware supprimé dans le commit
« Retire le verrou d'accès de l'interface ».

Ce qui reste protégé :

- **Les routes d'ingestion** (`/api/ingest/*`), appelées par les Raccourcis
  iOS, vérifient `Authorization: Bearer <INGEST_TOKEN>` — comparaison à temps
  constant.
- **La base.** RLS est actif sur toutes les tables sans aucune policy : la clé
  publishable ne lit rien. Tout passe par la clé privilégiée, côté serveur
  uniquement, jamais exposée au navigateur.
- **Les photos.** Les buckets sont privés, servis par URL signées d'une heure.

## Déploiement

L'app tourne sur Vercel à **https://dailymprove.vercel.app**, reliée à la
branche `main` : chaque push y déclenche un déploiement.

Deux pièges, tous deux rencontrés en production :

- **Les variables doivent exister avant le build.** Vercel les fige au moment
  où il construit. Une variable ajoutée après coup n'atteint pas le
  déploiement en cours — il faut redéployer pour qu'elle soit prise en compte.
- **Redéployer sans le cache de build.**  `SUPABASE_URL` est
  inscrite en dur dans le bundle à la compilation ; avec le cache, elle peut
  rester à son ancienne valeur.

Une variable manquante ne passe pas inaperçue : `requireEnv` lève une erreur
qui la nomme, visible dans les logs d'exécution Vercel.

## Base de données

Le schéma est dans `supabase/migrations/0001_carnet_de_bord.sql` (tables,
index, RLS, buckets). Il est idempotent : rejouable sur un projet déjà migré.

## Routes API

| Route | Méthode | Appelée par | Corps |
|---|---|---|---|
| `/api/ingest/frequence-cardiaque` | POST | Raccourci iOS | `{ date, fc_repos, fc_moyenne, fc_max, minutes_zone_cardio }` |
| `/api/ingest/sommeil` | POST | Raccourci iOS | `{ date, heure_coucher, heure_lever, duree_minutes, score_sommeil, pourcentage_* }` |
| `/api/ingest/sport` | POST | Raccourci iOS | `{ date, heure_debut, duree_minutes, type_activite, fc_moyenne, fc_max, minutes_zone_elevee, distance_km }` |
| `/api/sport` | POST | l'app | même forme, `source = manuel` |
| `/api/repas` | POST multipart | l'app | `photo`, `moment`, `date?`, `heure?` |
| `/api/medicaments` | POST multipart | l'app | `photo`, `moment`, `date?`, `heure?` |
| `/api/tabac` | POST | l'app | `{ date, statut }` (upsert sur `date`) |
| `/api/repas/{id}/estimer` | POST | l'app | rejoue l'estimation d'un repas sans macros |

Les routes `/api/ingest/*` acceptent des rejeux : FC et sommeil sont des upserts
sur la date, et le sport déduplique sur `(date, heure_debut)`.

### Tester l'ingestion avant de brancher les Raccourcis

```bash
curl -X POST http://localhost:3000/api/ingest/frequence-cardiaque \
  -H "Authorization: Bearer $INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-09-04","fc_repos":58,"fc_moyenne":72,"fc_max":141,"minutes_zone_cardio":18}'

curl -X POST http://localhost:3000/api/ingest/sommeil \
  -H "Authorization: Bearer $INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-09-04","heure_coucher":"23:40","heure_lever":"07:05","duree_minutes":445,"score_sommeil":78,"pourcentage_profond":18,"pourcentage_leger":57,"pourcentage_paradoxal":25}'

curl -X POST http://localhost:3000/api/ingest/sport \
  -H "Authorization: Bearer $INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-09-04","heure_debut":"2026-09-04T18:12:00Z","duree_minutes":42,"type_activite":"Course","fc_moyenne":149,"fc_max":172,"distance_km":7.4}'
```

## Écrans

- **Aujourd'hui** — 4 actions rapides au même endroit (repas, sport,
  médicament, pointage), un lien discret pour rattraper un autre jour, une
  carte Capteurs, et la liste chronologique unifiée du jour.
- **Journal** — filtres en chips (filtrage en mémoire, sans rechargement),
  bande de photos récentes en défilement horizontal, puis la liste complète
  groupée par jour, un type d'entrée = un style de ligne.
- **Tendances** — FC au repos (30 j), sommeil (durée et score en **deux**
  courbes séparées, jamais un graphique à deux échelles), séances par semaine
  (8 semaines), moyennes de macros + répartition des repas par créneau,
  calendrier tabac sur 4 semaines avec légende.

Le mode sombre suit `prefers-color-scheme` partout, pas seulement sur la
coquille de l'app.

Une couche de mouvement s'ajoute par-dessus, sans toucher aux couleurs ni aux
typographies du brief : entrées de listes échelonnées, feuille modale qui monte
sur un fond flouté, courbes qui se tracent, barres qui poussent, calendrier qui
éclot case par case, retour tactile sur chaque contrôle, en-tête et barre
d'onglets en verre dépoli. Le tout s'annule sous
`prefers-reduced-motion: reduce`.

## Décisions prises en construisant

- **Modèle de vision** : API Gemini, `gemini-3.6-flash` par défaut. Modèle
  épinglé, jamais un alias `-latest` qui changerait de comportement sans
  prévenir. La photo part avec une sortie JSON structurée, que le schéma zod
  revalide avant écriture. Gemini lit le **HEIC** : les photos iPhone passent
  sans conversion.
- **Trois tentatives d'estimation** (`gemini-3.6-flash`, puis
  `gemini-3.8-flash`, puis le principal après 1,5 s). Mesuré : les modèles
  flash renvoient régulièrement un 503 « high demand » sur une requête avec
  image, parfois tous en même temps. Un repas dont l'estimation échoue perd
  définitivement ses macros — on ne peut pas rejouer l'appel plus tard — d'où
  l'insistance. Si les trois échouent, le repas est enregistré quand même,
  avec sa photo et des colonnes `ia_*` vides — et la ligne porte alors un
  bouton **Estimer** qui rejoue l'appel depuis la photo conservée.
- **Formulaire de sport manuel** : liste déroulante de types d'activité (la
  colonne reste du texte libre en base, donc rien n'empêche d'en ajouter).
- **Verrou d'accès** : mot de passe unique via middleware Next.js, plus rapide
  à mettre en place que Vercel Authentication et indépendant de l'hébergeur.

## Reste à faire

- Configurer les vrais Raccourcis iOS, une fois les routes stables en production.
- Phase 2 (couche collaborative) : hors scope, rien n'a été construit pour
  l'anticiper au-delà de la colonne `source`.

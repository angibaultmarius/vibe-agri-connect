-- Carnet de Bord — schéma initial.
--
-- Chaque table porte une colonne `source` : elle rend lisible le palier de
-- confiance de la donnée (capteur / preuve / déclaratif) sans imposer de
-- migration le jour où une pondération sera calculée.

create table if not exists frequence_cardiaque (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  fc_repos integer,
  fc_moyenne integer,
  fc_max integer,
  minutes_zone_cardio integer,
  source text default 'amazfit',
  synced_at timestamptz default now()
);

create table if not exists sommeil (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  heure_coucher time,
  heure_lever time,
  duree_minutes integer,
  score_sommeil integer,
  pourcentage_profond numeric,
  pourcentage_leger numeric,
  pourcentage_paradoxal numeric,
  source text default 'amazfit',
  synced_at timestamptz default now()
);

create table if not exists seances_sport (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  heure_debut timestamptz,
  duree_minutes integer,
  type_activite text,
  fc_moyenne integer,
  fc_max integer,
  minutes_zone_elevee integer,
  distance_km numeric,
  source text default 'amazfit', -- 'amazfit' ou 'manuel'
  synced_at timestamptz default now()
);

create table if not exists repas (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  moment text check (moment in ('petit_dejeuner','dejeuner','diner','collation')),
  heure timestamptz not null,
  photo_url text not null,
  ia_categorie text,
  ia_calories numeric,
  ia_proteines_g numeric,
  ia_lipides_g numeric,
  ia_fibres_g numeric,
  ia_confiance numeric,
  source text default 'photo',
  synced_at timestamptz default now()
);

create table if not exists medicaments (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  moment text check (moment in ('matin','midi','soir','autre')),
  heure timestamptz not null,
  photo_url text not null,
  source text default 'photo',
  synced_at timestamptz default now()
);

create table if not exists tabac (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  statut text check (statut in ('non_fume','sans_clope_travail','fume_toute_journee')),
  pointe_le timestamptz default now(),
  source text default 'declaratif'
);

-- Lectures par période, sur toutes les listes chronologiques de l'app.
create index if not exists idx_seances_sport_date on seances_sport (date desc);
create index if not exists idx_repas_date on repas (date desc);
create index if not exists idx_medicaments_date on medicaments (date desc);

-- RLS actif sans policy : la clé anon ne lit rien. L'app est mono-utilisateur
-- et n'accède aux données que côté serveur, avec la clé service_role, derrière
-- le verrou d'accès du middleware.
alter table frequence_cardiaque enable row level security;
alter table sommeil enable row level security;
alter table seances_sport enable row level security;
alter table repas enable row level security;
alter table medicaments enable row level security;
alter table tabac enable row level security;

-- Buckets privés : les photos ne sont servies que via des URL signées
-- générées côté serveur.
insert into storage.buckets (id, name, public)
values ('repas-photos', 'repas-photos', false),
       ('medicaments-photos', 'medicaments-photos', false)
on conflict (id) do nothing;

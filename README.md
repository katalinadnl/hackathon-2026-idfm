# Hackathon 2026 — IDF Mobilités

Application web & mobile destinée aux voyageurs et visiteurs d'Île-de-France Mobilités.

## Fonctionnalités

- Authentification FranceConnect + compte local
- Abonnements Navigo — souscription, gestion des bénéficiaires, facturation
- Conseiller IA — assistant capable d'effectuer des actions à la place de l'utilisateur (recherche de trajet, souscription, etc.)
- Espace specifique visiteurs / touristes avec passes, destinations et accès aéroports
- Multilingue (fr / en / es / de / ar / zh) et traduction avec l'IA
- Backoffice Directus — gestion des contenus, bénéficiaires, abonnements et paiements
- Analytics RGPD-compliant via Umami — suivi du trafic sans cookies
- Accessibilité WCAG 2.1 AA — design system IDF Mobilités et Accessibilité augmentée par l'IA — simplification de l'interface à la demande


## Architecture

| Service      | Description                                | Techno                  |
| ------------ | ------------------------------------------ | ----------------------- |
| `nginx`      | Reverse proxy local (dev uniquement)       | nginx:alpine            |
| `caddy`      | Reverse proxy + TLS auto (prod)            | Caddy 2                 |
| `app`        | Frontend                                   | Expo / React Native Web |
| `api`        | API REST + Swagger                         | NestJS + Prisma         |
| `database`   | Base de données relationnelle              | PostgreSQL 16           |
| `directus`   | CMS headless                               | Directus 11             |
| `mailhog`    | Serveur mail de test (dev uniquement)      | MailHog                 |
| `umami`      | Analytics RGPD-compliant (prod uniquement) | Umami                   |

> En mode Swarm (haute disponibilité), Caddy est remplacé par **Traefik v3** pour le load balancing multi-nœuds.

## Prérequis

- Docker + Docker Compose
- Node 20+

## Démarrage local

```bash
git clone https://github.com/katalinadnl/hackathon-2026-idfm.git
```

### 1. Variables d'environnement

```bash
cp api/.env.example api/.env
cp application/.env.example application/.env
```

Les valeurs par défaut fonctionnent en local. Modifier si besoin :
- `api/.env` — connexion DB, clés FranceConnect, SMTP, JWT secret
- `application/.env` — URL de l'API, clés IA

### 2. Lancer les services

```bash
docker compose up -d --build
```

### 3. Initialiser la base de données (premier démarrage uniquement)

```bash
docker compose exec api npx prisma generate
docker compose exec api npx prisma db push
docker compose exec api npm run prisma:sync-tariffs
docker compose exec api npm run prisma:fixture
```

### 4. Configurer Directus (premier démarrage uniquement)

```bash
node admin/seed-directus.mjs
```

Ce script crée les rôles et permissions dans Directus :

| Rôle            | Accès                                              |
| --------------- | -------------------------------------------------- |
| Administrateur  | CRUD complet sur toutes les collections            |
| Opérateur       | CRUD bénéficiaires/abonnements, lecture comptes    |
| Lecteur         | Lecture seule sur toutes les collections           |

### URLs locales

| URL                       | Cible                  |
| ------------------------- | ---------------------- |
| http://localhost/         | Application Expo (web) |
| http://localhost/api/     | API NestJS             |
| http://localhost/api/docs | Swagger UI             |
| http://localhost:8080/    | Adminer (DB)           |
| http://localhost:8025/    | MailHog (emails)       |
| http://localhost:8055/    | Directus CMS           |

## Infrastructure

### Déploiement production (Docker Context + Caddy)

```bash
make prod-env              # créer .env.prod, puis éditer avec les vraies valeurs
make context-create VPS_HOST=<IP_DU_VPS>
make deploy
```

Prérequis VPS : Docker installé, ports 80/443 ouverts, enregistrements DNS configurés.

Caddy gère automatiquement les certificats TLS via Let's Encrypt.

### Haute disponibilité — Docker Swarm + Traefik

Cluster 2 managers + 5 workers :

```bash
make swarm-init            # sur manager-1
make swarm-token-manager   # token à coller sur manager-2
make swarm-token-worker    # token à coller sur worker-1..5
make swarm-label-db        # label de stockage sur manager-1
make swarm-deploy          # déployer la stack
```

| Service    | Placement | Replicas               |
| ---------- | --------- | ---------------------- |
| `traefik`  | managers  | 1 par manager (global) |
| `api`      | workers   | 5 (1 par worker)       |
| `app`      | workers   | 5 (1 par worker)       |
| `database` | manager-1 | 1 (volume local)       |

## Comptes par défaut (dev)

### Application

Tous les comptes fixtures ont le mot de passe `Password123!`

| Email                         | Rôle        |
| ----------------------------- | ----------- |
| `pierre.moreau@email.fr`      | Titulaire   |
| `monique.moreau@email.fr`     | Titulaire   |
| `alice.martin@email.fr`       | Titulaire   |
| `bernard.dupont@email.fr`     | Titulaire   |

### Directus CMS (`http://localhost:8055`)

| Champ    | Valeur         |
| -------- | -------------- |
| Email    | `admin@idfm.fr` |
| Mot de passe | `Admin123!` |

### Adminer (`http://localhost:8080`)

| Champ    | Valeur        |
| -------- | ------------- |
| Serveur  | `database`    |
| Utilisateur | `app`      |
| Mot de passe | `!ChangeMe!` |
| Base     | `app`         |

## Variables d'environnement

| Fichier            | Usage                                       |
| ------------------ | ------------------------------------------- |
| `api/.env`         | Dev local — voir `api/.env.example`         |
| `application/.env` | Dev local — voir `application/.env.example` |
| `.env.prod`        | Production — voir `.env.prod.example`       |
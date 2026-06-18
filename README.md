# Hackathon 2026 — IDFM

## Architecture

| Service    | Description                                      | Techno                  |
| ---------- | ------------------------------------------------ | ----------------------- |
| `traefik`  | Reverse proxy, TLS automatique via Let's Encrypt | Traefik v3              |
| `app`      | Frontend statique Expo/web servi par nginx       | Expo / React Native Web |
| `api`      | API REST                                         | NestJS                  |
| `database` | Base de données relationnelle                    | PostgreSQL 16           |
| `directus` | CMS headless                                     | Directus 11             |
| `umami`    | Analytics RGPD-compliant (prod uniquement)       | Umami                   |

## Prérequis

- Docker + Docker Compose
- Node 20+

## Démarrage local

```bash
# 1. Variables d'environnement
cp api/.env.example api/.env
cp application/.env.example application/.env

# 2. Générer le client Prisma et appliquer le schéma

docker compose exec api npx prisma generate && docker compose exec api npx prisma db push && docker compose exec api npm run prisma:sync-tariffs && docker compose exec api npm run prisma:fixture

 # 3. Lancer
docker compose up --build
```

| URL                       | Cible                  |
| ------------------------- | ---------------------- |
| http://localhost/         | Application Expo (web) |
| http://localhost/api/     | API NestJS             |
| http://localhost/api/docs | Swagger UI             |
| http://localhost:8080/    | Adminer (DB)           |

```bash
docker compose down
```

## Déploiement en production

### Prérequis VPS

- Docker installé (`curl -fsSL https://get.docker.com | sh`)
- Ports 80 et 443 ouverts
- Enregistrements DNS pointant vers l'IP du VPS :
  - `app.vetpawtrol.com`
  - `api.vetpawtrol.com`
  - `stats.vetpawtrol.com`
  - `traefik.vetpawtrol.com`

### Déploiement via Docker Context

```bash
# 1. Créer le fichier d'environnement de prod
make prod-env   # puis éditer .env.prod avec les vraies valeurs

# 2. Créer le contexte Docker pointant vers le VPS
make context-create VPS_HOST=<IP_DU_VPS>

# 3. Déployer
make deploy
```

### URLs de production

| URL                            | Cible             |
| ------------------------------ | ----------------- |
| https://app.vetpawtrol.com     | Frontend          |
| https://api.vetpawtrol.com     | API               |
| https://stats.vetpawtrol.com   | Umami analytics   |
| https://traefik.vetpawtrol.com | Dashboard Traefik |

## Haute disponibilité — Docker Swarm

Configuration d'un cluster 2 managers + 5 workers pour la haute disponibilité.

```bash
# Sur manager-1 : initialiser le Swarm
make swarm-init

# Récupérer les tokens et les coller sur les autres noeuds
make swarm-token-manager   # → coller sur manager-2
make swarm-token-worker    # → coller sur worker-1..5

# Poser le label de stockage sur manager-1 (nécessaire pour la DB)
make swarm-label-db

# Déployer la stack
make swarm-deploy

# Vérifier l'état du cluster
make swarm-nodes
make swarm-status
make swarm-ps
```

Topologie des services :

| Service    | Placement | Replicas               |
| ---------- | --------- | ---------------------- |
| `traefik`  | managers  | 1 par manager (global) |
| `api`      | workers   | 5 (1 par worker)       |
| `app`      | workers   | 5 (1 par worker)       |
| `database` | manager-1 | 1 (volume local)       |

## Variables d'environnement

| Fichier            | Usage                                       |
| ------------------ | ------------------------------------------- |
| `api/.env`         | Dev local — voir `api/.env.example`         |
| `application/.env` | Dev local — voir `application/.env.example` |
| `.env.prod`        | Production — voir `.env.prod.example`       |

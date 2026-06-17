# Hackathon 2026 — IDFM

## Architecture

| Service | Description                                                  | Techno                  |
| ------- | ------------------------------------------------------------ | ----------------------- |
| `nginx` | Gateway / reverse-proxy, seul port exposé (`80`)             | nginx alpine            |
| `app`   | Application front, build web statique d'Expo servi par nginx | Expo / React Native Web |
| `api`   | API back-end                                                 | Nest Js                 |

## Initialisation

Copy `api/.env.exemple` to `api/.env` in backend
Copy `application/.env` to `application/.env` in frontend

```bash
cd application
npm i
cd ..
cd api
npm i
npx prisma generate
npx prisma migrate dev
npm run seed
cd ..
```

## Démarrage

```bash
docker compose up --build
```

Une fois les conteneurs démarrés :

| URL                     | Cible                  |
| ----------------------- | ---------------------- |
| <http://localhost/>     | Application Expo (web) |
| <http://localhost/api/> | API Nest               |

Pour arrêter :

```bash
docker compose down
```

## Routing de l'API

La gateway transmet les requêtes commençant par `/api` à l'api **en conservant
le préfixe** (nécessaire pour Swagger, qui génère ses routes et sa doc à
partir de ce chemin). Les assets statiques des UIs de doc sont servis depuis
`/bundles/`.

### Documentation API (API Platform)

Disponible une fois les conteneurs lancés :

| Type                  | URL                         |
| --------------------- | --------------------------- |
| Doc HTML (Swagger UI) | <http://localhost/api/docs> |

## Variables d'environnement

L'API charge ses variables depuis `api/.env` (voir `api/.env.example` pour un exemple).
L'app charge ses variables depuis `applicatiion/.env` (voir `application/.env.example` pour un exemple).

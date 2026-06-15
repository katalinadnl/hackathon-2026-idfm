# Hackathon 2026 — IDFM

## Architecture

| Service | Description | Techno |
|---------|-------------|--------|
| `nginx` | Gateway / reverse-proxy, seul port exposé (`8080`) | nginx alpine |
| `app`   | Application front, build web statique d'Expo servi par nginx | Expo / React Native Web |
| `php`   | API back-end | Symfony 8.1 · PHP 8.4-FPM |

## Démarrage

```bash
docker compose up --build

docker compose exec php composer install
docker compose exec php bin/console doctrine:migrations:migrate

docker compose exec app npm install
```

Une fois les conteneurs démarrés :

| URL | Cible |
|-----|-------|
| <http://localhost:8080/> | Application Expo (web) |
| <http://localhost:8080/api/> | API Symfony |

Pour arrêter :

```bash
docker compose down
```

## Routing de l'API

La gateway transmet les requêtes commençant par `/api` à Symfony **en conservant
le préfixe** (nécessaire pour API Platform, qui génère ses routes et sa doc à
partir de ce chemin). Les assets statiques des UIs de doc sont servis depuis
`/bundles/`.

### Documentation API (API Platform)

Disponible une fois les conteneurs lancés :

| Type | URL |
|------|-----|
| Doc HTML (Swagger UI) | <http://localhost:8080/api/docs> |


  ```bash
  cd application
  npm install
  npm run web
  ```

## Variables d'environnement

L'API charge ses variables depuis `api/.env` (voir `api/.env.dev` pour un exemple).

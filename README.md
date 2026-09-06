# CRM Backend — API REST NestJS

![NestJS](https://img.shields.io/badge/NestJS-11-e0234e?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-29-c21325?logo=jest&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

API REST pour la gestion de la relation client (CRM) — authentification JWT, RBAC, lead scoring, notifications, export CSV et recherche globale.

## Stack technique

| Domaine | Technologie |
|---------|-------------|
| Framework | NestJS 11 |
| Langage | TypeScript 5 |
| Auth | JWT (@nestjs/jwt) + bcryptjs |
| Validation | class-validator + class-transformer |
| Tests | Jest 29 + ts-jest |
| Linter | ESLint |

## Architecture

```
src/
├── common/             # Code partagé
│   ├── domain/         # Erreurs métier (DomainError, NotFound, Conflict...)
│   ├── dto/            # DTOs génériques (Pagination)
│   ├── guards/         # Guards JWT + Rôles
│   ├── decorators/     # @CurrentUser, @Roles
│   ├── filters/        # Exception filter (DomainError → HTTP)
│   ├── rbac/           # Access control (ownership, admin bypass)
│   ├── services/       # ActivityLogger
│   └── utils/          # repo-utils (search, paginate, sort, CSV)
├── infrastructure/     # Coucle infrastructure
│   ├── mock/           # Base de données + seed
│   └── security/       # Password hasher, Token service
├── modules/            # Modules métier
│   ├── auth/           # Login, profile, logout
│   ├── users/          # CRUD utilisateurs (admin)
│   ├── customers/      # CRUD clients + export CSV
│   ├── leads/          # CRUD prospects + conversion + scoring
│   ├── deals/          # CRUD affaires + export CSV
│   ├── tasks/          # CRUD tâches + toggle
│   ├── activities/     # Timeline d'activités
│   ├── notes/          # Notes polymorphiques
│   ├── dashboard/      # Analytics (stats, evolution, pipeline)
│   ├── search/         # Recherche globale multi-entités
│   └── notifications/  # Notifications in-app
└── main.ts             # Bootstrap (CORS, validation pipe, exception filter)
```

## Prérequis

- Node.js 20+
- npm 10+

## Installation

```bash
cd CRM_backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# JWT_SECRET=your-secret-key
# JWT_EXPIRES_IN=24h
# PORT=4000
# CORS_ORIGIN=http://localhost:5173

# Démarrer le serveur
npm run dev
```

L'API est accessible sur `http://localhost:4000/api`.

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement (watch) |
| `npm run build` | Build production |
| `npm run start:prod` | Démarrage production |
| `npm test` | Tests unitaires (149 tests) |
| `npm run test:watch` | Tests en watch mode |
| `npm run lint` | ESLint |

## Documentation API

### Authentification

Toutes les routes (sauf `/auth/login`) requièrent un header `Authorization: Bearer <token>`.

| Méthode | Endpoint | Auth | Rôle | Description |
|---------|----------|------|------|-------------|
| POST | `/api/auth/login` | - | - | Connexion, retourne JWT + user |
| GET | `/api/auth/profile` | JWT | - | Profil de l'utilisateur connecté |
| POST | `/api/auth/logout` | JWT | - | Déconnexion |

### Utilisateurs

| Méthode | Endpoint | Auth | Rôle | Description |
|---------|----------|------|------|-------------|
| GET | `/api/users` | JWT | ADMIN | Liste paginée |
| GET | `/api/users/:id` | JWT | ADMIN | Détail utilisateur |
| POST | `/api/users` | JWT | ADMIN | Création |
| PATCH | `/api/users/:id` | JWT | ADMIN | Modification |
| DELETE | `/api/users/:id` | JWT | ADMIN | Suppression (auto-suppression interdite) |

### Clients

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/customers` | JWT | Liste paginée + filtres |
| GET | `/api/customers/export` | JWT | Export CSV |
| GET | `/api/customers/:id` | JWT | Détail |
| POST | `/api/customers` | JWT | Création |
| PATCH | `/api/customers/:id` | JWT | Modification |
| DELETE | `/api/customers/:id` | JWT | Suppression |

**Query params (GET /customers)** : `page`, `limit`, `search`, `ownerId`, `tag`, `sortBy`, `sortOrder`, `dateFrom`, `dateTo`

### Prospects

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/leads` | JWT | Liste paginée + filtres + score |
| GET | `/api/leads/export` | JWT | Export CSV |
| GET | `/api/leads/:id` | JWT | Détail + score |
| POST | `/api/leads` | JWT | Création |
| POST | `/api/leads/:id/convert` | JWT | Conversion en client |
| PATCH | `/api/leads/:id` | JWT | Modification |
| DELETE | `/api/leads/:id` | JWT | Suppression |

**Query params (GET /leads)** : `page`, `limit`, `search`, `status`, `source`, `ownerId`, `tag`, `sortBy` (dont `score`), `sortOrder`, `dateFrom`, `dateTo`

### Affaires

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/deals` | JWT | Liste paginée + filtres |
| GET | `/api/deals/export` | JWT | Export CSV |
| GET | `/api/deals/:id` | JWT | Détail |
| POST | `/api/deals` | JWT | Création (vérifie client) |
| PATCH | `/api/deals/:id` | JWT | Modification + log changement d'étape |
| DELETE | `/api/deals/:id` | JWT | Suppression |

**Query params (GET /deals)** : `page`, `limit`, `search`, `stage`, `ownerId`, `sortBy`, `sortOrder`, `dateFrom`, `dateTo`

### Tâches

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/tasks` | JWT | Liste paginée + filtres |
| GET | `/api/tasks/:id` | JWT | Détail |
| POST | `/api/tasks` | JWT | Création |
| POST | `/api/tasks/:id/toggle` | JWT | Toggle OPEN ↔ DONE |
| PATCH | `/api/tasks/:id` | JWT | Modification |
| DELETE | `/api/tasks/:id` | JWT | Suppression |

**Query params** : `page`, `limit`, `search`, `status`, `priority`, `relatedType`, `relatedId`, `dueTo`, `ownerId`

### Activités

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/activities` | JWT | Liste paginée |
| POST | `/api/activities` | JWT | Création (vérifie entité liée) |
| DELETE | `/api/activities/:id` | JWT | Suppression |

### Notes

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/notes` | JWT | Liste paginée |
| POST | `/api/notes` | JWT | Création |
| PATCH | `/api/notes/:id` | JWT | Modification (auteur ou admin) |
| DELETE | `/api/notes/:id` | JWT | Suppression (auteur ou admin) |

### Dashboard

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/dashboard/stats` | JWT | Compteurs globaux |
| GET | `/api/dashboard/evolution` | JWT | Évolution 12 mois + répartitions |
| GET | `/api/dashboard/pipeline` | JWT | Pipeline (CA gagné, prévision, étapes) |

### Recherche globale

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/search?q=` | JWT | Recherche across clients, prospects, deals, tâches |

### Notifications

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/notifications` | JWT | Liste triée par sévérité |
| GET | `/api/notifications/count` | JWT | Compteur |

### Système

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/health` | - | Health check |
| POST | `/api/reset` | - | Réinitialisation des données |

## Sécurité

- **JWT** : tokens signés avec expiration configurable
- **bcrypt** : hashage des mots de passe (10 rounds)
- **RBAC** : 2 rôles (ADMIN, COMMERCIAL)
  - ADMIN : accès global à toutes les ressources
  - COMMERCIAL : accès restreint à ses propres ressources (ownerId)
- **Ownership enforcement** : chaque service vérifie que la ressource appartient à l'utilisateur
- **Validation** : class-validator sur tous les DTOs (whitelist, transform)

## Lead Scoring

Le score (0-100) est calculé à la volée à partir de :
- **Source** du prospect (Recommandation: 25, Salon: 20, Appel: 18, Site: 12, Réseaux: 8)
- **Statut** (NEW: 5 → NEGOTIATING: 45 → CONVERTED: 50)
- **Nombre d'activités** liées (jusqu'à 20 pts)
- **Ancienneté** (< 7j: +10, < 30j: +5, > 90j: -10)
- **Coordonnées** (email: +3, téléphone: +2)
- **Tags** (Hot: +15, Stratégique: +10)

## Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `JWT_SECRET` | `crm-dev-secret-change-me` | Secret JWT |
| `JWT_EXPIRES_IN` | `24h` | Durée de validité du token |
| `PORT` | `4000` | Port d'écoute |
| `CORS_ORIGIN` | `*` | Origine CORS autorisée |

## Tests

```bash
# Lancer tous les tests
npm test

# Coverage
npx jest --coverage
```

**Coverage actuelle** : 149 tests, 13 suites, couvrant :
- `common/rbac` — toutes les fonctions RBAC
- `common/utils/repo-utils` — search, paginate, sort, filtres
- `common/domain/domain-error` — hiérarchie d'erreurs
- `modules/customers` — CRUD + filtres + tags + ownership
- `modules/leads` — CRUD + conversion + scoring
- `modules/deals` — CRUD + changement d'étape
- `modules/tasks` — CRUD + toggle
- `modules/auth` — login, credentials, disabled
- `modules/users` — CRUD + email unique + self-delete
- `modules/dashboard` — stats, evolution, pipeline
- `modules/search` — recherche multi-entités
- `modules/notifications` — notifications + severity
- `common/guards/jwt-auth.guard` — token validation

## Licence

MIT
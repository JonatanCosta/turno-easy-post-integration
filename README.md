# Turno Easy Post Integration

Laravel 13 API with a React (Vite + Tailwind v4) SPA, PostgreSQL, Docker (PHP-FPM + Nginx), JWT authentication, SaaS-style plans with monthly label limits, and EasyPost as the first shipping-label integration behind a pluggable contract.

**EasyPost** is called **only from Laravel**; the SPA talks to the API, not to EasyPost. Local development uses **PostgreSQL** and **Redis** in Docker.

---

## Requirements

To run the stack as documented here, you need:

| Requirement | Notes |
| ----------- | ----- |
| **Git** | Clone the repository. |
| **Docker Engine** + **Docker Compose v2** | Builds PHP 8.4-FPM, Nginx, PostgreSQL 16, and Redis 7. |
| **GNU Make** (optional but recommended) | Wraps common `docker compose` and `npm` commands (`Makefile`). |
| **NVM** (or another Node version manager) + **Node.js** | Match [`.nvmrc`](.nvmrc) (currently **Node 22**) for Vite, Vitest, and npm scripts on the host. |
| **Bash** | Used by some Makefile targets (e.g. `first-install`, `in-pick`). |

You do **not** need PHP, Composer, or Postgres installed on the host for the default flow: Composer runs **inside** the `app` container after `make build` / `make up`.

**Disk / RAM (practical minimums):** a few GB free for images and Postgres volume; **4 GB+ RAM** for Docker is comfortable when building and running all services.

After cloning, install and select the Node version:

```bash
nvm install
nvm use
```

(`nvm install` with no version reads `.nvmrc`.)

In **non-interactive shells** (e.g. CI or scripts), NVM is not loaded by default. Source it, then select the project version:

```bash
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd <repository-root>
nvm use
npm ci
```

---

## Quick start (including database setup)

### Local setup (`make first-install`)

From the repository root, with **NVM** loaded and the project Node version active (`nvm use` — see [Requirements](#requirements)):

```bash
make first-install
```

This target: copies **`.env`** from `.env.example` if `.env` is missing; on the host (with NVM) runs **`npm install`** and **`npm run build`**; then **`docker compose build`**, **`docker compose up -d`**, **`composer install`** inside `app`, **`php artisan key:generate`**, **`php artisan jwt:secret --force`** (writes **`JWT_SECRET`** to `.env`), and **`php artisan migrate --seed`** (database schema + seed data).

Open **`http://localhost:8080`** (or your `HTTP_PORT`). In the app, use **Integrations** to save your [EasyPost](https://www.easypost.com/) **test** API key before purchasing labels (test keys avoid charges).

---

### Manual setup (step by step)

If you prefer not to use `first-install`:

1. **Environment**

   ```bash
   cp .env.example .env
   ```

   Defaults in `.env.example` match `docker-compose.yml` (`DB_HOST=postgres`, `DB_*`, Redis, queue). Adjust `HTTP_PORT` / `DB_PORT_EXTERNAL` if ports conflict on your machine.

2. **Laravel and JWT secrets** (run from the repo root; uses the `app` image):

   ```bash
   docker compose run --rm app php artisan key:generate
   docker compose run --rm app php artisan jwt:secret --force
   ```

3. **Build and start** PostgreSQL, Redis, PHP-FPM, and Nginx:

   ```bash
   make build
   make up
   ```

   Wait until Postgres and Redis healthchecks pass (Compose `depends_on` waits for the `app` service).

4. **Frontend dependencies and production build** (needed for the Blade shell that loads Vite):

   ```bash
   make npm-install
   npm run build
   ```

5. **Database: migrations and seeders** (creates schema, plans, shipping label statuses):

   ```bash
   make migrate
   make seed
   ```

6. **Open the app** at `http://localhost:8080` (or the port in `HTTP_PORT`).

7. **EasyPost:** save your API key under **Integrations** in the UI (it is stored per user). Use a [EasyPost](https://www.easypost.com/) **test** key while developing (no carrier charges; production labels cost money).

### Database (Docker vs GUI clients)

- **PHP inside Docker** must reach Postgres on the Compose network: keep **`DB_HOST=postgres`** unless the DB runs on the host — then use **`DB_HOST=host.docker.internal`** (macOS/Windows) with matching `DB_PORT`. Inside a container, `localhost` is the container itself, not your laptop.
- **TablePlus / DBeaver on the host** typically use **`127.0.0.1`** and **`DB_PORT_EXTERNAL`** (default `5432`) via the published port.
- `docker-compose.yml` injects `DB_*` from **`.env`** into `app`. After changing DB variables, run **`docker compose up -d`** again.
- **`Nothing to migrate`** usually means Laravel already applied every migration — verify with `SELECT * FROM migrations` on the **same** database you expect.
- **Redis:** used for **queues** (`QUEUE_CONNECTION=redis`), **cache**, and **sessions** (`CACHE_STORE=redis`, `SESSION_DRIVER=redis`). Inside Docker, **`REDIS_HOST=redis`**. The `app` container runs **`laravel-worker`** under Supervisor next to PHP-FPM, so jobs are processed after `make up` without extra manual worker terminals.

### EasyPost checklist (docs)

- **Authentication:** each request uses the API key (official PHP client); use **HTTPS / TLS 1.2+**; treat the key like a password ([Authentication](https://docs.easypost.com/docs/authentication)).
- **Dashboard:** production accounts may need a **wallet** and **default ship-from** before some operations match the dashboard.
- **Addresses:** labels use `from_address` / `to_address`; see [Address](https://docs.easypost.com/docs/addresses). Optional **`EASYPOST_VERIFY_ADDRESSES=true`** verifies full address payloads. The app exposes **`GET/POST /api/integrations/shipping/easypost/addresses`** (authenticated) using the user’s stored API key.
- **Rate limits:** **`429` / 5xx** may need backoff; see [rate limiting](https://docs.easypost.com/guides/rate-limiting-guide). The API may create a shipment quote then purchase a rate in a second call.

---

## Technical decisions (interview notes)

### Repository + service layer (not full clean / hexagonal architecture)

The codebase uses **repositories** and **services** for users, plans, and shipping labels. For an **MVP-sized** codebase, that is enough structure to keep persistence and integration details out of controllers without adopting a heavy **clean architecture** or **hexagonal** layout (many ports/adapters, bounded contexts, etc.), which would add ceremony without clear payoff at this scale.

If the product **grows**, I would evolve toward **feature or domain modules** (vertical slices), stricter boundaries between billing, shipping, and identity, and only then consider patterns like ports-and-adapters where they reduce coupling rather than increase file count.

### PostgreSQL instead of MySQL or a non-relational store

**PostgreSQL** was chosen for **relational data** (users, plans, label history, quotas) with strong **ACID** guarantees, **rich indexing** (including partial and expression indexes when needed), and **solid JSON support** if we later store flexible carrier metadata without abandoning SQL. For workloads mixing transactional reporting and analytical queries, Postgres tends to offer **predictable performance** and mature tooling compared to bolting document semantics onto a traditional RDBMS or jumping to a document DB before access patterns are proven.

MySQL remains a fine choice for many apps; here Postgres aligns with the brief and with Docker defaults already wired in the repo.

### Redis for sessions and cache

**Redis** backs **sessions** and **application cache** so multiple app instances (horizontal scaling) can share state without sticky sessions only on the load balancer. It is also the **queue driver**, which fits the same infrastructure and keeps background work off the request path. Redis is fast, well supported by Laravel, and a single small instance is enough for development and early production.

---

## Assumptions and what I’d do next

**Assumptions (MVP):** mock billing and plan limits are enforced in-app; EasyPost keys are per-user configuration; the official **`easypost/easypost-php`** package is acceptable for speed of delivery even though it is **not always the freshest** client.

**Next steps I would prioritize:**

1. **Login hardening:** add **reCAPTCHA** (or similar) on sign-in / registration to reduce automated abuse.
2. **Authorization:** introduce **ACL levels** (roles/permissions) beyond “authenticated user,” especially if admins or support staff access the same API.
3. **EasyPost API resilience:** **richer exception handling** — map carrier/EasyPost errors to stable API error codes, structured logging, retries with backoff for **429/5xx**, and possibly circuit breaking for degraded providers.
4. **EasyPost client strategy:** for the MVP the official PHP package is fine; longer term I would **wrap or replace** it with a **thin in-house client** (or an internal package) versioned with the app so upgrades, timeouts, and observability hooks stay under our control.
5. **Real billing:** charge for platform plans with a **payment provider** (e.g. Stripe), **recurring billing**, webhooks for subscription state, and alignment between “plan” in DB and what was paid for.
6. **CI/CD:** define pipelines (lint, tests, build images, deploy). Early stage: a **Kubernetes** cluster on **EC2** (or EKS) for the API/workers, with **CloudFront** in front of static **frontend** assets for global edge caching and TLS.
7. **Observability:** export **metrics**, **distributed traces**, and **logs** to an **APM**; aggregate logs in **Elasticsearch/OpenSearch + Kibana** (or a managed equivalent), with **alerts** on error rates, latency, and queue depth.
8. **Pipeline quality:** run **backend and frontend tests in parallel** in CI, cache dependencies, and keep **Git history** and branching discipline healthy (squash/merge strategies, smaller PRs) so the repo does not become a bottleneck as the team grows.
9. **UX:** improve the **shipping label form** (address autocomplete, validation hints, saved addresses) so users fill addresses faster and with fewer EasyPost validation errors.

**Additional (security hardening):**

1. **Plan limit race (TOCTOU):** close the gap between “check monthly count” and “create/purchase label” (e.g. **transaction + row lock** on the user or plan row, or an **atomic counter**) so concurrent requests cannot exceed the plan’s monthly label cap.
2. **API rate limiting:** add Laravel **`throttle`** (or equivalent) on **login/register** and **label quote/purchase** routes to limit brute force, abuse, and accidental or malicious **EasyPost cost** spikes.
3. **Token storage / XSS surface:** today the SPA keeps the JWT in **`localStorage`**; longer term prefer **HttpOnly** cookies (with **CSRF** protection for same-site requests) and a tight **Content-Security-Policy**, since any XSS can steal a bearer token and act as the user.

---

## Makefile targets

| Target | Description |
| ------ | ----------- |
| `make up` | Start containers in the background |
| `make down` | Stop containers |
| `make build` | Build Docker images |
| `make shell` | Shell into the `app` container |
| `make in s=app` | Shell into any compose service (`app`, `postgres`, `nginx`, `redis`) |
| `make in-pick` | Interactive menu then shell into the chosen service |
| `make services` | List compose service names |
| `make migrate` | Run `php artisan migrate` |
| `make fresh` | Run `php artisan migrate:fresh` |
| `make seed` | Run `php artisan db:seed` |
| `make test` | Run PHPUnit (`php artisan test`) in `app` |
| `make test-unit` | Run PHPUnit Unit suite |
| `make test-frontend` | Run Vitest on the host (`npm run test`) |
| `make npm-install` | `npm ci` on the host (requires `nvm use`) |
| `make npm-build` | `npm run build` on the host (Vite production assets) |
| `make npm-dev` | Vite dev server on the host (proxies `/api` to port 8080) |
| `make pint` | Laravel Pint |
| `make supervisor-status` | Supervisor status (`php-fpm` + `laravel-worker`) in `app` |
| `make first-install` | First-time bootstrap (see Quick start): includes **`jwt:secret`** and **`npm run build`**. |

The **`app`** image runs **Supervisord** as PID 1: **`php-fpm`** and **`laravel-worker`** (`php artisan queue:work redis`). PHPUnit uses **`QUEUE_CONNECTION=sync`**, so the worker stays idle during tests.

---

## Vite dev server

From the host, after `make up`:

```bash
make npm-dev
```

Vite proxies `/api` to `http://127.0.0.1:8080`. **Open the Laravel app at `http://localhost:8080`** so the Blade layout loads React; opening only `http://localhost:5173` will not serve that layout.

The Blade layout includes **`@viteReactRefresh`** before **`@vite(...)`** per [Laravel 13 Vite + React](https://laravel.com/docs/13.x/vite#react). Tailwind v4 follows the [Tailwind + Laravel + Vite](https://tailwindcss.com/docs/installation/framework-guides/laravel/vite) guide.

---

## Tests

**Backend (PHPUnit):**

```bash
make test
```

**Frontend (Vitest + Testing Library):**

```bash
make test-frontend
```

PHPUnit uses an in-memory SQLite database and a fake shipping integration (no live EasyPost). For routes that render the Vite shell, run `npm run build` first so `public/build/manifest.json` exists.

---

## Architecture snapshot

- **JWT** (`php-open-source-saver/jwt-auth`) for API authentication.
- **Repository + service** layers for users, plans, and shipping labels (see [Technical decisions](#technical-decisions-interview-notes)).
- **Integration contract** `ShippingLabelIntegrationInterface` with an EasyPost implementation; additional carriers can be registered in `AppServiceProvider`.
- **Plans** (mock billing): `free` (10 labels/month), `pro` (100), `unlimited` (no cap). Limits enforced in `PlanLimitService` using monthly counts.

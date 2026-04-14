COMPOSE := docker compose
APP := $(COMPOSE) exec -T app

.PHONY: up down build shell in in-pick services migrate fresh seed test test-unit test-frontend npm-install npm-build npm-dev pint supervisor-status first-install

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

build:
	$(COMPOSE) build --no-cache

shell:
	$(COMPOSE) exec app sh

# Non-interactive shell in any compose service, e.g. make in s=postgres
in:
	@test -n "$(s)" || (echo 'Usage: make in s=<service>   example: make in s=app   |   List: make services' && exit 1)
	$(COMPOSE) exec $(s) sh

# Interactive menu (requires bash) — pick a container and open a shell
in-pick:
	@bash -c '\
		set -e; \
		services=$$($(COMPOSE) config --services 2>/dev/null | sort -u); \
		if [ -z "$$services" ]; then echo "No compose services found. Run make from the repository root."; exit 1; fi; \
		PS3="Service number: "; \
		select svc in $$services; do \
			if [ -n "$$svc" ]; then $(COMPOSE) exec "$$svc" sh; break; fi; \
		done'

services:
	@$(COMPOSE) config --services | sort -u

migrate:
	$(APP) php artisan migrate --force

fresh:
	$(APP) php artisan migrate:fresh --force

seed:
	$(APP) php artisan db:seed --force

test:
	$(APP) php artisan test

test-unit:
	$(APP) php artisan test --testsuite=Unit

test-frontend:
	npm run test

npm-install:
	npm ci

npm-build:
	npm run build

npm-dev:
	npm run dev

pint:
	$(APP) ./vendor/bin/pint

supervisor-status:
	$(COMPOSE) exec app supervisorctl -c /etc/supervisord.conf status

first-install:
	@if [ ! -f .env ]; then cp .env.example .env && echo "Created .env from .env.example"; else echo ".env already exists; skipping copy"; fi
	@bash -lc 'set -e; cd "$(CURDIR)"; export NVM_DIR="$${NVM_DIR:-$$HOME/.nvm}"; [ -s "$$NVM_DIR/nvm.sh" ] || { echo "nvm not found at $$NVM_DIR/nvm.sh"; exit 1; }; . "$$NVM_DIR/nvm.sh"; nvm use && npm install && npm run build'
	$(COMPOSE) build
	$(COMPOSE) up -d
	$(APP) composer install --no-interaction --prefer-dist
	$(APP) php artisan key:generate --force
	$(APP) php artisan jwt:secret --force
	$(APP) php artisan migrate --force --seed
	@echo "first-install finished. App URL (default): http://localhost:8080"

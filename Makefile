VPS_USER ?= root
VPS_HOST ?= $(shell grep -oP '(?<=VPS_HOST=).*' .env.prod 2>/dev/null || echo "IP_DU_VPS")
CONTEXT  := idfm-vps
COMPOSE  := docker compose -f compose.yaml -f compose.prod.yaml

# dev local
.PHONY: up down logs

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

# déploiement distant via Docker Context (SSH vers le VPS)
.PHONY: context-create context-remove deploy deploy-down

context-create:
	docker context create $(CONTEXT) --docker "host=ssh://$(VPS_USER)@$(VPS_HOST)"
	docker context use $(CONTEXT)

context-remove:
	docker context use default
	docker context rm $(CONTEXT)

deploy:
	docker --context $(CONTEXT) $(COMPOSE) --env-file .env.prod up -d --build

deploy-down:
	docker --context $(CONTEXT) $(COMPOSE) down

# swarm — cluster 2 managers + 5 workers
# ordre : swarm-init → swarm-token-manager (sur manager-2) → swarm-token-worker (sur workers) → swarm-label-db → swarm-deploy
.PHONY: swarm-init swarm-token-manager swarm-token-worker swarm-label-db \
        swarm-nodes swarm-deploy swarm-status swarm-ps swarm-down

swarm-init:
	docker --context $(CONTEXT) swarm init

swarm-token-manager:
	docker --context $(CONTEXT) swarm join-token manager

swarm-token-worker:
	docker --context $(CONTEXT) swarm join-token worker

# pose le label sur manager-1 pour que la DB soit toujours sur le même noeud
swarm-label-db:
	docker --context $(CONTEXT) node update --label-add storage=primary \
		$(shell docker --context $(CONTEXT) node ls --filter role=manager -q | head -1)

swarm-nodes:
	docker --context $(CONTEXT) node ls

swarm-deploy:
	docker --context $(CONTEXT) stack deploy -c compose.swarm.yml --env-file .env.prod idfm

swarm-status:
	docker --context $(CONTEXT) stack services idfm

swarm-ps:
	docker --context $(CONTEXT) stack ps idfm

swarm-down:
	docker --context $(CONTEXT) stack rm idfm

# utilitaires
.PHONY: prod-env ps

prod-env:
	cp .env.prod.example .env.prod
	@echo "Pense à remplir .env.prod avant de déployer."

ps:
	docker --context $(CONTEXT) compose ps
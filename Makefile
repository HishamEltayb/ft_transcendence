all-log:
	docker compose up --build

all: up build

up:
	docker compose up -d

build:
	docker compose build

down:
	-@docker compose down

clean: 
	-@docker compose down -v

fclean:
	-@yes | docker system prune -a
	-@yes | docker image prune -a
	-@yes | docker volume prune
	-@yes | docker network prune
	-@yes | docker container prune

logs:
	docker compose logs -f

attach-backend:
	docker exec -it backend /bin/sh

attach-blockchain:
	docker exec -it blockchain /bin/bash

attach-frontend:
	docker exec -it frontend /bin/sh

attach-database:
	docker exec -it postgres /bin/sh

attach-nginx:
	docker exec -it nginx /bin/sh

re: down all-log

.PHONY: all down clean fclean logs re all-log attach-backend attach-frontend attach-database attach-nginx up build

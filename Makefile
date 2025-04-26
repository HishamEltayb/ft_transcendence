all-log:
	docker compose up -d --build

all: up build

up:
	docker compose up -d

build:
	docker compose build

down:
	-@docker compose down -v

clean:
	-@docker rm -f $$(docker container ls -aq)
	-@docker rmi -f $$(docker images -q)
	-@docker network rm transcendence
	-@docker volume rm -f $$(docker volume ls -q)

fclean: clean
	-@yes | docker system prune -a
	-@yes | docker image prune -a
	-@yes | docker volume prune
	-@yes | docker network prune
	-@yes | docker container prune

logs:
	docker compose logs -f

attach-backend:
	docker exec -it backend /bin/sh

attach-frontend:
	docker exec -it frontend /bin/sh

attach-database:
	docker exec -it postgres /bin/sh

attach-nginx:
	docker exec -it nginx /bin/sh

re: clean all-log

.PHONY: all down clean fclean logs re all-log attach-backend attach-frontend attach-database attach-nginx up build

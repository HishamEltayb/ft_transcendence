
all:
	docker compose up --build
	

down:
	docker compose down -v

up:
	docker compose up -d

build:
	docker compose build

clean-images:
	docker image rm -f backend

clean-volumes:
	docker volume rm -f backend

clean-all:
	docker compose down -v
	docker image rm -f backend
	docker volume rm -f backend

fclean: down
	yes | docker system prune -a
	yes | docker image prune -a
	yes | docker volume prune
	yes | docker network prune
	yes | docker container prune


logs:
	docker compose logs -f

re: clean-all all



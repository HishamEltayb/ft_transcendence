
all:
	docker compose up --build

down:
	docker compose down

clean:
	-@docker compose down
	-@docker rmi -f $(docker images -q)
	-@docker volume rm -f $(docker volume ls -q)
	-@docker network rm -f $(docker network ls -q)
	-@docker container rm -f $(docker container ls -q)

fclean: down
	yes | docker system prune -a
	yes | docker image prune -a
	yes | docker volume prune
	yes | docker network prune
	yes | docker container prune

logs:
	docker compose logs -f

re: clean all


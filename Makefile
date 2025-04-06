
all:
	docker compose up --build

down:
	-@docker compose down -v

clean:
	-@docker rm -f $$(docker container ls -aq)
	-@docker rmi -f $$(docker images -q)
	-@docker network rm transcendence
	-@docker volume rm -f $$(docker volume ls -q)

clean-re: down clean

fclean: clean
	-@yes | docker system prune -a
	-@yes | docker image prune -a
	-@yes | docker volume prune
	-@yes | docker network prune
	-@yes | docker container prune

logs:
	docker compose logs -f

re: clean all

.PHONY: all down clean fclean logs re clean-re



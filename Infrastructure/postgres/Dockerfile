FROM postgres:15-alpine

RUN mkdir -p /docker-entrypoint-initdb.d

COPY conf/init.sql /docker-entrypoint-initdb.d/


FROM node:18-alpine

WORKDIR /app

RUN npm install -g http-server

CMD ["http-server", ".", "-p", "3000", "-a", "0.0.0.0", "-c-1", "--spa"]

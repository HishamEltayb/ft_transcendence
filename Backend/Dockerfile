FROM python:3.11-alpine

WORKDIR /app

RUN mkdir -p /app/contract

COPY contract/Tournaments.json /app/contract/Tournaments.json

RUN apk add --no-cache postgresql-client build-base postgresql-dev

RUN apk add --no-cache \
    gcc \
    musl-dev \
    python3-dev \
    postgresql-dev \
    libffi-dev

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

COPY tools/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh


ENTRYPOINT ["/entrypoint.sh"]

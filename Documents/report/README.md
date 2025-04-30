# ft_transcendence

A modern, **feature-rich clone of the classic Pong game** implemented as a full-stack web application.  The project demonstrates real-time game play, OAuth & two-factor authentication, on-chain storage of tournament results, and full DevOps automation – all shipped as a single Docker-Compose stack.

## Table of Contents
1. [Project Goals](#project-goals)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Directory Layout](#directory-layout)
5. [Quick Start](#quick-start)
6. [Environment Variables](#environment-variables)
7. [Game Play & Frontend](#game-play--frontend)
8. [REST API](#rest-api)
9. [Blockchain Integration](#blockchain-integration)
10. [Logging & Monitoring](#logging--monitoring)
11. [Testing](#testing)
12. [Deployment Tips](#deployment-tips)
13. [Contributing](#contributing)
14. [License](#license)

---

## Project Goals
* Deliver a **single-page application (SPA)** playable directly in the browser.
* Provide **secure user management**: registration / login, 42 OAuth, JWT cookies, and optional TOTP-based 2-factor authentication.
* Offer multiple game modes – 1&nbsp;vs&nbsp;1, vs AI, 4-player multiplayer, and full tournaments.
* Persist match & tournament data both in **PostgreSQL** _and_ on an **Ethereum side-chain** for immutability.
* Expose a clean, documented **RESTful API** so alternative clients (CLI, mobile…) can interact with the platform.
* Ship with production-grade **DevOps**: Nginx reverse proxy, HTTPS, centralized logging (ELK), and zero-to-hero Docker Compose orchestration.

## Architecture Overview
```
┌───────────────────────────────────────────┐
│                Frontend SPA              │
│ (Vanilla JS + Bootstrap + HTML templates) │
└───────────────┬───────────────────────────┘
                │ REST / WebSocket (future)
┌───────────────▼───────────────────────────┐
│               Django Backend              │
│  • DRF API  • JWT cookies  • 2FA • ELK    │
└───────┬──────────────┬──────────────┬─────┘
        │              │              │
        │              │              │
 PostgreSQL      Elasticsearch      Ethereum
  (relational)   (logs & metrics)   (tournaments)
```
Each major service sits in its own container and communicates on the private `transcendence` Docker network.  Nginx fronts the stack and serves the SPA over port 443.

## Technology Stack
| Layer              | Tech                                                         |
|--------------------|--------------------------------------------------------------|
| Front-End          | Vanilla JS, ES6 modules, Bootstrap 5, HTML templates         |
| Game Engine        | Custom Canvas-based Pong implementation (`Frontend/js/game.js`) |
| Back-End           | Python 3 / Django 5, Django Rest Framework, Simple-JWT, django-otp |
| Database           | PostgreSQL 15                                               |
| Blockchain         | Local Ethereum node (geth/POA) + Web3.py smart-contract calls |
| Auth Providers     | Native credentials, 42 Intra OAuth 2.0                       |
| DevOps             | Docker, Docker-Compose, Nginx, Makefile                      |
| Observability      | Elasticsearch 7 / Kibana 8                                   |

## Directory Layout
```
.
├── Backend/           ← Django project (apps: users, tournaments, elk)
├── Frontend/          ← SPA source: HTML, JS, CSS, Dockerfile
├── Blockchain/        ← Smart-contract JSON & helper scripts
├── Infrastructure/    ← Dockerfiles & configs for postgres, nginx, elk …
├── Documents/         ← Subject PDF, design docs, diagrams
├── docker-compose.yml ← One-click orchestration
├── Makefile           ← Convenience targets (build, up, logs, tests …)
└── .env.example       ← Template for required secrets & connection strings
```

## Quick Start
Prerequisites: **Docker ≥ 24** and **Docker Compose v2**.

```bash
# 1. Clone the repository
$ git clone https://github.com/your-org/ft_transcendence.git && cd ft_transcendence

# 2. Create and edit the environment file
$ cp .env.example .env
$ $EDITOR .env  # fill in secrets, passwords, OAuth keys …

# 3. Build & launch everything (detached)
$ make up           # or: docker compose up --build -d

# 4. Visit the app
$ open https://localhost    # frontend SPA (served by nginx)
$ open https://localhost/api # browseable DRF API root
```
> **Tip :** run `make logs` to follow all container logs, or `make attach-<service>` to exec into a container.

## Environment Variables
All secrets/connection strings live in `.env`.  The provided `.env.example` documents every key; the most important ones are:

| Variable               | Purpose                               |
|------------------------|---------------------------------------|
| `DJANGO_SECRET_KEY`    | Django cryptographic secret           |
| `POSTGRES_*`           | DB name / user / password / port      |
| `FT_CLIENT_ID/SECRET`  | 42 OAuth credentials                  |
| `FRONTEND_URL`         | Public SPA URL (used in CORS, cookies) |
| `ELASTICSEARCH_HOST`   | URL for ELK internal networking        |
| `ELASTIC_CLIENT_APIVERSIONING` | Pin ES API version            |

## Game Play & Frontend
Open the SPA and choose between:
* **1 vs 1** – play against a random online player.
* **1 vs AI** – face a configurable computer paddle.
* **Multiplayer** – up to 4 paddles on one screen.
* **Tournament** – knockout bracket; results are later pushed to both the backend and the blockchain.

Gameplay is entirely client-side and rendered on a `<canvas>` element.  Results are submitted through the injected callbacks in `game.js`:
```javascript
// inside Frontend/js/app.js
import game from './game.js';

game.init(currentUser,  api.submitMatch, api.submitTournament);
```

## REST API
Base URL: `https://<host>/api/`

### Auth
| Endpoint                  | Method | Description                        |
|---------------------------|--------|------------------------------------|
| `/users/register/`        | POST   | Sign-up (username, email, pwd)     |
| `/users/login/`           | POST   | Obtain access & refresh tokens     |
| `/users/logout/`          | POST   | Revoke current access token        |
| `/users/token/refresh/`   | POST   | Refresh expired token via cookie   |
| `/users/2fa/*`            | POST   | Setup / verify / disable TOTP      |
| `/users/oauth/42/`        | GET    | Redirect to 42 Intra consent page  |

### Gameplay
| Endpoint                     | Method | Auth | Description                         |
|------------------------------|--------|------|-------------------------------------|
| `/tournaments/`              | POST   | ✔    | Create new tournament                |
| `/tournaments/<id>/`         | GET    | ✖    | Retrieve tournament w/ match list    |
| `/tournaments/matches/`      | POST   | ✔    | Submit single match (non-tournament) |

Full schema can be explored via the DRF Web UI once the stack is running.

## Blockchain Integration
The `Blockchain/tools/` folder contains helper scripts built with **Web3.py**:
* `deploy.py` – deploys the compiled `Tournaments.json` contract if not yet on-chain.
* `store_tournament.py` / `models.py` – convenience functions to push/read tournament data.

The backend never directly manipulates the chain; instead, a background job (future work) could consume an internal queue and invoke these scripts.

> The dev chain is exposed on `localhost:8545` inside the `blockchain` container.  Use MetaMask’s “Localhost 8545” network for manual inspection.

## Logging & Monitoring
Logs emitted by Django (via the custom `elk` app) are shipped to **Elasticsearch 7**.  `kibana` is available at `https://localhost/kibana` for dashboards & queries.

## Testing
Unit tests live under `Backend/*/tests.py` and can be executed in the running backend container:
```bash
$ make backend-test     # runs registration, login & 2FA suites
```

## Deployment Tips
The default Docker Compose setup is **production-ready out-of-the-box**:
* All services run as non-root users.
* HTTPS is terminated by Nginx with self-signed certificates located in the `ssl` volume.
* Postgres, Elasticsearch and blockchain data are persisted in named volumes.

For cloud deployment:
1. Set real certificates via the `ssl` volume (or use LetsEncrypt).
2. Configure `DJANGO_ALLOWED_HOSTS` & `FRONTEND_URL` with your public domain.
3. Point `ELASTICSEARCH_HOSTS` to an external ES cluster if desired.

> 🐳 **Tip**: Re-deploy with zero downtime by rebuilding only the updated service(s) and letting Compose recreate them: `docker compose up -d --build backend`.

## Contributing
Contributions are welcome!  Please open an issue to discuss major changes first.

1. Fork the repository and create your feature branch (`git checkout -b feature/my-feature`).
2. Run `pre-commit` hooks & ensure all tests pass.
3. Submit a pull request describing your changes.

## License
This project is licensed under the MIT License – see `LICENSE` for details.




given these secitonss and infromation i want to update the whole document (i already updated team name + abstract with abbriviations). 
now you can apply this in the whole project, given that the project folder is @transcendence 
review it wisely in steps, understand it and then edit the tex files. 

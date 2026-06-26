# Podsumowanie repozytorium

To repozytorium jest prostym środowiskiem do testowania workflow agentów na pełnym stosie aplikacji webowej.

## Główne elementy

- `backend/` — serwer API w Go z obsługą healthchecka i prostą tablicą wiadomości zapisywaną w Postgresie.
- `frontend/` — aplikacja React + Vite, która wyświetla stan backendu i pozwala dodawać wiadomości.
- `shared/` — współdzielony moduł Go, obecnie używany do wersjonowania aplikacji.
- `nginx/` — proxy developerskie wystawiające frontend pod `/` i backend pod `/api`.
- `skills/` — lokalne opisy skillów do uruchamiania testów E2E w różnych frameworkach.

## Jak działa aplikacja

- Backend udostępnia endpointy `GET /api/health`, `GET /api/messages` i `POST /api/messages`.
- Frontend pobiera stan zdrowia aplikacji oraz listę ostatnich wiadomości, a także umożliwia dodanie nowej wiadomości przez formularz.
- Dane są przechowywane w bazie PostgreSQL uruchamianej przez Docker Compose.

## Uruchamianie lokalne

Podstawowy workflow developerski opiera się o Docker Compose:

```bash
docker-compose up --build
```

Najważniejsze adresy po uruchomieniu:

- `http://localhost:8088` — wejście przez nginx
- `http://localhost:8080/api/health` — backend bezpośrednio
- `http://localhost:5173` — frontend bezpośrednio

## Testy i weryfikacja

Repo zawiera głównie testy end-to-end dla kilku narzędzi:

- Playwright
- Cypress
- Selenium
- Puppeteer

Testy można uruchamiać zarówno w kontenerach, jak i — dla części scenariuszy — przeciwko zdalnej przeglądarce dostępnej na `localhost:3000`.

## Charakter repo

To nie jest rozbudowany produkt biznesowy, tylko mały projekt demonstracyjny do sprawdzania zmian w aplikacji Go + React oraz ćwiczenia automatyzacji, walidacji i workflow agentów.

# Inventory Application Foundation

This workspace contains a configuration-only Spring Boot backend and a minimal React/TypeScript frontend. CRUD endpoints, inventory entities, upload services, authentication, and application pages are intentionally deferred.

## PostgreSQL with Docker

Docker Compose runs PostgreSQL locally on `127.0.0.1:5432` and persists its data in a named Docker volume.

```bash
cp .env.docker.example .env
docker compose up -d
docker compose ps
```

The backend can then use the same values from `.env`:

```bash
export DB_URL=jdbc:postgresql://localhost:5432/inventory_db
export DB_USERNAME=postgres
export DB_PASSWORD=change-this-local-password
```

If you change `POSTGRES_PORT` in `.env`, use that host port in `DB_URL` as well.

Stop the database while preserving its data with `docker compose down`. To remove the database volume and all stored data, run `docker compose down -v`.

## Backend

The backend uses Maven, Spring Boot, Spring Web MVC, Spring Data JPA/Hibernate, PostgreSQL, validation, and multipart request support. PostgreSQL settings and the upload directory are configured through environment variables.

```bash
cd backend
export DB_URL=jdbc:postgresql://localhost:5432/inventory_db
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
export UPLOAD_DIR=./uploads
./mvnw spring-boot:run
```

The default upload location is `backend/uploads/` when the application is started from `backend/`. Runtime uploads are ignored by Git; only the directory placeholder is tracked. The database will eventually store image paths or URLs rather than image bytes.

## Frontend

The frontend uses Vite, React, TypeScript, and Axios. Configure the future API base URL and start the development server with:

```bash
cd frontend
cp .env.example .env.local
npm run dev
```

Use `npm run lint` and `npm run build` to verify the frontend.

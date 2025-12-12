# HCMUTE Chatbot

RAG-based chatbot system with FastAPI backend and Next.js frontend.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

## Quick Start

### Production Deployment

```bash
# Clean previous containers and images
docker compose -f docker-compose.prod.yml down --remove-orphans
docker system prune -a --volumes -f

# Build and start services
docker compose -f docker-compose.prod.yml up -d --build

# Check service status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### Development Deployment

```bash
# Clean previous containers
docker compose -f docker-compose.dev.yml down --remove-orphans

# Start services
docker compose -f docker-compose.dev.yml up -d --build

# Check status
docker compose -f docker-compose.dev.yml ps

# View logs
docker compose -f docker-compose.dev.yml logs -f
```

## Local Development

### Backend (FastAPI)

#### Setup Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env.development

# Edit .env.development with your settings
nano .env.development
```

Required environment variables:
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` - Database credentials
- `POSTGRES_HOST`, `POSTGRES_PORT` - Database connection
- `JWT_SECRET_KEY` - Secret key for JWT authentication
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth credentials
- `FRONTEND_URL`, `BACKEND_URL` - Application URLs
- `QDRANT_HOST`, `QDRANT_PORT` - Vector database connection
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` - Object storage

#### Run Database Migrations

```bash
# Run migrations
alembic upgrade head

# Create new migration (if needed)
alembic revision --autogenerate -m "description"
```

#### Start Development Server

```bash
# Run with hot reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API documentation available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Frontend (Next.js)

#### Setup Environment

```bash
cd frontend

# Install dependencies
npm install
# or
pnpm install
# or
yarn install
```

#### Configure Environment Variables

```bash
# Create environment file
cp .env.example .env.local

# Edit .env.local with your settings
nano .env.local
```

Required environment variables:
- `NEXT_PUBLIC_API_URL` - Backend API URL (e.g., http://localhost:8000)

#### Start Development Server

```bash
# Run development server
npm run dev
# or
pnpm dev
# or
yarn dev
```

Application available at: http://localhost:3000

#### Build for Production

```bash
# Create production build
npm run build

# Start production server
npm run start
```

## Service Ports

### Development
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- PostgreSQL: localhost:5433
- Qdrant: http://localhost:6333
- MinIO: http://localhost:9000 (Console: http://localhost:9001)

### Production
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- PostgreSQL: localhost:5432 (internal)
- Qdrant: http://localhost:6333 (internal)
- MinIO: http://localhost:9000 (internal)

## Common Commands

### Docker Management

```bash
# Stop all services
docker compose -f docker-compose.{dev|prod}.yml down

# Remove volumes (warning: deletes data)
docker compose -f docker-compose.{dev|prod}.yml down -v

# Restart specific service
docker compose -f docker-compose.{dev|prod}.yml restart <service-name>

# View logs for specific service
docker compose -f docker-compose.{dev|prod}.yml logs -f <service-name>

# Execute command in container
docker compose -f docker-compose.{dev|prod}.yml exec <service-name> <command>
```

### Database Management

```bash
# Access PostgreSQL in development
docker compose -f docker-compose.dev.yml exec postgres psql -U admin -d postgres

# Backup database
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U admin postgres > backup.sql

# Restore database
docker compose -f docker-compose.prod.yml exec -T postgres psql -U admin postgres < backup.sql
```

## Project Structure

```
hcmute-chatbot/
├── backend/              # FastAPI application
│   ├── alembic/         # Database migrations
│   ├── app/             # Application code
│   │   ├── api/         # API routes
│   │   ├── core/        # Core configurations
│   │   ├── db/          # Database setup
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   └── services/    # Business logic
│   ├── main.py          # Application entry point
│   └── requirements.txt # Python dependencies
├── frontend/            # Next.js application
│   ├── app/             # Next.js app directory
│   ├── components/      # React components
│   ├── lib/             # Utility functions
│   └── services/        # API client services
├── docker-compose.dev.yml   # Development configuration
└── docker-compose.prod.yml  # Production configuration
```

## Troubleshooting

### Backend not connecting to database

Check if PostgreSQL is running:
```bash
docker compose -f docker-compose.dev.yml ps postgres
```

Verify environment variables in `.env.development`

### Frontend cannot reach backend

Ensure `NEXT_PUBLIC_API_URL` is correctly set in `.env.local`

Check CORS settings in backend `.env.development`:
```
ALLOW_ORIGINS=http://localhost:3000
```

### Permission denied errors

Ensure proper file permissions:
```bash
chmod +x backend/scripts/*
```

### Port already in use

Change port mappings in `docker-compose.{dev|prod}.yml` or stop conflicting services

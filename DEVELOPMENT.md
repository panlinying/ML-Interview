# Development Guide

This guide explains how to run the ML Interview site locally for development and debugging.

## Prerequisites

- **Node.js 18+** (for frontend)
- **Python 3.13+** (for backend)
- **UV** (Python package manager)
- **PostgreSQL** (or Neon database)

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/panlinying/ML-Interview.git
cd ML-Interview

# Install Python dependencies with UV
uv sync

# Install Node.js dependencies for frontend
cd site
npm install
cd ..
```

### 2. Setup Environment Variables

```bash
# Copy example env file
cp .env.example .env.local

# Generate secrets
openssl rand -hex 32  # Use for JWT_SECRET
openssl rand -hex 32  # Use for ADMIN_SECRET

# Edit .env.local with your values
nano .env.local
```

**Minimum required variables:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/ml_interview
JWT_SECRET=your-generated-secret-here
ADMIN_SECRET=your-generated-admin-secret-here
APP_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

### 3. Setup Database

If using local PostgreSQL:

```bash
# Create database
createdb ml_interview

# Or using psql
psql -U postgres -c "CREATE DATABASE ml_interview;"
```

If using Neon (recommended for development):
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string to `DATABASE_URL` in `.env.local`

### 4. Initialize Database Tables

```bash
# Start the backend first (see below)
# Then call the init endpoint with admin secret:
curl -X POST http://localhost:8000/api/init-db \
  -H "X-Admin-Secret: your-admin-secret-here"
```

## Running the Application

You'll need **two terminal windows** - one for frontend, one for backend.

### Terminal 1: Frontend (Next.js)

```bash
cd site

# Development mode (with hot reload)
npm run dev

# Or build and serve production version
npm run build
npm start
```

The frontend will be available at **http://localhost:3000**

### Terminal 2: Backend (FastAPI)

```bash
# From project root

# Option 1: Using uvicorn directly with UV
uv run uvicorn api.index:app --reload --host 0.0.0.0 --port 8000

# Option 2: Using Python module
uv run python -m uvicorn api.index:app --reload --port 8000
```

The backend API will be available at **http://localhost:8000**

API documentation: **http://localhost:8000/docs** (Swagger UI)

## Development Workflow

### Frontend Development

```bash
cd site

# Start dev server with hot reload
npm run dev

# Run TypeScript type checking
npx tsc --noEmit

# Run linter
npm run lint

# Build for production
npm run build

# Preview production build
npm start
```

### Backend Development

```bash
# Run with auto-reload (recommended for development)
uv run uvicorn api.index:app --reload --port 8000

# Run without reload
uv run uvicorn api.index:app --port 8000

# Run with specific host
uv run uvicorn api.index:app --reload --host 0.0.0.0 --port 8000
```

### Testing API Endpoints

```bash
# Health check
curl http://localhost:8000/api

# Initialize database (requires admin secret)
curl -X POST http://localhost:8000/api/init-db \
  -H "X-Admin-Secret: your-admin-secret"

# Get user progress (requires authentication)
curl http://localhost:8000/api/progress \
  -H "Authorization: Bearer your-jwt-token"
```

## Debugging

### Frontend Debugging

1. **Browser DevTools**: Open Chrome/Firefox DevTools (F12)
2. **React DevTools**: Install React DevTools extension
3. **Next.js Debug Mode**: 
   ```bash
   NODE_OPTIONS='--inspect' npm run dev
   ```
4. **VS Code**: Use the built-in debugger with this configuration:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Next.js: debug",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "dev"],
  "port": 9229,
  "cwd": "${workspaceFolder}/site"
}
```

### Backend Debugging

1. **Print Debugging**: Add `print()` statements
2. **Python Debugger (pdb)**:
   ```python
   import pdb; pdb.set_trace()
   ```
3. **VS Code**: Use this launch configuration:

```json
{
  "type": "python",
  "request": "launch",
  "name": "FastAPI Debug",
  "module": "uvicorn",
  "args": [
    "api.index:app",
    "--reload",
    "--port",
    "8000"
  ],
  "jinja": true,
  "justMyCode": false
}
```

4. **Logs**: Check uvicorn logs in terminal

### Common Issues

**Frontend:**
- **Port 3000 in use**: Kill process with `lsof -ti:3000 | xargs kill -9`
- **Module not found**: Run `npm install` in `site/` directory
- **TypeScript errors**: Run `npm run build` to see all errors

**Backend:**
- **Port 8000 in use**: Kill process with `lsof -ti:8000 | xargs kill -9`
- **Import errors**: Run `uv sync` to install dependencies
- **Database connection**: Check `DATABASE_URL` in `.env.local`
- **CORS errors**: Add your frontend URL to `ALLOWED_ORIGINS`

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Secret for JWT tokens (min 32 chars) | Generate with `openssl rand -hex 32` |
| `ADMIN_SECRET` | Secret for admin endpoints | Generate with `openssl rand -hex 32` |
| `APP_URL` | Your app's public URL | `http://localhost:3000` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App ID | None |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | None |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | None |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | None |

## Project Structure

```
ML-Interview/
├── api/                    # FastAPI backend
│   ├── __init__.py
│   ├── index.py           # Main API routes
│   ├── auth.py            # Authentication & OAuth
│   └── db.py              # Database models
├── site/                   # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities
│   └── public/            # Static assets
├── content/               # Markdown content
├── ml_interview/          # Python CLI tool
├── .env.local            # Local environment variables (gitignored)
├── .env.example          # Example environment variables
└── pyproject.toml        # Python dependencies
```

## Useful Commands

```bash
# Frontend
cd site && npm run dev              # Start dev server
cd site && npm run build            # Build for production
cd site && npm start                # Serve production build
cd site && npm run lint             # Run linter

# Backend
uv run uvicorn api.index:app --reload  # Start with hot reload
uv sync                                 # Install/update dependencies
uv run python -m pytest                 # Run tests (if added)

# Database
psql $DATABASE_URL                      # Connect to database
psql $DATABASE_URL -c "SELECT * FROM users;"  # Query database

# Generate secrets
openssl rand -hex 32                    # Generate random secret
```

## Next Steps

1. ✅ Setup environment variables
2. ✅ Start frontend and backend
3. ✅ Initialize database
4. 📝 Test API endpoints
5. 🎨 Make your changes
6. 🚀 Deploy to Vercel

For deployment instructions, see [README.md](./README.md#deployment).

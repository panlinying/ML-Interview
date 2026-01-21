# ML Interview Preparation

[![GitHub Pages](https://img.shields.io/badge/View%20Online-GitHub%20Pages-blue)](https://www.aceinterview.online/)

A comprehensive 10-week ML engineer interview preparation system designed as an Obsidian vault with a modern web interface.

**View online:** 
- https://www.aceinterview.online

## Overview

This project provides a structured curriculum covering:

- **Part 1 (Weeks 1-4):** Coding & Algorithm interviews - LeetCode problems with pattern-based learning
- **Part 2 (Weeks 1-6):** ML Fundamentals - Math, classical ML, deep learning, modern architectures
- **Part 3 (Weeks 7-10):** ML System Design - Framework and real-world case studies

## Project Structure

```
ML-Interview/
├── content/                # Obsidian vault content
│   ├── 00-Reference/       # Start Here, Calendar Map, Execution Playbook
│   ├── 10-Weeks/           # Weekly overview pages
│   ├── 20-Daily/           # Daily notes (70 days)
│   ├── 30-ML-Fundamentals/ # ML theory and fundamentals
│   ├── 40-ML-System-Design/# System design case studies
│   └── ml_interview_detailed_guide.md
├── site/                   # Next.js web application
│   ├── app/                # Next.js App Router pages
│   ├── components/         # React components (Sidebar, Header, etc.)
│   ├── lib/                # Utilities (markdown processing, wiki links)
│   └── public/             # Static assets
├── ml_interview/           # Python package for note generation
└── vercel.json             # Vercel deployment configuration
```

## Getting Started

### Using the Web Interface

Visit [aceinterview.online](https://www.aceinterview.online/) to:

1. Browse the curriculum with a modern, searchable interface
2. Navigate through daily notes and weekly plans
3. Follow wiki-style links between related topics
4. Access everything from any device

### Using the Obsidian Vault

For a local, customizable experience:

1. Clone this repository
2. Open `content/` as an Obsidian vault
3. Start with `00-Reference/Start Here.md`
4. Navigate to today's date in `Calendar Map`
5. Follow the `Execution Playbook` methodology

### The 5-Step Learning Loop

1. **Watch** pattern video (15-20 min)
2. **Solve** template problem with hints (30 min)
3. **Practice** 2-3 similar problems (1 hour)
4. **Challenge** harder variation without hints (45 min)
5. **Review** next day from memory (15 min)

## Installation

This project uses [UV](https://docs.astral.sh/uv/) for Python dependency management.

```bash
# Install UV (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Clone and setup
git clone https://github.com/panlinying/ML-Interview.git
cd ML-Interview

# Install all dependencies
uv sync

# Verify installation
uv run python -c "import httpx; print('✅ Dependencies installed successfully')"
```

## Regenerating Notes

If you modify the curriculum, regenerate the daily notes:

```bash
# Using UV (recommended)
uv run ml-interview content/ml_interview_detailed_guide.md --out content

# With options
uv run ml-interview content/ml_interview_detailed_guide.md \
  --out content \
  --days 7 \
  --start 2026-01-12

# Force overwrite existing notes
uv run ml-interview content/ml_interview_detailed_guide.md --out content --force

# Or run as a module
uv run python -m ml_interview content/ml_interview_detailed_guide.md --out content

# Or use the convenience script directly
uv run python run.py content/ml_interview_detailed_guide.md --out content
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `md_path` | Path to plan markdown file | Required |
| `--out` | Output vault directory | Current directory |
| `--days` | Days per week to split into | 5 |
| `--start` | Start date (YYYY-MM-DD) | None (uses "Week X - Day Y" naming) |
| `--force` | Overwrite existing day notes | False |
| `--version` | Show version number | - |

## Requirements

### For Web Development

- Node.js 18+
- npm or yarn

### For Note Generation

- Python 3.13+
- [UV](https://docs.astral.sh/uv/) (for package management)

### For Obsidian Vault

- Obsidian (for viewing/editing the vault locally)

## Development

### Local Development

```bash
# 1. Setup environment
cp .env.example .env.local
# Edit .env.local with your database URL and secrets

# 2. Start everything with one command
./start-dev.sh
```

This starts:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Manual Setup (if needed)

**Frontend:**
```bash
cd site && npm install && npm run dev
```

**Backend:**
```bash
uv sync && uv run uvicorn api.index:app --reload --port 8000
```

## Deployment

### Quick Deploy (30 minutes)

**1. Deploy Backend to Railway**
```bash
# Go to https://railway.app
# New Project → Deploy from GitHub → Select your repo
# Add PostgreSQL: Click "+ New" → Database → PostgreSQL
```

**IMPORTANT:** After adding PostgreSQL, you MUST manually add environment variables:
1. Click on PostgreSQL service → "Connect" tab → Copy the DATABASE_URL
2. Click on your backend service → "Variables" tab
3. Add ALL variables listed below (Railway doesn't auto-link them)

**2. Deploy Frontend to Vercel**
```bash
# Go to https://vercel.com
# Add New Project → Import your GitHub repo
# Add environment variables:
#   NEXT_PUBLIC_API_URL=https://www.aceinterview.online/api
#   NEXT_STATIC_EXPORT=true
# Settings → Domains → Add www.aceinterview.online
```

**3. Update vercel.json**
```json
{
  "rewrites": [{
    "source": "/api/:path*",
    "destination": "https://YOUR-RAILWAY-URL.up.railway.app/api/:path*"
  }]
}
```

**4. Initialize Database**
```
Visit: https://YOUR-RAILWAY-URL.up.railway.app/api/init-db?admin_secret=YOUR_SECRET
```

**5. Update OAuth Callbacks**
- GitHub: Add `https://www.aceinterview.online/api/auth/github/callback`
- Google: Add `https://www.aceinterview.online/api/auth/google/callback`

### Environment Variables

**Railway (Backend):**
```bash
DATABASE_URL=<auto-set by Railway PostgreSQL>
JWT_SECRET=<generate with: openssl rand -hex 32>
ADMIN_SECRET=<generate with: openssl rand -hex 32>
GITHUB_CLIENT_ID=<from GitHub OAuth app>
GITHUB_CLIENT_SECRET=<from GitHub OAuth app>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
APP_URL=https://www.aceinterview.online
API_URL=https://www.aceinterview.online/api
ALLOWED_ORIGINS=https://www.aceinterview.online
```

**Vercel (Frontend):**
```bash
NEXT_PUBLIC_API_URL=https://www.aceinterview.online/api
NEXT_STATIC_EXPORT=true
```

**Local (.env.local):**
```bash
DATABASE_URL=<Railway public PostgreSQL URL>
JWT_SECRET=<same as Railway>
ADMIN_SECRET=<same as Railway>
GITHUB_CLIENT_ID=<same as Railway>
GITHUB_CLIENT_SECRET=<same as Railway>
GOOGLE_CLIENT_ID=<same as Railway>
GOOGLE_CLIENT_SECRET=<same as Railway>
APP_URL=http://localhost:3000
API_URL=http://localhost:8000/api
NEXT_PUBLIC_API_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

## Features

### Web Interface

- 🔍 **Full-text search** across all notes
- 🎨 **Dark mode** support
- 📱 **Responsive design** for mobile and desktop
- 🔗 **Wiki-style links** automatically resolved
- 📊 **Organized navigation** by category
- ⚡ **Static site generation** for fast loading

## Curriculum Highlights

### Coding Interview (40+ problems)

- Arrays, Two Pointers, Hash Maps
- Binary Trees, Graphs (BFS/DFS)
- Dynamic Programming
- Backtracking, Intervals

### ML Fundamentals

- Linear Algebra (3Blue1Brown)
- Probability & Statistics (StatQuest)
- Classical ML: Regression, Trees, SVM, Ensemble
- Deep Learning: Neural Networks, Backprop, Optimization
- Modern Architectures: CNNs, RNNs, Transformers

### ML System Design Framework

1. **CLARIFY** - Business goals, constraints, data
2. **METRICS** - Offline/online metrics
3. **DATA & FEATURES** - Sources, engineering, feature stores
4. **MODEL** - Selection, architecture, training
5. **SERVING** - Inference, latency, scaling
6. **MONITORING** - Drift detection, A/B testing

### Case Studies

- Recommendation Systems (Netflix/YouTube)
- Feed Ranking (Facebook/Twitter)
- Ads Click Prediction
- Search Ranking

## License

MIT

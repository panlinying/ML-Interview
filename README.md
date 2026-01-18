# ML Interview Preparation

[![GitHub Pages](https://img.shields.io/badge/View%20Online-GitHub%20Pages-blue)](https://panlinying.github.io/ML-Interview/)

A comprehensive 10-week ML engineer interview preparation system designed as an Obsidian vault.

**View online:** https://panlinying.github.io/ML-Interview/

## Overview

This project provides a structured curriculum covering:

- **Part 1 (Weeks 1-4):** Coding & Algorithm interviews - LeetCode problems with pattern-based learning
- **Part 2 (Weeks 1-6):** ML Fundamentals - Math, classical ML, deep learning, modern architectures
- **Part 3 (Weeks 7-10):** ML System Design - Framework and real-world case studies

## Project Structure

```
ML-Interview/
├── content/                # Obsidian vault content
│   ├── 00-Reference/
│   ├── 10-Weeks/
│   ├── 20-Daily/
│   ├── 30-ML-Fundamentals/
│   ├── 40-ML-System-Design/
│   └── ml_interview_detailed_guide.md
├── site/                   # Next.js site
└── ml_interview/           # Python package
```

## Getting Started

### Using the Vault

1. Open `content/` as an Obsidian vault
2. Start with `00-Reference/Start Here.md`
3. Navigate to today's date in `Calendar Map`
4. Follow the `Execution Playbook` methodology

### The 5-Step Learning Loop

1. **Watch** pattern video (15-20 min)
2. **Solve** template problem with hints (30 min)
3. **Practice** 2-3 similar problems (1 hour)
4. **Challenge** harder variation without hints (45 min)
5. **Review** next day from memory (15 min)

## Installation

This project uses [UV](https://docs.astral.sh/uv/) for Python package management.

```bash
# Install UV (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Clone and setup
git clone https://github.com/panlinying/ML-Interview.git
cd ML-Interview
uv sync
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

- Python 3.13+
- [UV](https://docs.astral.sh/uv/) (for package management)
- Obsidian (for viewing the vault)

## Deployment

### GitHub Pages

This repo uses a `/ML-Interview` base path. The GitHub Actions workflow sets:

```
NEXT_PUBLIC_BASE_PATH=/ML-Interview
```

### Vercel

Set the project's Root Directory to `site` and define:

```
NEXT_PUBLIC_BASE_PATH=
```

Leave it empty to deploy at the root domain.

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

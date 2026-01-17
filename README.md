# ML Interview Preparation

A comprehensive 10-week ML engineer interview preparation system designed as an Obsidian vault.

## Overview

This project provides a structured curriculum covering:

- **Part 1 (Weeks 1-4):** Coding & Algorithm interviews - LeetCode problems with pattern-based learning
- **Part 2 (Weeks 1-6):** ML Fundamentals - Math, classical ML, deep learning, modern architectures
- **Part 3 (Weeks 7-10):** ML System Design - Framework and real-world case studies

## Project Structure

```
ML-Interview/
├── 00-Reference/           # Navigation & reference guides
│   ├── Start Here.md       # Entry point
│   ├── Calendar Map.md     # 10-week calendar overview
│   ├── Execution Playbook  # Learning methodology
│   └── Quick Reference     # Curated resource links
├── 10-Weeks/               # Weekly overview notes
├── 20-Daily/               # 70 daily task notes
├── 30-ML-Fundamentals/     # ML theory content
├── 40-ML-System-Design/    # System design guides
├── ml_interview/           # Python package
└── ml_interview_detailed_guide.md  # Source curriculum
```

## Getting Started

### Using the Vault

1. Open this folder as an Obsidian vault
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
uv run ml-interview ml_interview_detailed_guide.md

# With options
uv run ml-interview ml_interview_detailed_guide.md \
  --out . \
  --days 7 \
  --start 2026-01-12

# Force overwrite existing notes
uv run ml-interview ml_interview_detailed_guide.md --force

# Or run as a module
uv run python -m ml_interview ml_interview_detailed_guide.md

# Or use the convenience script directly
uv run python run.py ml_interview_detailed_guide.md
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

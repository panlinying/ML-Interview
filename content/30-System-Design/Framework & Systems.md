# Framework & Systems

## Framework (Memorize This)

```
1. CLARIFY (5 min)
   - What's the business goal?
   - What are the constraints? (latency, scale, cost)
   - What data is available?

2. METRICS (5 min)
   - Offline: Precision, Recall, AUC, NDCG
   - Online: CTR, conversion, engagement, revenue

3. DATA & FEATURES (10 min)
   - Data sources
   - Feature engineering
   - Feature stores

4. MODEL (10 min)
   - Model selection
   - Architecture
   - Training strategy

5. SERVING (10 min)
   - Inference pipeline
   - Latency optimization
   - Scaling

6. MONITORING (5 min)
   - Data drift
   - Model degradation
   - A/B testing
```

## Must-Study Systems

### 1. Recommendation System (Netflix/YouTube)

**Video:** https://www.youtube.com/watch?v=n3RKsY2H-NE

**Key Components:**
- Candidate generation (recall)
- Ranking (precision)
- Two-tower model
- User/item embeddings

### 2. Feed Ranking (Facebook/Twitter)

**Video:** https://www.youtube.com/watch?v=hKoJgLf5sj0

**Key Components:**
- Multi-stage ranking
- Real-time features
- Personalization
- Diversity/freshness

### 3. Ads Click Prediction

**Video:** https://www.youtube.com/watch?v=RZJBOo9HW-M

**Key Components:**
- CTR prediction
- Wide & Deep model
- Feature crosses
- Calibration

### 4. Search Ranking

**Key Components:**
- Query understanding
- Document retrieval
- Learning to rank
- BERT for search

## Book

**"Designing Machine Learning Systems" by Chip Huyen**
- Buy: https://www.amazon.com/Designing-Machine-Learning-Systems-Production-Ready/dp/1098107969
- This is the gold standard for ML system design

---

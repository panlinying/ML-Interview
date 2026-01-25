# Specialized Topics (Guide)

Related:
- Plan: [[30-ML-Fundamentals/Week 5-6 CNNs, RNNs, Transformers]]
- Concepts tracker: [[30-ML-Fundamentals/Concepts Tracker#NLP]]
- Concepts tracker: [[30-ML-Fundamentals/Concepts Tracker#RecSys]]
- Concepts tracker: [[30-ML-Fundamentals/Concepts Tracker#ML Systems]]
- Quick reference: [[00-Reference/ML Cheat Sheet]]

## 4.1 Natural Language Processing (NLP)

### Word Embeddings

```
Word2Vec:

Skip-gram:
P(context|word) = Π P(wₒ|wᵢ)
P(wₒ|wᵢ) = exp(vᵢ·vₒ) / Σexp(vᵢ·vₖ)

CBOW:
P(word|context) = P(wᵢ|context)

Negative Sampling:
- Sample k negative words
- Binary classification: real context vs random
- Much faster than full softmax

GloVe:
Objective: wᵢᵀw̃ⱼ + bᵢ + b̃ⱼ = log(Xᵢⱼ)
- Co-occurrence matrix factorization
- Global statistics + local context
```

### Language Models

```
Perplexity:
PPL = exp(-1/N × Σ log P(wᵢ|w₁...wᵢ₋₁))
Lower = better

Beam Search:
- Keep top k candidates at each step
- Score: log P(y₁...yₜ)
- Length normalization: score / length^α

Temperature Sampling:
P(wᵢ) = exp(zᵢ/T) / Σexp(zⱼ/T)
T < 1: More confident (peaky)
T > 1: More random (flat)

Top-k Sampling:
- Only sample from top k tokens
- Prevents low-quality tokens

Top-p (Nucleus) Sampling:
- Sample from smallest set where cumsum(P) > p
- Adaptive: More tokens when uncertain
```

### BERT Details

```
Pre-training:

Masked Language Model (MLM):
- Mask 15% of tokens
- 80% [MASK], 10% random, 10% unchanged
- Predict original token

Next Sentence Prediction (NSP):
- 50% actual next sentence
- 50% random sentence
- Binary classification

Input:
[CLS] sentence1 [SEP] sentence2 [SEP]

Segment embeddings: Distinguish sentences
Position embeddings: Learned, up to 512

Fine-tuning:
- Classification: [CLS] + linear layer
- Token classification: Each token + linear layer
- QA: Start/end span prediction
```

**Interview Questions:**

Q: Explain the difference between BERT and GPT.
A:
```
BERT:
- Encoder only
- Bidirectional (sees all context)
- MLM pre-training (fill in blanks)
- Good for: Classification, NER, QA
- Not for: Generation

GPT:
- Decoder only
- Unidirectional (causal)
- Next token prediction
- Good for: Generation, few-shot learning
- Scaling laws: Larger = better
```

Q: How would you handle out-of-vocabulary words?
A:
- Subword tokenization: BPE, WordPiece, SentencePiece
- Character-level models
- FastText: Subword embeddings, average for OOV
- Never see true OOV with subword models

---

## 4.2 Recommender Systems

### Collaborative Filtering

```
User-Item Matrix:
R[u,i] = rating of user u for item i

User-based CF:
r̂ᵤᵢ = r̄ᵤ + Σᵥ sim(u,v)(rᵥᵢ - r̄ᵥ) / Σ|sim(u,v)|

Item-based CF:
r̂ᵤᵢ = Σⱼ sim(i,j)rᵤⱼ / Σ|sim(i,j)|

Similarity:
- Cosine: dot(u,v) / (||u||||v||)
- Pearson: Correlation coefficient
- Jaccard: |A∩B| / |A∪B|
```

### Matrix Factorization

```
Factorization:
R ≈ PQᵀ
P: User factors (n_users × k)
Q: Item factors (n_items × k)

Objective:
min Σ (rᵤᵢ - pᵤᵀqᵢ)² + λ(||P||² + ||Q||²)

SGD Update:
eᵤᵢ = rᵤᵢ - pᵤᵀqᵢ
pᵤ = pᵤ + η(eᵤᵢqᵢ - λpᵤ)
qᵢ = qᵢ + η(eᵤᵢpᵤ - λqᵢ)

ALS (Alternating Least Squares):
- Fix P, solve for Q (closed form)
- Fix Q, solve for P (closed form)
- Repeat until convergence
- Better for implicit feedback
```

### Deep Learning for RecSys

```
Neural Collaborative Filtering:
- Learn non-linear interactions
- Concatenate user/item embeddings
- Pass through MLP

Two-Tower Model:
User Tower: user features → user embedding
Item Tower: item features → item embedding
Score: dot(user_emb, item_emb)

Advantages:
- Can precompute item embeddings
- Fast retrieval with ANN (approximate nearest neighbor)

Wide & Deep:
Wide: Linear model (memorization)
Deep: MLP (generalization)
Output: σ(W_wide × [x] + W_deep × MLP(x))

Sequence Models:
- User history as sequence
- RNN/Transformer to encode history
- Predict next item
```

**Interview Questions:**

Q: How would you handle the cold start problem?
A:
```
New Users:
- Content-based: Use user features/demographics
- Popular items: Recommend most popular
- Interview: Ask preferences on onboarding

New Items:
- Content-based: Similar item features
- Explore/exploit: Show to sample users
- Metadata: Use item attributes

Hybrid:
- Combine collaborative + content-based
- Fall back to content when CF fails
```

Q: Explain the two-tower architecture.
A:
```
Architecture:
User Tower:
[user_id, age, gender, history] → MLP → 128-dim user embedding

Item Tower:
[item_id, category, title] → MLP → 128-dim item embedding

Score = dot(user_emb, item_emb)

Training:
- Positive: User interacted with item
- Negative: Random items (in-batch negatives)
- Loss: Cross-entropy or BPR

Serving:
1. Precompute all item embeddings
2. Build ANN index (FAISS, ScaNN)
3. At request: Compute user embedding, query ANN
4. Return top-k items
```

---

## 4.3 Computer Vision

### Image Classification Pipeline

```
Standard Pipeline:
1. Data augmentation
2. Feature extraction (CNN)
3. Global pooling
4. Classification head

Data Augmentation:
- Random crop, flip, rotation
- Color jitter, cutout
- MixUp: x = λx₁ + (1-λ)x₂
- CutMix: Patch from another image
- AutoAugment: Learned policies
```

### Object Detection

```
Two-Stage (Faster R-CNN):
1. Region Proposal Network (RPN)
2. RoI pooling + classification + bbox regression

Single-Stage (YOLO, SSD):
1. Grid-based detection
2. Predict class + bbox for each cell
3. Non-max suppression

Metrics:
IoU = Area(A ∩ B) / Area(A ∪ B)
AP = Area under precision-recall curve
mAP = Mean AP across classes

Anchor Boxes:
- Predefined aspect ratios
- Predict offsets from anchors
- Match to ground truth by IoU
```

### Segmentation

```
Semantic Segmentation:
- Per-pixel classification
- FCN: Fully convolutional
- U-Net: Encoder-decoder with skip connections

Instance Segmentation:
- Detect objects + segment each
- Mask R-CNN: Faster R-CNN + mask branch

Loss:
- Cross-entropy per pixel
- Dice loss: 2|A∩B| / (|A| + |B|)
```

---

## 4.4 Model Deployment & MLOps

### Model Optimization

```
Quantization:
- FP32 → FP16: 2× smaller, minimal accuracy loss
- INT8: 4× smaller, needs calibration
- Quantization-aware training for best results

Pruning:
- Remove small weights (magnitude pruning)
- Structured: Remove entire channels
- Iterative: Prune, fine-tune, repeat

Knowledge Distillation:
Student loss = α × CE(y_true, y_student) 
            + (1-α) × KL(y_teacher/T, y_student/T)
T: Temperature (soften distributions)

ONNX:
- Universal format for models
- Run inference across frameworks
```

### Serving

```
Batch vs Online:
Batch: Process many at once, higher throughput
Online: Single request, low latency

Optimizations:
- Batching: Group requests
- Caching: Store frequent predictions
- Model sharding: Split across GPUs
- Async inference: Non-blocking

Metrics:
- Latency: p50, p95, p99
- Throughput: Requests per second
- Availability: Uptime percentage
```

### Monitoring

```
Data Drift:
- Distribution shift in inputs
- Detect: KL divergence, KS test
- Action: Retrain or alert

Concept Drift:
- Relationship between X and Y changes
- Detect: Monitor prediction distribution, feedback
- Action: Retrain on recent data

Model Metrics:
- Online accuracy/AUC
- Prediction distribution
- Feature importance changes
```

---

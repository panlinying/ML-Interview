# ML Interview Cheat Sheet (Print This!)

Related:
- [[20-ML-Core/Guide/Overview]]
- [[20-ML-Core/Concepts Tracker]]


## MATH ESSENTIALS

```
Dot Product:     a·b = Σaᵢbᵢ = |a||b|cos(θ)
Cosine Sim:      cos(θ) = (a·b)/(|a||b|)
L2 Norm:         ||x||₂ = √(Σxᵢ²)

Bayes:           P(A|B) = P(B|A)P(A)/P(B)
Variance:        Var(X) = E[X²] - (E[X])²
Chain Rule:      d/dx f(g(x)) = f'(g(x))·g'(x)
```

## CLASSICAL ML

```
Linear Reg:      ŷ = Xw + b,  L = (1/n)Σ(y-ŷ)²
Logistic:        ŷ = σ(Xw+b) = 1/(1+e⁻ᶻ)
Cross-Entropy:   L = -Σ[y log(ŷ) + (1-y)log(1-ŷ)]

L1 (Lasso):      L + λΣ|w| → Sparse weights
L2 (Ridge):      L + λΣw²  → Small weights

Entropy:         H = -Σ pᵢ log₂(pᵢ)
Gini:            G = 1 - Σ pᵢ²
Info Gain:       IG = H(parent) - Σ(|Sᵥ|/|S|)H(child)
```

## METRICS

```
Precision = TP/(TP+FP)    "Of predicted +, correct?"
Recall    = TP/(TP+FN)    "Of actual +, found?"
F1        = 2PR/(P+R)     Harmonic mean

AUC-ROC:  TPR vs FPR (use for balanced)
AUC-PR:   Precision vs Recall (use for imbalanced)
```

## NEURAL NETWORKS

```
Forward:         z = Wx + b,  a = σ(z)
Backprop:        ∂L/∂W = ∂L/∂a × ∂a/∂z × ∂z/∂W

ReLU:            max(0, z),     ReLU' = 1 if z>0
Sigmoid:         1/(1+e⁻ᶻ),    σ' = σ(1-σ)
Softmax:         exp(zᵢ)/Σexp(zⱼ)

Xavier Init:     W ~ N(0, 2/(nᵢₙ+nₒᵤₜ))  [tanh/sigmoid]
He Init:         W ~ N(0, 2/nᵢₙ)          [ReLU]

BatchNorm:       x̂ = (x-μ)/√(σ²+ε), y = γx̂+β
Dropout:         Zero p% of activations during training
```

## OPTIMIZATION

```
SGD:             θ = θ - η∇L

Momentum:        v = βv + ∇L
                 θ = θ - ηv

Adam:            m = β₁m + (1-β₁)∇L
                 v = β₂v + (1-β₂)(∇L)²
                 θ = θ - η·m̂/√(v̂+ε)

Default Adam: β₁=0.9, β₂=0.999, ε=1e-8
```

## CNNs

```
Output Size:     (W - K + 2P)/S + 1
Conv Params:     K² × Cᵢₙ × Cₒᵤₜ + Cₒᵤₜ

ResNet Skip:     y = F(x) + x  (gradient highway)
1×1 Conv:        Channel mixing, reduce dimensions
```

## RNNs

```
Vanilla:         hₜ = tanh(Wₕhₜ₋₁ + Wₓxₜ)

LSTM Gates:
  Forget:        fₜ = σ(Wf[hₜ₋₁, xₜ])
  Input:         iₜ = σ(Wi[hₜ₋₁, xₜ])
  Output:        oₜ = σ(Wo[hₜ₋₁, xₜ])
  Cell:          Cₜ = fₜ⊙Cₜ₋₁ + iₜ⊙C̃ₜ
```

## TRANSFORMERS

```
Attention:       softmax(QKᵀ/√dₖ)V

Multi-Head:      Concat(head₁...headₕ)Wᴼ
                 headᵢ = Attention(QWᵢᵠ, KWᵢᴷ, VWᵢⱽ)

Positional:      PE(pos,2i) = sin(pos/10000^(2i/d))

Why scale √dₖ:   Keeps variance stable, prevents
                 softmax saturation
```

## NLP

```
Word2Vec:        Predict context from word (skip-gram)
                 or word from context (CBOW)

BERT:            Bidirectional encoder, MLM + NSP
GPT:             Causal decoder, next token prediction

Perplexity:      PPL = exp(-1/N × Σlog P(wᵢ))
```

## RECOMMENDER SYSTEMS

```
Matrix Factor:   R ≈ PQᵀ (user × item)

Two-Tower:       
  User Tower:    user features → user_emb (128d)
  Item Tower:    item features → item_emb (128d)
  Score:         dot(user_emb, item_emb)

Cold Start:      Use content features, popular items
```

## ML SYSTEM DESIGN FRAMEWORK

```
1. CLARIFY (5 min)
   - Business goal? Constraints? Data?

2. METRICS (5 min)
   - Offline: Precision, Recall, AUC, NDCG
   - Online: CTR, conversion, engagement

3. DATA & FEATURES (10 min)
   - Sources, engineering, feature store

4. MODEL (10 min)
   - Selection, architecture, training

5. SERVING (10 min)
   - Pipeline, latency, scaling

6. MONITORING (5 min)
   - Data drift, model degradation, A/B
```

## RAPID FIRE ANSWERS

```
Bias vs Variance?
→ Bias: wrong assumptions (underfit)
→ Variance: sensitive to data (overfit)

L1 vs L2?
→ L1: sparse (feature selection)
→ L2: small weights (regularization)

Bagging vs Boosting?
→ Bagging: parallel, reduce variance (RF)
→ Boosting: sequential, reduce bias (XGB)

BatchNorm vs LayerNorm?
→ BN: across batch (CNNs)
→ LN: across features (Transformers)

BERT vs GPT?
→ BERT: bidirectional encoder (understanding)
→ GPT: causal decoder (generation)

Why ReLU?
→ No vanishing gradient for z>0
→ Computationally simple
→ Sparse activations
```

## CODE SNIPPETS

```python
# Softmax (numerically stable)
def softmax(x):
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()

# Cross-entropy
def cross_entropy(y, y_hat):
    return -np.sum(y * np.log(y_hat + 1e-9))

# Self-attention
def attention(Q, K, V):
    d_k = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(d_k)
    weights = softmax(scores)
    return weights @ V
```

---
*Keep this handy during study sessions!*

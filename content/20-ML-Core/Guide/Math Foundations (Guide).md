# Math Foundations (Guide)

Related:
- Plan: [[20-ML-Core/Module 01 - Math Foundations + Classical ML]]
- Concepts tracker: [[20-ML-Core/Concepts Tracker#Math]]
- Quick reference: [[20-ML-Core/ML Cheat Sheet]]

## 1.1 Linear Algebra

### Core Concepts to Master

| Concept | What to Know | Interview Relevance |
|---------|--------------|---------------------|
| Vectors | Dot product, norm, unit vectors | Embeddings, similarity |
| Matrices | Multiplication, transpose, inverse | Weight matrices in NN |
| Eigenvalues/Eigenvectors | Definition, computation, meaning | PCA, understanding transformations |
| Matrix Decomposition | SVD, eigendecomposition | Dimensionality reduction, recommendations |
| Linear Independence | Span, basis, rank | Feature selection |

### Key Formulas to Memorize

```
Dot Product:
a · b = Σ(aᵢ × bᵢ) = |a| × |b| × cos(θ)

Cosine Similarity:
cos(θ) = (a · b) / (|a| × |b|)

L2 Norm (Euclidean):
||x||₂ = √(Σxᵢ²)

L1 Norm (Manhattan):
||x||₁ = Σ|xᵢ|

Matrix Multiplication:
(AB)ᵢⱼ = Σₖ Aᵢₖ × Bₖⱼ

Eigenvalue Equation:
Av = λv
where λ is eigenvalue, v is eigenvector
```

### Interview Questions

**Q: What is the geometric interpretation of dot product?**
A: Dot product measures how much two vectors point in the same direction. It equals |a||b|cos(θ), where θ is the angle between them. If orthogonal, dot product = 0.

**Q: Why do we use cosine similarity instead of Euclidean distance for embeddings?**
A: Cosine similarity measures the angle between vectors, ignoring magnitude. This is important for text embeddings where document length shouldn't affect similarity - a longer document isn't necessarily more similar.

**Q: Explain SVD and its applications in ML.**
A: SVD decomposes matrix A = UΣVᵀ where U and V are orthogonal and Σ is diagonal with singular values. Applications:
- Dimensionality reduction (keep top k singular values)
- Matrix completion (recommendations)
- Noise reduction
- Latent semantic analysis in NLP

### Study Resources
- 3Blue1Brown: Essence of Linear Algebra (YouTube playlist)
- Khan Academy: Linear Algebra course
- Book: "Linear Algebra Done Right" by Axler (advanced)

---

## 1.2 Probability & Statistics

### Core Concepts to Master

| Concept | What to Know | Interview Relevance |
|---------|--------------|---------------------|
| Probability Basics | Conditional prob, independence, Bayes | Naive Bayes, probabilistic models |
| Distributions | Normal, Bernoulli, Binomial, Poisson | Data modeling, assumptions |
| Expectation & Variance | E[X], Var(X), properties | Loss functions, bias-variance |
| Maximum Likelihood | MLE derivation, intuition | Training objectives |
| Bayesian Inference | Prior, posterior, likelihood | Bayesian methods |

### Key Formulas to Memorize

```
Bayes' Theorem:
P(A|B) = P(B|A) × P(A) / P(B)

Chain Rule:
P(A,B,C) = P(A) × P(B|A) × P(C|A,B)

Expectation:
E[X] = Σ xᵢ × P(xᵢ)     [discrete]
E[X] = ∫ x × f(x) dx    [continuous]

Variance:
Var(X) = E[(X - μ)²] = E[X²] - (E[X])²

Normal Distribution:
f(x) = (1/√(2πσ²)) × exp(-(x-μ)²/(2σ²))

Bernoulli:
P(X=1) = p, P(X=0) = 1-p
E[X] = p, Var(X) = p(1-p)

Binomial:
P(X=k) = C(n,k) × pᵏ × (1-p)ⁿ⁻ᵏ

Maximum Likelihood:
θ_MLE = argmax_θ Π P(xᵢ|θ)
      = argmax_θ Σ log P(xᵢ|θ)
```

### Interview Questions

**Q: Derive the MLE for the mean of a Gaussian distribution.**
A:
```
Given: x₁, x₂, ..., xₙ ~ N(μ, σ²)

Likelihood: L(μ) = Π (1/√(2πσ²)) × exp(-(xᵢ-μ)²/(2σ²))

Log-likelihood: ℓ(μ) = -n/2 × log(2πσ²) - Σ(xᵢ-μ)²/(2σ²)

Take derivative and set to 0:
dℓ/dμ = Σ(xᵢ-μ)/σ² = 0

Solve: μ_MLE = (1/n) × Σxᵢ = sample mean
```

**Q: Explain the bias-variance tradeoff.**
A:
```
Expected Error = Bias² + Variance + Irreducible Error

Bias: Error from simplifying assumptions (underfitting)
- High bias: Model too simple, misses patterns
- Example: Linear model for non-linear data

Variance: Error from sensitivity to training data (overfitting)
- High variance: Model memorizes training data
- Example: Deep tree with no regularization

Tradeoff: Increasing model complexity decreases bias but increases variance
```

**Q: When would you use Bayesian vs. Frequentist approaches?**
A:
- Bayesian: When you have prior knowledge, small data, need uncertainty estimates
- Frequentist: Large data, need computational efficiency, interpretable point estimates

### Study Resources
- StatQuest: Probability playlist (YouTube)
- Khan Academy: Statistics and Probability
- Book: "All of Statistics" by Wasserman

---

## 1.3 Calculus & Optimization

### Core Concepts to Master

| Concept | What to Know | Interview Relevance |
|---------|--------------|---------------------|
| Derivatives | Chain rule, partial derivatives | Backpropagation |
| Gradients | Gradient vector, directional derivative | Optimization |
| Convexity | Convex functions, local vs global minima | Loss landscape |
| Optimization | Gradient descent variants | Training neural networks |
| Lagrange Multipliers | Constrained optimization | SVM derivation |

### Key Formulas to Memorize

```
Chain Rule:
d/dx f(g(x)) = f'(g(x)) × g'(x)

Gradient:
∇f = [∂f/∂x₁, ∂f/∂x₂, ..., ∂f/∂xₙ]

Gradient Descent Update:
θ = θ - α × ∇L(θ)

Gradient with Momentum:
v = β × v + (1-β) × ∇L(θ)
θ = θ - α × v

Adam Update:
m = β₁ × m + (1-β₁) × g
v = β₂ × v + (1-β₂) × g²
m̂ = m / (1-β₁ᵗ)
v̂ = v / (1-β₂ᵗ)
θ = θ - α × m̂ / (√v̂ + ε)

Convex Function:
f(λx + (1-λ)y) ≤ λf(x) + (1-λ)f(y)
for all λ ∈ [0,1]
```

### Interview Questions

**Q: Derive the gradient of the cross-entropy loss.**
A:
```
Cross-entropy: L = -Σ yᵢ × log(ŷᵢ)

For binary classification with sigmoid:
ŷ = σ(z) = 1/(1+e⁻ᶻ)
L = -[y×log(ŷ) + (1-y)×log(1-ŷ)]

Derivative of sigmoid:
dσ/dz = σ(z) × (1-σ(z)) = ŷ(1-ŷ)

Gradient:
∂L/∂z = -[y/ŷ × ŷ(1-ŷ) - (1-y)/(1-ŷ) × ŷ(1-ŷ)]
      = -[y(1-ŷ) - (1-y)ŷ]
      = -[y - yŷ - ŷ + yŷ]
      = ŷ - y

Beautiful result: gradient is just (prediction - target)!
```

**Q: Why does Adam work better than vanilla SGD?**
A:
- Adaptive learning rates: Different rates for each parameter
- Momentum: Smooths gradients, escapes local minima
- Bias correction: Handles early training instability
- Works well with sparse gradients (NLP, recommendations)

**Q: What problems can occur with gradient descent?**
A:
- Vanishing gradients: Gradients → 0, weights don't update
- Exploding gradients: Gradients → ∞, training unstable
- Saddle points: Gradient = 0 but not minimum
- Local minima: Stuck in suboptimal solution
- Oscillation: Learning rate too high

---

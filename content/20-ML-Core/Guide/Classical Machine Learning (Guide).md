# Classical Machine Learning (Guide)

Related:
- Plan: [[20-ML-Core/Module 01 - Math Foundations + Classical ML]]
- Concepts tracker: [[20-ML-Core/Concepts Tracker#Classical ML]]
- Quick reference: [[20-ML-Core/ML Cheat Sheet]]

## 2.1 Linear Models

### Linear Regression

**What to Know:**
```
Model: ŷ = Xw + b

Loss Function (MSE):
L = (1/n) × Σ(yᵢ - ŷᵢ)²

Closed-form Solution:
w = (XᵀX)⁻¹Xᵀy

Gradient:
∂L/∂w = (2/n) × Xᵀ(Xw - y)

Assumptions:
1. Linear relationship
2. Independence of errors
3. Homoscedasticity (constant variance)
4. Normality of errors (for inference)
```

**Interview Questions:**

Q: When would closed-form solution fail?
A: When XᵀX is singular (not invertible), which happens with:
- Multicollinearity (correlated features)
- More features than samples (n < d)
- Solution: Use regularization or gradient descent

Q: What's the difference between L1 and L2 regularization?
A:
```
L2 (Ridge): L + λ||w||₂²
- Shrinks weights toward 0
- Doesn't produce sparse solutions
- Closed-form solution exists

L1 (Lasso): L + λ||w||₁
- Can shrink weights exactly to 0
- Produces sparse solutions (feature selection)
- No closed-form, needs optimization

Elastic Net: L + λ₁||w||₁ + λ₂||w||₂²
- Combines benefits of both
```

### Logistic Regression

**What to Know:**
```
Model:
z = Xw + b
ŷ = σ(z) = 1/(1+e⁻ᶻ)

Interpretation: P(y=1|X) = ŷ

Loss (Binary Cross-Entropy):
L = -(1/n) × Σ[yᵢ log(ŷᵢ) + (1-yᵢ)log(1-ŷᵢ)]

Gradient:
∂L/∂w = (1/n) × Xᵀ(ŷ - y)

Decision Boundary:
Xw + b = 0 (hyperplane)
```

**Interview Questions:**

Q: Why use cross-entropy instead of MSE for classification?
A:
- MSE with sigmoid creates non-convex loss (multiple local minima)
- Cross-entropy is convex for logistic regression
- Cross-entropy gradient is stronger when prediction is wrong
- Cross-entropy relates to maximum likelihood estimation

Q: How do you handle multi-class classification?
A:
```
Softmax:
ŷᵢ = exp(zᵢ) / Σⱼexp(zⱼ)

Cross-entropy:
L = -Σᵢ yᵢ × log(ŷᵢ)

One-vs-All: Train K binary classifiers
One-vs-One: Train K(K-1)/2 classifiers
```

---

## 2.2 Tree-Based Models

### Decision Trees

**What to Know:**
```
Splitting Criteria:

Entropy:
H(S) = -Σ pᵢ × log₂(pᵢ)

Information Gain:
IG(S, A) = H(S) - Σ (|Sᵥ|/|S|) × H(Sᵥ)

Gini Impurity:
Gini(S) = 1 - Σ pᵢ²

For regression: Use variance reduction
Variance(S) = (1/n) × Σ(yᵢ - ȳ)²
```

**Interview Questions:**

Q: How do you prevent overfitting in decision trees?
A:
- Max depth: Limit tree depth
- Min samples split: Require minimum samples to split
- Min samples leaf: Require minimum samples in leaf
- Pruning: Remove branches that don't improve validation
- Max features: Random subset of features at each split

Q: Compare Gini vs Entropy.
A:
- Gini: Faster (no log computation), tends to isolate most frequent class
- Entropy: Slightly more balanced splits
- In practice: Similar performance, Gini preferred for speed

### Random Forest

**What to Know:**
```
Key Concepts:
1. Bagging: Bootstrap samples (sample with replacement)
2. Feature randomness: Random subset at each split
3. Aggregation: Average (regression) or vote (classification)

Hyperparameters:
- n_estimators: Number of trees (more = better, diminishing returns)
- max_features: sqrt(n) for classification, n/3 for regression
- max_depth: Usually None (fully grown trees)
- min_samples_leaf: 1 for classification, 5 for regression

Out-of-Bag Error:
~37% samples not in each bootstrap → use for validation
```

**Interview Questions:**

Q: Why does Random Forest reduce variance?
A:
- Individual trees are high variance (overfit)
- Bagging: Averaging reduces variance by factor of n
- Feature randomness: Decorrelates trees, further reducing variance
- Result: Var(avg) = Var(tree)/n × (1 + (n-1)ρ), where ρ is correlation

Q: When would you choose Random Forest over Gradient Boosting?
A:
- Random Forest: Faster training, parallelizable, less hyperparameter tuning
- Gradient Boosting: Usually higher accuracy, but slower and prone to overfit
- RF good for: Quick baseline, high-dimensional data, when training time matters

### Gradient Boosting (XGBoost, LightGBM)

**What to Know:**
```
Key Concept: Additive model
F(x) = Σ fₘ(x)

Each tree fits the negative gradient (residuals):
fₘ(x) = argmin Σ L(yᵢ, Fₘ₋₁(xᵢ) + f(xᵢ))

For MSE loss: gradient = -(y - ŷ) = residuals

XGBoost Objective:
Obj = Σ L(yᵢ, ŷᵢ) + Σ Ω(fₘ)
Ω(f) = γT + (1/2)λ||w||²

T = number of leaves
w = leaf weights

Key Hyperparameters:
- learning_rate (eta): 0.01-0.3
- n_estimators: 100-1000
- max_depth: 3-10 (usually 6)
- subsample: 0.5-1.0
- colsample_bytree: 0.5-1.0
- reg_alpha (L1), reg_lambda (L2)
```

**Interview Questions:**

Q: Explain the difference between bagging and boosting.
A:
```
Bagging (Random Forest):
- Parallel: Trees trained independently
- Bootstrap samples
- Reduces variance
- Hard to overfit

Boosting (XGBoost):
- Sequential: Each tree corrects previous errors
- Weighted samples or residuals
- Reduces bias
- Can overfit if not regularized
```

Q: How does XGBoost handle missing values?
A: XGBoost learns optimal direction for missing values during training. At each split, it tries both directions for missing values and picks the one with best gain.

---

## 2.3 Support Vector Machines

**What to Know:**
```
Linear SVM Objective:
min (1/2)||w||² + C × Σ max(0, 1 - yᵢ(w·xᵢ + b))

Margin: 2/||w||
Support Vectors: Points on or inside margin

Kernel Trick:
K(x, x') = φ(x)·φ(x')

Common Kernels:
- Linear: K(x,x') = x·x'
- Polynomial: K(x,x') = (γx·x' + r)ᵈ
- RBF: K(x,x') = exp(-γ||x-x'||²)

Dual Formulation:
max Σαᵢ - (1/2)ΣΣ αᵢαⱼyᵢyⱼK(xᵢ,xⱼ)
s.t. Σαᵢyᵢ = 0, 0 ≤ αᵢ ≤ C
```

**Interview Questions:**

Q: What is the kernel trick and why is it useful?
A: Kernel trick computes dot products in high-dimensional space without explicitly computing the transformation. This allows SVMs to find non-linear decision boundaries efficiently. Example: RBF kernel implicitly maps to infinite dimensions.

Q: What is the role of C in SVM?
A:
- Large C: Small margin, fewer misclassifications, risk of overfitting
- Small C: Large margin, more misclassifications, better generalization
- C controls bias-variance tradeoff

---

## 2.4 Clustering

### K-Means

**What to Know:**
```
Algorithm:
1. Initialize K centroids randomly
2. Assign each point to nearest centroid
3. Update centroids as mean of assigned points
4. Repeat until convergence

Objective:
min Σₖ Σ_{x∈Cₖ} ||x - μₖ||²

Choosing K:
- Elbow method: Plot inertia vs K
- Silhouette score: Measure cluster quality
- Domain knowledge
```

**Interview Questions:**

Q: What are K-means limitations?
A:
- Assumes spherical clusters
- Sensitive to initialization (use K-means++)
- Must specify K in advance
- Sensitive to outliers
- Only finds convex clusters

Q: Explain K-means++ initialization.
A:
1. Choose first centroid uniformly at random
2. For each point, compute distance to nearest centroid
3. Choose next centroid with probability proportional to distance²
4. Repeat until K centroids chosen
- This spreads centroids apart, leading to better convergence

### Other Clustering Methods

```
Hierarchical Clustering:
- Agglomerative: Bottom-up, merge closest clusters
- Divisive: Top-down, split clusters
- Linkage: Single, complete, average, Ward's

DBSCAN:
- Density-based: Clusters are dense regions
- Parameters: eps (radius), min_samples
- Can find arbitrary shapes
- Handles outliers (noise points)

Gaussian Mixture Models:
- Soft clustering (probabilities)
- EM algorithm: E-step (assign), M-step (update)
- Can model elliptical clusters
```

---

## 2.5 Dimensionality Reduction

### PCA (Principal Component Analysis)

**What to Know:**
```
Goal: Find directions of maximum variance

Algorithm:
1. Center data: X = X - mean
2. Compute covariance: C = XᵀX/(n-1)
3. Eigendecomposition: C = VΛVᵀ
4. Select top k eigenvectors
5. Project: Z = XV_k

Variance explained:
Ratio = λₖ / Σλᵢ

Properties:
- Components are orthogonal
- First component has maximum variance
- Linear transformation
```

**Interview Questions:**

Q: When would PCA fail?
A:
- Non-linear relationships (use kernel PCA or t-SNE)
- Data not centered
- Features on different scales (need standardization)
- When variance ≠ importance

Q: Explain the difference between PCA and t-SNE.
A:
```
PCA:
- Linear transformation
- Preserves global structure
- Fast, deterministic
- Good for preprocessing

t-SNE:
- Non-linear transformation
- Preserves local structure
- Slow, stochastic
- Good for visualization
- Not suitable for new data (no transform)
```

---

## 2.6 Evaluation Metrics

### Classification Metrics

```
Confusion Matrix:
                Predicted
              Pos    Neg
Actual Pos    TP     FN
       Neg    FP     TN

Accuracy = (TP + TN) / (TP + TN + FP + FN)

Precision = TP / (TP + FP)
"Of predicted positives, how many are correct?"

Recall (Sensitivity) = TP / (TP + FN)
"Of actual positives, how many did we find?"

F1 = 2 × (Precision × Recall) / (Precision + Recall)

Specificity = TN / (TN + FP)
"Of actual negatives, how many did we identify?"

AUC-ROC:
- ROC: TPR vs FPR at various thresholds
- AUC: Area under ROC curve
- 0.5 = random, 1.0 = perfect

AUC-PR (Precision-Recall):
- Better for imbalanced datasets
- Precision vs Recall at various thresholds
```

**Interview Questions:**

Q: When would you optimize for precision vs recall?
A:
```
High Precision Priority:
- Spam detection (don't want to miss important emails)
- Recommendation (bad recommendations hurt trust)

High Recall Priority:
- Cancer detection (don't want to miss cases)
- Fraud detection (cost of missed fraud is high)
```

Q: Why use AUC-PR for imbalanced data?
A: AUC-ROC can be misleadingly high on imbalanced data because TN dominates. AUC-PR focuses only on positive class, giving a more realistic picture.

### Regression Metrics

```
MSE = (1/n) × Σ(y - ŷ)²
RMSE = √MSE
MAE = (1/n) × Σ|y - ŷ|
R² = 1 - (SS_res / SS_tot) = 1 - Σ(y-ŷ)² / Σ(y-ȳ)²

MAPE = (100/n) × Σ|y - ŷ| / |y|
```

**Interview Questions:**

Q: When to use MAE vs MSE?
A:
- MSE: Penalizes large errors more, sensitive to outliers
- MAE: More robust to outliers, harder to optimize (non-differentiable at 0)
- Use MAE when outliers should be treated equally
- Use MSE when large errors are especially bad

### Ranking Metrics

```
NDCG (Normalized Discounted Cumulative Gain):
DCG = Σ (2^relᵢ - 1) / log₂(i + 1)
NDCG = DCG / IDCG

MRR (Mean Reciprocal Rank):
MRR = (1/|Q|) × Σ (1/rankᵢ)

MAP (Mean Average Precision):
AP = Σ (P@k × rel(k)) / (# relevant)
MAP = mean of APs across queries
```

---

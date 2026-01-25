# Interview Question Bank (Guide)

Related:
- Quick reference: [[20-ML-Core/ML Cheat Sheet]]
- Study schedule: [[20-ML-Core/Guide/Study Schedule Summary (Guide)]]

## Rapid-Fire Questions (Know Immediately)

```
Q: Bias vs Variance?
A: Bias = error from wrong assumptions (underfitting)
   Variance = error from sensitivity to training data (overfitting)

Q: L1 vs L2 regularization?
A: L1 = sparse weights (feature selection)
   L2 = small weights (prevents overfitting)

Q: Precision vs Recall?
A: Precision = TP/(TP+FP), "of predicted positive, how many correct"
   Recall = TP/(TP+FN), "of actual positive, how many found"

Q: Bagging vs Boosting?
A: Bagging = parallel, reduce variance (Random Forest)
   Boosting = sequential, reduce bias (XGBoost)

Q: Batch vs Stochastic Gradient Descent?
A: Batch = all data per update, stable but slow
   SGD = one sample per update, noisy but fast
   Mini-batch = compromise, standard practice

Q: Why ReLU over sigmoid?
A: No vanishing gradient for positive values
   Computationally simpler
   Sparsity (neurons can be off)

Q: What is dropout?
A: Randomly zero activations during training
   Prevents co-adaptation
   Ensemble effect

Q: BatchNorm purpose?
A: Normalize activations per batch
   Allows higher learning rates
   Reduces internal covariate shift

Q: Attention mechanism?
A: Weighted sum of values based on query-key similarity
   Allows focusing on relevant parts
   Handles variable-length sequences

Q: Transformer vs RNN?
A: Transformer = parallel, global attention, O(n²) memory
   RNN = sequential, local by default, O(n) memory
```

## Common Coding Questions

```python
# 1. Implement softmax
def softmax(x):
    exp_x = np.exp(x - np.max(x))  # stability
    return exp_x / exp_x.sum()

# 2. Implement cross-entropy loss
def cross_entropy(y_true, y_pred):
    return -np.sum(y_true * np.log(y_pred + 1e-9))

# 3. Implement batch normalization forward
def batchnorm_forward(x, gamma, beta, eps=1e-5):
    mu = x.mean(axis=0)
    var = x.var(axis=0)
    x_norm = (x - mu) / np.sqrt(var + eps)
    return gamma * x_norm + beta

# 4. Implement dropout forward
def dropout_forward(x, p, train=True):
    if train:
        mask = (np.random.rand(*x.shape) > p) / (1 - p)
        return x * mask
    return x

# 5. Implement convolution (simple)
def conv2d(x, kernel, stride=1, pad=0):
    x_padded = np.pad(x, pad)
    H, W = x_padded.shape
    kH, kW = kernel.shape
    out_H = (H - kH) // stride + 1
    out_W = (W - kW) // stride + 1
    out = np.zeros((out_H, out_W))
    for i in range(out_H):
        for j in range(out_W):
            out[i,j] = np.sum(
                x_padded[i*stride:i*stride+kH, j*stride:j*stride+kW] * kernel
            )
    return out
```

---

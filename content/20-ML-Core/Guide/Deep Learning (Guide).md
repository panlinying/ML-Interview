# Deep Learning (Guide)

Related:
- Plan: [[20-ML-Core/Module 02 - Deep Learning Foundations]]
- Concepts tracker: [[20-ML-Core/Concepts Tracker#Deep Learning]]
- Quick reference: [[20-ML-Core/ML Cheat Sheet]]

## 3.1 Neural Network Fundamentals

### Forward Propagation

```
Layer computation:
z = Wx + b
a = activation(z)

Common Activations:
Sigmoid: σ(z) = 1/(1+e⁻ᶻ)
Tanh: tanh(z) = (eᶻ - e⁻ᶻ)/(eᶻ + e⁻ᶻ)
ReLU: max(0, z)
Leaky ReLU: max(αz, z), α ≈ 0.01
GELU: z × Φ(z), used in transformers
Softmax: exp(zᵢ)/Σexp(zⱼ)
```

### Backpropagation

```
Chain Rule Application:
∂L/∂W = ∂L/∂a × ∂a/∂z × ∂z/∂W

For each layer l:
δˡ = (Wˡ⁺¹)ᵀδˡ⁺¹ ⊙ g'(zˡ)
∂L/∂Wˡ = δˡ(aˡ⁻¹)ᵀ
∂L/∂bˡ = δˡ

Derivatives:
σ'(z) = σ(z)(1-σ(z))
tanh'(z) = 1 - tanh²(z)
ReLU'(z) = 1 if z > 0 else 0
```

**Interview Questions:**

Q: Why do we need non-linear activations?
A: Without non-linearity, any composition of linear layers is still linear. The network could only learn linear functions, regardless of depth. Non-linearity allows learning complex patterns.

Q: Explain the vanishing gradient problem.
A:
```
With sigmoid/tanh:
- σ'(z) ≤ 0.25 (maximum at z=0)
- Gradients multiply through layers
- n layers → gradient ≤ 0.25ⁿ → vanishes

Solutions:
1. ReLU activation (gradient = 1 for z > 0)
2. Residual connections (gradient highway)
3. Batch normalization
4. LSTM/GRU for sequences
5. Proper initialization
```

### Weight Initialization

```
Xavier (Glorot):
W ~ N(0, 2/(n_in + n_out))
Good for: tanh, sigmoid

He Initialization:
W ~ N(0, 2/n_in)
Good for: ReLU

Why it matters:
- Too small: Vanishing gradients, activations → 0
- Too large: Exploding gradients, activations saturate
```

### Regularization

```
L2 Regularization (Weight Decay):
L_total = L + λ × Σw²

Dropout:
- Training: Randomly zero activations with prob p
- Inference: Scale by (1-p) or use inverted dropout
- Effect: Ensemble of sub-networks

Batch Normalization:
μ = (1/m) × Σxᵢ
σ² = (1/m) × Σ(xᵢ - μ)²
x̂ᵢ = (xᵢ - μ) / √(σ² + ε)
yᵢ = γx̂ᵢ + β (learnable)

Benefits:
- Reduces internal covariate shift
- Allows higher learning rates
- Slight regularization effect

Layer Normalization:
- Normalize across features (not batch)
- Used in transformers
- Works with any batch size
```

**Interview Questions:**

Q: Why does dropout work?
A:
- Prevents co-adaptation of neurons
- Approximates ensemble of networks
- Each training step uses different sub-network
- At test time, average of all sub-networks

Q: When to use BatchNorm vs LayerNorm?
A:
- BatchNorm: CNNs, stable batch statistics, training mode matters
- LayerNorm: Transformers, RNNs, variable sequence lengths, works with batch size 1

---

## 3.2 Convolutional Neural Networks (CNNs)

### Core Operations

```
Convolution:
Output[i,j] = Σₘ Σₙ Input[i+m, j+n] × Kernel[m,n]

Output Size:
out = (in + 2×padding - kernel) / stride + 1

Parameters:
Conv layer: kernel_size² × in_channels × out_channels + out_channels

Pooling:
- Max pooling: Take max in window
- Average pooling: Take mean in window
- Global pooling: Pool over entire spatial dimension
```

### Key Architectures

```
LeNet-5 (1998):
Conv → Pool → Conv → Pool → FC → FC → Output
- First successful CNN

AlexNet (2012):
- Deeper, ReLU activation
- Dropout, data augmentation
- Won ImageNet

VGG (2014):
- 3×3 convolutions only
- Deeper is better
- VGG16: 138M parameters

ResNet (2015):
- Skip connections: y = F(x) + x
- Solves vanishing gradient
- Can train 100+ layers
- Key insight: Easier to learn residual F(x) = H(x) - x

Inception/GoogLeNet:
- Parallel branches with different kernel sizes
- 1×1 convolutions reduce dimensions
- Computationally efficient

EfficientNet:
- Compound scaling (depth, width, resolution)
- NAS-designed architecture
```

**Interview Questions:**

Q: Explain why ResNet works so well.
A:
```
Skip Connection: y = F(x) + x

Benefits:
1. Gradient flows directly through skip (avoids vanishing)
2. Easy to learn identity (just make F(x)=0)
3. Ensemble effect (exponentially many paths)
4. Features from different depths combined

Why residual easier to learn:
- If identity is optimal, F(x)=0 easier than learning identity
- Small perturbations around identity
```

Q: What is the purpose of 1×1 convolutions?
A:
- Reduce/increase channels (dimensionality reduction)
- Add non-linearity without changing spatial size
- Cross-channel information mixing
- Significantly reduces parameters

Q: How would you handle different image sizes in CNN?
A:
- Global average pooling before FC layers
- Spatial pyramid pooling
- Resize/crop during preprocessing
- Fully convolutional networks

---

## 3.3 Recurrent Neural Networks (RNNs)

### Vanilla RNN

```
Hidden State:
hₜ = tanh(Wₕₕhₜ₋₁ + Wₓₕxₜ + b)

Output:
yₜ = Wₕᵧhₜ

Problem: Vanishing/Exploding Gradients
∂h_T/∂h_1 = Π ∂hₜ/∂hₜ₋₁
= Π Wₕₕ × diag(tanh'(zₜ))

If ||W|| < 1: gradients vanish
If ||W|| > 1: gradients explode
```

### LSTM (Long Short-Term Memory)

```
Forget Gate:
fₜ = σ(Wf[hₜ₋₁, xₜ] + bf)

Input Gate:
iₜ = σ(Wi[hₜ₋₁, xₜ] + bi)
C̃ₜ = tanh(Wc[hₜ₋₁, xₜ] + bc)

Cell State Update:
Cₜ = fₜ ⊙ Cₜ₋₁ + iₜ ⊙ C̃ₜ

Output Gate:
oₜ = σ(Wo[hₜ₋₁, xₜ] + bo)
hₜ = oₜ ⊙ tanh(Cₜ)

Why it works:
- Cell state provides gradient highway
- Gates control information flow
- Can learn long-range dependencies
```

### GRU (Gated Recurrent Unit)

```
Update Gate:
zₜ = σ(Wz[hₜ₋₁, xₜ])

Reset Gate:
rₜ = σ(Wr[hₜ₋₁, xₜ])

Candidate:
h̃ₜ = tanh(W[rₜ ⊙ hₜ₋₁, xₜ])

Output:
hₜ = (1-zₜ) ⊙ hₜ₋₁ + zₜ ⊙ h̃ₜ

GRU vs LSTM:
- Fewer parameters (2 gates vs 3)
- Similar performance
- Often faster to train
```

**Interview Questions:**

Q: Why does LSTM solve vanishing gradients?
A:
```
Cell state update: Cₜ = fₜ × Cₜ₋₁ + iₜ × C̃ₜ

Gradient through cell state:
∂Cₜ/∂Cₜ₋₁ = fₜ

If forget gate ≈ 1:
- Gradient flows unchanged (like skip connection)
- No multiplicative degradation
- Can preserve information across many steps
```

Q: Explain bidirectional RNNs.
A:
- Two RNNs: forward and backward
- Capture context from both directions
- Concatenate hidden states: h = [h→; h←]
- Used when future context is available (not for generation)

---

## 3.4 Attention & Transformers

### Attention Mechanism

```
Basic Attention:
score(query, key) → weights → weighted sum of values

Additive (Bahdanau):
score(q, k) = vᵀ tanh(W₁q + W₂k)

Dot-product:
score(q, k) = qᵀk

Scaled Dot-product (Transformer):
Attention(Q, K, V) = softmax(QKᵀ/√dₖ)V

Why scale by √dₖ:
- Dot products grow with dimension
- Large values → softmax saturates → tiny gradients
- Scaling keeps variance stable
```

### Transformer Architecture

```
Multi-Head Attention:
MultiHead(Q, K, V) = Concat(head₁, ..., headₕ)Wᴼ
headᵢ = Attention(QWᵢᵠ, KWᵢᴷ, VWᵢⱽ)

Why multi-head:
- Different heads learn different patterns
- Relationships at different positions/subspaces

Positional Encoding:
PE(pos, 2i) = sin(pos/10000^(2i/d))
PE(pos, 2i+1) = cos(pos/10000^(2i/d))

Why sinusoidal:
- Can extrapolate to longer sequences
- Relative positions are linear functions

Feed-Forward Network:
FFN(x) = max(0, xW₁ + b₁)W₂ + b₂
- Applied to each position independently
- Adds capacity and non-linearity

Layer Normalization:
- Applied before or after each sub-layer
- Pre-LN: More stable training
- Post-LN: Original paper, needs warmup

Encoder Block:
x → LayerNorm → MultiHeadAttn → +x → LayerNorm → FFN → +x

Decoder Block:
x → LayerNorm → MaskedMultiHeadAttn → +x 
  → LayerNorm → CrossAttn(encoder) → +x 
  → LayerNorm → FFN → +x

Masking:
- Padding mask: Ignore padding tokens
- Causal mask: Prevent attending to future (decoder)
```

### Key Transformer Variants

```
BERT (Bidirectional Encoder):
- Encoder only
- Pre-training: Masked LM + Next Sentence Prediction
- Fine-tuning: Add task-specific head
- [CLS] token for classification

GPT (Decoder):
- Decoder only (causal attention)
- Autoregressive: Predict next token
- Larger = better (scaling laws)

T5 (Encoder-Decoder):
- Text-to-text framework
- All tasks as text generation

Vision Transformer (ViT):
- Patches as tokens
- Position embeddings for patch positions
- Works well with lots of data
```

**Interview Questions:**

Q: Why is self-attention O(n²) and how to reduce it?
A:
```
Standard: QKᵀ is n×n matrix for sequence length n

Efficient Transformers:
- Sparse attention: Only attend to subset (local + global)
- Linear attention: Kernel approximation, O(n)
- Linformer: Low-rank projection of K, V
- Performer: Random feature approximation
- Flash Attention: IO-aware implementation, exact but faster
```

Q: Explain the difference between encoder and decoder attention.
A:
```
Encoder (Self-attention):
- Bidirectional: Each position attends to all positions
- Used for understanding/encoding

Decoder Self-attention (Causal):
- Unidirectional: Only attend to previous positions
- Mask future positions (set to -∞ before softmax)
- For generation

Cross-attention (Decoder):
- Query from decoder, Key/Value from encoder
- Allows decoder to attend to input
```

Q: Implement self-attention in code.
A:
```python
import torch
import torch.nn.functional as F

def self_attention(Q, K, V, mask=None):
    """
    Q, K, V: (batch, seq_len, d_k)
    """
    d_k = Q.size(-1)
    
    # Compute attention scores
    scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d_k)
    
    # Apply mask (for causal or padding)
    if mask is not None:
        scores = scores.masked_fill(mask == 0, -1e9)
    
    # Softmax to get attention weights
    weights = F.softmax(scores, dim=-1)
    
    # Weighted sum of values
    output = torch.matmul(weights, V)
    
    return output, weights
```

---

## 3.5 Training Deep Networks

### Optimization

```
SGD:
θ = θ - η∇L

Momentum:
v = βv + ∇L
θ = θ - ηv

Nesterov:
v = βv + ∇L(θ - βv)
θ = θ - ηv

AdaGrad:
g² = g² + (∇L)²
θ = θ - η∇L/√(g² + ε)

RMSprop:
g² = βg² + (1-β)(∇L)²
θ = θ - η∇L/√(g² + ε)

Adam:
m = β₁m + (1-β₁)∇L
v = β₂v + (1-β₂)(∇L)²
m̂ = m/(1-β₁ᵗ)
v̂ = v/(1-β₂ᵗ)
θ = θ - ηm̂/(√v̂ + ε)

Default: β₁=0.9, β₂=0.999, ε=1e-8
```

### Learning Rate Scheduling

```
Step Decay:
η = η₀ × γ^(epoch/step_size)

Exponential:
η = η₀ × γ^epoch

Cosine Annealing:
η = η_min + (η_max - η_min) × (1 + cos(πt/T))/2

Warmup:
η = η_max × (t/warmup_steps) for t < warmup_steps

One Cycle:
- Linear warmup to max
- Cosine decay to min
- Often best for transformers
```

### Gradient Clipping

```
Clip by Value:
g = clip(g, -threshold, threshold)

Clip by Norm (preferred):
if ||g|| > threshold:
    g = g × threshold / ||g||

Why needed:
- Prevents exploding gradients
- Especially important for RNNs
- Common threshold: 1.0 or 5.0
```

**Interview Questions:**

Q: How would you debug a model that's not training?
A:
```
Checklist:
1. Learning rate: Try 1e-3, 1e-4, 1e-5
2. Check gradients: Are they vanishing/exploding?
3. Overfit small batch: Can model memorize 10 examples?
4. Check data: Are labels correct? Preprocessing issues?
5. Weight initialization: Using appropriate method?
6. Loss function: Correct for task?
7. Architecture: Any mistakes in forward pass?
8. Normalization: Is data normalized?
```

Q: How do you choose batch size?
A:
- Larger batch: More stable gradients, faster training (parallelism)
- Smaller batch: Better generalization, regularization effect
- Typical: 32-256 for CV, larger for NLP/transformers
- Limited by GPU memory
- Linear scaling rule: If batch size × k, then learning rate × k

---

## 3.6 Loss Functions

### Classification

```
Binary Cross-Entropy:
L = -[y log(ŷ) + (1-y) log(1-ŷ)]

Categorical Cross-Entropy:
L = -Σ yᵢ log(ŷᵢ)

Focal Loss (for imbalanced):
L = -αₜ(1-pₜ)^γ log(pₜ)
γ: Focus on hard examples
α: Class weighting

Label Smoothing:
y_smooth = (1-ε)y + ε/K
Prevents overconfidence
```

### Regression

```
MSE (L2):
L = (1/n)Σ(y - ŷ)²

MAE (L1):
L = (1/n)Σ|y - ŷ|

Huber (Smooth L1):
L = 0.5(y-ŷ)² if |y-ŷ| < δ
    δ(|y-ŷ| - 0.5δ) otherwise
- Combines MSE (small errors) and MAE (large errors)
```

### Embedding/Metric Learning

```
Triplet Loss:
L = max(0, d(a,p) - d(a,n) + margin)
a: anchor, p: positive, n: negative

Contrastive Loss (SimCLR):
L = -log(exp(sim(zᵢ,zⱼ)/τ) / Σₖexp(sim(zᵢ,zₖ)/τ))
τ: temperature

InfoNCE:
L = -log(exp(q·k⁺/τ) / Σexp(q·k/τ))
```

---

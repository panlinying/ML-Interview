# Concepts Tracker (ML Fundamentals)

Use this to track coverage across the fundamentals. Check items as you master them.

Related:
- [[30-ML-Fundamentals/Guide/Overview]]
- [[00-Reference/ML Cheat Sheet]]

## Math
### Calculus
- [ ] MATH-011 Chain Rule (High, Not Started, Week 1) :: Formula: d/dx f(g(x)) = f'(g(x))g'(x) :: Interview: How is chain rule used in backprop? :: Resource: https://www.youtube.com/watch?v=YG15m2VwSjA :: Notes: Backpropagation foundation
- [ ] MATH-012 Gradient (High, Not Started, Week 1) :: Formula: ∇f = [∂f/∂x₁ ... ∂f/∂xₙ] :: Interview: What is the gradient? :: Resource: https://www.youtube.com/watch?v=GkB4vW16QHI :: Notes: Direction of steepest ascent
- [ ] MATH-013 Convexity (Medium, Not Started, Week 1) :: Formula: f(λx+(1-λ)y) ≤ λf(x)+(1-λ)f(y) :: Interview: Why is convexity important for optimization? :: Resource: https://www.youtube.com/watch?v=kcOodzDGV4c :: Notes: Guarantees global minimum

### Linear Algebra
- [ ] MATH-001 Dot Product (High, Not Started, Week 1) :: Formula: a·b = Σ(aᵢ×bᵢ) = |a||b|cos(θ) :: Interview: What is the geometric interpretation of dot product? :: Resource: https://www.youtube.com/watch?v=LyGKycYT2v0 :: Notes: Measures similarity between vectors
- [ ] MATH-002 Cosine Similarity (High, Not Started, Week 1) :: Formula: cos(θ) = (a·b)/(|a|×|b|) :: Interview: Why use cosine similarity for embeddings? :: Resource: https://www.youtube.com/watch?v=e9U0QAFbfLI :: Notes: Ignores magnitude focuses on direction
- [ ] MATH-003 Matrix Multiplication (High, Not Started, Week 1) :: Formula: (AB)ᵢⱼ = Σₖ Aᵢₖ × Bₖⱼ :: Interview: Explain matrix multiplication complexity :: Resource: https://www.youtube.com/watch?v=XkY2DOUCWMU :: Notes: O(n³) naive - foundation of neural networks
- [ ] MATH-004 Eigenvalues/Eigenvectors (Medium, Not Started, Week 1) :: Formula: Av = λv :: Interview: What are eigenvalues used for in ML? :: Resource: https://www.youtube.com/watch?v=PFDu9oVAE-g :: Notes: PCA dimensionality reduction
- [ ] MATH-005 SVD (High, Not Started, Week 1) :: Formula: A = UΣVᵀ :: Interview: Explain SVD applications in ML :: Resource: https://www.youtube.com/watch?v=nbBvuuNVfco :: Notes: Recommendations matrix completion

### Probability
- [ ] MATH-006 Bayes Theorem (High, Not Started, Week 1) :: Formula: P(A|B) = P(B|A)P(A)/P(B) :: Interview: Derive Naive Bayes classifier :: Resource: https://www.youtube.com/watch?v=9wCnvr7Xw4E :: Notes: Foundation of probabilistic ML
- [ ] MATH-007 Expectation (High, Not Started, Week 1) :: Formula: E[X] = Σ xᵢP(xᵢ) :: Interview: What is expectation of X²? :: Resource: https://www.youtube.com/watch?v=KLs_7b7SKi4 :: Notes: Mean of random variable
- [ ] MATH-008 Variance (High, Not Started, Week 1) :: Formula: Var(X) = E[X²] - (E[X])² :: Interview: Derive variance formula :: Resource: https://www.youtube.com/watch?v=Qf3RMGXR-h8 :: Notes: Spread of distribution
- [ ] MATH-009 Normal Distribution (High, Not Started, Week 1) :: Formula: f(x) = (1/√2πσ²)exp(-(x-μ)²/2σ²) :: Interview: Why is normal distribution important? :: Resource: https://www.youtube.com/watch?v=rzFX5NWojp0 :: Notes: Central limit theorem
- [ ] MATH-010 MLE (High, Not Started, Week 1) :: Formula: θ_MLE = argmax Π P(xᵢ|θ) :: Interview: Derive MLE for Gaussian mean :: Resource: https://www.youtube.com/watch?v=XepXtl9YKwc :: Notes: Training objective foundation

## Classical ML
### Ensemble
- [ ] ML-010 Random Forest (High, Not Started, Week 3) :: Formula: Bagging + feature randomness :: Interview: Why does RF reduce variance? :: Resource: https://www.youtube.com/watch?v=J4Wdy0Wc_xQ :: Notes: Ensemble of trees
- [ ] ML-011 Bagging (High, Not Started, Week 3) :: Formula: Bootstrap + aggregate :: Interview: Bagging vs Boosting? :: Resource: https://www.youtube.com/watch?v=2Mg8QD0F1dQ :: Notes: Parallel variance reduction
- [ ] ML-012 Boosting (High, Not Started, Week 3) :: Formula: Sequential residual fitting :: Interview: How does gradient boosting work? :: Resource: https://www.youtube.com/watch?v=3CC4N4z3GJc :: Notes: Sequential bias reduction
- [ ] ML-013 XGBoost (High, Not Started, Week 3) :: Formula: Obj = L + γT + λ||w||² :: Interview: XGBoost vs Random Forest? :: Resource: https://www.youtube.com/watch?v=OtD8wVaFm6E :: Notes: State-of-art tabular

### Metrics
- [ ] ML-018 Precision (High, Not Started, Week 2) :: Formula: TP/(TP+FP) :: Interview: When optimize for precision? :: Resource: https://www.youtube.com/watch?v=j-EB6RqqjGI :: Notes: Of predicted positive correct
- [ ] ML-019 Recall (High, Not Started, Week 2) :: Formula: TP/(TP+FN) :: Interview: When optimize for recall? :: Resource: https://www.youtube.com/watch?v=j-EB6RqqjGI :: Notes: Of actual positive found
- [ ] ML-020 F1 Score (High, Not Started, Week 2) :: Formula: 2×P×R/(P+R) :: Interview: When use F1? :: Resource: https://www.youtube.com/watch?v=j-EB6RqqjGI :: Notes: Harmonic mean P and R
- [ ] ML-021 AUC-ROC (High, Not Started, Week 2) :: Formula: Area under TPR vs FPR :: Interview: Why AUC-PR for imbalanced? :: Resource: https://www.youtube.com/watch?v=4jRBRDbJemM :: Notes: Threshold independent

### Optimization
- [ ] ML-003 Gradient Descent (High, Not Started, Week 2) :: Formula: θ = θ - α∇L(θ) :: Interview: Explain SGD vs batch GD :: Resource: https://www.youtube.com/watch?v=sDv4f4s2SB8 :: Notes: Core optimization algorithm

### Regularization
- [ ] ML-004 L1 Regularization (High, Not Started, Week 2) :: Formula: L + λΣ|wᵢ| :: Interview: When use L1 vs L2? :: Resource: https://www.youtube.com/watch?v=Q81RR3yKn30 :: Notes: Feature selection sparsity
- [ ] ML-005 L2 Regularization (High, Not Started, Week 2) :: Formula: L + λΣwᵢ² :: Interview: How does L2 prevent overfitting? :: Resource: https://www.youtube.com/watch?v=Q81RR3yKn30 :: Notes: Weight shrinkage

### Supervised
- [ ] ML-001 Linear Regression (High, Not Started, Week 2) :: Formula: ŷ = Xw + b; L = (1/n)Σ(y-ŷ)² :: Interview: Derive gradient for linear regression :: Resource: https://www.youtube.com/watch?v=nk2CQITm_eo :: Notes: Foundation regression model
- [ ] ML-002 Logistic Regression (High, Not Started, Week 2) :: Formula: ŷ = σ(Xw+b); L = -Σ[y log(ŷ)] :: Interview: Why cross-entropy not MSE for classification? :: Resource: https://www.youtube.com/watch?v=yIYKR4sgzI8 :: Notes: Foundation classification model
- [ ] ML-007 Decision Trees (High, Not Started, Week 3) :: Formula: IG = H(S) - Σ(|Sᵥ|/|S|)H(Sᵥ) :: Interview: How does a decision tree split? :: Resource: https://www.youtube.com/watch?v=_L39rN6gz7Y :: Notes: Interpretable model
- [ ] ML-014 SVM (Medium, Not Started, Week 3) :: Formula: min ||w||² + CΣξᵢ :: Interview: Explain kernel trick :: Resource: https://www.youtube.com/watch?v=efR1C6CvhmE :: Notes: Maximum margin classifier

### Theory
- [ ] ML-006 Bias-Variance Tradeoff (High, Not Started, Week 2) :: Formula: Error = Bias² + Variance + Noise :: Interview: Explain bias-variance tradeoff :: Resource: https://www.youtube.com/watch?v=EuBBz3bI-aA :: Notes: Fundamental ML concept
- [ ] ML-008 Entropy (High, Not Started, Week 3) :: Formula: H(S) = -Σ pᵢ log₂(pᵢ) :: Interview: What is entropy in ML? :: Resource: https://www.youtube.com/watch?v=YtebGVx-Fxw :: Notes: Impurity measure
- [ ] ML-009 Gini Impurity (Medium, Not Started, Week 3) :: Formula: Gini = 1 - Σ pᵢ² :: Interview: Gini vs Entropy? :: Resource: https://www.youtube.com/watch?v=u4IxOk2ijSs :: Notes: Faster than entropy
- [ ] ML-015 Kernel Trick (Medium, Not Started, Week 3) :: Formula: K(x,x') = φ(x)·φ(x') :: Interview: Why is kernel trick useful? :: Resource: https://www.youtube.com/watch?v=OmTu0fqUsQk :: Notes: Implicit high-dim mapping

### Unsupervised
- [ ] ML-016 K-Means (High, Not Started, Week 3) :: Formula: min Σ||x-μₖ||² :: Interview: K-means limitations? :: Resource: https://www.youtube.com/watch?v=4b5d3muPQmA :: Notes: Simple clustering
- [ ] ML-017 PCA (High, Not Started, Week 3) :: Formula: X = VΛVᵀ; keep top k :: Interview: When does PCA fail? :: Resource: https://www.youtube.com/watch?v=FgakZw6K1QQ :: Notes: Dimensionality reduction

## Deep Learning
### Activations
- [ ] DL-003 Sigmoid (High, Not Started, Week 4) :: Formula: σ(z) = 1/(1+e⁻ᶻ) :: Interview: Why not sigmoid in hidden layers? :: Resource: https://www.youtube.com/watch?v=Xvg00QnyaIY :: Notes: Vanishing gradient issue
- [ ] DL-004 ReLU (High, Not Started, Week 4) :: Formula: max(0,z) :: Interview: Why ReLU works better? :: Resource: https://www.youtube.com/watch?v=Xvg00QnyaIY :: Notes: No vanishing gradient for z>0
- [ ] DL-005 Softmax (High, Not Started, Week 4) :: Formula: exp(zᵢ)/Σexp(zⱼ) :: Interview: Implement softmax numerically stable :: Resource: https://www.youtube.com/watch?v=LLux1SW--oM :: Notes: Multi-class output

### CNN
- [ ] CNN-001 Convolution (High, Not Started, Week 5) :: Formula: out = Σ input×kernel :: Interview: Explain convolution operation :: Resource: https://www.youtube.com/watch?v=KuXjwB4LzSA :: Notes: Feature extraction
- [ ] CNN-002 Pooling (High, Not Started, Week 5) :: Formula: Max or average over window :: Interview: Why use pooling? :: Resource: https://www.youtube.com/watch?v=8oOgPUO-TBY :: Notes: Reduce spatial size
- [ ] CNN-003 ResNet (High, Not Started, Week 5) :: Formula: y = F(x) + x :: Interview: Why does ResNet work? :: Resource: https://www.youtube.com/watch?v=ZILIbUvp5lk :: Notes: Skip connections
- [ ] CNN-004 1x1 Convolution (High, Not Started, Week 5) :: Formula: Channel mixing no spatial :: Interview: Purpose of 1x1 convolutions? :: Resource: https://www.youtube.com/watch?v=c1RBQzKsDCk :: Notes: Reduce dimensions
- [ ] CNN-005 Transfer Learning (High, Not Started, Week 5) :: Formula: Pretrain + finetune :: Interview: When to freeze layers? :: Resource: https://www.youtube.com/watch?v=yofjFQddwHE :: Notes: Use pretrained weights

### Fundamentals
- [ ] DL-001 Forward Propagation (High, Not Started, Week 4) :: Formula: z=Wx+b; a=activation(z) :: Interview: Explain forward pass :: Resource: https://www.youtube.com/watch?v=aircAruvnKk :: Notes: NN computation flow
- [ ] DL-002 Backpropagation (High, Not Started, Week 4) :: Formula: ∂L/∂W = ∂L/∂a × ∂a/∂z × ∂z/∂W :: Interview: Derive backprop for 2-layer NN :: Resource: https://www.youtube.com/watch?v=Ilg3gGewQ5U :: Notes: Training algorithm

### Loss
- [ ] DL-006 Cross-Entropy Loss (High, Not Started, Week 4) :: Formula: L = -Σ yᵢlog(ŷᵢ) :: Interview: Derive cross-entropy gradient :: Resource: https://www.youtube.com/watch?v=6ArSys5qHAU :: Notes: Classification loss

### Optimization
- [ ] DL-011 Adam Optimizer (High, Not Started, Week 4) :: Formula: m=β₁m+(1-β₁)g; v=β₂v+(1-β₂)g² :: Interview: Why Adam works well? :: Resource: https://www.youtube.com/watch?v=JXQT_vxqwIs :: Notes: Adaptive learning rates
- [ ] DL-012 Learning Rate Schedule (Medium, Not Started, Week 4) :: Formula: Warmup + decay :: Interview: When use LR warmup? :: Resource: https://www.youtube.com/watch?v=UoFxCN2ROag :: Notes: Training stability

### Problems
- [ ] DL-007 Vanishing Gradient (High, Not Started, Week 4) :: Formula: Gradient → 0 in deep nets :: Interview: How to solve vanishing gradient? :: Resource: https://www.youtube.com/watch?v=qhXZsFVxGKo :: Notes: Deep network issue

### RNN
- [ ] RNN-001 Vanilla RNN (Medium, Not Started, Week 6) :: Formula: hₜ = tanh(Wₕₕhₜ₋₁ + Wₓₕxₜ) :: Interview: Why RNN has vanishing gradient? :: Resource: https://www.youtube.com/watch?v=AsNTP8Kwu80 :: Notes: Sequence modeling
- [ ] RNN-002 LSTM (High, Not Started, Week 6) :: Formula: Forget/Input/Output gates :: Interview: How LSTM solves vanishing gradient? :: Resource: https://www.youtube.com/watch?v=YCzL96nL7j0 :: Notes: Long-term dependencies
- [ ] RNN-003 GRU (Medium, Not Started, Week 6) :: Formula: Update/Reset gates :: Interview: LSTM vs GRU? :: Resource: https://www.youtube.com/watch?v=8HyCNIVRbSU :: Notes: Simpler than LSTM

### Regularization
- [ ] DL-009 Dropout (High, Not Started, Week 4) :: Formula: Randomly zero p fraction :: Interview: Why does dropout work? :: Resource: https://www.youtube.com/watch?v=D8PBER2klLg :: Notes: Ensemble effect
- [ ] DL-010 Batch Normalization (High, Not Started, Week 4) :: Formula: x̂ = (x-μ)/σ; y = γx̂+β :: Interview: BatchNorm vs LayerNorm? :: Resource: https://www.youtube.com/watch?v=yXOMHOpbon8 :: Notes: Normalize activations

### Training
- [ ] DL-008 Weight Initialization (High, Not Started, Week 4) :: Formula: Xavier: N(0, 2/(n_in+n_out)) :: Interview: Why is initialization important? :: Resource: https://www.youtube.com/watch?v=1PGLj-uKT1w :: Notes: Prevent vanishing/exploding
- [ ] DL-013 Gradient Clipping (Medium, Not Started, Week 4) :: Formula: g = g × threshold/||g|| :: Interview: When to use gradient clipping? :: Resource: https://www.youtube.com/watch?v=8zJMxkghjZU :: Notes: Prevent exploding gradients

### Transformer
- [ ] TRANS-001 Self-Attention (High, Not Started, Week 6) :: Formula: softmax(QKᵀ/√dₖ)V :: Interview: Implement self-attention :: Resource: https://www.youtube.com/watch?v=PSs6nxngL6k :: Notes: Core transformer mechanism
- [ ] TRANS-002 Multi-Head Attention (High, Not Started, Week 6) :: Formula: Concat(head₁...headₕ)Wᴼ :: Interview: Why multiple heads? :: Resource: https://www.youtube.com/watch?v=mMa2PmYJlCo :: Notes: Different attention patterns
- [ ] TRANS-003 Positional Encoding (High, Not Started, Week 6) :: Formula: sin/cos at different frequencies :: Interview: Why sinusoidal encoding? :: Resource: https://www.youtube.com/watch?v=1biZfFLPRSY :: Notes: Position information
- [ ] TRANS-004 Transformer Architecture (High, Not Started, Week 6) :: Formula: Encoder/Decoder with attention :: Interview: Explain transformer architecture :: Resource: https://www.youtube.com/watch?v=zxQyTK8quyY :: Notes: Foundation of modern NLP
- [ ] TRANS-005 BERT (High, Not Started, Week 6) :: Formula: Masked LM + NSP :: Interview: BERT vs GPT? :: Resource: https://www.youtube.com/watch?v=xI0HHN5XKDo :: Notes: Bidirectional encoder
- [ ] TRANS-006 GPT (High, Not Started, Week 6) :: Formula: Autoregressive LM :: Interview: How does GPT generate text? :: Resource: https://www.youtube.com/watch?v=kCc8FmEb1nY :: Notes: Causal decoder

## NLP
### Decoding
- [ ] NLP-004 Beam Search (Medium, Not Started, Week 7) :: Formula: Keep top k candidates :: Interview: Beam search vs greedy? :: Resource: https://www.youtube.com/watch?v=RLWuzLLSIgw :: Notes: Sequence decoding

### Embeddings
- [ ] NLP-001 Word2Vec (High, Not Started, Week 7) :: Formula: Skip-gram/CBOW :: Interview: Skip-gram vs CBOW? :: Resource: https://www.youtube.com/watch?v=viZrOnJclY0 :: Notes: Word embeddings

### Metrics
- [ ] NLP-003 Perplexity (Medium, Not Started, Week 7) :: Formula: exp(-1/N × Σlog P(wᵢ)) :: Interview: What is perplexity? :: Resource: https://www.youtube.com/watch?v=BAN3NB_SNHY :: Notes: Language model metric

### Preprocessing
- [ ] NLP-002 Subword Tokenization (High, Not Started, Week 7) :: Formula: BPE/WordPiece :: Interview: How handle OOV words? :: Resource: https://www.youtube.com/watch?v=HEikzVL-lZU :: Notes: Handle rare words

## RecSys
### Methods
- [ ] RECSYS-001 Collaborative Filtering (High, Not Started, Week 7) :: Formula: User-based or Item-based :: Interview: Cold start problem? :: Resource: https://www.youtube.com/watch?v=h9gpufJFF-0 :: Notes: Similarity-based recs
- [ ] RECSYS-002 Matrix Factorization (High, Not Started, Week 7) :: Formula: R ≈ PQᵀ :: Interview: How to handle implicit feedback? :: Resource: https://www.youtube.com/watch?v=ZspR5PZemcs :: Notes: Latent factors
- [ ] RECSYS-003 Two-Tower Model (High, Not Started, Week 8) :: Formula: User tower + Item tower :: Interview: Explain two-tower architecture :: Resource: https://www.youtube.com/watch?v=Jnll9TYxsVM :: Notes: Deep learning recs

### Serving
- [ ] RECSYS-004 ANN/FAISS (Medium, Not Started, Week 8) :: Formula: Approximate nearest neighbor :: Interview: How to serve recs at scale? :: Resource: https://www.youtube.com/watch?v=sKyvsdEv6rk :: Notes: Fast similarity search

## ML Systems
### Deployment
- [ ] MLSYS-004 Model Serving (Medium, Not Started, Week 8) :: Formula: Real-time inference :: Interview: Batch vs online serving? :: Resource: https://www.youtube.com/watch?v=6m4qFQMH6vk :: Notes: Deployment patterns

### Evaluation
- [ ] MLSYS-002 A/B Testing (High, Not Started, Week 8) :: Formula: Randomized experiment :: Interview: How to A/B test ML models? :: Resource: https://www.youtube.com/watch?v=DUNk4GPZ9bw :: Notes: Online evaluation

### Infrastructure
- [ ] MLSYS-001 Feature Store (Medium, Not Started, Week 8) :: Formula: Centralized feature management :: Interview: What is a feature store? :: Resource: https://www.youtube.com/watch?v=OVWW93IGlnk :: Notes: Feature management

### Monitoring
- [ ] MLSYS-003 Data Drift (High, Not Started, Week 8) :: Formula: Input distribution shift :: Interview: How to detect data drift? :: Resource: https://www.youtube.com/watch?v=tGckE83G-E4 :: Notes: Model monitoring

### Optimization
- [ ] MLSYS-005 Quantization (Medium, Not Started, Week 8) :: Formula: FP32 → INT8 :: Interview: When to quantize models? :: Resource: https://www.youtube.com/watch?v=VKnUVkgTVCE :: Notes: Model compression

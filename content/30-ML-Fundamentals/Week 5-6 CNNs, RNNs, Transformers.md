# Week 5-6: CNNs, RNNs, Transformers

### CNNs

**Watch:**
1. Stanford CS231n: CNNs for Visual Recognition
   - Lecture 5 (CNNs): https://www.youtube.com/watch?v=bNb2fEVKeEo
   - Lecture 9 (Architectures): https://www.youtube.com/watch?v=DAOcjicFr1Y

2. StatQuest: Neural Network series
   - CNNs: https://www.youtube.com/watch?v=HGwBXDKFk9I

**Key Architectures to Know:**
- LeNet-5 (basic)
- AlexNet (ReLU, dropout)
- VGG (small filters)
- ResNet (skip connections) ← MOST IMPORTANT
- Inception (parallel branches)

### RNNs & LSTMs

**Watch:**
1. StatQuest: RNN/LSTM
   - RNN: https://www.youtube.com/watch?v=AsNTP8Kwu80
   - LSTM: https://www.youtube.com/watch?v=YCzL96nL7j0

2. Andrew Ng: Sequence Models (Coursera Course 5)

### Transformers (CRITICAL for Meta/Google)

**Watch (in order):**
1. Illustrated Transformer (blog + video)
   - Blog: https://jalammar.github.io/illustrated-transformer/
   - Video: https://www.youtube.com/watch?v=4Bdc55j80l8

2. StatQuest: Transformer
   - Attention: https://www.youtube.com/watch?v=PSs6nxngL6k
   - Transformer: https://www.youtube.com/watch?v=zxQyTK8quyY

3. Andrej Karpathy: Let's build GPT
   - https://www.youtube.com/watch?v=kCc8FmEb1nY

**Must Implement:**
```python
# Self-Attention from Scratch
import numpy as np

def self_attention(Q, K, V):
    """
    Q, K, V: (seq_len, d_model)
    """
    d_k = K.shape[-1]
    
    # Attention scores
    scores = np.dot(Q, K.T) / np.sqrt(d_k)  # (seq_len, seq_len)
    
    # Softmax
    attention_weights = np.exp(scores) / np.sum(np.exp(scores), axis=-1, keepdims=True)
    
    # Weighted sum
    output = np.dot(attention_weights, V)  # (seq_len, d_model)
    
    return output, attention_weights

# Multi-Head Attention
def multi_head_attention(X, num_heads, d_model):
    d_k = d_model // num_heads
    heads = []
    
    for _ in range(num_heads):
        W_q = np.random.randn(d_model, d_k)
        W_k = np.random.randn(d_model, d_k)
        W_v = np.random.randn(d_model, d_k)
        
        Q = np.dot(X, W_q)
        K = np.dot(X, W_k)
        V = np.dot(X, W_v)
        
        head, _ = self_attention(Q, K, V)
        heads.append(head)
    
    # Concatenate heads
    concat = np.concatenate(heads, axis=-1)
    
    # Final linear projection
    W_o = np.random.randn(d_model, d_model)
    output = np.dot(concat, W_o)
    
    return output
```

---

## Deep dive links

- **[[30-ML-Fundamentals/Guide/Deep Learning (Guide)]]**
- **[[30-ML-Fundamentals/Guide/Specialized Topics (Guide)]]**
- **[[30-ML-Fundamentals/Concepts Tracker#Deep Learning]]**
- **[[30-ML-Fundamentals/Concepts Tracker#NLP]]**
- **[[30-ML-Fundamentals/Concepts Tracker#RecSys]]**
- **[[00-Reference/ML Cheat Sheet]]**

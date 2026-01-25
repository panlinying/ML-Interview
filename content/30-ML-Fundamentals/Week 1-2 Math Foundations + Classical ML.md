# Week 1-2: Math Foundations + Classical ML

### Math Resources (Watch in Order)

**Linear Algebra (Week 1, 3-4 hours total):**
1. 3Blue1Brown: Essence of Linear Algebra
   - Full playlist: https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab
   - MUST WATCH: Vectors (Ep 1), Linear combinations (Ep 2), Matrix multiplication (Ep 4)

**Probability & Statistics (Week 1, 3-4 hours total):**
1. StatQuest: Probability Fundamentals
   - Bayes Theorem: https://www.youtube.com/watch?v=9wCnvr7Xw4E
   - Distributions: https://www.youtube.com/watch?v=rzFX5NWojp0
   - Maximum Likelihood: https://www.youtube.com/watch?v=XepXtl9YKwc

**Calculus for ML (Week 1, 2 hours):**
1. 3Blue1Brown: Essence of Calculus
   - Chain Rule: https://www.youtube.com/watch?v=YG15m2VwSjA
   - Partial Derivatives: https://www.youtube.com/watch?v=GkB4vW16QHI

### Classical ML (Week 2)

**Linear Regression:**
- StatQuest: https://www.youtube.com/watch?v=nk2CQITm_eo
- Gradient Descent: https://www.youtube.com/watch?v=sDv4f4s2SB8

**Logistic Regression:**
- StatQuest: https://www.youtube.com/watch?v=yIYKR4sgzI8
- Cross-entropy: https://www.youtube.com/watch?v=6ArSys5qHAU

**Regularization:**
- L1/L2: https://www.youtube.com/watch?v=Q81RR3yKn30

**Decision Trees & Ensemble:**
- Decision Trees: https://www.youtube.com/watch?v=_L39rN6gz7Y
- Random Forest: https://www.youtube.com/watch?v=J4Wdy0Wc_xQ
- XGBoost: https://www.youtube.com/watch?v=OtD8wVaFm6E

**SVM:**
- StatQuest SVM: https://www.youtube.com/watch?v=efR1C6CvhmE

**Evaluation Metrics:**
- Confusion Matrix: https://www.youtube.com/watch?v=Kdsp6soqA7o
- ROC/AUC: https://www.youtube.com/watch?v=4jRBRDbJemM
- Precision/Recall: https://www.youtube.com/watch?v=j-EB6RqqjGI

### Hands-On Implementation

**Do these in Jupyter notebooks:**

```python
# 1. Linear Regression from Scratch
import numpy as np

class LinearRegression:
    def __init__(self, lr=0.01, n_iters=1000):
        self.lr = lr
        self.n_iters = n_iters
        self.weights = None
        self.bias = None
    
    def fit(self, X, y):
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = 0
        
        for _ in range(self.n_iters):
            y_pred = np.dot(X, self.weights) + self.bias
            
            dw = (1/n_samples) * np.dot(X.T, (y_pred - y))
            db = (1/n_samples) * np.sum(y_pred - y)
            
            self.weights -= self.lr * dw
            self.bias -= self.lr * db
    
    def predict(self, X):
        return np.dot(X, self.weights) + self.bias

# 2. Logistic Regression from Scratch
class LogisticRegression:
    def __init__(self, lr=0.01, n_iters=1000):
        self.lr = lr
        self.n_iters = n_iters
        self.weights = None
        self.bias = None
    
    def sigmoid(self, z):
        return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
    
    def fit(self, X, y):
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = 0
        
        for _ in range(self.n_iters):
            z = np.dot(X, self.weights) + self.bias
            y_pred = self.sigmoid(z)
            
            dw = (1/n_samples) * np.dot(X.T, (y_pred - y))
            db = (1/n_samples) * np.sum(y_pred - y)
            
            self.weights -= self.lr * dw
            self.bias -= self.lr * db
    
    def predict(self, X):
        z = np.dot(X, self.weights) + self.bias
        return (self.sigmoid(z) >= 0.5).astype(int)
```

---

## Deep dive links

- **[[30-ML-Fundamentals/Guide/Math Foundations (Guide)]]**
- **[[30-ML-Fundamentals/Guide/Classical Machine Learning (Guide)]]**
- **[[30-ML-Fundamentals/Concepts Tracker#Math]]**
- **[[30-ML-Fundamentals/Concepts Tracker#Classical ML]]**
- **[[00-Reference/ML Cheat Sheet]]**

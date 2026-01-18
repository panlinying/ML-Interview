# Week 3-4: Deep Learning Foundations

### Neural Network Fundamentals

**Watch in Order:**
1. 3Blue1Brown: Neural Networks
   - Full playlist: https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi
   - MUST WATCH: All 4 videos (What is NN, Gradient descent, Backprop, Backprop calculus)

2. Andrew Ng Deep Learning Specialization (free audit on Coursera)
   - Course 1: Neural Networks and Deep Learning
   - https://www.coursera.org/specializations/deep-learning

**Key Concepts to Master:**
- Forward propagation
- Backpropagation (derive by hand!)
- Activation functions: ReLU, sigmoid, tanh, softmax
- Loss functions: MSE, binary cross-entropy, categorical cross-entropy
- Weight initialization: Xavier, He
- Optimization: SGD, momentum, Adam

### Hands-On: Neural Network from Scratch

```python
# 2-Layer Neural Network from Scratch (NumPy)
import numpy as np

class NeuralNetwork:
    def __init__(self, input_size, hidden_size, output_size):
        # He initialization
        self.W1 = np.random.randn(input_size, hidden_size) * np.sqrt(2/input_size)
        self.b1 = np.zeros((1, hidden_size))
        self.W2 = np.random.randn(hidden_size, output_size) * np.sqrt(2/hidden_size)
        self.b2 = np.zeros((1, output_size))
    
    def relu(self, z):
        return np.maximum(0, z)
    
    def relu_derivative(self, z):
        return (z > 0).astype(float)
    
    def softmax(self, z):
        exp_z = np.exp(z - np.max(z, axis=1, keepdims=True))
        return exp_z / np.sum(exp_z, axis=1, keepdims=True)
    
    def forward(self, X):
        self.z1 = np.dot(X, self.W1) + self.b1
        self.a1 = self.relu(self.z1)
        self.z2 = np.dot(self.a1, self.W2) + self.b2
        self.a2 = self.softmax(self.z2)
        return self.a2
    
    def backward(self, X, y, lr=0.01):
        m = X.shape[0]
        
        # Output layer gradient
        dz2 = self.a2 - y  # softmax + cross-entropy derivative
        dW2 = (1/m) * np.dot(self.a1.T, dz2)
        db2 = (1/m) * np.sum(dz2, axis=0, keepdims=True)
        
        # Hidden layer gradient
        dz1 = np.dot(dz2, self.W2.T) * self.relu_derivative(self.z1)
        dW1 = (1/m) * np.dot(X.T, dz1)
        db1 = (1/m) * np.sum(dz1, axis=0, keepdims=True)
        
        # Update weights
        self.W2 -= lr * dW2
        self.b2 -= lr * db2
        self.W1 -= lr * dW1
        self.b1 -= lr * db1
    
    def train(self, X, y, epochs=100, lr=0.01):
        for epoch in range(epochs):
            output = self.forward(X)
            self.backward(X, y, lr)
            if epoch % 10 == 0:
                loss = -np.mean(y * np.log(output + 1e-8))
                print(f"Epoch {epoch}, Loss: {loss:.4f}")
```

---

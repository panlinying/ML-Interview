# Module 04: PyTorch Practice

**Primary Resource:**
- Daniel Bourke's PyTorch Bootcamp: https://www.youtube.com/watch?v=Z_ikDlimN6A

**Practice Projects (in order):**

1. **MNIST with CNN** (Week 5)
```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms

class CNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(1, 32, 3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(64 * 7 * 7, 128)
        self.fc2 = nn.Linear(128, 10)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.25)
    
    def forward(self, x):
        x = self.pool(self.relu(self.conv1(x)))
        x = self.pool(self.relu(self.conv2(x)))
        x = x.view(-1, 64 * 7 * 7)
        x = self.dropout(self.relu(self.fc1(x)))
        x = self.fc2(x)
        return x
```

2. **CIFAR-10 with ResNet** (Week 5)
3. **Sentiment Analysis with LSTM** (Week 6)
4. **Text Classification with Transformer** (Week 6)

---

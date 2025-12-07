# ============================================
# QUBIX AI TRAINER - Docker Image
# Ambiente isolado para executar jobs de AI
# ============================================

FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

LABEL maintainer="QUBIX <dev@qubix.io>"
LABEL description="AI Training environment for QUBIX compute jobs"

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    CUDA_HOME=/usr/local/cuda \
    PATH=/usr/local/cuda/bin:$PATH \
    LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    git \
    wget \
    curl \
    build-essential \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create workspace
WORKDIR /workspace

# Install Python packages
RUN pip3 install --no-cache-dir \
    torch==2.1.0 \
    torchvision==0.16.0 \
    torchaudio==2.1.0 \
    transformers==4.35.0 \
    datasets==2.14.0 \
    accelerate==0.24.0 \
    bitsandbytes==0.41.0 \
    scipy \
    scikit-learn \
    pandas \
    numpy \
    matplotlib \
    pillow \
    opencv-python \
    tensorboard \
    wandb \
    ipfs-api

# Copy training scripts
COPY scripts/ /workspace/scripts/
COPY train.py /workspace/train.py
COPY inference.py /workspace/inference.py
COPY evaluate.py /workspace/evaluate.py

# Security: Run as non-root user
RUN useradd -m -u 1000 qubix && \
    chown -R qubix:qubix /workspace

USER qubix

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python3 -c "import torch; print(torch.cuda.is_available())" || exit 1

# Default command
CMD ["python3", "train.py"]

# ============================================
# BUILD INSTRUCTIONS:
# docker build -t qubix/ai-trainer:latest .
# docker push qubix/ai-trainer:latest
# ============================================

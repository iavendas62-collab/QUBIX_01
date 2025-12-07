# ☁️ QUBIX - Cloud Infrastructure Setup

## 🎯 Overview

Este guia detalha EXATAMENTE como provisionar toda a infraestrutura na AWS para rodar QUBIX em produção.

**Custo estimado:** $500-1000/mês (início), $5K-10K/mês (scale)

---

## 📋 AWS Services Used

```
✅ VPC (Virtual Private Cloud)
✅ ECS Fargate (Backend API)
✅ EKS (Kubernetes - Orchestrator)
✅ RDS PostgreSQL (Database)
✅ ElastiCache Redis (Cache + Queue)
✅ S3 (File storage)
✅ CloudFront (CDN)
✅ Route53 (DNS)
✅ Certificate Manager (SSL)
✅ Secrets Manager (API keys, passwords)
✅ CloudWatch (Monitoring + Logs)
✅ ALB (Load Balancer)
✅ Auto Scaling
✅ IAM (Access control)
```

---

## 🚀 STEP-BY-STEP SETUP

### STEP 1: AWS Account Setup

```bash
# 1. Create AWS account
# Go to: https://aws.amazon.com/
# Sign up with credit card

# 2. Enable MFA (Multi-Factor Authentication)
# IAM → Users → Security credentials → Assign MFA device

# 3. Create IAM user for Terraform
# IAM → Users → Add user
# Name: terraform-admin
# Access type: Programmatic access
# Permissions: AdministratorAccess
# Save Access Key ID and Secret Access Key

# 4. Install AWS CLI
# macOS:
brew install awscli

# Windows:
# Download from: https://aws.amazon.com/cli/

# Linux:
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 5. Configure AWS CLI
aws configure
# AWS Access Key ID: <your-key>
# AWS Secret Access Key: <your-secret>
# Default region: us-east-1
# Default output format: json

# 6. Verify
aws sts get-caller-identity
```

---

### STEP 2: Install Terraform

```bash
# macOS:
brew tap hashicorp/tap
brew install hashicorp/terraform

# Windows (Chocolatey):
choco install terraform

# Linux:
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Verify:
terraform --version
```

---

### STEP 3: Terraform Infrastructure

Create `infrastructure/terraform/main.tf`:

```hcl
# Provider
provider "aws" {
  region = "us-east-1"
}

# Variables
variable "project_name" {
  default = "qubix"
}

variable "environment" {
  default = "production"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Subnets
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-1"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-2"
  }
}

resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "${var.project_name}-private-1"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "${var.project_name}-private-2"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

# Security Groups
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-alb-sg"
  }
}

resource "aws_security_group" "ecs" {
  name        = "${var.project_name}-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ecs-sg"
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}

# RDS PostgreSQL
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name = "${var.project_name}-db-subnet"
  }
}

resource "aws_db_instance" "postgres" {
  identifier             = "${var.project_name}-postgres"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t3.micro"  # Start small, scale later
  allocated_storage      = 20
  storage_type           = "gp3"
  db_name                = "qubix"
  username               = "qubix_admin"
  password               = random_password.db_password.result
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot    = true
  backup_retention_period = 7
  multi_az               = false  # Enable for production

  tags = {
    Name = "${var.project_name}-postgres"
  }
}

# Random password for DB
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-redis-subnet"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${var.project_name}-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"  # Start small
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.ecs.id]

  tags = {
    Name = "${var.project_name}-redis"
  }
}

# S3 Bucket
resource "aws_s3_bucket" "storage" {
  bucket = "${var.project_name}-storage-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "${var.project_name}-storage"
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_versioning" "storage" {
  bucket = aws_s3_bucket.storage.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "storage" {
  bucket = aws_s3_bucket.storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-cluster"
  }
}

# ALB
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  tags = {
    Name = "${var.project_name}-alb"
  }
}

resource "aws_lb_target_group" "backend" {
  name        = "${var.project_name}-backend-tg"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 10
    timeout             = 60
    interval            = 300
    matcher             = "200"
  }

  tags = {
    Name = "${var.project_name}-backend-tg"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# Outputs
output "vpc_id" {
  value = aws_vpc.main.id
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "s3_bucket" {
  value = aws_s3_bucket.storage.id
}
```

---

### STEP 4: Deploy Infrastructure

```bash
# 1. Initialize Terraform
cd infrastructure/terraform
terraform init

# 2. Plan (review changes)
terraform plan

# 3. Apply (create resources)
terraform apply
# Type 'yes' when prompted

# This will take 10-15 minutes
# ☕ Grab a coffee

# 4. Save outputs
terraform output > outputs.txt
```

---

### STEP 5: Deploy Backend to ECS

Create `infrastructure/ecs/backend-task-definition.json`:

```json
{
  "family": "qubix-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/qubix-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3001"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:qubix/database-url"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:qubix/redis-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/qubix-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Deploy script `infrastructure/scripts/deploy-backend.sh`:

```bash
#!/bin/bash

# Build Docker image
cd ../../backend
docker build -t qubix-backend:latest .

# Tag for ECR
docker tag qubix-backend:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/qubix-backend:latest

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Push to ECR
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/qubix-backend:latest

# Register task definition
aws ecs register-task-definition --cli-input-json file://../ecs/backend-task-definition.json

# Update service
aws ecs update-service \
  --cluster qubix-cluster \
  --service qubix-backend \
  --task-definition qubix-backend \
  --force-new-deployment

echo "✅ Backend deployed!"
```

---

### STEP 6: Deploy Frontend to Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
cd frontend
vercel --prod

# 4. Configure environment variables in Vercel dashboard
# NEXT_PUBLIC_API_URL=https://api.qubix.io
```

---

### STEP 7: Setup Domain & SSL

```bash
# 1. Buy domain (e.g., qubix.io) on Route53 or Namecheap

# 2. Create hosted zone in Route53
aws route53 create-hosted-zone --name qubix.io --caller-reference $(date +%s)

# 3. Point domain to Route53 nameservers

# 4. Create SSL certificate
aws acm request-certificate \
  --domain-name qubix.io \
  --subject-alternative-names "*.qubix.io" \
  --validation-method DNS

# 5. Validate certificate (add DNS records)

# 6. Update ALB listener to use HTTPS
aws elbv2 create-listener \
  --load-balancer-arn <ALB_ARN> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<CERT_ARN> \
  --default-actions Type=forward,TargetGroupArn=<TG_ARN>
```

---

### STEP 8: Setup Monitoring

```bash
# 1. Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name qubix-production \
  --dashboard-body file://cloudwatch-dashboard.json

# 2. Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name qubix-high-cpu \
  --alarm-description "Alert when CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# 3. Setup log aggregation
# Install Datadog agent or use CloudWatch Logs Insights
```

---

## 💰 COST BREAKDOWN

### Initial Setup (Month 1)
```
VPC: $0 (free tier)
ECS Fargate: $30/month (1 task, 0.25 vCPU, 0.5 GB)
RDS t3.micro: $15/month
ElastiCache t3.micro: $12/month
S3: $5/month (100 GB)
ALB: $20/month
Route53: $0.50/month
CloudWatch: $10/month
Data transfer: $50/month

Total: ~$142/month
```

### Scale (1,000 users)
```
ECS Fargate: $300/month (10 tasks)
RDS t3.medium: $60/month
ElastiCache t3.small: $35/month
S3: $50/month (1 TB)
ALB: $20/month
CloudFront: $100/month
Data transfer: $500/month

Total: ~$1,065/month
```

### Growth (10,000 users)
```
ECS Fargate: $1,500/month (50 tasks)
RDS r5.xlarge: $500/month
ElastiCache r5.large: $200/month
S3: $500/month (10 TB)
ALB: $50/month
CloudFront: $1,000/month
Data transfer: $3,000/month

Total: ~$6,750/month
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

- [ ] Infrastructure provisioned
- [ ] Backend deployed to ECS
- [ ] Frontend deployed to Vercel
- [ ] Database migrated
- [ ] Redis connected
- [ ] Domain configured
- [ ] SSL certificate installed
- [ ] Monitoring setup
- [ ] Alerts configured
- [ ] Backups enabled
- [ ] Auto-scaling configured
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated

---

## 🚀 YOU'RE LIVE!

**URLs:**
- Frontend: https://qubix.io
- Backend API: https://api.qubix.io
- Admin: https://admin.qubix.io
- Docs: https://docs.qubix.io

**Next:** Start marketing and onboarding users! 💰
